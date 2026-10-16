(() => {
 'use strict';
 const service=window.repoAccount;
 let current=null,timer=null,token=null;
 const validGames=new Set(['moratales','manager','morogue','broomflight','dragonbound','diver','goblin','rooftops','seas','sports']);
 const active=()=>!document.hidden&&service.playtimeActive!==false;
 service.db.auth.getSession().then(({data})=>{token=data.session?.access_token||null;});
 service.db.auth.onAuthStateChange((_event,session)=>{token=session?.access_token||null;if(!session)stop();});
 async function send(session,action,{keepalive=false}={}){
  if(!token)return;
  const body={game:session.game,session:session.id,sequence:++session.sequence,action,active:action==='stop'?false:active()};
  try{
   const response=await fetch('/api/dashboard/play',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),keepalive});
   if(response.status===409&&current===session){clearInterval(timer);current=null;}
   if(!response.ok)throw Error('Play time could not sync.');
   session.synced=true;
   if(action==='start')session.started=true;
  }catch{
   // Missing beats earn no offline time. Never submit a client-calculated duration.
   session.synced=false;
  }
 }
 async function start(game){
  if(!validGames.has(game)||current?.game===game)return;
  await stop();
  if(!service.state.user)return;
  const session={id:crypto.randomUUID(),game,sequence:-1,synced:false,started:false};
  current=session;
  if(!token){const {data}=await service.db.auth.getSession();token=data.session?.access_token||null;}
  if(current!==session)return;
  await send(session,'start');
  if(current!==session)return;
  // A temporary failure during startup must not disable tracking for the whole
  // game. Retry the same session id; server-side start is idempotent.
  // Keep the open-game lease alive while paused or viewing Wibs. The server
  // still credits play time only when active is true.
  timer=setInterval(()=>{if(current===session)send(session,session.started?'tick':'start');},30000);
 }
 async function stop(){
  clearInterval(timer);timer=null;const session=current;current=null;
  if(session)await send(session,'stop',{keepalive:true});
 }
 document.addEventListener('visibilitychange',()=>{if(current)send(current,current.started?'tick':'start',{keepalive:document.hidden});});
 addEventListener('repo-playtime-visibility',()=>{if(current)send(current,current.started?'tick':'start',{keepalive:!active()});});
 addEventListener('pagehide',()=>{stop();});
 window.repoPlaytime=Object.freeze({start,stop,get game(){return current?.game||'';}});
})();
