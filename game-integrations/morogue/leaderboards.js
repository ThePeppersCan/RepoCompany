(function(root){
 'use strict';
 const seasons={normal:'first-light-1',insane:'first-light-insane-1'},API='/api/leaderboards',queueKey='morogue-pending-records-v1';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;},button=(text,fn,cls='mr-board-action')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
 function create({notice=()=>{}}={}){
  let auth=null,config=null,player=null,current=null,starting=false,generation=0,accountSync=null,retrying=null,chain=Promise.resolve(),accountError='';const listeners=new Set();
  const notify=()=>listeners.forEach(fn=>fn()),pending=()=>{try{return JSON.parse(localStorage.getItem(queueKey)||'[]').filter(x=>x&&x.playerId&&x.body).slice(-5);}catch{return[];}},savePending=list=>{try{localStorage.setItem(queueKey,JSON.stringify(list.slice(-5)));}catch{}};
  async function request(path,body,anonymous=false){
   const headers={};if(!anonymous&&auth){const {data:{session}}=await auth.auth.getSession();if(session)headers.Authorization='Bearer '+session.access_token;}
   if(body!==undefined)headers['Content-Type']='application/json';
   const response=await fetch(API+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
   let data;try{data=await response.json();}catch{throw Error('The leaderboards are temporarily unavailable.');}
   if(!response.ok)throw Object.assign(Error(data.error||'Could not load the leaderboard.'),{status:response.status});return data;
  }
  function syncAccount(){
   if(accountSync)return accountSync.then(()=>syncAccount());accountSync=(async()=>{
   const version=++generation;try{
    const {data:{session}}=await auth.auth.getSession();const identity=session?await request('/account'):null;
    if(version!==generation)return;player=identity;accountError='';notify();if(player)void retry();
   }catch(error){if(version!==generation)return;player=null;accountError=error.message;notify();}finally{accountSync=null;}
   })();return accountSync;
  }
  const ready=(async()=>{try{const response=await fetch('interface/vampire-survivor/account-config.json',{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('Account sign-in is temporarily unavailable.');config=await response.json();auth=root.supabase.createClient(config.url,config.key,{auth:{storageKey:'morogue-repo-account-v1',detectSessionInUrl:false}});if(root.MOROGUE_SITE_BRIDGE)auth=await root.MOROGUE_SITE_BRIDGE.account(auth);auth.auth.onAuthStateChange(()=>{setTimeout(()=>syncAccount(),0);});await syncAccount();}catch(error){accountError=error.message;notify();}})();
  async function signIn(username,password){await ready;if(!auth)throw Error(accountError||'Sign-in unavailable.');if(!/^[a-zA-Z0-9_-]{3,16}$/.test(username.trim()))throw Error('Enter your Repo Company username.');const {error}=await auth.auth.signInWithPassword({email:username.trim().toLowerCase()+'@'+config.authDomain,password});if(error)throw Error('That username or password was not accepted.');await syncAccount();if(!player)throw Error(accountError||'Your player profile could not be loaded.');}
  async function signOut(){if(auth)await auth.auth.signOut({scope:'local'});player=null;generation++;notify();}
  async function begin(options){
   await ready;current=null;if(options.practice||!player)return null;if(starting)return null;starting=true;
   try{
    await chain;await retry();if(!player)return null;
    if(pending().some(entry=>entry.playerId===player.id)){notice('Your previous record is waiting to sync. This run will stay local.');return null;}
    const run={id:crypto.randomUUID(),playerId:player.id,username:player.username,seq:0,lastReport:0,ended:false};
    await request('/start',{runId:run.id,season:seasons[options.difficulty==='insane'?'insane':'normal'],mode:options.mode,weapon:options.weapon,loadout:options.loadout});current=run;return run;
   }catch(error){notice('Playing offline: '+error.message);return null;}finally{starting=false;}
  }
  const report=(run,state,activeMs)=>({runId:run.id,seq:++run.seq,activeMs,waveMs:Math.round(state.runTime*1000),kills:state.kills,bosses:state.bossKills||0,majors:state.majorKills||0,finales:state.finaleKills||0,score:Math.floor(state.score),outcome:state.status});
  function heartbeat(state,activeMs){
   const run=current;if(!run||run.ended||player?.id!==run.playerId||activeMs-run.lastReport<30000)return;run.lastReport=activeMs;const body=report(run,state,activeMs);
   chain=chain.then(()=>request('/checkpoint',body)).catch(()=>{});
  }
  function finish(state,activeMs){
   const run=current;if(!run||run.ended||state.practice)return Promise.resolve({guest:true});run.ended=true;const body=report(run,state,activeMs),entry={playerId:run.playerId,body,createdAt:Date.now()};
   savePending([...pending().filter(p=>p.body.runId!==run.id),entry]);
   const send=async()=>{if(player?.id!==run.playerId)throw Error('Sign in with '+run.username+' to post this run.');const result=await request('/finish',body);if(!result.posted)throw Error('The record is waiting to sync.');savePending(pending().filter(p=>p.body.runId!==run.id));notify();return result;};
   const result=chain.then(send).catch(error=>{if([400,404,409].includes(error.status))savePending(pending().filter(p=>p.body.runId!==run.id));throw error;});chain=result.catch(()=>{});return result;
  }
  function retry(){
   if(retrying)return retrying;retrying=(async()=>{if(!player)return;for(const entry of pending())if(entry.playerId===player?.id){try{const result=await request('/finish',entry.body);if(result.posted)savePending(pending().filter(p=>p.body.runId!==entry.body.runId));}catch(error){if([400,404,409].includes(error.status))savePending(pending().filter(p=>p.body.runId!==entry.body.runId));}}})();return retrying.finally(()=>{retrying=null;});
  }
  root.addEventListener('online',()=>void retry());
  function mount(panel){
   let difficulty='normal',mode='endless',sort='survival',weapon='all',loadout='all',page=0,requestId=0,loginOpen=false;
   const account=el('section','mr-board-account'),nav=el('nav','mr-reader-tabs'),controls=el('div','mr-board-controls'),description=el('p','mr-board-description'),content=el('div','mr-board-content'),own=el('div','mr-board-own'),pages=el('nav','mr-board-pages'),status=el('p','mr-board-status');
   nav.setAttribute('aria-label','Leaderboard mode');pages.setAttribute('aria-label','Leaderboard pages');status.setAttribute('role','status');content.setAttribute('aria-live','polite');panel.append(account,nav,controls,description,status,content,own,pages,el('p','mr-reader-footnote','Gameplay time includes bosses and transitions. Pauses and upgrade choices are excluded. One best run per player; practice and old local records do not count.'));
   function accountView(){
    if(!panel.isConnected){listeners.delete(accountView);return;}account.replaceChildren();
    if(player){account.append(el('p','','Playing as '+player.username),button('Sign out',async()=>{await signOut();load();}));return;}
    account.append(el('p','','Your Repo Company name. Your place in the night.'),button(loginOpen?'Close sign-in':'Sign in to post records',()=>{loginOpen=!loginOpen;accountView();}));
    if(!loginOpen)return;
    const form=el('form','mr-board-login'),username=el('input'),password=el('input'),message=el('p','mr-board-status'),submit=el('button','mr-reader-action','Sign in');
    username.name='username';username.autocomplete='username';username.maxLength=16;username.required=true;password.name='password';password.type='password';password.autocomplete='current-password';password.required=true;submit.type='submit';
    for(const [label,input]of [['Username',username],['Password',password]]){const wrap=el('label','',label);wrap.append(input);form.append(wrap);}message.setAttribute('role','status');const create=el('a','mr-board-action','Create an account at Repo Company ↗');create.href='https://repocompany.uk/#account/profile';create.target='_blank';create.rel='noopener';
    form.append(submit,create,el('small','','Runs started while signed in are posted publicly under your username.'),message);form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;message.textContent='Signing in…';try{await signIn(username.value,password.value);password.value='';loginOpen=false;accountView();load();}catch(error){message.textContent=error.message;submit.disabled=false;}};account.append(form);username.focus();
   }
   function filters(){
    nav.replaceChildren();for(const [value,label]of [['endless','Endless Night'],['mora','Mora Mode']]){const b=button(label,()=>{mode=value;sort=mode==='mora'?'fastest':'survival';page=0;filters();load();},'mr-reader-tab');b.setAttribute('aria-pressed',String(mode===value));nav.append(b);}
    controls.replaceChildren();for(const [name,value,options,change]of [
     ['Difficulty',difficulty,[['normal','Normal'],['insane','Insane']],v=>{difficulty=v;}],
     ['Ranking',sort,mode==='mora'?[['fastest','Fastest clear'],['completions','Most completions']]:[['survival','Longest survival'],['kills','Most enemies killed']],v=>{sort=v;}],
     ['Weapon',weapon,[['all','All weapons'],['espresso','Coffee'],['baguette','Blade']],v=>{weapon=v;}]
    ]){const label=el('label','',name),select=el('select');select.setAttribute('aria-label',name);for(const [v,text]of options){const option=el('option','',text);option.value=v;select.append(option);}select.value=value;select.onchange=()=>{change(select.value);page=0;load();};label.append(select);controls.append(label);}
   }
   function row(record,personal=false){
    const tr=el('tr',record.isYou?'mr-board-you':'');tr.append(el('td','mr-board-rank',String(record.rank)),el('th','',record.username+(record.isYou?' · You':'')));
    if(sort==='completions')tr.append(el('td','',record.completions.toLocaleString()));
    tr.append(el('td','mr-board-time',root.MOROGUE_RUN_CLOCK.format(record.activeMs,true)),el('td','',record.kills.toLocaleString()));if(mode==='endless')tr.append(el('td','',String((record.bosses||0)+(record.majors||0)+(record.finales||0))));tr.append(el('td','mr-board-build',(record.weapon==='espresso'?'Coffee':'Blade')));return tr;
   }
   function table(records,caption){const t=el('table','mr-board-table');t.append(el('caption','',caption));const head=el('thead'),header=el('tr'),body=el('tbody');for(const label of ['Rank','Player',...(sort==='completions'?['Clears']:[]),mode==='mora'?'Best clear':'Survived','Enemies',...(mode==='endless'?['Bosses']:[]),'Weapon']){const th=el('th','',label);th.scope='col';header.append(th);}head.append(header);for(const record of records)body.append(row(record));t.append(head,body);return t;}
   async function load(){
    const id=++requestId;content.setAttribute('aria-busy','true');status.textContent='Loading records…';
    description.textContent=mode==='mora'?(sort==='completions'?'Every completed circuit counts. Ties go to the faster clear.':'Defeat all twelve bosses and The Uncrowned. The fastest full clear leads.'):(sort==='kills'?'The most enemies banished in a single Endless run.':'The longest night, including every boss fight.');
    try{await ready;await retry();const data=await request('?'+new URLSearchParams({season:seasons[difficulty],mode,sort,weapon,loadout,page}),undefined,!player);if(id!==requestId||!panel.isConnected)return;content.replaceChildren();own.replaceChildren();pages.replaceChildren();status.textContent='';
     if(data.rows.length)content.append(table(data.rows,'Public '+(difficulty==='insane'?'Insane ':'Normal ')+(mode==='mora'?'Mora Mode':'Endless Night')+' records'));else content.append(el('h2','mr-board-empty','The first page is waiting.'),el('p','','No recorded runs for these filters yet.'));
     if(data.own){own.append(el('h2','','Your best'),table([data.own],'Your place in this ranking'));}else if(player)own.append(el('p','','Complete a '+(mode==='mora'?'Mora Mode':'Endless')+' run to set your first record.'));
     if(data.total){const prev=button('← Previous',()=>{page--;load();}),next=button('Next →',()=>{page++;load();});prev.disabled=page===0;next.disabled=(page+1)*25>=data.total;pages.append(prev,el('span','',(page*25+1)+'–'+Math.min((page+1)*25,data.total)+' of '+data.total),next);}
    }catch(error){if(id!==requestId||!panel.isConnected)return;content.replaceChildren();own.replaceChildren();pages.replaceChildren();status.textContent=error.message;content.append(button('Try again',load));}finally{if(id===requestId)content.setAttribute('aria-busy','false');}
   }
   listeners.add(accountView);accountView();filters();void load();return{refresh:load};
  }
  return{ready,mount,begin,heartbeat,finish,signIn,signOut,retry,get player(){return player;}};
 }
 root.MOROGUE_LEADERBOARDS={create};
})(globalThis);
