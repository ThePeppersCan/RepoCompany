(() => {
 'use strict';
 const config=window.repoDashboardConfig,db=window.supabase.createClient(config.url,config.key);
 const state={ready:false,user:null,character:null,bank:null,cards:[],slabs:[],social:null,error:'',collectionError:'',socialError:'',loading:false};
 let generation=0,game='',refreshPromise=null,heartbeatTimer=null;
 const notify=()=>dispatchEvent(new CustomEvent('repo-account-state',{detail:state}));
 const first=data=>Array.isArray(data)?data[0]:data;
 async function rpc(name,args){const {data,error}=await db.rpc(name,args);if(error)throw new Error(error.message||'Could not load your account.');return first(data);}
 async function api(route,body){
  const {data:{session}}=await db.auth.getSession();if(!session)throw new Error('Sign in to continue.');
  const response=await fetch('/api/dashboard/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+session.access_token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not complete that action.');return result;
 }
 async function refreshSocial(){
  if(!state.user)return;try{state.social=await api('state');state.socialError='';}catch(e){state.socialError=e.message;}notify();
 }
 async function heartbeat(online=!document.hidden){if(!state.user)return;try{await api('presence',{game,online});}catch(_){} }
 async function refresh(){
  if(refreshPromise)return refreshPromise;
  const revision=++generation;state.loading=true;notify();
  refreshPromise=(async()=>{
   try{
    const {data:{user},error}=await db.auth.getUser();
    if(revision!==generation)return;
    if(error||!user){Object.assign(state,{user:null,character:null,bank:null,cards:[],slabs:[],social:null,error:'',collectionError:'',socialError:''});return;}
    state.user=user;state.character=await rpc('get_my_character');if(!state.character)throw new Error('Your player profile could not be loaded. Please try signing in again.');
    const results=await Promise.allSettled([rpc('get_my_bank'),rpc('get_my_quidditch_tcg_collection'),rpc('get_my_rcg_slab_binder_view'),rpc('get_my_world_cup_pack_event_state',{p_username:state.character.username})]);
    if(revision!==generation)return;
    state.bank=results[0].status==='fulfilled'?results[0].value:null;
    state.cards=results[1].status==='fulfilled'&&Array.isArray(results[1].value?.cards)?results[1].value.cards:[];
    if(results[3].status==='fulfilled')for(const card of results[3].value?.cards||[])if(!state.cards.includes(card))state.cards.push(card);
    state.slabs=results[2].status==='fulfilled'&&Array.isArray(results[2].value?.slabs)?results[2].value.slabs:[];
    state.collectionError=results[0].status==='rejected'||results[1].status==='rejected'?'Some collection data could not be loaded. Retry before making a purchase.':'';
    state.error='';await refreshSocial();await heartbeat();
   }catch(e){if(revision===generation)state.error=e.message;}
   finally{if(revision===generation){state.ready=true;state.loading=false;notify();}refreshPromise=null;}
  })();return refreshPromise;
 }
 async function signIn(username,password,create=false){
  if(!/^[a-zA-Z0-9_-]{3,16}$/.test(username))throw new Error('Use 3–16 letters, numbers, _ or - for your username.');
  if(password.length<8)throw new Error('Your password must have at least 8 characters.');
  const credentials={email:username.trim().toLowerCase()+'@'+config.authDomain,password};
  const result=create?await db.auth.signUp({...credentials,options:{data:{username:username.trim()}}}):await db.auth.signInWithPassword(credentials);
  if(result.error)throw new Error(result.error.message);
  if(create&&!result.data.session)throw new Error('Your account was created, but sign-in requires confirmation. Contact Repo Company support.');
  await refresh();if(state.error)throw new Error(state.error);
 }
 async function signOut(){await heartbeat(false);await db.auth.signOut();generation++;Object.assign(state,{user:null,character:null,bank:null,cards:[],slabs:[],social:null,error:'',collectionError:'',socialError:'',ready:true});notify();}
 let buying=false;
 async function buyPack(){
  if(buying)throw new Error('Your purchase is already processing.');
  if(!state.user)throw new Error('Sign in to buy a pack.');
  buying=true;
  try{const row=await rpc('buy_quidditch_tcg_pack');if(!row||!Number.isFinite(Number(row.new_gp)))throw new Error('Could not confirm your purchase. Refresh your inventory before trying again.');state.bank={gp:Number(row.new_gp),items:row.bank_items||{}};notify();return row;}
  finally{buying=false;}
 }
 window.repoAccount=Object.freeze({state,refresh,refreshSocial,signIn,signOut,buyPack,api,rpc,db,setGame(id){game=id;heartbeat();},setProfile:async values=>{await api('profile',values);await refreshSocial();}});
 db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(refresh,0);});
 document.addEventListener('visibilitychange',()=>{heartbeat();if(!document.hidden&&state.user)refreshSocial();});
 heartbeatTimer=setInterval(()=>{heartbeat();if(document.querySelector('#account-menu[open][data-account-tab="friends"]'))refreshSocial();},30000);
 addEventListener('pagehide',()=>{clearInterval(heartbeatTimer);});
 refresh();
})();
