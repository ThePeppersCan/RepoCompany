(() => {
 'use strict';
 const allowed=new Set(['https://morogue.repocompany.uk','https://moratales.repocompany.uk']);
 if(parent===window)return;
 const config=window.repoDashboardConfig,db=window.supabase.createClient(config.url,config.key),channel='morogue-account-v1';
 let parentOrigin=null,parentNonce=null,authRevision=0,authUser;
 // The Repo Company origin owns refresh tokens and their rotation. Only a
 // short-lived access token crosses to the two explicitly trusted games.
 async function session(){const {data,error}=await db.auth.getSession();if(error)throw error;const s=data.session;return s?{access_token:s.access_token,expires_at:s.expires_at,user:{id:s.user.id}}:null;}
 async function characters(payload,write=false){
  const revision=authRevision;
  const before=await session();
  if(revision!==authRevision||!before||typeof payload?.userId!=='string'||before.user.id!==payload.userId)throw Error('ACCOUNT_CHANGED');
  const response=await fetch('/api/characters/moratales',{method:write?'POST':'GET',headers:{Authorization:'Bearer '+before.access_token,...(write?{'Content-Type':'application/json'}:{})},...(write?{body:JSON.stringify({revision:payload.revision,characters:payload.characters})}:{}),cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(revision!==authRevision)throw Error('ACCOUNT_CHANGED');
  const value=await response.json(),after=await session();
  if(revision!==authRevision||!after||after.user.id!==before.user.id)throw Error('ACCOUNT_CHANGED');
  if(!response.ok)throw Object.assign(Error('Character connection unavailable'),{code:response.status===409?'revision_conflict':'unavailable'});
  if(value.userId!==before.user.id)throw Error('ACCOUNT_CHANGED');
  return value;
 }
 const reply=(e,value)=>e.source.postMessage(value,e.origin);
 addEventListener('message',async e=>{
  const m=e.data;
  if(e.source!==parent||!allowed.has(e.origin)||m?.channel!==channel||typeof m.nonce!=='string'||!/^[a-f0-9-]{36}$/.test(m.nonce)||typeof m.id!=='string'||m.id.length>64)return;
  if(parentNonce&&(parentNonce!==m.nonce||parentOrigin!==e.origin))return;
  parentOrigin=e.origin;parentNonce=m.nonce;
  const response={channel,nonce:m.nonce,id:m.id};
  try{
   if(m.action==='hello')response.result=true;
   else if(m.action==='session')response.result=await session();
   else if(m.action==='characters')response.result=await characters(m.payload);
   else if(m.action==='characters-save'&&e.origin==='https://moratales.repocompany.uk')response.result=await characters(m.payload,true);
   else if(m.action==='signin'){
    const {email,password}=m.payload||{};
    if(typeof email!=='string'||!new RegExp('^[a-zA-Z0-9_-]{3,16}@'+config.authDomain.replaceAll('.','\\.')+'$').test(email)||typeof password!=='string'||password.length>1024)throw Error('Enter your Repo Company username and password.');
    const {error}=await db.auth.signInWithPassword({email,password});if(error)throw Error('That username or password was not accepted.');response.result={};
   }else if(m.action==='signout'){const {error}=await db.auth.signOut({scope:'local'});if(error)throw error;response.result={};}
   else if(m.action==='adopt'){
    // One-time migration for players already signed in on the standalone game.
    // Never replace a different account already signed in at Repo Company.
    if(!await session()){
     const p=m.payload;if(typeof p?.access_token!=='string'||typeof p?.refresh_token!=='string'||p.access_token.length>16384||p.refresh_token.length>4096)throw Error('Could not connect this account.');
     const {error}=await db.auth.setSession({access_token:p.access_token,refresh_token:p.refresh_token});if(error)throw Error('Please sign in again.');
    }
    response.result=await session();
   }else return;
  }catch(error){response.error=['signin','adopt'].includes(m.action)?error.message:'Your account connection is temporarily unavailable.';if(error.code)response.code=error.code;}
  reply(e,response);
 });
 db.auth.onAuthStateChange((event,value)=>{const next=value?.user?.id||null;if(event==='SIGNED_OUT'||authUser!==undefined&&next!==authUser)authRevision++;authUser=next;setTimeout(()=>{if(parentOrigin)parent.postMessage({channel,nonce:parentNonce,event:'changed'},parentOrigin);},0);});
})();
