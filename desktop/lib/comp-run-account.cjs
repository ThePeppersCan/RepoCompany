'use strict';
// A bounded account capability. The game receives results, never an auth token.
async function requestCompRunAccount({account,record,alive,portalOrigin,value}) {
  if(!value||typeof value!=='object'||!['start','progress','run-start','run-finish'].includes(value.kind))throw Error('Unknown account request.');
  const kind=value.kind,input=value.body||{};
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid account request.');
  const ranked=kind.startsWith('run-');
  const body=ranked?Object.fromEntries(['courseId','mode','season','version','run','timeMs','splits'].filter(k=>Object.hasOwn(input,k)).map(k=>[k,input[k]])):kind==='start'?{game:'comp-run'}:{game:'comp-run',session:input.session,facts:input.facts};
  const encoded=JSON.stringify(body);if(Buffer.byteLength(encoded)>4096)throw Error('Account request is too large.');
  const identity=await account.requireOnline();
  const current=()=>alive()&&record.__gameId==='comp-run'&&identity===record.__accountId&&identity===account.identity&&account.state.status==='online';
  if(!current())throw Error('Your account changed. Reopen the game.');
  const response=await account.fetch(portalOrigin+(ranked?'/api/comp-run/':'/api/achievements/')+kind,{method:'POST',headers:{Authorization:'Bearer '+account.token,'Content-Type':'application/json'},body:encoded,signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!current())throw Error('Your account changed. Reopen the game.');
  if(!response.ok)throw Error(result.error||'Your account could not connect.');return result;
}
module.exports={requestCompRunAccount};
