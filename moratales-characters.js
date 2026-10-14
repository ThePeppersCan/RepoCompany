(() => {
  'use strict';
  const origin='https://moratales.repocompany.uk',channel='morogue-characters-v1';
  const endpoint='/api/characters/moratales';
  const lookKeys=['skin','hair','hair_colour','face','eyes','nose','mouth','eye_colour','shirt','trousers','shoes','hat','shirt_colour','trousers_colour','shoes_colour','hat_colour'];
  const $=id=>document.getElementById(id);
  const state={session:null,epoch:0,load:0,checking:true,authBusy:false,loading:false,busy:false,locals:[],cloud:null,selected:new Set(),localError:'',cloudError:'',saved:null,linked:false};
  const requests=new Map(),controllers=new Set();
  let bridge=null,bridgeNonce='',requestId=0,db=null,authEvents=0;
  const object=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
  const username=()=>state.session?.user?.user_metadata?.username||state.session?.user?.email?.split('@')[0]||'your account';
  const ticket=()=>({epoch:state.epoch,load:state.load,userId:state.session?.user?.id});
  const current=t=>t.epoch===state.epoch&&t.load===state.load&&t.userId===state.session?.user?.id;
  const source=id=>id.startsWith('slot-')?'Adventure slot '+(Number(id.slice(-1))+1):'Current MoraTales character';
  function characters(value){
    if(!Array.isArray(value)||value.length>4)throw Error('The character list could not be read safely.');
    const ids=new Set();
    return value.map(item=>{
      if(!object(item)||typeof item.id!=='string'||!/^(?:slot-[0-2]|current)$/.test(item.id)||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>32||/[\u0000-\u001f\u007f]/.test(item.name)||!object(item.look)||typeof item.look.skin!=='string'||typeof item.look.hair!=='string')throw Error('A character could not be read safely. Your saves have not been changed.');
      const name=item.name.trim(),look={name};ids.add(item.id);
      for(const key of lookKeys){if(item.look[key]!==undefined){if(typeof item.look[key]!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(item.look[key]))throw Error('A character appearance could not be read safely.');look[key]=item.look[key];}}
      return {id:item.id,name,look};
    });
  }
  function snapshot(value,userId){
    if(!object(value)||value.userId!==userId||!Number.isSafeInteger(value.revision)||value.revision<0)throw Error('The account response did not match your current sign-in. Refresh to try again.');
    return {userId,revision:value.revision,characters:characters(value.characters),updatedAt:value.updatedAt};
  }
  function cancelPending(){
    for(const controller of controllers)controller.abort();controllers.clear();
    for(const pending of requests.values()){clearTimeout(pending.timer);pending.reject(Error('Account or character list changed.'));}requests.clear();
    bridge?.remove();bridge=null;bridgeNonce='';
  }
  function setResult(title,message,error=false){
    $('result').hidden=false;$('result').dataset.error=String(error);$('result-title').textContent=title;$('result-message').textContent=message;
  }
  function merged(){
    const result=new Map((state.cloud?.characters||[]).map(item=>[item.id,item]));
    for(const item of state.locals)if(state.selected.has(item.id))result.set(item.id,item);
    return [...result.values()];
  }
  function renderSelection(){
    const count=state.selected.size,existing=new Set((state.cloud?.characters||[]).map(item=>item.id));
    const replacements=state.locals.filter(item=>state.selected.has(item.id)&&existing.has(item.id)).length;
    const overCapacity=merged().length>4;
    $('confirmation').hidden=!state.locals.length;
    $('selection-summary').textContent=overCapacity?'This selection would exceed the four linked-character limit. Choose fewer characters; existing linked characters will be kept.':count?`${count} character${count===1?'':'s'} selected for ${username()}.${replacements?' Matching character slots on this account will be updated.':''} Other linked characters will be kept.`:'Choose at least one character to link.';
    $('link-characters').textContent=state.busy?'Linking…':state.linked?'Characters linked':'Link to '+username()+' →';
    $('link-characters').disabled=state.busy||state.authBusy||state.loading||!state.cloud||Boolean(state.cloudError)||Boolean(state.localError)||!count||overCapacity||Boolean(state.saved);
    $('refresh').disabled=state.busy||state.authBusy||state.loading;
    $('sign-out').disabled=state.busy||state.authBusy;
    $('character-choices').disabled=state.busy||state.loading||state.authBusy;
    $('retry-link').hidden=!state.saved||state.linked;
    $('retry-link').disabled=state.busy||state.authBusy;
    $('link-panel').setAttribute('aria-busy',String(state.checking||state.loading||state.busy||state.authBusy));
  }
  function renderList(){
    const list=$('character-list');list.replaceChildren();
    for(const item of state.locals){
      const row=document.createElement('div');row.className='character-row';
      const label=document.createElement('label');label.className='character-select';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=item.id;checkbox.checked=state.selected.has(item.id);
      checkbox.addEventListener('change',()=>{if(checkbox.checked)state.selected.add(item.id);else state.selected.delete(item.id);state.saved=null;state.linked=false;$('result').hidden=true;renderSelection();});
      const monogram=document.createElement('span');monogram.className='character-monogram';monogram.setAttribute('aria-hidden','true');monogram.textContent=Array.from(item.name)[0].toUpperCase();
      const copy=document.createElement('span'),name=document.createElement('span'),description=document.createElement('span');
      name.className='character-name';name.textContent=item.name;description.className='character-source';description.textContent=source(item.id);copy.append(name,description);label.append(checkbox,monogram,copy);
      row.append(label);list.append(row);
    }
    $('character-choices').hidden=!state.locals.length;$('local-count').textContent=state.locals.length?'('+state.locals.length+')':'';
  }
  function render(){
    const signedIn=Boolean(state.session);
    $('login-form').hidden=state.checking||signedIn;$('signed-in').hidden=!signedIn;$('sign-out').hidden=!signedIn;
    $('panel-title').textContent=state.checking?'Connecting to your account…':signedIn?'Link to '+username():'Welcome back.';
    $('account-status').textContent=state.checking?'Checking your Repo Company sign-in.':signedIn?'Signed in as '+username()+'. Choose the characters you want on this account.':'Your characters will be linked only after you choose them and confirm.';
    $('local-status').textContent=state.localError|| (state.loading&&!state.locals.length?'Looking for MoraTales characters in this browser…':state.locals.length?'Choose the names and appearances you want to bring into Morogue.':'No MoraTales characters were found here. Open this page in the browser and browser profile you use for MoraTales, then refresh. Existing linked characters have not been changed.');
    $('cloud-status').textContent=state.cloudError||(state.loading&&!state.cloud?'Checking characters already linked to your account…':'');
    $('cloud-summary').hidden=!state.cloud?.characters.length;
    $('cloud-names').textContent=state.cloud?.characters.map(item=>item.name+' · '+source(item.id)).join(' / ')||'';
    renderSelection();
  }
  async function api(method,t,body){
    if(!current(t))throw Error('Your account changed.');
    const {data,error}=await db.auth.getSession();
    if(!current(t)||error||data?.session?.user?.id!==t.userId||typeof data.session.access_token!=='string')throw Error('Your sign-in changed. Sign in again before linking characters.');
    const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(endpoint,{method,cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
      if(!current(t))throw Error('Your account changed.');
      if(response.status===409){const error=Error('Your linked characters changed elsewhere. Refresh characters, review the latest list, then link again.');error.conflict=true;throw error;}
      if(response.status===401||response.status===403)throw Error('Your sign-in could not be verified. Sign in again before linking characters.');
      if(!response.ok)throw Error('Your linked characters are unavailable right now. Please refresh and try again.');
      const payload=await response.json();if(!current(t))throw Error('Your account changed.');return snapshot(payload,t.userId);
    }catch(error){if(error.name==='AbortError')throw Error('The connection took too long. Refresh characters to try again.');throw error;}
    finally{clearTimeout(timeout);controllers.delete(controller);}
  }
  function bridgeRequest(action,payload){
    if(!bridge?.contentWindow||!bridgeNonce)return Promise.reject(Error('The MoraTales connection is unavailable. Refresh characters to try again.'));
    const frame=bridge,id=String(++requestId),nonce=bridgeNonce;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{requests.delete(id);reject(Error('MoraTales did not respond. Open this page in the browser you use for MoraTales, allow its browser storage, then refresh.'));},12000);
      requests.set(id,{resolve,reject,timer,frame,nonce});
      frame.contentWindow.postMessage({channel,nonce,id,action,...(payload?{payload}:{})},origin);
    });
  }
  addEventListener('message',event=>{
    const message=event.data;
    if(event.origin!==origin||event.source!==bridge?.contentWindow||!object(message)||message.channel!==channel||message.nonce!==bridgeNonce)return;
    if(message.event==='changed'){if(state.session&&!state.loading&&!state.busy){state.localError='Your MoraTales characters changed in another tab. Refresh characters to review the latest appearances.';render();}return;}
    if(typeof message.id!=='string')return;const pending=requests.get(message.id);
    if(!pending||pending.frame!==bridge||pending.nonce!==bridgeNonce)return;
    clearTimeout(pending.timer);requests.delete(message.id);
    if(message.error)pending.reject(Error(typeof message.error==='string'?message.error.slice(0,240):'Your MoraTales characters could not be read.'));else pending.resolve(message.result);
  });
  async function connectBridge(t){
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='Read your MoraTales character names and appearances';frame.referrerPolicy='strict-origin-when-cross-origin';
    bridge=frame;bridgeNonce=crypto.randomUUID();
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('MoraTales could not be reached. Refresh characters to try again.')),12000);frame.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});frame.addEventListener('error',()=>{clearTimeout(timer);reject(Error('MoraTales could not be reached.'));},{once:true});frame.src=origin+'/interface/vampire-survivor/character-bridge.html';document.body.append(frame);});
    if(!current(t)||bridge!==frame)return;
    if(await bridgeRequest('hello')!==true)throw Error('MoraTales could not establish a character connection.');
    if(!current(t)||bridge!==frame)return;
    const exported=await bridgeRequest('characters');
    if(!Array.isArray(exported)||exported.length>4)throw Error('The character list could not be read safely.');
    // Older bridges also return the separate Morogue record. Only MoraTales
    // characters can be linked through this page.
    const result=characters(exported.filter(item=>item?.id!=='survivor'));
    if(!current(t)||bridge!==frame)return;
    state.locals=result;state.selected=new Set(result.map(item=>item.id));renderList();
  }
  async function refresh(){
    if(!state.session||state.busy)return;
    state.load++;cancelPending();state.loading=true;state.locals=[];state.cloud=null;state.selected.clear();state.localError='';state.cloudError='';state.saved=null;state.linked=false;$('result').hidden=true;renderList();render();
    const t=ticket();
    await Promise.allSettled([
      api('GET',t).then(value=>{if(current(t)){state.cloud=value;render();}}).catch(error=>{if(current(t)){state.cloudError=error.message;render();}}),
      connectBridge(t).catch(error=>{if(current(t)){state.localError=error.message;render();}})
    ]);
    if(current(t)){state.loading=false;render();}
  }
  async function markLinked(saved,t){
    if(!current(t))return;
    try{
      const linked=await bridgeRequest('link',{userId:saved.userId,revision:saved.revision,characters:saved.characters,ids:saved.ids});
      if(!current(t))return;
      if(linked!==true)throw Error('MoraTales could not enable automatic appearance updates.');
      state.linked=true;setResult('Your characters are linked.','Reopen Morogue in the launcher, or retry its character list. Linked character names and appearances will also update when you play MoraTales in this browser.');
    }catch{if(current(t))setResult('Your characters have been saved.','Reopen Morogue in the launcher, or retry its character list. Automatic appearance updates could not be enabled in this browser. You can retry below without uploading the characters again.');}
  }
  async function link(){
    if($('link-characters').disabled)return;
    const t=ticket(),selectedIds=[...state.selected],selection=characters(merged());state.busy=true;render();
    try{
      const saved=await api('POST',t,{revision:state.cloud.revision,characters:selection});if(!current(t))return;
      state.cloud=saved;state.saved={...saved,ids:selectedIds};await markLinked(state.saved,t);
    }catch(error){if(current(t)){if(error.conflict)state.cloudError=error.message;setResult('Characters were not linked.',error.message,true);}}
    finally{if(current(t)){state.busy=false;render();}}
  }
  function applySession(session){
    if(!session?.user?.id||typeof session.access_token!=='string')session=null;
    const previous=state.session?.user?.id,next=session?.user?.id;
    state.session=session;state.checking=false;$('retry-account').hidden=true;
    if(previous!==next){
      state.epoch++;state.load++;cancelPending();state.locals=[];state.cloud=null;state.selected.clear();state.localError='';state.cloudError='';state.saved=null;state.linked=false;state.loading=false;state.busy=false;$('result').hidden=true;renderList();
      if(next)queueMicrotask(refresh);
    }
    render();
  }
  async function reconnect(){
    state.checking=true;$('retry-account').hidden=true;render();const generation=authEvents;
    try{const {data,error}=await db.auth.getSession();if(generation!==authEvents)return;if(error)throw error;applySession(data.session);}
    catch{if(generation!==authEvents)return;state.checking=false;render();$('account-status').textContent='Your account could not be reached. Check your connection, then try again.';$('retry-account').hidden=false;}
  }
  $('login-form').addEventListener('submit',async event=>{
    event.preventDefault();if(state.authBusy)return;state.authBusy=true;const button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;$('login-feedback').textContent='Signing in…';
    try{
      const name=$('username').value.trim();if(!/^[A-Za-z0-9_-]{3,16}$/.test(name))throw Error('Enter a username of 3–16 letters, numbers, underscores or dashes.');
      const startingEvents=authEvents,result=await db.auth.signInWithPassword({email:name.toLowerCase()+'@'+window.repoDashboardConfig.authDomain,password:$('password').value});
      if(result.error)throw Error('That username or password was not accepted. Please try again.');
      $('password').value='';$('login-feedback').textContent='';if(startingEvents===authEvents||state.session?.user?.id===result.data.session?.user?.id)applySession(result.data.session);
    }catch(error){$('login-feedback').textContent=error.message||'Sign-in is unavailable right now. Please try again.';}
    finally{state.authBusy=false;button.disabled=false;render();}
  });
  $('sign-out').addEventListener('click',async()=>{
    if(state.authBusy||state.busy)return;state.authBusy=true;render();
    try{const {error}=await db.auth.signOut({scope:'local'});if(error)throw error;applySession(null);$('username').focus();}
    catch{setResult('Could not switch accounts.','Check your connection and try again.',true);}
    finally{state.authBusy=false;render();}
  });
  $('refresh').addEventListener('click',refresh);$('link-characters').addEventListener('click',link);$('retry-account').addEventListener('click',reconnect);
  $('retry-link').addEventListener('click',async()=>{if(!state.saved||state.busy||state.authBusy)return;const t=ticket();state.busy=true;render();try{await markLinked(state.saved,t);}finally{if(current(t)){state.busy=false;render();}}});
  addEventListener('pagehide',cancelPending);
  addEventListener('pageshow',event=>{if(event.persisted&&state.session)refresh();});
  try{
    const config=window.repoDashboardConfig;if(!config?.url||!config?.key||!config?.authDomain||!window.supabase?.createClient)throw Error('Account connection unavailable.');
    db=window.supabase.createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    db.auth.onAuthStateChange((_event,session)=>{authEvents++;applySession(session);});reconnect();
  }catch{state.checking=false;render();$('login-form').hidden=true;$('account-status').textContent='The account connection could not load. Refresh this page to try again.';}
})();
