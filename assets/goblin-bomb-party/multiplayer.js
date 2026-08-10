(()=>{
'use strict';

const INSTALL_KEY='__repoGoblinBombMultiplayerV1';
if(window[INSTALL_KEY]) return;
window[INSTALL_KEY]=true;

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_HUMANS=4;
const TOTAL_COMPETITORS=8;
const INPUT_MS=33;
const STATE_MS=66;
const LOBBY_HEARTBEAT_MS=1200;

function code6(){let s='';for(let i=0;i<6;i++)s+=ALPHABET[Math.floor(Math.random()*ALPHABET.length)];return s;}
function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function install(){
  const party=window.GoblinBombParty;
  const E=window.GoblinBombEngine;
  const C=window.GBPCharacter;
  if(!party?.app||!E?.Engine||!C){setTimeout(install,100);return;}
  if(window.__repoGoblinBombMultiplayerInstalled)return;
  window.__repoGoblinBombMultiplayerInstalled=true;

  const app=party.app;
  const BaseEngine=E.Engine;

  class MultiplayerEngine extends BaseEngine{
    constructor(canvas,opts={}){
      MultiplayerEngine._pending=opts;
      super(canvas,opts);
      MultiplayerEngine._pending=null;
    }
    init(){
      const opts=MultiplayerEngine._pending||{};
      this.humanRoster=(Array.isArray(opts.humans)?opts.humans:[]).slice(0,MAX_HUMANS).map((p,i)=>({
        clientId:String(p?.clientId||`human-${i}`),
        name:String(p?.name||`Player ${i+1}`).slice(0,18),
        appearance:C.clean(p?.appearance||{}),
        entityId:i
      }));
      this.localHumanId=Number.isInteger(opts.localHumanId)?opts.localHumanId:0;
      this.networkClient=Boolean(opts.networkClient);
      this.remoteInputs=new Map();
      this.humanPlacements={};
      this.lastNetworkAt=performance.now();
      this.networkBombTarget=null;
      super.init();
    }
    createCompetitors(){
      this.entities=[];
      const goblinNames=['Grubnose','Wartface','Snaggle','Muckfoot','Boggle','Skrit','Gromp'];
      const humanCount=Math.max(1,this.humanRoster.length);
      for(let i=0;i<TOTAL_COMPETITORS;i++){
        const p=this.spawnPoint(i),human=i<humanCount,local=human&&i===this.localHumanId;
        const meta=human?this.humanRoster[i]:null;
        this.entities.push({
          id:i,isPlayer:local,isLocal:local,isHuman:human,
          name:human?(local?'YOU':meta.name):goblinNames[(i-humanCount)%goblinNames.length],
          displayName:human?meta.name:goblinNames[(i-humanCount)%goblinNames.length],
          clientId:human?meta.clientId:null,
          x:p.x,y:p.y,vx:0,vy:0,kx:0,ky:0,r:16,alive:true,dir:1,
          speed:190*(human?1:this.difficulty.speed),dashCd:0,dashT:0,dashDx:1,dashDy:0,
          transferImmune:0,frozen:0,knockback:0,protect:0,vengeance:false,spear:false,bombShield:false,morph:0,power:null,
          personality:human?(local?'player':'remote'):['coward','bully','idiot','sneaky','maniac','panic','smart'][(i-humanCount)%7],
          decision:0,targetX:p.x,targetY:p.y,variant:i%5,seed:i*1.7+this.rand()*5,lastDashHit:new Map(),
          lastDirX:1,lastDirY:0,lastMoveX:p.x,lastMoveY:p.y,stuckT:0,avoidCorner:null,blockedThrows:0,throwThink:0,
          appearance:human?C.clean(meta.appearance):null,
          mpStats:{passes:0,throws:0,dashes:0,dashHits:0,dashHitsTaken:0,lastSecond:0,closestEscape:99}
        });
      }
    }
    get player(){return this.entities?.find(e=>e.isLocal)||this.entities?.[0];}
    aiInput(e,dt,owner){
      if(e?.isHuman&&!e.isLocal){
        const input=this.remoteInputs.get(e.id)||{};
        const keys=input.keys instanceof Set?input.keys:new Set(input.keys||[]);
        const ix=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0);
        const iy=(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0);
        e.aiX=ix;e.aiY=iy;
        e.targetX=Number.isFinite(input.mouseX)?input.mouseX:e.x;
        e.targetY=Number.isFinite(input.mouseY)?input.mouseY:e.y;
        e.groundPickupIntent=true;
        return;
      }
      return super.aiInput(e,dt,owner);
    }
    recoverStuckAI(e){if(e?.isHuman)return;return super.recoverStuckAI(e);}
    setHumanInput(entityId,payload={}){
      const id=Number(entityId),e=this.entities?.find(x=>x.id===id&&x.isHuman&&!x.isLocal);
      if(!e)return false;
      this.remoteInputs.set(id,{keys:new Set(Array.isArray(payload.keys)?payload.keys:[]),mouseX:Number(payload.mouseX)||480,mouseY:Number(payload.mouseY)||300});
      return true;
    }
    humanAction(entityId,type,payload={}){
      const e=this.entities?.find(x=>x.id===Number(entityId)&&x.isHuman&&x.alive);
      if(!e)return false;
      if(type==='dash'){this.tryDash(e);return true;}
      if(type==='power'){this.usePower(e);return true;}
      if(type==='throw'){
        const x=Number(payload.x),y=Number(payload.y),charge=clamp(Number(payload.charge)||0,0,1);
        if(Number.isFinite(x)&&Number.isFinite(y))this.throwBomb(e,x,y,charge);
        return true;
      }
      return false;
    }
    tryDash(e){
      const before=e?.dashCd||0;
      super.tryDash(e);
      if(e?.isHuman&&before<=0&&e.dashCd>before)e.mpStats.dashes++;
    }
    hit(victim,force,nx,ny,kbGain=5,kind='hit',source=null){
      if(kind==='dash'&&source?.isHuman&&victim?.isHuman){
        source.mpStats.dashHits++;
        victim.mpStats.dashHitsTaken++;
      }
      return super.hit(victim,force,nx,ny,kbGain,kind,source);
    }
    transferBomb(from,to,method='body'){
      const beforeOwner=this.bomb?.ownerId,beforeTimer=this.bomb?.timer;
      super.transferBomb(from,to,method);
      if(from?.isHuman&&beforeOwner===from.id&&this.bomb?.ownerId===to?.id){
        from.mpStats.passes++;
        if(method==='throw')from.mpStats.throws++;
        if(beforeTimer<1){from.mpStats.lastSecond++;from.mpStats.closestEscape=Math.min(from.mpStats.closestEscape,beforeTimer);}
        this.onEvent({type:'mp-pass',from:from.id,to:to.id,urgent:beforeTimer<1});
      }
    }
    transferBombAfterThrow(from,to){
      const timer=this.bomb?.timer;
      super.transferBombAfterThrow(from,to);
      if(from?.isHuman){
        from.mpStats.passes++;
        from.mpStats.throws++;
        if(timer<1){from.mpStats.lastSecond++;from.mpStats.closestEscape=Math.min(from.mpStats.closestEscape,timer);}
        this.onEvent({type:'mp-pass',from:from.id,to:to?.id,urgent:timer<1});
      }
    }
    explodeBomb(){
      const x=this.bomb?.x,y=this.bomb?.y;
      super.explodeBomb();
      this.onEvent({type:'mp-explosion',x,y});
    }
    chainExplosion(x,y){
      this.audio?.explosion();this.burst(x,y,'#ff7b32',24,240);
      for(const e of this.alive()){
        const d=Math.hypot(e.x-x,e.y-y);
        if(d<120){
          const n={x:(e.x-x)/(d||1),y:(e.y-y)/(d||1)};
          this.hit(e,13,n.x,n.y,12,'barrel');
          if(!e.isHuman&&d<42&&this.player?.alive){this.stats.environmental++;this.stats.score+=500;}
        }
      }
    }
    eliminate(e,cause='bomb'){
      if(!e?.alive)return;
      e.alive=false;e.elimCause=cause;e.kx*=2;e.ky*=2;
      this.audio?.voice(e.isLocal?'hit':'panic');
      if(e.isHuman){
        const placement=this.alive().length+1;
        this.humanPlacements[e.id]=placement;
        if(e.isLocal){this.playerEliminated=true;this.playerPlacement=placement;this.spectating=true;this.audio?.defeat();this.onEvent({type:'player-eliminated'});}
        this.onEvent({type:'human-eliminated',entityId:e.id,name:e.displayName||e.name,placement,cause});
      }else if(this.player?.alive){
        this.stats.eliminations++;this.stats.score+=1000;
        if(cause!=='bomb'){this.stats.environmental++;this.stats.score+=500;if(cause==='lava')this.callout('YEET');}
        if(this.stats.eliminations===3)this.callout('ABSOLUTE MENACE');
      }
      this.shrinkTarget=Math.min(115,this.shrinkTarget+18+(this.difficultyKey==='insane'?3:0));
      this.shrinkWarn=1.1;this.onEvent({type:'elimination',name:e.displayName||e.name,cause});
      this.burst(e.x,e.y,'#ffcb68',20,200);
      const alive=this.alive();
      if(alive.length===2&&!this.finalDuelTriggered){this.finalDuelTriggered=true;this.state='final-duel';this.stateTimer=1.05;this.shrinkTarget=Math.max(this.shrinkTarget,92);this.audio?.setIntensity(2);this.audio?.finalDuel();this.onEvent({type:'final-duel'});}else if(alive.length<=4)this.audio?.setIntensity(1);
    }
    finish(){
      if(this.finished)return;
      this.finished=true;this.state='finished';
      const alive=this.alive(),winner=alive[0],local=this.player;
      const rank=local?.alive?1:(this.humanPlacements[local?.id]||this.playerPlacement||Math.max(2,alive.length+1));
      const results=this.humanRoster.map((h,i)=>{
        const e=this.entities.find(x=>x.id===i),won=Boolean(e?.alive&&winner?.id===i);
        return {entityId:i,clientId:h.clientId,name:h.name,placement:won?1:(this.humanPlacements[i]||TOTAL_COMPETITORS),won,alive:Boolean(e?.alive),knockback:Math.round(e?.knockback||0),stats:clone(e?.mpStats||{})};
      }).sort((a,b)=>a.placement-b.placement);
      const summary={placement:rank,won:Boolean(local?.alive&&winner?.id===local.id),score:Math.round(this.stats.score+(local?.alive?2500:0)),durationMs:Math.round(this.matchActiveMs),...this.stats,arena:this.arenaKey,difficulty:this.difficultyKey,multiplayer:true,winnerId:winner?.id??null,winnerName:winner?.displayName||winner?.name||'Goblin',multiplayerResults:results,humanCount:this.humanRoster.length};
      if(summary.won){summary.score+=2500;this.audio?.victory();}
      this.onFinish(summary);this.audio?.stopMusic();
    }
    drawEntity(ctx,e,t){
      if(e?.isHuman&&!e.isPlayer){const was=e.isPlayer;e.isPlayer=true;try{return super.drawEntity(ctx,e,t);}finally{e.isPlayer=was;}}
      return super.drawEntity(ctx,e,t);
    }
    serializeNetwork(){
      return {
        v:1,at:Date.now(),elapsed:this.elapsed,matchActiveMs:this.matchActiveMs,state:this.state,stateTimer:this.stateTimer,phase:this.phase,
        finalDuelTriggered:this.finalDuelTriggered,rareEvent:clone(this.rareEvent),shrinkMargin:this.shrinkMargin,shrinkTarget:this.shrinkTarget,shrinkWarn:this.shrinkWarn,cameraZoom:this.cameraZoom,
        flash:this.flash,shake:this.shake,finished:this.finished,stats:{score:this.stats.score},
        bomb:clone(this.bomb),powerups:clone(this.powerups),projectiles:clone(this.projectiles),scorches:clone(this.scorches.slice(-12)),stampede:clone(this.stampede),
        hazards:clone(this.hazards),
        entities:this.entities.map(e=>({id:e.id,x:e.x,y:e.y,kx:e.kx,ky:e.ky,alive:e.alive,dir:e.dir,dashCd:e.dashCd,dashT:e.dashT,dashDx:e.dashDx,dashDy:e.dashDy,transferImmune:e.transferImmune,frozen:e.frozen,knockback:e.knockback,protect:e.protect,vengeance:e.vengeance,spear:e.spear,bombShield:e.bombShield,morph:e.morph,power:e.power,energyDashes:e.energyDashes,lastDirX:e.lastDirX,lastDirY:e.lastDirY,elimCause:e.elimCause,mpStats:clone(e.mpStats)}))
      };
    }
    applyNetworkSnapshot(s){
      if(!this.networkClient||!s||!Array.isArray(s.entities))return;
      this.lastNetworkAt=performance.now();
      this.elapsed=Number(s.elapsed)||this.elapsed;this.matchActiveMs=Number(s.matchActiveMs)||this.matchActiveMs;this.state=s.state||this.state;this.stateTimer=Number(s.stateTimer)||0;this.phase=Number(s.phase)||this.phase;
      this.finalDuelTriggered=Boolean(s.finalDuelTriggered);this.rareEvent=clone(s.rareEvent);this.shrinkTarget=Number(s.shrinkTarget)||0;this.shrinkWarn=Number(s.shrinkWarn)||0;this.cameraZoom=Number(s.cameraZoom)||1;this.flash=Math.max(this.flash,Number(s.flash)||0);this.shake=Math.max(this.shake,Number(s.shake)||0);this.finished=Boolean(s.finished);
      if(s.stats)this.stats.score=Number(s.stats.score)||0;
      if(s.bomb){
        if(!this.bomb)this.bomb=clone(s.bomb);
        else{
          this.networkBombTarget={x:Number(s.bomb.x)||0,y:Number(s.bomb.y)||0};
          const bx=this.bomb.x,by=this.bomb.y;Object.assign(this.bomb,clone(s.bomb));this.bomb.x=bx;this.bomb.y=by;
        }
      }
      this.powerups=clone(s.powerups||[]);this.projectiles=clone(s.projectiles||[]);this.scorches=clone(s.scorches||[]);this.stampede=clone(s.stampede||[]);
      if(Array.isArray(s.hazards))this.hazards=clone(s.hazards);
      for(const incoming of s.entities){
        const e=this.entities.find(x=>x.id===incoming.id);if(!e)continue;
        const wasAlive=e.alive;
        e._netX=Number(incoming.x);e._netY=Number(incoming.y);
        for(const [k,v] of Object.entries(incoming))if(!['id','x','y'].includes(k))e[k]=clone(v);
        if(wasAlive&&!e.alive&&e.isLocal){this.spectating=true;this.playerEliminated=true;}
      }
    }
    networkUpdate(dt){
      const a=1-Math.pow(.001,dt*1.9);
      for(const e of this.entities){if(Number.isFinite(e._netX)){e.x+=(e._netX-e.x)*a;e.y+=(e._netY-e.y)*a;}}
      if(this.bomb&&this.networkBombTarget){this.bomb.x+=(this.networkBombTarget.x-this.bomb.x)*a;this.bomb.y+=(this.networkBombTarget.y-this.bomb.y)*a;}
      if(this.bomb?.timer>0)this.bomb.timer=Math.max(0,this.bomb.timer-dt);
      this.flash=Math.max(0,this.flash-dt*2.8);this.shake=Math.max(0,this.shake-dt*18);this.shrinkMargin+=(this.shrinkTarget-this.shrinkMargin)*Math.min(1,dt*2.6);
      this.emitHud();
    }
    update(dt){if(this.networkClient){this.networkUpdate(dt);return;}return super.update(dt);}
  }
  E.MultiplayerEngine=MultiplayerEngine;

  const net={
    clientId:`gbp-${Math.random().toString(36).slice(2,10)}`,
    role:null,code:'',channel:null,connected:false,accepted:false,slot:null,players:[],ready:false,
    joinTimer:null,lobbyHeartbeat:null,stateTimer:null,inputTimer:null,startRetry:null,
    active:false,lastWasMultiplayer:false,startToken:'',localEntityId:0,keys:new Set(),mouseX:480,mouseY:300,mouseDownAt:0,
    lastInputSig:'',lastInputAt:0,hostSeenAt:0,pendingStart:null
  };

  function db(){return app.db;}
  function accountName(){return String(app.account?.username||'Player').slice(0,18);}
  function localPlayerInfo(){return{clientId:net.clientId,name:accountName(),appearance:C.clean(app.character||{}),ready:net.role==='host'||net.ready};}
  function setStatus(text,kind=''){const e=$('gbpMpStatus');if(e){e.textContent=text||'';e.dataset.kind=kind;}}
  function send(event,payload={}){try{return net.channel?.send({type:'broadcast',event,payload:{...payload,sender:net.clientId}});}catch(_){return null;}}
  function playerCount(){return net.players.length;}
  function hostPlayer(){return net.players.find(p=>p.slot===0);}
  function allReady(){return net.players.length>=2&&net.players.every(p=>p.slot===0||p.ready);}

  function renderLobby(){
    const code=$('gbpMpRoomCodeDisplay');if(code)code.textContent=net.code||'------';
    const hostSettings=$('gbpMpHostSettings');if(hostSettings){const arena=E.ARENAS?.[app.arena]?.name||app.arena||'Arena',diff=String(app.difficulty||'normal').toUpperCase();hostSettings.textContent=`${arena} · ${diff} · ${Math.max(0,TOTAL_COMPETITORS-playerCount())} AI goblins`;} 
    const slots=$('gbpMpSlots');if(slots){
      const bySlot=new Map(net.players.map(p=>[p.slot,p]));
      slots.innerHTML=Array.from({length:MAX_HUMANS},(_,slot)=>{const p=bySlot.get(slot);if(!p)return `<article class="gbp-mp-slot empty"><span>P${slot+1}</span><div><b>OPEN SLOT</b><small>${slot===0?'Create or join a room':'Waiting for player…'}</small></div><em>—</em></article>`;const mine=p.clientId===net.clientId;return `<article class="gbp-mp-slot ${mine?'mine':''} ${p.ready||slot===0?'ready':''}"><span>P${slot+1}</span><div><b>${esc(p.name)}${mine?' · YOU':''}</b><small>${slot===0?'HOST':p.ready?'READY':'NOT READY'}</small></div><em>${slot===0?'HOST':p.ready?'✓':'…'}</em></article>`;}).join('');
    }
    const ready=$('gbpMpReady');if(ready){ready.hidden=net.role!=='guest'||!net.accepted;ready.textContent=net.ready?'UNREADY':'READY UP';ready.classList.toggle('selected',net.ready);}
    const start=$('gbpMpStart');if(start){start.hidden=net.role!=='host';start.disabled=!allReady();start.querySelector('small')?.replaceChildren(document.createTextNode(playerCount()<2?'NEED AT LEAST 2 PLAYERS':allReady()?`${playerCount()} PLAYERS · ${TOTAL_COMPETITORS-playerCount()} GOBLINS`:'WAITING FOR EVERYONE TO READY'))}
    const leave=$('gbpMpLeave');if(leave)leave.hidden=!net.role;
    const create=$('gbpMpCreate');if(create)create.disabled=Boolean(net.role);
    const join=$('gbpMpJoin');if(join)join.disabled=Boolean(net.role);
    const input=$('gbpMpCodeInput');if(input)input.disabled=Boolean(net.role);
  }

  function resetNetState(keepLast=false){
    clearInterval(net.joinTimer);clearInterval(net.lobbyHeartbeat);clearInterval(net.stateTimer);clearInterval(net.inputTimer);clearInterval(net.startRetry);
    net.joinTimer=net.lobbyHeartbeat=net.stateTimer=net.inputTimer=net.startRetry=null;
    if(net.channel){try{db()?.removeChannel(net.channel);}catch(_){try{net.channel.unsubscribe();}catch(__){}}}
    net.role=null;net.code='';net.channel=null;net.connected=false;net.accepted=false;net.slot=null;net.players=[];net.ready=false;net.active=false;net.startToken='';net.localEntityId=0;net.keys.clear();net.lastInputSig='';net.pendingStart=null;
    if(!keepLast)net.lastWasMultiplayer=false;
    renderLobby();
  }

  function setupChannel(code,role){
    const client=db();if(!client?.channel){setStatus('Supabase Realtime is unavailable on this build.','error');return false;}
    resetNetState(true);
    net.role=role;net.code=code;net.hostSeenAt=Date.now();
    if(role==='host')net.players=[{...localPlayerInfo(),slot:0,ready:true}];
    const channel=client.channel(`goblin-bomb-party-${code}`,{config:{broadcast:{self:false,ack:false},presence:{key:net.clientId}}});
    net.channel=channel;

    channel.on('broadcast',{event:'join-request'},({payload})=>{
      if(net.role!=='host'||!payload?.clientId)return;
      if(net.active){send('room-full',{targetId:payload.clientId,reason:'MATCH_IN_PROGRESS'});return;}
      const existing=net.players.find(p=>p.clientId===payload.clientId);
      if(existing){send('join-accepted',{targetId:payload.clientId,slot:existing.slot,players:net.players,difficulty:app.difficulty,arena:app.arena});return;}
      if(net.players.length>=MAX_HUMANS){send('room-full',{targetId:payload.clientId});return;}
      const used=new Set(net.players.map(p=>p.slot));let slot=1;while(used.has(slot)&&slot<MAX_HUMANS)slot++;
      const player={clientId:String(payload.clientId),name:String(payload.name||'Player').slice(0,18),appearance:C.clean(payload.appearance||{}),ready:false,slot};
      net.players.push(player);net.players.sort((a,b)=>a.slot-b.slot);
      send('join-accepted',{targetId:player.clientId,slot,players:net.players,difficulty:app.difficulty,arena:app.arena});broadcastLobby();renderLobby();setStatus(`${player.name} joined the party.`,'ok');
    });
    channel.on('broadcast',{event:'join-accepted'},({payload})=>{
      if(net.role!=='guest'||payload?.targetId!==net.clientId)return;
      net.accepted=true;net.connected=true;net.slot=Number(payload.slot);net.players=Array.isArray(payload.players)?payload.players:[];
      if(payload.difficulty)app.difficulty=payload.difficulty;if(payload.arena)app.arena=payload.arena;
      clearInterval(net.joinTimer);net.joinTimer=null;setStatus(`Connected to ${hostPlayer()?.name||'host'}. Ready up when you are set.`,'ok');renderLobby();
    });
    channel.on('broadcast',{event:'room-full'},({payload})=>{if(net.role==='guest'&&payload?.targetId===net.clientId){clearInterval(net.joinTimer);net.joinTimer=null;setStatus(payload?.reason==='MATCH_IN_PROGRESS'?'That room is already in a match. Try again after the round.':'That room already has four human players.','error');}});
    channel.on('broadcast',{event:'lobby-state'},({payload})=>{
      if(net.role!=='guest'||!payload)return;net.hostSeenAt=Date.now();
      net.players=Array.isArray(payload.players)?payload.players:net.players;if(payload.difficulty)app.difficulty=payload.difficulty;if(payload.arena)app.arena=payload.arena;
      renderLobby();
    });
    channel.on('broadcast',{event:'guest-ready'},({payload})=>{
      if(net.role!=='host'||!payload?.clientId)return;const p=net.players.find(x=>x.clientId===payload.clientId);if(!p)return;p.ready=Boolean(payload.ready);if(payload.appearance)p.appearance=C.clean(payload.appearance);broadcastLobby();renderLobby();
    });
    channel.on('broadcast',{event:'leave'},({payload})=>{
      if(!payload?.clientId)return;
      if(net.role==='host'){
        const leaving=net.players.find(p=>p.clientId===payload.clientId);if(!leaving)return;
        if(net.active){const rosterIndex=net.pendingStart?.roster?.findIndex(p=>p.clientId===payload.clientId);if(rosterIndex>=0){const e=app.engine?.entities?.find(x=>x.id===rosterIndex);if(e?.alive)app.engine.eliminate(e,'disconnect');}}
        else{net.players=net.players.filter(p=>p.clientId!==payload.clientId);broadcastLobby();renderLobby();setStatus(`${leaving.name} left the party.`,'waiting');}
      }else if(net.role==='guest'&&payload.clientId===hostPlayer()?.clientId){hostDisconnected();}
    });
    channel.on('broadcast',{event:'game-start'},({payload})=>{
      if(net.role!=='guest'||payload?.targetId&&payload.targetId!==net.clientId||!payload?.startToken)return;
      if(net.startToken===payload.startToken&&net.active){send('game-start-ack',{targetId:payload.hostClientId,startToken:payload.startToken,clientId:net.clientId});return;}
      startGuestGame(payload);send('game-start-ack',{targetId:payload.hostClientId,startToken:payload.startToken,clientId:net.clientId});
    });
    channel.on('broadcast',{event:'game-start-ack'},({payload})=>{if(net.role==='host'&&payload?.startToken===net.startToken){net.hostSeenAt=Date.now();}});
    channel.on('broadcast',{event:'input'},({payload})=>{
      if(net.role!=='host'||!net.active||!payload?.clientId)return;
      const idx=net.pendingStart?.roster?.findIndex(p=>p.clientId===payload.clientId);if(idx<=0)return;
      app.engine?.setHumanInput?.(idx,payload);
    });
    channel.on('broadcast',{event:'action'},({payload})=>{
      if(net.role!=='host'||!net.active||!payload?.clientId)return;
      const idx=net.pendingStart?.roster?.findIndex(p=>p.clientId===payload.clientId);if(idx<=0)return;
      app.engine?.humanAction?.(idx,payload.action,payload);
    });
    channel.on('broadcast',{event:'state'},({payload})=>{if(net.role==='guest'&&net.active&&payload?.targetId===net.clientId&&payload.snapshot){net.hostSeenAt=Date.now();app.engine?.applyNetworkSnapshot?.(payload.snapshot);}});
    channel.on('broadcast',{event:'game-event'},({payload})=>{if(net.role==='guest'&&net.active&&payload?.targetId===net.clientId&&payload.event){handleRemoteGameEvent(payload.event);}});
    channel.on('broadcast',{event:'game-end'},({payload})=>{if(net.role==='guest'&&net.active&&payload?.targetId===net.clientId&&payload.summary){showMultiplayerResults(payload.summary);}});
    channel.on('broadcast',{event:'host-heartbeat'},({payload})=>{if(net.role==='guest'){net.hostSeenAt=Date.now();if(payload?.players)net.players=payload.players;}});
    channel.on('presence',{event:'sync'},()=>{
      if(net.role!=='host')return;
      const online=Object.values(channel.presenceState?.()||{}).flat();
      const ids=new Set(online.map(x=>x?.clientId).filter(Boolean));
      if(net.active){
        const missing=(net.pendingStart?.roster||[]).filter(p=>p.clientId!==net.clientId&&!ids.has(p.clientId));
        for(const p of missing)setTimeout(()=>{if(net.role!=='host'||!net.active)return;const live=Object.values(channel.presenceState?.()||{}).flat();if(live.some(x=>x?.clientId===p.clientId))return;const idx=net.pendingStart?.roster?.findIndex(x=>x.clientId===p.clientId);const e=app.engine?.entities?.find(x=>x.id===idx);if(e?.alive){app.engine.eliminate(e,'disconnect');app.callout?.(`${p.name.toUpperCase()} DISCONNECTED`);}},3200);
        return;
      }
      const removed=net.players.filter(p=>p.slot>0&&!ids.has(p.clientId));
      if(removed.length){setTimeout(()=>{if(net.role!=='host'||net.active)return;const live=Object.values(channel.presenceState?.()||{}).flat();const liveIds=new Set(live.map(x=>x?.clientId).filter(Boolean));const before=net.players.length;net.players=net.players.filter(p=>p.slot===0||liveIds.has(p.clientId));if(net.players.length!==before){broadcastLobby();renderLobby();}},2200);}
    });
    channel.subscribe(async status=>{
      if(status==='SUBSCRIBED'){
        net.connected=true;try{await channel.track({role,clientId:net.clientId,name:accountName()});}catch(_){}
        if(role==='host'){setStatus('Room created. Share the six-character code.','ok');broadcastLobby();}
        else{setStatus('Looking for the host…','waiting');const req=()=>send('join-request',{clientId:net.clientId,name:accountName(),appearance:C.clean(app.character||{})});req();net.joinTimer=setInterval(req,900);}
        net.lobbyHeartbeat=setInterval(()=>{if(net.role==='host'){broadcastLobby();send('host-heartbeat',{players:net.players});}else if(net.role==='guest'&&net.accepted){const quiet=Date.now()-net.hostSeenAt;if(net.active&&quiet>6500)hostDisconnected();else if(!net.active&&quiet>5000)setStatus('Host connection is quiet — still trying…','waiting');}},LOBBY_HEARTBEAT_MS);
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){setStatus('Could not connect to the multiplayer room. Check Supabase Realtime.','error');}
    });
    renderLobby();return true;
  }

  function broadcastLobby(){if(net.role!=='host'||!net.channel)return;const host=net.players.find(p=>p.slot===0);if(host){host.name=accountName();host.appearance=C.clean(app.character||{});host.ready=true;}send('lobby-state',{players:net.players,difficulty:app.difficulty,arena:app.arena});}

  function createRoom(){if(net.role)return;const code=code6();if(setupChannel(code,'host'))renderLobby();}
  function joinRoom(){if(net.role)return;const code=String($('gbpMpCodeInput')?.value||'').trim().toUpperCase().replace(/[^A-Z2-9]/g,'');if(code.length!==6){setStatus('Enter the complete six-character room code.','error');return;}setupChannel(code,'guest');}
  function toggleReady(){if(net.role!=='guest'||!net.accepted)return;net.ready=!net.ready;const me=net.players.find(p=>p.clientId===net.clientId);if(me)me.ready=net.ready;send('guest-ready',{clientId:net.clientId,ready:net.ready,appearance:C.clean(app.character||{})});renderLobby();}

  function buildRoster(){return net.players.slice().sort((a,b)=>a.slot-b.slot).map((p,entityId)=>({clientId:p.clientId,name:p.name,appearance:C.clean(p.appearance||{}),entityId}));}
  function startHostGame(){
    if(net.role!=='host'||!allReady()||net.active)return;
    const roster=buildRoster(),seed=`online-${net.code}-${Date.now()}-${Math.random()}`,token=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    net.startToken=token;net.localEntityId=0;net.pendingStart={seed,startToken:token,roster,arena:app.arena,difficulty:app.difficulty};
    const payload={...net.pendingStart,hostClientId:net.clientId};
    startMultiplayerEngine(payload,false);
    const broadcastStart=()=>{if(net.role!=='host'||net.startToken!==token)return;for(const p of roster.filter(x=>x.clientId!==net.clientId))send('game-start',{...payload,targetId:p.clientId});};
    broadcastStart();let repeats=0;net.startRetry=setInterval(()=>{if(++repeats>4){clearInterval(net.startRetry);net.startRetry=null;return;}broadcastStart();},650);
  }
  function startGuestGame(payload){
    const roster=Array.isArray(payload.roster)?payload.roster:[],idx=roster.findIndex(p=>p.clientId===net.clientId);if(idx<0)return;
    net.startToken=payload.startToken;net.localEntityId=idx;net.pendingStart={seed:payload.seed,startToken:payload.startToken,roster,arena:payload.arena,difficulty:payload.difficulty};
    app.arena=payload.arena;app.difficulty=payload.difficulty;startMultiplayerEngine(net.pendingStart,true);
  }

  function startMultiplayerEngine(payload,isGuest){
    net.active=true;net.lastWasMultiplayer=true;net.keys.clear();net.lastInputSig='';
    app.engine?.stop?.();app.engine=null;app.practice=true;app.matchId=null;app.rewardStartError='Online party matches currently use casual rewards.';
    app.show('game');$('gbpTutorial')?.classList.add('hidden');$('gbpGameOverlay')?.classList.add('hidden');$('gbpSpectatorBar')?.classList.add('hidden');
    const spectatorText=$('gbpSpectatorBar')?.querySelector('span');if(spectatorText)spectatorText.textContent="YOU'RE OUT — WATCH THE PARTY PANIC";
    const notice=$('gbpInlineNotice');if(notice)notice.textContent=`ONLINE ${payload.roster.length}P · ${TOTAL_COMPETITORS-payload.roster.length} AI GOBLINS · HOST-AUTHORITATIVE`;
    const canvas=$('gbpCanvas');if(!canvas)return;
    app.engine=new E.MultiplayerEngine(canvas,{audio:app.audio,appearance:app.character,difficulty:payload.difficulty,arena:payload.arena,seed:payload.seed,settings:app.settings,humans:payload.roster,localHumanId:net.localEntityId,networkClient:isGuest,onHud:h=>app.hud(h),onEvent:e=>{
      if(!isGuest){app.gameEvent(e);for(const p of payload.roster.filter(x=>x.clientId!==net.clientId))send('game-event',{targetId:p.clientId,event:e});}
    },onFinish:s=>{if(!isGuest)finishHostGame(s);}});
    app.engine.start();canvas.focus();
    if(!isGuest){
      clearInterval(net.stateTimer);net.stateTimer=setInterval(()=>{
        if(!net.active||net.role!=='host'||!app.engine?.serializeNetwork)return;
        const snapshot=app.engine.serializeNetwork();for(const p of payload.roster.filter(x=>x.clientId!==net.clientId))send('state',{targetId:p.clientId,snapshot});
      },STATE_MS);
    }else{
      clearInterval(net.inputTimer);net.inputTimer=setInterval(sendGuestInput,INPUT_MS);
    }
    setStatus('Match in progress.','ok');
  }

  function sendGuestInput(force=false){
    if(net.role!=='guest'||!net.active)return;
    const payload={clientId:net.clientId,keys:[...net.keys],mouseX:net.mouseX,mouseY:net.mouseY};
    const sig=JSON.stringify(payload),now=Date.now();if(!force&&sig===net.lastInputSig&&now-net.lastInputAt<240)return;net.lastInputSig=sig;net.lastInputAt=now;send('input',payload);
  }
  function guestAction(action,payload={}){if(net.role==='guest'&&net.active)send('action',{clientId:net.clientId,action,...payload});}

  function handleRemoteGameEvent(e){
    if(!e)return;
    if(e.type==='mp-explosion'){app.audio?.explosion?.();return;}
    if(e.type==='mp-pass'){app.audio?.pass?.(Boolean(e.urgent));return;}
    if(e.type==='human-eliminated'&&Number(e.entityId)===Number(net.localEntityId)){app.gameEvent?.({type:'player-eliminated'});return;}
    app.gameEvent?.(e);
  }

  function finishHostGame(summary){
    if(!net.active)return;
    clearInterval(net.stateTimer);net.stateTimer=null;
    const roster=net.pendingStart?.roster||[];
    for(const p of roster.filter(x=>x.clientId!==net.clientId))send('game-end',{targetId:p.clientId,summary});
    showMultiplayerResults(summary);
  }

  function ordinal(n){const x=Number(n)||0;return`${x}${x===1?'ST':x===2?'ND':x===3?'RD':'TH'}`;}
  function showMultiplayerResults(summary){
    net.active=false;clearInterval(net.stateTimer);clearInterval(net.inputTimer);net.stateTimer=net.inputTimer=null;
    app.engine?.stop?.();
    const results=Array.isArray(summary?.multiplayerResults)?summary.multiplayerResults:[];
    const mine=results.find(r=>r.clientId===net.clientId)||{placement:summary?.placement||TOTAL_COMPETITORS,won:false,stats:{}};
    app.show('results');
    document.getElementById('goblinBombDialog')?.classList.add('gbp-multiplayer-results');
    $('gbpResultPlace').textContent=`${ordinal(mine.placement)} PLACE · ONLINE PARTY`;
    $('gbpResultTitle').textContent=mine.won?'YOU ARE THE BOMB PARTY CHAMPION':`${String(summary?.winnerName||'SOMEONE').toUpperCase()} WINS`;
    $('gbpResultScore').textContent=Number(summary?.score||0).toLocaleString('en-GB');
    const s=mine.stats||{};$('gbpResultStats').innerHTML=[['Human players',summary?.humanCount||results.length],['AI goblins',TOTAL_COMPETITORS-(summary?.humanCount||results.length)],['Bomb passes',s.passes||0],['Throws landed',s.throws||0],['Dash hits',s.dashHits||0],['Last-second passes',s.lastSecond||0],['Your knockback',`${mine.knockback||0}%`],['Match time',`${(Number(summary?.durationMs||0)/1000).toFixed(1)}s`]].map(([k,v])=>`<div><span>${k}</span><strong>${v}</strong></div>`).join('');
    $('gbpRewardXp').textContent='0';$('gbpRewardGp').textContent='0 GP';$('gbpRewardStatus').textContent='Online party match complete. Multiplayer rewards are disabled so the existing solo reward system stays secure.';
    const playAgain=$('gbpPlayAgain');if(playAgain){playAgain.textContent='RETURN TO PARTY';playAgain.hidden=false;}
    const retry=$('gbpRetry');if(retry)retry.hidden=true;
  }

  function returnToLobby(){
    document.getElementById('goblinBombDialog')?.classList.remove('gbp-multiplayer-results');
    const playAgain=$('gbpPlayAgain');if(playAgain)playAgain.textContent='PLAY AGAIN';const retry=$('gbpRetry');if(retry)retry.hidden=false;
    app.show('multiplayer');renderLobby();setStatus(net.role?'Party room still open. Ready up for another round.':'Create or join a room.','ok');
    if(net.role==='guest'){net.ready=false;const me=net.players.find(p=>p.clientId===net.clientId);if(me)me.ready=false;send('guest-ready',{clientId:net.clientId,ready:false,appearance:C.clean(app.character||{})});}
    if(net.role==='host'){for(const p of net.players)if(p.slot>0)p.ready=false;broadcastLobby();}
    renderLobby();
  }

  function hostDisconnected(){
    if(net.active){app.engine?.stop?.();net.active=false;app.show('multiplayer');}
    setStatus('The host disconnected. Create or join another room.','error');
    setTimeout(()=>resetNetState(true),200);
  }

  function leaveRoom(goMenu=false){
    if(net.role)send('leave',{clientId:net.clientId,role:net.role,name:accountName()});
    app.engine?.stop?.();app.engine=null;resetNetState(true);
    if(goMenu)app.show('menu');else{app.show('multiplayer');setStatus('Left the party room.','waiting');}
  }

  // UI bindings
  $('gbpMpCreate')?.addEventListener('click',createRoom);
  $('gbpMpJoin')?.addEventListener('click',joinRoom);
  $('gbpMpReady')?.addEventListener('click',toggleReady);
  $('gbpMpStart')?.addEventListener('click',startHostGame);
  $('gbpMpLeave')?.addEventListener('click',()=>leaveRoom(false));
  $('gbpMpCopy')?.addEventListener('click',async()=>{if(!net.code)return;try{await navigator.clipboard.writeText(net.code);setStatus('Room code copied.','ok');}catch(_){setStatus(`Room code: ${net.code}`,'ok');}});
  $('gbpMpCodeInput')?.addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6);});
  $('gbpMpCodeInput')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom();}});
  document.querySelector('[data-gbp-view="multiplayer"]')?.addEventListener('click',()=>setTimeout(()=>{renderLobby();if(!net.role)setStatus('Create a room or join with a six-character code.','waiting');},0));
  app.dialog?.addEventListener('click',e=>{if(net.role!=='host'||net.active)return;if(e.target.closest('[data-gbp-difficulty],[data-gbp-arena]'))setTimeout(()=>{broadcastLobby();renderLobby();},0);});

  // Capture the multiplayer result buttons before the solo App handlers see them.
  $('gbpPlayAgain')?.addEventListener('click',e=>{if(!net.lastWasMultiplayer)return;e.preventDefault();e.stopImmediatePropagation();returnToLobby();},true);
  $('gbpRetry')?.addEventListener('click',e=>{if(!net.lastWasMultiplayer)return;e.preventDefault();e.stopImmediatePropagation();returnToLobby();},true);
  document.querySelector('#gbpResultsView [data-gbp-view="menu"]')?.addEventListener('click',()=>{if(net.lastWasMultiplayer)leaveRoom(true);},true);

  // Guest controls: host remains on the original local control path.
  const originalKeyDown=app.keyDown.bind(app),originalKeyUp=app.keyUp.bind(app),originalPointer=app.pointer.bind(app);
  app.keyDown=function(ev){
    if(!(net.active&&net.role==='guest'))return originalKeyDown(ev);
    const raw=ev.key,k=raw.length===1?raw.toLowerCase():raw;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','e','Escape'].includes(k)||['W','A','S','D','E'].includes(raw))ev.preventDefault();
    if(k==='Escape'){app.callout?.('ONLINE MATCHES CANNOT BE PAUSED');return;}
    if(k===' '||k==='Spacebar'){if(!ev.repeat)guestAction('dash');return;}
    if(k==='e'){if(!ev.repeat)guestAction('power');return;}
    net.keys.add(k);sendGuestInput(true);
  };
  app.keyUp=function(ev){
    if(!(net.active&&net.role==='guest'))return originalKeyUp(ev);
    const raw=ev.key,k=raw.length===1?raw.toLowerCase():raw;net.keys.delete(k);sendGuestInput(true);
  };
  app.pointer=function(ev,type){
    if(!(net.active&&net.role==='guest'))return originalPointer(ev,type);
    const c=$('gbpCanvas'),r=c?.getBoundingClientRect();if(!c||!r)return;
    const x=(ev.clientX-r.left)*(c.width/r.width),y=(ev.clientY-r.top)*(c.height/r.height);net.mouseX=x;net.mouseY=y;
    if(type==='down'){ev.preventDefault();net.mouseDownAt=performance.now();}
    else if(type==='up'){ev.preventDefault();const charge=clamp((performance.now()-net.mouseDownAt)/600,0,1);guestAction('throw',{x,y,charge});net.mouseDownAt=0;}
    sendGuestInput();
  };

  // Touch / footer actions bypass App.keyDown in the original game, so intercept them in capture phase for guests.
  app.dialog?.querySelectorAll('[data-gbp-touch-key]').forEach(button=>{
    const key=button.dataset.gbpTouchKey;
    const down=e=>{if(!(net.active&&net.role==='guest'))return;e.preventDefault();e.stopImmediatePropagation();net.keys.add(key);sendGuestInput(true);};
    const up=e=>{if(!(net.active&&net.role==='guest'))return;e.preventDefault();e.stopImmediatePropagation();net.keys.delete(key);sendGuestInput(true);};
    button.addEventListener('pointerdown',down,true);button.addEventListener('pointerup',up,true);button.addEventListener('pointercancel',up,true);button.addEventListener('pointerleave',up,true);
  });
  $('gbpDashTouch')?.addEventListener('click',e=>{if(net.active&&net.role==='guest'){e.preventDefault();e.stopImmediatePropagation();guestAction('dash');}},true);
  $('gbpUsePower')?.addEventListener('click',e=>{if(net.active&&net.role==='guest'){e.preventDefault();e.stopImmediatePropagation();guestAction('power');}},true);
  $('gbpSkipResults')?.addEventListener('click',e=>{if(net.active){e.preventDefault();e.stopImmediatePropagation();app.callout?.('WAITING FOR THE MATCH TO FINISH');}},true);

  // Keep online channels from surviving a dialog close or page exit.
  const originalCloseCleanup=app.closeCleanup.bind(app);
  app.closeCleanup=function(){if(net.role)leaveRoom(false);originalCloseCleanup();};
  window.addEventListener('beforeunload',()=>{if(net.role)send('leave',{clientId:net.clientId,role:net.role,name:accountName()});});

  renderLobby();
}

install();
})();
