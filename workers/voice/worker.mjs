import {LIMIT, month, nextMonth, settle, hasBudget, monthlyBudget, rollingUsage, audioDescription} from './budget.mjs';

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
    this.ctx = ctx; this.env = env; this.queue = Promise.resolve();
    this.ready = ctx.blockConcurrencyWhile(async () => {
      this.state = await ctx.storage.get('state') || {version:1, billingDay:Number(env.BILLING_DAY)||1, at:Date.now(), usage:{}, daily:{}, rooms:[], rates:{}};
    });
  }
  serial(fn) { const task = this.queue.then(() => this.ready).then(fn); this.queue = task.catch(() => {}); return task; }
  async save() { await this.ctx.storage.put('state', this.state); }
  async schedule() {
    if (this.state.rooms.some(r => !r.ended || members(r).some(m => m.pub || m.recv))) await this.ctx.storage.setAlarm(Date.now() + 15000);
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
    const p = await this.db().prepare('SELECT username,user_id,display_name FROM dashboard_players WHERE user_id=? AND username=?').bind(me.id,me.name).first();
    if (!p) throw fail('Refresh your player profile before calling.',403);
    return {id:p.user_id,name:p.username,display:p.display_name || p.username};
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
  async clean(room) {
    for (const m of members(room)) if (m.status === 'left') {
      // Always close publications first, stopping audio fanout to every receiver.
      for (const key of ['pub','recv']) if(m[key]) {
        try { await this.closeSession(m[key]); m[key]=null; } catch { /* Alarm retries, retaining the traffic reservation. */ }
      }
      if (!m.pub && !m.recv) m.client=null;
    }
  }
  async maintain(now, verify = false) {
    settle(this.state,now);
    if (!monthlyBudget(this.state,now)) this.state.stopped=month(now,this.state.billingDay);
    for (const room of this.state.rooms) {
      if (!room.ended) {
        if (this.env.VOICE_ENABLED==='false') this.end(room,'Voice is temporarily paused.',now);
        else if (!hasBudget(this.state,now)) this.end(room,'The voice allowance has been reached. Calls reopen automatically when the allowance renews.',now);
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
    for (const room of this.state.rooms) await this.clean(room);
    settle(this.state,Date.now());
    this.state.rooms = this.state.rooms.filter(r => !r.ended || now-r.ended < 120000 || members(r).some(m=>m.pub||m.recv));
    await this.save(); await this.schedule();
  }
  alarm() { return this.serial(() => this.maintain(Date.now(),true)); }
  view(me, client, now) {
    return {enabled:true, budget:{limit:LIMIT,used:Math.ceil(this.state.usage[month(now,this.state.billingDay)]||0),resetAt:nextMonth(now,this.state.billingDay),available:hasBudget(this.state,now),estimated:true,rollingGuard:rollingUsage(this.state,now)>=LIMIT},
      community:{title:'RE-COMP',capacity:8,members:this.state.rooms.filter(r=>r.kind==='community'&&!r.ended).flatMap(r=>members(r).filter(live).map(m=>({name:m.name,display:m.display,muted:!!m.muted})))},
      rooms:this.state.rooms.filter(r=>r.members[me.id] && (r.members[me.id].status!=='left' || r.members[me.id].client===client || (r.kind==='group'&&!r.ended))).map(r=>({
        id:r.id,title:r.title,kind:r.kind,host:r.host,created:r.created,ended:r.ended||null,reason:r.reason||'',expires:r.expires,
        mine:{status:r.members[me.id].status,owned:r.members[me.id].client===client,muted:!!r.members[me.id].muted},
        members:members(r).filter(m=>m.status!=='left').map(m=>({id:m.id,name:m.name,display:m.display,status:m.status,muted:!!m.muted})),
        sources:members(r).filter(m=>m.id!==me.id && m.status==='active' && m.pub?.ready).map(m=>({id:m.id,name:m.name,trackName:m.pub.trackName}))
      }))};
  }
  fetch(request) { return this.serial(async () => {
    try {
      const {me:identity,op,body={}} = await request.json(), now=Date.now();
      if (!identity || typeof identity.id!=='string' || !name(identity.name)) throw fail('Sign in to call.',401);
      if (!uuid(body.client)) throw fail('Refresh this page to call.');
      const me = await this.owner(identity); this.rate(me,op,now);
      await this.maintain(now,op==='state');
      let result;
      if(op==='state') result=this.view(me,body.client,now);
      else result=await this.action(me,op,body,now);
      await this.save(); await this.schedule(); return json(result);
    } catch(error) {
      await this.save(); await this.schedule();
      return json({error:error.status?error.message:'Voice is temporarily unavailable.'},error.status||503);
    }
  }); }
  async action(me,op,b,now) {
    if(op==='community') {
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
      await this.save(); await this.clean(room); return {ok:true};
    }
    if(room.ended || (m.status==='left' && !(op==='join' && room.kind==='group'))) throw fail(room.reason||'This call has ended.',410);
    try { await this.permitted(room); } catch(error) { this.end(room,'A friendship changed.',now); await this.save(); await this.clean(room); throw error; }
    if(op==='join') return this.join(room,me,b,now);
    if(!live(m)||m.client!==b.client) throw fail('Join the call from this device first.',403);
    if(!hasBudget(this.state,now)) {this.end(room,'The monthly voice allowance has been reached.',now);await this.save();await this.clean(room);throw fail(room.reason,429);}
    if(op==='heartbeat') {m.lease=now+LEASE;m.muted=!!b.muted;return this.view(me,b.client,now);}
    if(op==='reset-receiver') {
      // A permanent channel can see many departures/rejoins. Retire the old
      // receiver before creating another, so inactive SDP tracks never pile up.
      if(m.recv){await this.closeSession(m.recv);m.recv=null;await this.save();}
      return {ok:true};
    }
    if(op==='publish') {
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
      } catch(e) {m.status='left';await this.save();await this.clean(room);throw e;}
    }
    if(op==='ready') {if(!m.pub)throw fail('Connect your microphone first.');m.pub.ready=true;m.status='active';return{ok:true};}
    if(op==='subscribe') {
      if(!m.pub?.ready) throw fail('Connect your microphone first.');
      if(m.recv?.pending) throw fail('Finish the previous voice connection first.',409);
      const sources=members(room).filter(p=>p.id!==me.id&&p.status==='active'&&p.pub?.ready&&!m.recv?.sources?.includes(p.pub.trackName));
      if(!sources.length) return {tracks:[]};
      if(!m.recv) {const s=await this.sfu('/sessions/new');if(!s.sessionId)throw fail('Voice could not connect.',502);m.recv={id:s.sessionId,sources:[],pending:false};await this.save();}
      m.recv.pending=true;m.recv.pendingUntil=Date.now()+60000;await this.save();
      try {
        const response=await this.sfu(`/sessions/${m.recv.id}/tracks/new`,{tracks:sources.map(p=>({location:'remote',sessionId:p.pub.id,trackName:p.pub.trackName}))});
        if(response.sessionDescription?.type!=='offer') throw fail('Unexpected voice connection response.',502);
        m.recv.pendingUntil=0;
        m.recv.sources.push(...sources.map(p=>p.pub.trackName));
        return {sessionDescription:response.sessionDescription,tracks:response.tracks};
      }catch(e){m.status='left';await this.save();await this.clean(room);throw e;}
    }
    if(op==='answer') {
      if(!m.recv?.pending)throw fail('No voice connection is waiting.',409);
      let sdp;try{sdp=audioDescription(b.sessionDescription,'answer');}catch(e){throw fail(e.message);}
      await this.sfu(`/sessions/${m.recv.id}/renegotiate`,{sessionDescription:sdp},'PUT');m.recv.pending=false;return{ok:true};
    }
    throw fail('Unknown voice action.',404);
  }
  async join(room,me,b,now) {
    const m=room.members[me.id];
    if(m.status==='left'&&(m.pub||m.recv))throw fail('Your previous connection is still closing. Try again shortly.',409);
    if(m.client && m.client!==b.client)throw fail('This call is open on another device.',409);
    if(live(m))return{ok:true,room:room.id};
    if(this.state.rooms.some(r=>r.id!==room.id&&!r.ended&&live(r.members[me.id]||{})))throw fail('Leave your current call first.',409);
    const current=members(room).filter(p=>p.client||p.pub||p.recv).length;
    if(!hasBudget(this.state,now,2*current))throw fail('The monthly voice allowance has been reached.',429);
    if(this.state.rooms.flatMap(members).filter(p=>p.client).length>=16)throw fail('Voice rooms are full.',429);
    m.client=b.client;m.status='joining';m.lease=now+LEASE;m.muted=false;return{ok:true,room:room.id};
  }
}
