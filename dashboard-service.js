(() => {
 'use strict';
 const config=window.repoDashboardConfig,db=window.supabase.createClient(config.url,config.key);
 const state={ready:false,user:null,character:null,bank:null,cards:[],slabs:[],frames:null,framesError:'',social:null,error:'',collectionError:'',socialError:'',loading:false};
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
  if(!state.user)return;const userId=state.user.id,revision=generation;try{const result=await api('state');if(state.user?.id!==userId||generation!==revision)return;state.social=result;state.socialError='';}catch(e){if(state.user?.id!==userId||generation!==revision)return;state.socialError=e.message;}notify();
 }
 async function heartbeat(online=!document.hidden){if(!state.user)return;try{await api('presence',{game,online});}catch(_){} }
 async function refresh(){
  if(refreshPromise)return refreshPromise;
  const revision=++generation;state.loading=true;notify();
  refreshPromise=(async()=>{
   try{
    const {data:{user},error}=await db.auth.getUser();
    if(revision!==generation)return;
    if(error||!user){Object.assign(state,{user:null,character:null,bank:null,cards:[],slabs:[],frames:null,framesError:'',social:null,error:'',collectionError:'',socialError:''});return;}
    if(state.user?.id!==user.id)Object.assign(state,{bank:null,cards:[],slabs:[],frames:null,framesError:'',social:null});
    state.user=user;state.character=await rpc('get_my_character');if(!state.character)throw new Error('Your player profile could not be loaded. Please try signing in again.');
    const results=await Promise.allSettled([rpc('get_my_bank'),rpc('get_my_quidditch_tcg_collection'),rpc('get_my_rcg_slab_binder_view'),rpc('get_my_world_cup_pack_event_state',{p_username:state.character.username})]);
    if(revision!==generation)return;
    state.bank=results[0].status==='fulfilled'?results[0].value:null;
    state.cards=results[1].status==='fulfilled'&&Array.isArray(results[1].value?.cards)?results[1].value.cards:[];
    if(results[3].status==='fulfilled')for(const card of results[3].value?.cards||[])if(!state.cards.includes(card))state.cards.push(card);
    state.slabs=results[2].status==='fulfilled'&&Array.isArray(results[2].value?.slabs)?results[2].value.slabs:[];
    state.collectionError=results[0].status==='rejected'||results[1].status==='rejected'?'Some collection data could not be loaded. Retry before making a purchase.':'';
    state.error='';await Promise.all([refreshSocial(),refreshFrames()]);await heartbeat();
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
 async function signOut(){await heartbeat(false);await db.auth.signOut();generation++;Object.assign(state,{user:null,character:null,bank:null,cards:[],slabs:[],frames:null,framesError:'',social:null,error:'',collectionError:'',socialError:'',ready:true});notify();}
 async function refreshFrames(){
  const userId=state.user?.id,revision=generation;if(!userId)return;
  try{const [row,rewards]=await Promise.all([rpc('get_my_avatar_frames'),api('frame-rewards')]);if(!Array.isArray(row?.owned)||!Array.isArray(rewards?.owned))throw Error('Your frames could not be loaded.');if(state.user?.id!==userId||revision!==generation)return;state.frames=[...new Set([...row.owned,...rewards.owned])];state.framesError='';}
  catch{if(state.user?.id!==userId||revision!==generation)return;state.frames=null;state.framesError='Your frame collection is unavailable. Refresh before buying or equipping.';}
  notify();
 }
 let rewardSignature='';addEventListener('repo-achievement-state',()=>{const signature=(state.user?.id||'')+':'+Object.values(window.repoAchievementState?.mine||{}).filter(a=>a.unlocked_at).map(a=>a.id).sort().join(',');if(signature!==rewardSignature){rewardSignature=signature;if(state.user)refreshFrames();}});
 let frameBusy=false;
 async function buyFrame(id){
  if(window.repoFrames?.get(id)?.kind==='achievement')throw Error('This frame is earned through its achievement.');
  if(frameBusy)throw Error('Your frame purchase is already processing.');if(!state.user)throw Error('Sign in to buy a frame.');
  const userId=state.user.id,revision=generation;frameBusy=true;
  try{const row=await rpc('buy_avatar_frame',{p_frame_id:id});if(state.user?.id!==userId||revision!==generation)throw Error('Your account changed. Refresh your collection.');
   if(!Array.isArray(row?.owned)||!row.owned.includes(id)||!Number.isFinite(Number(row.new_gp)))throw Error('Your purchase could not be confirmed. Refresh your collection before trying again.');
   state.frames=[...new Set([...row.owned,...(state.frames||[]).filter(id=>window.repoFrames?.get(id)?.kind==='achievement')])];state.framesError='';state.bank={...state.bank,gp:Number(row.new_gp)};notify();return row;
  }finally{frameBusy=false;}
 }
 async function equipFrame(id){
  const userId=state.user?.id,revision=generation;if(!userId)throw Error('Sign in to equip a frame.');
  const row=await api('frame',{frameId:id});if(state.user?.id!==userId||revision!==generation)throw Error('Your account changed. Refresh your profile.');
  if(!row.ok||row.frame_id!==id)throw Error('Your frame could not be confirmed.');if(state.social?.profile)state.social.profile.frame_id=id;notify();return row;
 }
 let buying=false;
 async function buyPack(){
  if(buying)throw new Error('Your purchase is already processing.');
  if(!state.user)throw new Error('Sign in to buy a pack.');
  buying=true;
  try{const row=await rpc('buy_quidditch_tcg_pack');if(!row||!Number.isFinite(Number(row.new_gp)))throw new Error('Could not confirm your purchase. Refresh your inventory before trying again.');state.bank={gp:Number(row.new_gp),items:row.bank_items||{}};notify();return row;}
  finally{buying=false;}
 }
 let openingPack=false;
 async function openPack(){
  if(openingPack)throw new Error('Your pack is already opening.');
  if(!state.user)throw new Error('Sign in to open a pack.');
  if(Number(state.bank?.items?.quidditch_tcg_pack||0)<1)throw new Error('You have no unopened packs.');
  openingPack=true;
  try{
   // The existing server transaction consumes the pack and chooses/saves its card.
   // Never retry this mutation automatically after an uncertain network response.
   const row=await rpc('open_quidditch_tcg_pack');
   if(!row?.card_id||!Array.isArray(row.owned_cards)||!row.bank_items)throw new Error('The pack result could not be confirmed.');
   state.bank={...state.bank,items:row.bank_items};
   state.cards=[...row.owned_cards];
   for(const key of ['one','two'])if(row['skill_'+key+'_total']!=null&&row['skill_'+key]){
    state.character[String(row['skill_'+key]).replace(/_xp$/,'')+'_xp']=Number(row['skill_'+key+'_total']);
   }
   notify();return row;
  }finally{openingPack=false;}
 }
 window.repoAccount=Object.freeze({state,refresh,refreshSocial,refreshFrames,signIn,signOut,buyPack,openPack,buyFrame,equipFrame,api,rpc,db,setGame(id){game=id;heartbeat();},setAvatar:async avatar=>{const userId=state.user?.id,revision=generation;if(!userId)throw Error('Sign in to save your avatar.');const result=await api('avatar',{avatar});if(!result.ok||!result.avatar)throw Error('Your avatar could not be confirmed. Please reload your profile.');if(state.user?.id!==userId||generation!==revision)throw Error('Your account changed. Reload your profile.');if(state.social?.profile)state.social.profile.avatar=result.avatar;notify();return result.avatar;},setProfile:async values=>{await api('profile',values);await refreshSocial();}});
 db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(refresh,0);});
 document.addEventListener('visibilitychange',()=>{heartbeat();if(!document.hidden&&state.user){refreshSocial();refreshFrames();}});
 heartbeatTimer=setInterval(()=>{heartbeat();if(!document.hidden&&document.querySelector('#account-menu[open]')&&['friends','profile'].includes(document.querySelector('#account-menu').dataset.accountTab))refreshSocial();},15000);
 addEventListener('pagehide',()=>{clearInterval(heartbeatTimer);});
 refresh();
})();
