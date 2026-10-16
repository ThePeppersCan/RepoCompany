(() => {
 'use strict';
 if(parent===window)return;
 const params=new URLSearchParams(location.search),game=params.get('game'),parentOrigin=params.get('parent');
 const origins={
  'https://moratales.repocompany.uk':['moratales','morogue'],
  'https://morogue.repocompany.uk':['morogue'],
  'https://manager.repocompany.uk':['manager'],
  'https://dragonbound.repocompany.uk':['dragonbound']
 };
 let local=false;
 try{const p=new URL(parentOrigin);local=['localhost','127.0.0.1'].includes(location.hostname)&&['localhost','127.0.0.1'].includes(p.hostname)&&['http:','https:'].includes(p.protocol);}catch{return;}
 if(!origins[parentOrigin]?.includes(game)&&!(local&&['moratales','manager','morogue','dragonbound'].includes(game)))return;
 const config=window.repoDashboardConfig;
 const db=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const service=window.repoAccount={db,state:{user:null},playtimeActive:false};
 let lastActive=false,lease;
 function setActive(next){
  const changed=lastActive!==next;lastActive=next;service.playtimeActive=next;
  if(!window.repoPlaytime)return;
  if(next&&!window.repoPlaytime.game&&changed)window.repoPlaytime.start(game);
  else if(changed)dispatchEvent(new Event('repo-playtime-visibility'));
 }
 const core=document.createElement('script');core.src='dashboard-playtime.js?v=open-game-presence-1';
 core.onload=async()=>{
  const {data}=await db.auth.getSession();service.state.user=data.session?.user||null;
  db.auth.onAuthStateChange((_event,session)=>{
   const previous=service.state.user?.id;service.state.user=session?.user||null;
   if(previous!==service.state.user?.id)setTimeout(async()=>{await window.repoPlaytime.stop();if(lastActive&&service.state.user)window.repoPlaytime.start(game);},0);
  });
  addEventListener('message',event=>{
   if(event.source!==parent||event.origin!==parentOrigin||event.data?.type!=='repo-game-activity'||event.data.game!==game||typeof event.data.active!=='boolean')return;
   clearTimeout(lease);setActive(event.data.active);
   // A closed, navigated or stalled parent cannot leave a hidden tracker running.
   lease=setTimeout(()=>setActive(false),20000);
  });
  addEventListener('pageshow',event=>{if(event.persisted){lastActive=false;parent.postMessage({type:'repo-game-tracker-ready'},parentOrigin);}});
  parent.postMessage({type:'repo-game-tracker-ready'},parentOrigin);
 };
 document.body.append(core);
})();
