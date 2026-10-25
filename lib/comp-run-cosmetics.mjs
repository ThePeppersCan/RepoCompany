const encoder=new TextEncoder(),scope='comp-run-finishes-v1';
const encode=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const keyFor=env=>env.ACCOUNT_ADMIN_KEY||env.WIBS_STORAGE_KEY;
async function signingKey(env){const key=keyFor(env);if(!key)throw Error('UNAVAILABLE');return crypto.subtle.importKey('raw',encoder.encode(scope+':'+key),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
// Existing native launchers can receive a narrowly scoped, 15-minute shop
// capability through their authenticated start request. No account JWT enters
// the game, and this ticket cannot access other products or transfer currency.
export async function createCosmeticsAccess(env,userId,session,now=Date.now()){
 if(!keyFor(env))return null;
 const expires=now+900000,payload=encode(encoder.encode(JSON.stringify({scope,userId,session,expires})));
 const signature=encode(new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload))));
 return{ticket:payload+'.'+signature,expires};
}
export async function verifyCosmeticsAccess(env,ticket,now=Date.now()){
 if(typeof ticket!=='string'||ticket.length>1024)throw Error('AUTH');
 try{
  const [payload,signature,extra]=ticket.split('.');if(extra||!payload||!signature)throw Error();
  if(!await crypto.subtle.verify('HMAC',await signingKey(env),decode(signature),encoder.encode(payload)))throw Error();
  const value=JSON.parse(new TextDecoder().decode(decode(payload)));
  if(value.scope!==scope||!Number.isSafeInteger(value.expires)||value.expires<=now||value.expires>now+900000||!/^[-a-f0-9]{36}$/.test(value.userId)||!/^[-a-f0-9]{36}$/.test(value.session))throw Error();
  return value;
 }catch{throw Error('AUTH');}
}
export async function cosmeticsRequest({request,env,config,reply,readBody}){
 const body=await readBody(request,2048);if(!body||!['state','buy','buy-runner'].includes(body.action))return reply({error:'Choose a shop action.'},400);
 try{
  const access=await verifyCosmeticsAccess(env,body.ticket);
  const owner=await env.DASHBOARD_DB.prepare('SELECT p.user_id FROM dashboard_achievement_sessions s JOIN dashboard_players p ON p.username=s.username WHERE s.id=? AND s.game=? AND s.expires_at>? AND p.user_id=?').bind(access.session,'comp-run',Date.now(),access.userId).first();
  if(owner?.user_id!==access.userId)throw Error('AUTH');
  if(body.action==='buy'&&(typeof body.finishId!=='string'||!/^[a-z]{3,20}$/.test(body.finishId)))return reply({error:'Choose a valid knife finish.'},400);
  if(body.action==='buy-runner'&&(typeof body.runnerId!=='string'||!/^[a-z][a-z-]{2,30}$/.test(body.runnerId)))return reply({error:'Choose a valid runner.'},400);
  const key=keyFor(env),buying=body.action!=='state',method=buying?'buy_comp_run_cosmetic_for_user':'comp_run_cosmetics_for_user';
  const response=await fetch(config.url+'/rest/v1/rpc/'+method,{method:'POST',headers:{apikey:key,...(!key.startsWith('sb_secret_')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json'},body:JSON.stringify({p_user_id:access.userId,...(buying?{p_kind:body.action==='buy'?'knife':'runner',p_id:body.action==='buy'?body.finishId:body.runnerId}:{})}),signal:AbortSignal.timeout(12000)});
  const data=await response.json();
  if(!response.ok){const message=typeof data?.message==='string'&&/^You need \d+ Repoints|^Choose a valid (knife finish|runner)|^Your player profile/.test(data.message)?data.message:'Your purchase could not be confirmed. Refresh your collection before retrying.';return reply({error:message},response.status===400?400:503);}
  const row=Array.isArray(data)?data[0]:data;
  if(!row||(!Array.isArray(row.owned)||!row.owned.every(id=>typeof id==='string'&&/^[a-z]{3,20}$/.test(id)))||!Array.isArray(row.runners)||!row.runners.every(id=>typeof id==='string'&&/^[a-z][a-z-]{2,30}$/.test(id))||(!Number.isSafeInteger(Number(row.new_gp))||Number(row.new_gp)<0))throw Error('UNAVAILABLE');
  return reply({owned:row.owned,runners:row.runners,balance:Number(row.new_gp),alreadyOwned:row.already_owned===true});
 }catch(error){return reply({error:error.message==='AUTH'?'Reconnect your account to use the shop.':'The shop is unavailable. Refresh your collection before retrying.',reconnect:error.message==='AUTH'},error.message==='AUTH'?401:503);}
}
