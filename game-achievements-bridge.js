(() => {
 'use strict';if(parent===window)return;
 const p=new URLSearchParams(location.search),game=p.get('game'),parentOrigin=p.get('parent');
 const origins={'https://moratales.repocompany.uk':['moratales','morogue'],'https://morogue.repocompany.uk':['morogue'],'https://manager.repocompany.uk':['manager']};
 let local=false;try{const url=new URL(parentOrigin);local=['localhost','127.0.0.1'].includes(location.hostname)&&['localhost','127.0.0.1'].includes(url.hostname)&&['http:','https:'].includes(url.protocol);}catch{return;}
 if(!['moratales','manager','morogue'].includes(game)||(!origins[parentOrigin]?.includes(game)&&!local))return;
 const config=window.repoDashboardConfig,db=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let user=null,busy=false;
 const send=data=>parent.postMessage({type:'repo-achievements',game,...data},parentOrigin);
 function account(session){user=session?.user?.id||null;send({kind:'account',user});}
 db.auth.getSession().then(({data})=>account(data.session));
 db.auth.onAuthStateChange((_event,session)=>account(session));
 addEventListener('message',async event=>{
  const msg=event.data;
  if(event.source!==parent||event.origin!==parentOrigin||msg?.type!=='repo-achievements'||msg.game!==game)return;
  if(msg.kind==='hello'){send({kind:'account',user});return;}
  if(!['start','progress'].includes(msg.kind)||typeof msg.request!=='string'||msg.request.length>80)return;
  if(busy){send({kind:'result',request:msg.request,error:'Sync busy. Progress will retry.'});return;}
  busy=true;
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session||session.user.id!==msg.user)throw Error('Sign in to sync achievements.');
   const owner=session.user.id;
   const body=msg.kind==='start'?{game,testing:!!msg.testing,practice:!!msg.practice}:{game,session:msg.session,facts:msg.facts};
   const r=await fetch('/api/achievements/'+msg.kind,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
   const result=await r.json();
   if(user!==owner)throw Error('Account changed. Reopen the game to continue.');
   send({kind:'result',request:msg.request,...(r.ok?{result}:{error:result.error,reconnect:result.reconnect})});
  }catch(error){send({kind:'result',request:msg.request,error:error.message});}
  finally{busy=false;}
 });
})();
