import {createMultiplayerInterface,raceStandings} from './multiplayer-interface.js?v=2.27.2';
import {EmoteAudioTimeline} from './emote-audio.js?v=2.27.1';
import {nearbySound} from './detail-sounds.js?v=2.27.1';
import * as THREE from './vendor/three.module.js?v=2.27.1';
import {createRunner,RUNNERS} from './characters.js?v=2.27.1';
import {normalizeKnifeSelection} from './knife-catalog.js?v=2.27.1';
import {RaceClock,PeerTimeline,bytesToBase64,FRAME_BYTES} from './race-protocol.js?v=2.27.1';
import {runnerPoseState} from './runner-state.js?v=2.27.1';
import {normalizePresentation,advancePresentation,poseRunner,runnerPresentation} from './runner-presentation.js?v=2.27.1';
const ENDPOINT='https://repocompany.uk/api/comp-run/races-v2271',el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
export function setupMultiplayer({courses,version,getRunVersion=()=>version,getRunner,getLoadout,getPresentation=()=>null,getSettings=()=>({}),onSound=()=>{},onStart,onCountdown,onLeave,onAirport,onLoadout,onResumeAirport,getCourseLength=()=>0}){
 const view=createMultiplayerInterface(courses),{panel,hud,chip,$,button,show}=view;
 const send=(s,m)=>{if(s?.readyState===1){s.send(JSON.stringify(m));return true;}return false;};
 let airportSocket=null,raceSocket=null,airport=null,room=null,id=null,session=null,busy=false,lastPose=0,lastDraw=0,lastInputFlush=0,prepared=false,started=false,finished=false,lastKind='public',lastCode=null,buffer=[],submitted=0,ticks=0,finishResolve=null,finishTimer=null,disposed=false;
 const handPeers=new Map(),handLinks=new Map(),heardHands=new Set();
 const clock=new RaceClock(),peers=new Map(),timelines=new Map(),raceProgress=new Map(),sentInvites=new Map();let pingTimer=null;
 let reconnectTimer=null,reconnecting=false,reconnectUntil=0,lobbySlot=0,flightGeneration=0;
 let pending=null,pendingTimer=null,waitingAuth=false,entryGeneration=0,lastPartyDraw=0,routeLength=1;
 const message=t=>$('message').textContent=t;
 function clearPeers(){for(const a of peers.values()){a.model.group.removeFromParent();a.model.dispose();a.texture.dispose();a.sprite.material.dispose();}peers.clear();timelines.clear();handPeers.clear();handLinks.clear();heardHands.clear();}
 function close(){panel.classList.add('hidden');if(airport&&!room){onResumeAirport?.();render();}else if(!room&&busy){stop();}else if(!room){waitingAuth=false;}}
 function open(){document.exitPointerLock?.();panel.classList.remove('hidden');chip.classList.add('hidden');render();button('close').focus();}
 function clearPending(){pending=null;clearTimeout(pendingTimer);pendingTimer=null;}
 function command(m){
  if(pending)return;if(!send(airportSocket,m)){message('Connection lost. Rejoin the lobby to continue.');return;}
  pending=m.type;if(m.type==='invite')sentInvites.set(m.target,Date.now()+30000);message('');render();
  pendingTimer=setTimeout(()=>{clearPending();message('No confirmation received. Please try again.');render();},8000);
 }
 function render(){
  const player=session?.player,now=Date.now();
  const near=(airport?.players||[]).filter(p=>p.id!==id).map(p=>{const t=timelines.get(p.id),v=t?.sample(clock.now(performance.now())||now);return {...p,near:!!player&&!!v&&performance.now()-t.lastArrival<2500&&Math.hypot(v[0]-player.x,v[1]-player.y,v[2]-player.z)<=4,invited:(sentInvites.get(p.id)||0)>now};});
  view.render({airport,room,id,busy,pending,connected:!!window.repoGameAchievements?.identity,loadout:(RUNNERS.find(r=>r.id===getRunner())?.name||'Runner')+' · '+String(getLoadout()?.knifeId||'Knife').toUpperCase(),nearby:near,now:clock.now(performance.now())||now,onCommand:command});if(reconnecting)chip.querySelector(".party-chip-detail").textContent="RECONNECTING · PARTY PLACE HELD";
 }
 function launch(){if(room){open();return;}if(airport){close();return;}if(busy)return;void enter('public');}
 function stop(){entryGeneration++;flightGeneration++;clearTimeout(reconnectTimer);reconnecting=false;send(airportSocket,{type:"airport-leave"});waitingAuth=false;clearPending();sentInvites.clear();raceProgress.clear();disposed=true;clearInterval(pingTimer);airportSocket?.close(1000);raceSocket?.close(1000);airportSocket=raceSocket=null;airport=room=null;session=null;clearPeers();hud.classList.add('hidden');chip.classList.add('hidden');busy=false;finishResolve?.({verified:false,reason:'Disconnected'});finishResolve=null;clearTimeout(finishTimer);render();}
 function leave(){stop();panel.classList.add('hidden');onLeave();}
 function ping(s){send(s,{type:'ping',sent:performance.now()});}
 function pong(m){clock.sample(m.sent,performance.now(),m.serverTime);}
 function beginPings(s){clearInterval(pingTimer);clock.reset();ping(s);setTimeout(()=>ping(s),120);setTimeout(()=>ping(s),300);setTimeout(()=>ping(s),600);pingTimer=setInterval(()=>ping(s),3000);}
 function resumeLobby(){
  session=onAirport({social:true,networked:true,ownerId:id,nearbyPlayer:nearby,onInvite:target=>command({type:'invite',target}),onDestination:course=>{if(!airport?.party)send(airportSocket,{type:'party-create'});send(airportSocket,{type:'party-configure',course,mode:'normal',rules:'race'});open();},onDepart:open,onLift:()=>send(airportSocket,{type:'lift'}),sendAction:action=>send(airportSocket,{type:'sport',action}),onHandGrab:()=>send(airportSocket,{type:'hand-grab'}),onHandRelease:()=>send(airportSocket,{type:'hand-release'}),handNearby,handPeer});
  // Separate arriving runners so their models are visible immediately.
  if(session?.player){session.player.x+=(lobbySlot%4-1.5)*1.8;session.player.z+=Math.floor(lobbySlot/4)*1.8;}
 }
 async function enter(kind,code){if(busy||airport||room)return;
  if(!window.repoGameAchievements?.identity){waitingAuth={kind,code};open();message('Connect your account to enter multiplayer.');window.repoGameAchievements?.connect();return;}
  waitingAuth=false;const generation=++entryGeneration;busy=true;disposed=false;message('');open();try{
   const access=await window.repoGameAchievements.airport({kind,code,version:'2.27.1-crossing1',runner:getRunner(),knife:normalizeKnifeSelection(getLoadout()||{})});if(generation!==entryGeneration)return;if(!access)throw Error('Connect your Repo Company account first.');lastKind=kind==='public'?'public':'join';lastCode=access.code;
   connectAirport(access,generation);
  }catch(e){if(generation!==entryGeneration)return;busy=false;message(e.message);render();}}
 function connectAirport(access,generation){
  const socket=airportSocket=new WebSocket(ENDPOINT.replace('https:','wss:')+'/airport/'+access.code);let welcomed=false;
  const timeout=setTimeout(()=>{if(socket===airportSocket&&!welcomed)socket.close();},15000);
  socket.onopen=()=>socket===airportSocket&&send(socket,{type:'hello',ticket:access.ticket});
  socket.onmessage=e=>{if(socket!==airportSocket||generation!==entryGeneration)return;let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.type==='airport-welcome'){welcomed=true;clearTimeout(timeout);id=m.id;lobbySlot=m.slot||0;busy=false;reconnecting=false;clearTimeout(reconnectTimer);message('');if(!room){beginPings(socket);if(!session)resumeLobby();close();}else send(socket,{type:'party-presence',flight:room.code,phase:room.state==='results'?'results':room.state==='racing'?'racing':'loading'});}
   if(m.type==='pong'&&!room)pong(m);
   if(m.type==='airport-state'){airport=m;clearPending();if(room&&!m.party?.activeFlight&&m.players.find(p=>p.id===id)?.phase==='lobby')returnLobby();render();}
   if(m.type==='airport-pose'&&!room)pose(m);
   if(m.type==='hand-link'&&!room)handEvent(m);
   if(m.type==='airport-activities'&&session)session.activities=m.state;
   if(m.type==='airport-lift'&&session)session.liftAt=session.time-Math.max(0,((clock.now(performance.now())||m.at)-m.at)/1000);
   if(m.type==='airport-flight')void flight(m);
   if(m.type==='airport-return')returnLobby();
   if(m.type==='error'){clearPending();sentInvites.clear();message(m.message);render();if(panel.classList.contains('hidden'))chip.querySelector('.party-chip-detail').textContent=m.message;}
  };
  socket.onclose=()=>{clearTimeout(timeout);if(socket!==airportSocket)return;airportSocket=null;busy=false;if(!disposed){session?.releaseHand?.(false);if(welcomed||reconnecting){scheduleReconnect();}else{airport=null;session=null;message('Lobby connection timed out. Please try again.');open();}}render();};
  socket.onerror=()=>{};
 }
 function scheduleReconnect(){
  if(disposed)return;if(!reconnecting){reconnecting=true;reconnectUntil=Date.now()+85000;}
  message('Reconnecting… Your party place is being held.');chip.querySelector('.party-chip-detail').textContent='RECONNECTING · PARTY PLACE HELD';
  const generation=entryGeneration;clearTimeout(reconnectTimer);reconnectTimer=setTimeout(async()=>{
   if(disposed||generation!==entryGeneration)return;
   if(Date.now()>reconnectUntil){reconnecting=false;message('Connection lost. Leave multiplayer and rejoin with your lobby code.');open();return;}
   try{const access=await window.repoGameAchievements.airport({kind:'join',code:lastCode,version:'2.27.1-crossing1',runner:getRunner(),knife:normalizeKnifeSelection(getLoadout()||{})});if(!disposed&&generation===entryGeneration)connectAirport(access,generation);}catch{if(!disposed&&generation===entryGeneration)scheduleReconnect();}
  },3000);
 }
 function returnLobby(){
  flightGeneration++;const previous=raceSocket;raceSocket=null;previous?.close(1000);room=null;prepared=started=finished=false;buffer=[];clearPending();finishResolve?.({verified:false,reason:'Returned with party'});finishResolve=null;clearTimeout(finishTimer);clearPeers();hud.classList.add('hidden');beginPings(airportSocket);resumeLobby();message('');close();
 }
 function pose(m){if(!Array.isArray(m.pose)||m.pose.length<7||!m.pose.every(Number.isFinite))return;if(m.handLink&&!handLinks.has(m.handLink.token))handEvent({...m.handLink,active:true});handPeers.set(m.id,{pose:m.pose,rope:m.rope,velocity:m.velocity||[0,0,0],arrival:performance.now()});if(m.id===id)return;if(room)raceProgress.set(m.id,{progress:m.pose?.[4]||0,at:performance.now()});let t=timelines.get(m.id);if(!t){t=new PeerTimeline();timelines.set(m.id,t);}t.push(m.at,m.pose,performance.now(),normalizePresentation(m.visual));}
 function handPeer(pid){const raw=handPeers.get(pid),t=timelines.get(pid);if(!raw||!Array.isArray(raw.pose)||raw.pose.length<7)return null;const pose=t?.sample(clock.now(performance.now())||Date.now())||raw.pose;return {...raw,pose,age:performance.now()-raw.arrival};}
 function handNearby(p){return (airport?.players||[]).filter(q=>q.id!==id).map(q=>({...q,h:handPeer(q.id)})).filter(q=>q.h&&q.h.age<500&&(q.h.rope||p.traversal?.type==='swing')&&[0,4,7].includes(q.h.pose[6])&&Math.hypot(q.h.pose[0]-p.x,q.h.pose[1]-p.y,q.h.pose[2]-p.z)<3.2).sort((a,b)=>Math.hypot(a.h.pose[0]-p.x,a.h.pose[2]-p.z)-Math.hypot(b.h.pose[0]-p.x,b.h.pose[2]-p.z))[0];}
 function handEvent(m){
  if(m.active){handLinks.set(m.token,m);if((m.host===id||m.guest===id)&&session?.handLink?.token!==m.token)session?.acceptHand(m);
   if(!heardHands.has(m.token)){heardHands.add(m.token);const mine=m.host===id||m.guest===id,peer=handPeers.get(m.host);if(mine)onSound('clap');else if(peer&&session){const sound=nearbySound(session.player,peer.pose);if(sound.volume>0)onSound('clap',{...sound,key:m.token});}}
  }else{handLinks.delete(m.token);if(session?.handLink?.token===m.token)session.releaseHand(false);}
 }
 function nearby(player){return airport?.players.filter(p=>p.id!==id).map(p=>({...p,v:timelines.get(p.id)?.sample(clock.now(performance.now())||Date.now())})).filter(p=>p.v&&Math.hypot(p.v[0]-player.x,p.v[1]-player.y,p.v[2]-player.z)<3.5).sort((a,b)=>Math.hypot(a.v[0]-player.x,a.v[2]-player.z)-Math.hypot(b.v[0]-player.x,b.v[2]-player.z))[0];}
 function peer(p,scene){let a=peers.get(p.id);if(a&&a.model.group.parent!==scene){a.model.group.removeFromParent();scene.add(a.model.group);}if(a)return a;const model=createRunner(RUNNERS.some(r=>r.id===p.runner)?p.runner:RUNNERS[0].id,{detail:'race'});model.setKnife(p.knife||getLoadout());model.group.traverse(o=>{o.castShadow=false;});const c=document.createElement('canvas');c.width=256;c.height=48;const cx=c.getContext('2d');cx.fillStyle='#111d';cx.fillRect(0,0,256,48);cx.font='23px sans-serif';cx.textAlign='center';cx.fillStyle='#fff';cx.fillText(p.name,128,32,240);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(2.4,.45,1);sprite.position.y=2.3;model.group.add(sprite);scene.add(model.group);a={model,sprite,texture,sounds:new EmoteAudioTimeline(),stepDistance:0,lastSoundDraw:0};peers.set(p.id,a);return a;}
 function drawPeers(players,scene,player,now){for(const[pid,a]of peers)if(!players.some(p=>p.id===pid)){a.model.group.removeFromParent();a.model.dispose();a.texture.dispose();a.sprite.material.dispose();peers.delete(pid);timelines.delete(pid);}for(const p of players){if(p.id===id)continue;const timeline=timelines.get(p.id),v=timeline?.sample(clock.now(now)||Date.now());if(!v)continue;const a=peer(p,scene);a.model.group.visible=now-timeline.lastArrival<2500&&Math.hypot(v[0]-player.x,v[2]-player.z)<130;if(a.model.group.visible){const sample=timeline.presentation(clock.now(now)||Date.now());const link=[...handLinks.values()].find(l=>[l.host,l.guest].includes(p.id)),visual={...advancePresentation(sample?.visual,sample?.elapsed||0),handHold:link?{role:link.host===p.id?'host':'guest'}:null},sound=nearbySound(player,v),dt=Math.min(.1,Math.max(0,(now-a.lastSoundDraw)/1000));a.lastSoundDraw=now;poseRunner(a.model,v,visual,now/1000,{motion:getSettings().motion,effects:getSettings().knifeEffects});for(const cue of a.sounds.update(visual?.emote,{motion:getSettings().motion}))if(sound.volume>0)onSound(cue,{...sound,key:p.id+':'+cue});if([1,5].includes(v[6])&&v[5]>2&&!visual?.emote&&now-timeline.lastArrival<350){a.stepDistance+=v[5]*dt;const stride=2.35+Math.min(1.2,v[5]/30);if(a.stepDistance>=stride){a.stepDistance%=stride;if(sound.volume>0)onSound('step-hard',{...sound,volume:sound.volume*.7,key:p.id+':step'});}}else a.stepDistance=0;}}}
 async function flight(m){const generation=++flightGeneration;const previous=raceSocket;raceSocket=null;previous?.close(1000);finishResolve?.({verified:false,reason:"Party restarted"});finishResolve=null;clearTimeout(finishTimer);room={...m,state:"loading",players:[],results:[]};clearPending();raceProgress.clear();chip.classList.add('hidden');prepared=started=finished=false;buffer=[];submitted=ticks=0;clearPeers();session=null;message('Loading your flight…');open();const socket=raceSocket=new WebSocket(ENDPOINT.replace('https:','wss:')+'/flight/'+m.code);socket.onopen=()=>socket===raceSocket&&send(socket,{type:'hello',ticket:m.ticket});socket.onmessage=async e=>{if(socket!==raceSocket||generation!==flightGeneration)return;let v;try{v=JSON.parse(e.data);}catch{return;}
   if(v.type==='welcome'){id=v.id;beginPings(socket);}if(v.type==='pong')pong(v);if(v.type==='pose')pose(v);if(v.type==='respawn'){timelines.get(v.id)?.reset();raceProgress.set(v.id,{progress:0,at:performance.now()});}if(v.type==='error')message(v.message);
   if(v.type==='room'){room=v;render();
    if(v.state==='loading'&&!prepared){prepared=true;send(airportSocket,{type:'party-presence',flight:m.code,phase:'loading'});await onStart({...m,startAt:Infinity,serverNow:clock.now(performance.now())||Date.now(),prepareScene:scene=>{for(const p of v.players)if(p.id!==id){const a=peer(p,scene);a.model.group.visible=false;}}});if(socket!==raceSocket||generation!==flightGeneration)return;routeLength=Math.max(1,getCourseLength());close();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));let attempts=0;while(!clock.ready&&attempts++<30)await new Promise(r=>setTimeout(r,100));if(socket!==raceSocket||generation!==flightGeneration)return;if(clock.ready){send(socket,{type:'loaded',version,protocol:3});send(airportSocket,{type:'party-presence',flight:m.code,phase:'ready'});}else message('Clock synchronisation failed. Return to the airport.');}
    if(v.state==='racing'&&!started){started=true;send(airportSocket,{type:'party-presence',flight:m.code,phase:'racing'});onCountdown(v.startAt);}
    const mine=v.results.find(r=>r.id===id);if(mine&&finishResolve){const resolve=finishResolve;finishResolve=null;clearTimeout(finishTimer);resolve({...mine,proof:mine.proof?{code:v.code,token:mine.proof}:null});}
    if(v.state==='results'){send(airportSocket,{type:'party-presence',flight:m.code,phase:'results'});message('Race complete. Your party stays together.');render();}
   }
  };socket.onclose=()=>{if(socket!==raceSocket||disposed)return;message('Race connection lost. This finish cannot be verified.');finishResolve?.({verified:false,reason:'Race connection lost'});finishResolve=null;};socket.onerror=()=>message('Could not connect to your flight.');
  // Keep the lobby socket: it owns membership and moves the whole party together.
 }
 let airportConnection=null;
 function flush(){if(!buffer.length)return;const bytes=new Uint8Array(buffer.length*FRAME_BYTES);buffer.forEach((b,i)=>bytes.set(b,i*FRAME_BYTES));send(raceSocket,{type:'inputs',round:room?.round,from:submitted,data:bytesToBase64(bytes)});submitted+=buffer.length;buffer=[];}
 for(const kind of['public','private'])button(kind).onclick=()=>enter(kind);$('join-form').onsubmit=e=>{e.preventDefault();const code=$('code').value.trim().toUpperCase();if(!/^[A-Z2-9]{8}$/.test(code)){message('Enter the eight-character lobby code.');return;}void enter('join',code);};button('account').onclick=()=>{waitingAuth=waitingAuth||{kind:'public'};window.repoGameAchievements?.connect();};chip.onclick=open;button('runner').onclick=()=>{panel.classList.add('hidden');onLoadout('runners');};button('knife').onclick=()=>{panel.classList.add('hidden');onLoadout('knives');};
 button('close').onclick=close;button('explore').onclick=close;button('leave').onclick=leave;button('return').onclick=()=>command({type:'party-return'});button('restart').onclick=()=>command({type:'party-restart'});button('copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(airport?.code||lastCode);message('Lobby code copied. Your friend can join, then accept your party invite.');}catch{message('Lobby code: '+(airport?.code||lastCode));}};for(const action of['party-create','party-leave','depart'])button(action).onclick=()=>command({type:action==='depart'?'party-depart':action});button('ready').onclick=()=>{if(airport?.party)command({type:'party-ready',ready:!airport.party.ready.includes(id)});};
 for(const key of['map','mode','rules'])$(key).onchange=()=>command({type:'party-configure',course:$('map').value,mode:$('mode').value,rules:$('rules').value});
 panel.addEventListener('keydown',e=>{if(e.code==='Escape'){e.stopPropagation();close();}if(e.code==='Tab'){const list=[...panel.querySelectorAll('button,input,select')].filter(x=>!x.disabled&&x.getClientRects().length),first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 addEventListener('repo-account-connection',()=>{if((airport||room)&&!window.repoGameAchievements?.identity)leave();else if(waitingAuth&&window.repoGameAchievements?.identity){const intent=waitingAuth;waitingAuth=false;void enter(intent.kind,intent.code);}else render();});
 document.addEventListener('keydown',e=>{if(e.code==='KeyP'&&!e.repeat&&(airport||room)&&panel.classList.contains('hidden')&&!document.querySelector('#settings:not(.hidden),#howto:not(.hidden)')){e.preventDefault();open();}});
 return{launch,open,close,leave,hideHUD(){hud.classList.add('hidden');},get joined(){return!!airport||!!room;},get visible(){return!panel.classList.contains('hidden');},get active(){return room?.state==='racing'&&!finished;},serverNow:()=>clock.now(performance.now())||Date.now(),
  updateAirport(now){if(!session||!airport)return;if(now-lastPartyDraw>500){lastPartyDraw=now;render();}airportConnection=airportSocket;const p=session.player;if(now-lastPose>70){lastPose=now;send(airportSocket,{type:'pose',pose:[p.x,p.y,p.z,p.yaw,0,Math.hypot(p.vx,p.vz),runnerPoseState(p)],pitch:session.pitch,rope:p.traversal?.type==='swing'?{id:p.traversal.id,type:'swing'}:null,velocity:[p.vx,p.vy,p.vz],visual:getPresentation()||runnerPresentation(p)});}drawPeers(airport.players.filter(p=>p.connected!==false&&(!p.phase||p.phase==="lobby")),session.airport.scene,p,now);},
  frame(bytes){if(finished)return;ticks++;buffer.push(bytes);if(buffer.length>=120)flush();},respawn(){send(raceSocket,{type:'respawn',round:room?.round});},
  update(now,scene,p,race){if(!room)return;if(now-lastInputFlush>=100){flush();lastInputFlush=now;}if(room.state==='racing'&&!finished&&race.status==='running'&&now-lastPose>70){lastPose=now;send(raceSocket,{type:'pose',round:room.round,pose:[p.x,p.y,p.z,p.yaw,race.progress,Math.hypot(p.vx,p.vz),runnerPoseState(p)],equipment:getLoadout()?.equipment??2,visual:getPresentation()||runnerPresentation(p)});}drawPeers(room.players,scene,p,now);if(now-lastDraw>250){lastDraw=now;view.standings(raceStandings({room,id,progress:race.progress,total:routeLength,peers:raceProgress,now}),id);}},
  finish(race,p){if(finished)return Promise.resolve({verified:false,reason:'Run already ended'});if(p)send(raceSocket,{type:'pose',round:room?.round,pose:[p.x,p.y,p.z,p.yaw,race.progress,0,1]});finished=true;flush();return new Promise(resolve=>{finishResolve=resolve;finishTimer=setTimeout(()=>{finishResolve=null;resolve({verified:false,reason:'Verification timed out. Result not ranked.'});},120000);send(raceSocket,{type:'finish',round:room?.round,finished:race.status==='finished',ticks});});}
 };
}


