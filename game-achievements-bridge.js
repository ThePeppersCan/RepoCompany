(() => {
 'use strict';if(parent===window)return;
 const p=new URLSearchParams(location.search),game=p.get('game'),parentOrigin=p.get('parent');
 const origins={'https://comp-run.fluffy-star-4855.chatgpt.site':['comp-run'],'https://moratales.repocompany.uk':['moratales','morogue'],'https://morogue.repocompany.uk':['morogue'],'https://manager.repocompany.uk':['manager']};
 let local=false;try{const url=new URL(parentOrigin);local=['localhost','127.0.0.1'].includes(location.hostname)&&['localhost','127.0.0.1'].includes(url.hostname)&&['http:','https:'].includes(url.protocol);}catch{return;}
 if(!['moratales','manager','morogue','comp-run'].includes(game)||(!origins[parentOrigin]?.includes(game)&&!local))return;
 const config=window.repoDashboardConfig,db=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 let user=null,busy=false;
 const send=data=>parent.postMessage({type:'repo-achievements',game,...data},parentOrigin);
 function account(session){user=session?.user?.id||null;send({kind:'account',user});}
 db.auth.getSession().then(({data})=>account(data.session));
 db.auth.onAuthStateChange((_event,session)=>account(session));
 // COMP-RUN has a different site origin. A portal-owned sign-in form also works
 // when the browser partitions third-party storage; credentials never leave it.
 if(game==='comp-run'){
  document.body.innerHTML='<main><p class="brand">REPO COMPANY</p><h1>Connect your account</h1><p>Save achievements and submit your best times.</p><form><label>Username<input name="username" autocomplete="username" required minlength="3" maxlength="16" pattern="[a-zA-Z0-9_-]+"></label><label>Password<input name="password" type="password" autocomplete="current-password" required minlength="8"></label><button type="submit">SIGN IN</button></form><p id="account-status" role="status"></p><a href="https://repocompany.uk/account-access/" target="_blank" rel="noopener">Request an account</a><button id="account-return" hidden>RETURN TO GAME</button></main>';
  const form=document.querySelector('form'),status=document.getElementById('account-status'),back=document.getElementById('account-return');
  const render=()=>{form.hidden=!!user;back.hidden=!user;status.textContent=user?'Connected. Your next full run can submit a ranked time.':'';};
  db.auth.onAuthStateChange(()=>setTimeout(render,0));db.auth.getSession().then(render);back.onclick=()=>send({kind:'close'});
  form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='Connecting…';try{const username=form.elements.username.value.trim().toLowerCase(),password=form.elements.password.value;if(!/^[a-z0-9_-]{3,16}$/.test(username))throw Error('Check your username.');const {data,error}=await db.auth.signInWithPassword({email:username+'@'+config.authDomain,password});if(error||!data.session)throw Error('That username or password was not accepted.');form.elements.password.value='';account(data.session);render();send({kind:'close'});}catch(error){status.textContent=error.message;}finally{button.disabled=false;}};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();send({kind:'close'});}});
  send({kind:'ready'});
 }
 addEventListener('message',async event=>{
  const msg=event.data;
  if(event.source!==parent||event.origin!==parentOrigin||msg?.type!=='repo-achievements'||msg.game!==game)return;
  if(msg.kind==='hello'){send({kind:'account',user});if(game==='comp-run')send({kind:'ready'});return;}
  if(!['start','progress','run-start','run-finish'].includes(msg.kind)||typeof msg.request!=='string'||msg.request.length>80)return;
  if(busy){send({kind:'result',request:msg.request,error:'Sync busy. Progress will retry.'});return;}
  busy=true;
  try{
   const {data:{session}}=await db.auth.getSession();
   if(!session||session.user.id!==msg.user)throw Error('Sign in to sync achievements.');
   const owner=session.user.id;
   const ranked=game==='comp-run'&&['run-start','run-finish'].includes(msg.kind);
   const body=ranked?{courseId:msg.courseId,mode:msg.mode,season:msg.season,version:msg.version,run:msg.run,timeMs:msg.timeMs,splits:msg.splits}:msg.kind==='start'?{game,testing:!!msg.testing,practice:!!msg.practice}:{game,session:msg.session,facts:msg.facts};
   const r=await fetch((ranked?'/api/comp-run/':'/api/achievements/')+msg.kind,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
   const result=await r.json();
   if(user!==owner)throw Error('Account changed. Reopen the game to continue.');
   send({kind:'result',request:msg.request,...(r.ok?{result}:{error:result.error,reconnect:result.reconnect})});
  }catch(error){send({kind:'result',request:msg.request,error:error.message});}
  finally{busy=false;}
 });
})();
