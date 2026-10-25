const encoder=new TextEncoder(),scope='comp-run-airport-v1';
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const keyFor=env=>env.ACCOUNT_ADMIN_KEY||env.WIBS_STORAGE_KEY;
async function signingKey(env){const key=keyFor(env);if(!key)throw Error('UNAVAILABLE');return crypto.subtle.importKey('raw',encoder.encode(scope+':'+key),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
// Existing native launchers can receive a narrowly scoped, 15-minute shop
// capability through their authenticated start request. No account JWT enters
// the game, and this ticket cannot access other products or transfer currency.
export async function createAirportAccess(env,userId,session,now=Date.now()){
 if(!keyFor(env))return null;
 const expires=now+900000,payload=encode(encoder.encode(JSON.stringify({scope,userId,session,expires})));
 const signature=encode(new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload))));
 return{ticket:payload+'.'+signature,expires};
}
export async function verifyAirportAccess(env,ticket,now=Date.now()){
 if(typeof ticket!=='string'||ticket.length>1024)throw Error('AUTH');
 try{
  const [payload,signature,extra]=ticket.split('.');if(extra||!payload||!signature)throw Error();
  if(!await crypto.subtle.verify('HMAC',await signingKey(env),decode(signature),encoder.encode(payload)))throw Error();
  const value=JSON.parse(new TextDecoder().decode(decode(payload)));
  if(value.scope!==scope||!Number.isSafeInteger(value.expires)||value.expires<=now||value.expires>now+900000||!/^[-a-f0-9]{36}$/.test(value.userId)||!/^[-a-f0-9]{36}$/.test(value.session))throw Error();
  return value;
 }catch{throw Error('AUTH');}
}
