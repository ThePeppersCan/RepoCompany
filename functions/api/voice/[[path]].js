import config from '../../../dashboard-config.json';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export async function onRequest({request,env,params}) {
  try {
    const url=new URL(request.url),origin=request.headers.get('Origin');
    if((origin&&origin!==url.origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')throw fail('Use the Repo Company website or client.',403);
    if(request.method!=='POST')throw fail('Method not allowed.',405);
    const op=Array.isArray(params.path)?params.path.join('/'):params.path;
    if(!['state','community','create','join','leave','heartbeat','publish','ready','subscribe','answer','reset-receiver','moderate','screen-publish','screen-ready','screen-watch','screen-answer','screen-stop','screen-unwatch'].includes(op))throw fail('Not found.',404);
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('Send a JSON request.',415);
    const reader=request.body?.getReader();if(!reader)throw fail('Request body required.');
    let size=0;const chunks=[];
    try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>65536){await reader.cancel();throw fail('Request too large.',413);}chunks.push(part.value);}}finally{reader.releaseLock();}
    const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
    let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw fail('Invalid request.');}
    if(!body||typeof body!=='object'||Array.isArray(body))throw fail('Invalid request.');
    const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];
    if(!token)throw fail('Sign in to call.',401);
    const headers={apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'};
    // Both provider reads authenticate the same bearer independently. Run them
    // together; identity still requires both successful, verified responses.
    const [userResponse,profileResponse]=await Promise.all([
      fetch(config.url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)}),
      fetch(config.url+'/rest/v1/rpc/get_my_character',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(8000)})
    ]);
    if(!userResponse.ok)throw fail('Sign in again to call.',401);
    const user=await userResponse.json();
    if(typeof user.id!=='string'||!/^[a-f0-9-]{36}$/i.test(user.id)||user.is_anonymous)throw fail('Sign in to call.',401);
    if(!profileResponse.ok)throw fail('Your account is temporarily unavailable.',503);
    const profile=await profileResponse.json(),character=Array.isArray(profile)?profile[0]:profile;
    if(!/^[a-z0-9_-]{3,16}$/i.test(character?.username||''))throw fail('Create a player profile first.',409);
    if(!env.REPO_VOICE)return json({enabled:false,reason:'Voice is being set up.'});
    // User identity is derived from verified auth, never from the caller's JSON.
    return await env.REPO_VOICE.fetch('https://voice.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,me:{id:user.id.toLowerCase(),name:character.username.toLowerCase()},body})});
  }catch(error){return json({error:error.status?error.message:'Voice is temporarily unavailable.'},error.status||503);}
}
