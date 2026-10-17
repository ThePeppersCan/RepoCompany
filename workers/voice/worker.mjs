import {LIMIT, month, nextMonth, settle, hasBudget, monthlyBudget, rollingUsage, audioDescription} from './budget.mjs';
import {ScreenSharing,mediaKeys,hasMedia} from './screens.mjs';

const LEASE = 60000, MAX_CALL = 8 * 3600000;
const uuid = v => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const name = v => typeof v === 'string' && /^[a-z0-9_-]{3,16}$/.test(v);
const fail = (message, status = 400) => Object.assign(new Error(message), {status});
const json = (value, status = 200) => Response.json(value, {status, headers:{'Cache-Control':'no-store'}});
const live = m => ['joining', 'active'].includes(m.status);
const members = r => Object.values(r.members);
export default {
  async fetch(request, env) {
    // No workers.dev URL or routes: this entry point is only a Pages service binding.
    if (env.VOICE_ENABLED !== 'true' || !env.SFU_APP_ID || !env.SFU_APP_SECRET) return json({enabled:false, reason:'Voice is being set up.'});
    return env.VOICE_HUB.get(env.VOICE_HUB.idFromName('account-monthly-budget-v1')).fetch(request);
  }
};

export class VoiceHub {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env; this.queue = Promise.resolve(); this.cleanups = new Map();
    this.screens=new ScreenSharing(this);
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.state = await ctx.storage.get('state') || {version:1, billingDay:Number(env.BILLING_DAY)||1, at:Date.now(), usage:{}, daily:{}, rooms:[], rates:{}};
      this.state.moderation ||= {};
    });
  }
  serial(fn) {
    const entered=Date.now();
    const task=this.queue.then(()=>this.ready).then(async()=>{
      if(Date.now()-entered>1000)console.log(JSON.stringify({event:'voice-queue',queuedMs:Date.now()-entered}));
      return fn();
    });
    this.queue=task.catch(()=>{});
    this.ctx.waitUntil?.(this.queue);
    return task;
  }
  async save() { await this.ctx.storage.put('state', this.state); }
  async schedule() {
    if (this.state.rooms.some(r => !r.ended || members(r).some(hasMedia))) {
      const due=Date.now()+15000,scheduled=await this.ctx.storage.getAlarm?.();
      if(!scheduled||scheduled>due)await this.ctx.storage.setAlarm(due);
    }
    else await this.ctx.storage.deleteAlarm();
  }
  async sfu(path, body, method = 'POST') {
    const response = await fetch(`https://rtc.live.cloudflare.com/v1/apps/${this.env.SFU_APP_ID}${path}`, {
      method, headers:{Authorization:'Bearer ' + this.env.SFU_APP_SECRET, 'Content-Type':'application/json'},
      ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(8000)
    });
    const data = await response.json().catch(() => ({}));
    const closing=path.endsWith('/tracks/close');
    if ((method==='GET'||closing) && (response.status===404 || (response.status===410 && data.errorCode==='session_error'))) return {tracks:[]};
    if (!response.ok || data.errorCode || data.tracks?.some(t => t.errorCode && !(closing && t.errorCode==='close_track_error'))) throw fail('Voice connection failed. Please leave and call again.', 502);
    return data;
  }
  db() { return this.env.DASHBOARD_DB.withSession?.('first-primary') || this.env.DASHBOARD_DB; }
  async owner(me) {
    const p = await this.db().prepare("SELECT username,user_id,display_name,EXISTS(SELECT 1 FROM community_roles WHERE user_id=dashboard_players.user_id AND role='Developer') developer FROM dashboard_players WHERE user_id=? AND username=?").bind(me.id,me.name).first();
    if (!p) throw fail('Refresh your player profile before calling.',403);
    return {id:p.user_id,name:p.username,display:p.display_name || p.username,developer:!!p.developer};
  }
  restrictions(id, now=Date.now()) {
    const r=this.state.moderation[id];
    return {serverMuted:!!r?.muted,serverDeafened:!!r?.deafened,bannedUntil:r?.bannedUntil>now?r.bannedUntil:0};
  }
  voiceFlags(room,m) { return room.kind==='community'?this.restrictions(m.id):{serverMuted:false,serverDeafened:false,bannedUntil:0}; }
  audible(room,m) { const r=this.voiceFlags(room,m);return m.status==='active'&&m.pub?.ready&&!m.pub.revoked&&!r.serverMuted&&!r.serverDeafened; }
  async moderate(me,b,now) {
    if(!me.developer)throw fail('Only Developers can moderate RE-COMP voice.',403);
    if(!name(b.username)||!['mute','deafen','disconnect','ban','unban'].includes(b.action))throw fail('Choose a player and voice action.');
    if(b.username===me.name)throw fail('Use your own voice controls for yourself.');
    if(['mute','deafen'].includes(b.action)&&typeof b.enabled!=='boolean')throw fail('Choose whether to enable this restriction.');
    if(b.action==='ban'&&![300,3600,86400].includes(b.seconds))throw fail('Choose a 5-minute, 1-hour or 24-hour voice ban.');
    const target=await this.db().prepare('SELECT user_id,username,display_name FROM dashboard_players WHERE username=? AND user_id IS NOT NULL').bind(b.username).first();
    if(!target)throw fail('Player not found.',404);
    const active=this.state.rooms.filter(r=>r.kind==='community'&&!r.ended&&live(r.members[target.user_id]||{}));
    if(b.action==='disconnect'&&!active.length)throw fail('This player has already left voice.',409);
    const r=this.state.moderation[target.user_id]||{name:target.username,display:target.display_name||target.username};
    if(b.action==='mute')r.muted=b.enabled;
    if(b.action==='deafen')r.deafened=b.enabled;
    if(b.action==='ban')r.bannedUntil=now+b.seconds*1000;
    if(b.action==='unban')r.bannedUntil=0;
    if(b.action!=='disconnect'){r.by=me.name;r.at=now;this.state.moderation[target.user_id]=r;}
    for(const room of active){
      const m=room.members[target.user_id];
      if(b.action==='disconnect'||b.action==='ban'){
        m.status='left';m.removedAt=now;m.removalReason=b.action==='ban'?'A Developer temporarily banned you from RE-COMP voice.':'A Developer disconnected you from RE-COMP voice.';
      }
      // Force-close upstream media; an altered client cannot ignore moderation.
      if((r.muted||r.deafened)&&m.pub)m.pub.revoked=true;
      if(r.deafened&&m.recv)m.recv.revoked=true;
      if(r.deafened){if(m.screenPub)m.screenPub.revoked=true;if(m.screenRecv)m.screenRecv.revoked=true;}
    }
    await this.save();await this.schedule();
    for(const room of active)this.clean(room);
    return this.view(me,b.client,now);
  }
  async friend(me, target) {
    const p = await this.db().prepare(`SELECT q.username,q.user_id,q.display_name FROM dashboard_players p JOIN dashboard_players q ON q.username=?
      WHERE p.username=? AND p.user_id=? AND q.user_id IS NOT NULL
      AND EXISTS(SELECT 1 FROM dashboard_friendships f WHERE f.status='accepted' AND ((f.player_a=p.username AND f.player_b=q.username) OR (f.player_b=p.username AND f.player_a=q.username)))
      AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=p.username AND b.blocked=q.username) OR (b.blocker=q.username AND b.blocked=p.username))`).bind(target,me.name,me.id).first();
    if (!p || p.user_id === me.id) throw fail('Calls are available to accepted friends only.',403);
    return {id:p.user_id,name:p.username,display:p.display_name || p.username};
  }
  async permitted(room) {
    if(room.kind==='community') {
      const roster=members(room).filter(m=>live(m));
      for(const m of roster)await this.owner(m);
      for(let i=0;i<roster.length;i++)for(let j=i+1;j<roster.length;j++)if(await this.db().prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?) LIMIT 1').bind(roster[i].name,roster[j].name,roster[j].name,roster[i].name).first())throw fail('A member is unavailable.',403);
      return;
    }
    const host = room.members[room.host]; await this.owner(host);
    // Invitations remain private even after someone leaves a group. Revoking
    // friendship with any invitee closes the room and its rejoin invitation.
    const roster = members(room);
    for (const m of roster) if (m.id !== host.id) {
      const p = await this.friend(host,m.name); if (p.id !== m.id) throw fail('Friendship changed.',403);
    }
    for (let i=0;i<roster.length;i++) for(let j=i+1;j<roster.length;j++) {
      const a=roster[i].name,b=roster[j].name;
      if (await this.db().prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?) LIMIT 1').bind(a,b,b,a).first()) throw fail('A member is unavailable.',403);
    }
  }
  rate(me, op, now) {
    const key = me.id + ':' + (op === 'create' ? 'invite' : 'request'), span = op === 'create' ? 3600000 : 60000;
    const item = this.state.rates[key];
    if (!item || now-item.at >= span) this.state.rates[key] = {at:now,n:1};
    else if (++item.n > (op === 'create' ? 12 : 90)) throw fail('Please wait before trying again.',429);
    for(const [k,v] of Object.entries(this.state.rates)) if(now-v.at > 3600000) delete this.state.rates[k];
  }
  end(room, reason, now) {
    if (!room.ended) { room.ended=now; room.reason=reason; }
    for (const m of members(room)) m.status='left';
  }
  async closeSession(session) {
    if (!session) return true;
    // Inspect the server, including tracks whose creation response may have been
    // lost. Retain unknown sessions and retry; never assume a timeout means closed.
    const data = await this.sfu(`/sessions/${session.id}`,undefined,'GET');
    const tracks = (data.tracks || []).filter(t => !['inactive','closed'].includes(t.status)).map(t => ({mid:t.mid}));
    if (tracks.length) await this.sfu(`/sessions/${session.id}/tracks/close`,{tracks,force:true},'PUT');
    // A timed-out tracks/new may still finish upstream. Keep its session known
    // and inspect/close it again after the uncertainty window.
    if (session.pendingUntil > Date.now()) throw fail('Voice cleanup is still pending.',503);
    return true;
  }
  clean(room) {
    this.screens.maintain(room,Date.now());
    for (const m of members(room)) {
      for (const key of mediaKeys) if(m[key]&&(m.status==='left'||m[key].revoked)) {
        const session=m[key];
        if(this.cleanups.has(session.id)||session.retryAt>Date.now())continue;
        // External shutdowns must never hold the admission/heartbeat queue.
        // Keep the exact session and its traffic reservation until confirmed closed.
        const job=(async()=>{
          let closed=false;
          try{await this.closeSession(session);closed=true;}catch{}
          await this.serial(async()=>{
            if(m[key]!==session)return;
            settle(this.state,Date.now());
            if(closed)m[key]=null;
            else session.retryAt=Date.now()+15000;
            if(m.status==='left'&&!hasMedia(m))m.client=null;
            await this.save();await this.schedule();
          });
        })().catch(error=>console.warn(JSON.stringify({event:'voice-cleanup-error',error:error.name}))).finally(()=>this.cleanups.delete(session.id));
        this.cleanups.set(session.id,job);this.ctx.waitUntil?.(job);
      }
      if (m.status==='left'&&!hasMedia(m)) m.client=null;
    }
  }
  async maintain(now, verify = false) {
    settle(this.state,now);
    for(const [id,r] of Object.entries(this.state.moderation))if(!r.muted&&!r.deafened&&!(r.bannedUntil>now))delete this.state.moderation[id];
    if (!monthlyBudget(this.state,now)) this.state.stopped=month(now,this.state.billingDay);
    for (const room of this.state.rooms) {
      if (!room.ended) {
        if (this.env.VOICE_ENABLED==='false') this.end(room,'Voice is temporarily paused.',now);
        else if (!hasBudget(this.state,now)) this.end(room,'Monthly Wibs usage has reached its limit. Voice and screen sharing reopen automatically when the allowance renews.',now);
        else if (now >= room.expires) this.end(room,'This call reached its eight-hour limit. You can start another.',now);
        else if (verify) { try { await this.permitted(room); } catch { this.end(room,'A friendship changed or account verification is unavailable.',now); } }
        for (const m of members(room)) {
          if (live(m) && m.lease <= now) { m.status='left'; if((m.id===room.host && room.kind!=='community') || room.kind==='private') this.end(room,'The call disconnected.',now); }
          if (room.kind==='private' && m.status==='invited' && m.invitedAt+90000 <= now) m.status='left';
        }
        if (room.kind==='private' && members(room).some(m=>m.status==='left')) this.end(room,'Call ended.',now);
        if (room.kind==='community' && !members(room).some(live)) this.end(room,'The voice channel is empty.',now);
      }
    }
    // Schedule and persist the shutdown BEFORE making external close requests.
    await this.save(); await this.schedule();
    for (const room of this.state.rooms) this.clean(room);
    settle(this.state,Date.now());
    this.state.rooms = this.state.rooms.filter(r => !r.ended || now-r.ended < 120000 || members(r).some(hasMedia));
    await this.save(); await this.schedule();
  }
  async alarm() { await this.serial(() => this.maintain(Date.now(),true)); await Promise.allSettled([...this.cleanups.values()]); }
  view(me, client, now) {
    return {enabled:true, budget:{limit:LIMIT,used:Math.ceil(this.state.usage[month(now,this.state.billingDay)]||0),resetAt:nextMonth(now,this.state.billingDay),available:hasBudget(this.state,now),estimated:true,rollingGuard:rollingUsage(this.state,now)>=LIMIT},
      community:{title:'RE-COMP',capacity:8,canModerate:!!me.developer,mine:this.restrictions(me.id,now),restrictions:me.developer?Object.entries(this.state.moderation).map(([id,r])=>({name:r.name,display:r.display,...this.restrictions(id,now)})):[],members:this.state.rooms.filter(r=>r.kind==='community'&&!r.ended).flatMap(r=>members(r).filter(live).map(m=>({name:m.name,display:m.display,muted:!!m.muted,...this.voiceFlags(r,m)})))},
      rooms:this.state.rooms.filter(r=>r.members[me.id] && (r.members[me.id].status!=='left' || r.members[me.id].client===client || r.members[me.id].removedAt>now-120000 || (r.kind==='group'&&!r.ended))).map(r=>({
        id:r.id,title:r.title,kind:r.kind,host:r.host,created:r.created,ended:r.ended||null,reason:r.reason||'',expires:r.expires,
        screen:this.screens.view(r,r.members[me.id]),
        mine:{status:r.members[me.id].status,owned:r.members[me.id].client===client,muted:!!r.members[me.id].muted,reason:r.members[me.id].removalReason||'',mediaClosing:!!r.members[me.id].pub?.revoked||!!r.members[me.id].recv?.revoked,...this.voiceFlags(r,r.members[me.id])},
        members:members(r).filter(m=>m.status!=='left').map(m=>({id:m.id,name:m.name,display:m.display,status:m.status,muted:!!m.muted,...this.voiceFlags(r,m)})),
        sources:this.voiceFlags(r,r.members[me.id]).serverDeafened?[]:members(r).filter(m=>m.id!==me.id && this.audible(r,m)).map(m=>({id:m.id,name:m.name,trackName:m.pub.trackName}))
      }))};
  }
  async fetch(request) {
    // Consume the request body while its caller is connected, before queuing
    // state changes. A disconnected stream must not stall every later caller.
    let payload;try{payload=await request.json();}catch{return json({error:'Voice request was interrupted. Please try again.'},400);}
    return this.serial(async () => {
    let action='unknown',stage='request',began=Date.now();
    try {
      const {me:identity,op,body={}} = payload, now=Date.now();
      action=op;stage='identity';
      if (!identity || typeof identity.id!=='string' || !name(identity.name)) throw fail('Sign in to call.',401);
      if (!uuid(body.client)) throw fail('Refresh this page to call.');
      const me = await this.owner(identity); this.rate(me,op,now);
      stage='maintenance';
      await this.maintain(now,op==='state');
      stage='action';
      let result;
      if(op==='state') result=this.view(me,body.client,now);
      else result=await this.action(me,op,body,now);
      stage='save';await this.save(); await this.schedule(); return json(result);
    } catch(error) {
      console.warn(JSON.stringify({event:'voice-error',action,stage,error:error.name,status:error.status||503,elapsedMs:Date.now()-began}));
      await this.save(); await this.schedule();
      return json({error:error.status?error.message:'Voice is temporarily unavailable.'},error.status||503);
    }finally{console.log(JSON.stringify({event:'voice-request',action,stage,elapsedMs:Date.now()-began,rooms:this.state.rooms.length,pending:this.state.rooms.flatMap(members).filter(m=>m.status==='left'&&(m.pub||m.recv)).length}));}
  }); }
  async action(me,op,b,now) {
    if(op==='moderate')return this.moderate(me,b,now);
    if(op==='community') {
      if(this.restrictions(me.id,now).bannedUntil)throw fail('You are temporarily banned from RE-COMP voice. Your access returns when the ban expires.',403);
      if(!hasBudget(this.state,now))throw fail('The monthly voice allowance has been reached.',429);
      if(this.state.rooms.some(r=>!r.ended&&live(r.members[me.id]||{})))throw fail('Leave your current call first.',409);
      let room=this.state.rooms.find(r=>r.kind==='community'&&!r.ended);
      if(!room){
        if(this.state.rooms.filter(r=>!r.ended).length>=8)throw fail('Voice is busy. Try again shortly.',429);
        room={id:crypto.randomUUID(),kind:'community',title:'RE-COMP',host:me.id,created:now,expires:now+MAX_CALL,members:{}};
        this.state.rooms.push(room);
      }
      if(members(room).filter(m=>m.client||m.pub||m.recv).length>=8)throw fail('RE-COMP has eight people in voice. Try again when a space opens.',429);
      for(const m of members(room).filter(live))if(await this.db().prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?) LIMIT 1').bind(me.name,m.name,m.name,me.name).first())throw fail('Voice is unavailable while a blocked player is in the channel.',403);
      // Never overwrite an uncertain retired media session or its budget reservation.
      if(!room.members[me.id])room.members[me.id]={...me,status:'left',invitedAt:now};
      return this.join(room,me,b,now);
    }
    if(op==='create') {
      if (!hasBudget(this.state,now)) throw fail('The monthly voice allowance has been reached.',429);
      if(this.state.rooms.some(r=>!r.ended && live(r.members[me.id]||{}))) throw fail('Leave your current call first.',409);
      if(this.state.rooms.filter(r=>!r.ended).length>=8) throw fail('All voice rooms are busy. Try again later.',429);
      if(!['private','group'].includes(b.kind) || !Array.isArray(b.friends) || b.friends.length<1 || b.friends.length>(b.kind==='private'?1:7) || new Set(b.friends).size!==b.friends.length || b.friends.some(v=>!name(v))) throw fail('Choose one to seven friends.');
      const guests=[]; for(const n of b.friends) guests.push(await this.friend(me,n));
      const room={id:crypto.randomUUID(),kind:b.kind,title:b.kind==='group'?String(b.title||'Voice room').trim().slice(0,48):'Private call',host:me.id,created:now,expires:now+MAX_CALL,members:{}};
      for(const m of [me,...guests]) room.members[m.id]={...m,status:'invited',invitedAt:now};
      await this.permitted(room); this.state.rooms.push(room);
      await this.join(room,me,b,now); return {room:room.id};
    }
    const room=this.state.rooms.find(r=>r.id===b.room), m=room?.members[me.id];
    if(!room||!m||m.name!==me.name) throw fail('Voice room not found.',404);
    if(op==='leave') {
      if(m.client && m.client!==b.client) throw fail('This call is open on another device.',409);
      m.status='left'; if((room.host===me.id && room.kind!=='community') || room.kind==='private' || (room.kind==='community'&&!members(room).some(live))) this.end(room,'Call ended.',now);
      await this.save(); this.clean(room); return {ok:true};
    }
    if(room.ended || (m.status==='left' && !(op==='join' && room.kind==='group'))) throw fail(m.removalReason||room.reason||'This call has ended.',410);
    try { await this.permitted(room); } catch(error) { this.end(room,'A friendship changed.',now); await this.save(); this.clean(room); throw error; }
    if(op==='join') return this.join(room,me,b,now);
    if(!live(m)||m.client!==b.client) throw fail('Join the call from this device first.',403);
    if(!hasBudget(this.state,now)) {this.end(room,'The monthly voice allowance has been reached.',now);await this.save();this.clean(room);throw fail(room.reason,429);}
    if(op==='heartbeat') {m.lease=now+LEASE;m.muted=!!b.muted;return this.view(me,b.client,now);}
    if(op.startsWith('screen-'))return this.screens.action(room,m,op,b,now);
    if(op==='reset-receiver') {
      // A permanent channel can see many departures/rejoins. Retire the old
      // receiver before creating another, so inactive SDP tracks never pile up.
      if(m.recv){await this.closeSession(m.recv);m.recv=null;await this.save();}
      return {ok:true};
    }
    if(op==='publish') {
      const flags=this.voiceFlags(room,m);if(flags.serverMuted||flags.serverDeafened)throw fail('A Developer has muted your microphone in RE-COMP.',403);
      if(m.pub) throw fail('The microphone connection already exists. Rejoin the call.',409);
      let sdp;try{sdp=audioDescription(b.sessionDescription,'offer',1);}catch(e){throw fail(e.message);}
      if(typeof b.mid!=='string'||!/^\d{1,3}$/.test(b.mid)||!sdp.sdp.includes('a=mid:'+b.mid+'\r\n')) throw fail('Invalid microphone track.');
      const session=await this.sfu('/sessions/new');
      if(!session.sessionId) throw fail('Voice could not start.',502);
      m.pub={id:session.sessionId,mid:b.mid,trackName:crypto.randomUUID(),ready:false,pendingUntil:Date.now()+60000}; await this.save();
      try {
        const response=await this.sfu(`/sessions/${m.pub.id}/tracks/new`,{sessionDescription:sdp,tracks:[{location:'local',mid:b.mid,trackName:m.pub.trackName}]});
        if(response.sessionDescription?.type!=='answer') throw fail('Unexpected voice connection response.',502);
        m.pub.pendingUntil=0;
        return {sessionDescription:response.sessionDescription};
      } catch(e) {m.status='left';await this.save();this.clean(room);throw e;}
    }
    if(op==='ready') {const flags=this.voiceFlags(room,m);if(!m.pub&&!flags.serverMuted&&!flags.serverDeafened)throw fail('Connect your microphone first.');if(m.pub&&!m.pub.revoked)m.pub.ready=true;m.status='active';return{ok:true};}
    if(op==='subscribe') {
      if(this.voiceFlags(room,m).serverDeafened)throw fail('A Developer has deafened you in RE-COMP.',403);
      if(m.status!=='active') throw fail('Connect your microphone first.');
      if(m.recv?.revoked)throw fail('Your previous speaker connection is still closing.',409);
      if(m.recv?.pending) throw fail('Finish the previous voice connection first.',409);
      const sources=members(room).filter(p=>p.id!==me.id&&this.audible(room,p)&&!m.recv?.sources?.includes(p.pub.trackName));
      if(!sources.length) return {tracks:[]};
      if(!m.recv) {const s=await this.sfu('/sessions/new');if(!s.sessionId)throw fail('Voice could not connect.',502);m.recv={id:s.sessionId,sources:[],pending:false};await this.save();}
      m.recv.pending=true;m.recv.pendingUntil=Date.now()+60000;await this.save();
      try {
        const response=await this.sfu(`/sessions/${m.recv.id}/tracks/new`,{tracks:sources.map(p=>({location:'remote',sessionId:p.pub.id,trackName:p.pub.trackName}))});
        if(response.sessionDescription?.type!=='offer') throw fail('Unexpected voice connection response.',502);
        m.recv.pendingUntil=0;
        m.recv.sources.push(...sources.map(p=>p.pub.trackName));
        return {sessionDescription:response.sessionDescription,tracks:response.tracks};
      }catch(e){m.status='left';await this.save();this.clean(room);throw e;}
    }
    if(op==='answer') {
      if(this.voiceFlags(room,m).serverDeafened)throw fail('A Developer has deafened you in RE-COMP.',403);
      if(!m.recv?.pending)throw fail('No voice connection is waiting.',409);
      let sdp;try{sdp=audioDescription(b.sessionDescription,'answer');}catch(e){throw fail(e.message);}
      await this.sfu(`/sessions/${m.recv.id}/renegotiate`,{sessionDescription:sdp},'PUT');m.recv.pending=false;return{ok:true};
    }
    throw fail('Unknown voice action.',404);
  }
  async join(room,me,b,now) {
    const m=room.members[me.id];
    if(this.voiceFlags(room,m).bannedUntil)throw fail('You are temporarily banned from RE-COMP voice.',403);
    if(m.status==='left'&&hasMedia(m))throw fail('Your previous connection is still closing. Try again shortly.',409);
    if(m.client && m.client!==b.client)throw fail('This call is open on another device.',409);
    if(live(m))return{ok:true,room:room.id,...this.voiceFlags(room,m)};
    if(this.state.rooms.some(r=>r.id!==room.id&&!r.ended&&live(r.members[me.id]||{})))throw fail('Leave your current call first.',409);
    const current=members(room).filter(p=>p.client||p.pub||p.recv).length;
    if(!hasBudget(this.state,now,2*current))throw fail('The monthly voice allowance has been reached.',429);
    if(this.state.rooms.flatMap(members).filter(p=>p.client).length>=16)throw fail('Voice rooms are full.',429);
    m.client=b.client;m.status='joining';m.lease=now+LEASE;m.muted=false;delete m.removedAt;delete m.removalReason;return{ok:true,room:room.id,...this.voiceFlags(room,m)};
  }
}
