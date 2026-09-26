// Guests keep a separate browser session so they never replace a RepoCompany login.
export function createRepartyAuth({createClient,config,onSession,onError}) {
 const account=createClient(config.url,config.key);
 const guest=createClient(config.url,config.key,{auth:{storageKey:'reparty-guest-session',detectSessionInUrl:false}});
 let accountSession=null,guestSession=null,ready=false,queue=Promise.resolve();
 const publish=()=>{
  queue=queue.catch(()=>{}).then(()=>onSession(accountSession?account:guestSession?guest:account,accountSession||guestSession));
  return queue;
 };
 async function start(){
  let accountVersion=0,guestVersion=0;
  account.auth.onAuthStateChange((_event,session)=>{accountVersion++;accountSession=session;if(ready)setTimeout(()=>publish().catch(onError),0);});
  guest.auth.onAuthStateChange((_event,session)=>{guestVersion++;guestSession=session;if(ready)setTimeout(()=>publish().catch(onError),0);});
  const av=accountVersion,gv=guestVersion;
  const [a,g]=await Promise.all([account.auth.getSession(),guest.auth.getSession()]);
  if(a.error)throw a.error;if(g.error)throw g.error;
  if(av===accountVersion)accountSession=a.data.session;
  if(gv===guestVersion)guestSession=g.data.session;
  ready=true;await publish();
 }
 async function continueAsGuest(name){
  const clean=String(name||'').trim().replace(/\s+/g,' ');
  if(clean.length<2||clean.length>24||/[\u0000-\u001f\u007f]/.test(clean))throw new Error('Choose a display name with 2–24 characters.');
  if(accountSession){await publish();return;}
  if(!guestSession){
   const {data,error}=await guest.auth.signInAnonymously({options:{data:{reparty_name:clean}}});
   if(error)throw error;guestSession=data.session;
  }
  await publish();
 }
 async function signIn(username,password){
  const {data,error}=await account.auth.signInWithPassword({email:`${username.trim().toLowerCase()}@${config.authDomain}`,password});
  if(error)throw error;accountSession=data.session;await publish();
 }
 async function signUp(username,password){
  const clean=username.trim();
  if(!/^[A-Za-z0-9_-]{3,16}$/.test(clean))throw new Error('Use 3–16 letters, numbers, underscores or dashes for your username.');
  if(password.length<6)throw new Error('Choose a password with at least 6 characters.');
  const {data,error}=await account.auth.signUp({email:`${clean.toLowerCase()}@${config.authDomain}`,password,options:{data:{username:clean}}});
  if(error)throw error;
  if(!data.session)throw new Error('Please try signing in to finish, or continue as a guest.');
  accountSession=data.session;await publish();
 }
 return {account,start,continueAsGuest,signIn,signUp};
}
