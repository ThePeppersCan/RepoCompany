import config from '../../dashboard-config.json';
import {savePhoto,readPhoto} from '../../lib/profile-photos.mjs';
import {imageError} from '../../lib/chat-images.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
export async function onRequest({request,env}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')throw imageError('Use Repo Company.',403);
  if(!['GET','POST'].includes(request.method))throw imageError('Method not allowed.',405);
  const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];if(!token)throw imageError('Sign in to continue.',401);
  const headers={apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'};
  const auth=await fetch(config.url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});if(!auth.ok)throw imageError('Sign in again.',401);
  const user=await auth.json();if(!user.id||user.is_anonymous)throw imageError('Sign in with your Repo Company account.',401);
  const response=await fetch(config.url+'/rest/v1/rpc/get_my_character',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(8000)});if(!response.ok)throw imageError('Profile unavailable.',503);
  const result=await response.json(),name=(Array.isArray(result)?result[0]:result)?.username?.toLowerCase();if(!/^[a-z0-9_-]{3,16}$/.test(name||''))throw imageError('Create your player profile first.',409);
  const db=env.DASHBOARD_DB?.withSession?.('first-primary')||env.DASHBOARD_DB;if(!db)throw imageError('Profile unavailable.',503);
  const owner=await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(name).first();if(owner?.user_id!==user.id)throw imageError('Refresh your Repo Company profile.',409);
  const me={id:user.id,name},now=Date.now();
  if(request.method==='POST'){
   const rate=await db.prepare(`INSERT INTO social_rate_limits(user_id,scope,window_start,count) VALUES(?,'profile-picture-write',?,1) ON CONFLICT(user_id,scope) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count`).bind(user.id,Math.floor(now/60000)).first();if(rate.count>10)throw imageError('Please wait a moment before trying again.',429);
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw imageError('Send a JSON request.',415);
   const reader=request.body?.getReader();if(!reader)throw imageError('Choose a picture.');let length=0;const chunks=[];
   try{for(;;){const p=await reader.read();if(p.done)break;length+=p.value.length;if(length>88000){await reader.cancel();throw imageError('Profile pictures must fit in 64 KB.',413);}chunks.push(p.value);}}finally{reader.releaseLock();}
   const bytes=new Uint8Array(length);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{throw imageError('Invalid request.');}if(!body||typeof body!=='object'||Array.isArray(body))throw imageError('Invalid request.');
   return json(await savePhoto(db,me,body,now));
  }
  const target=(url.searchParams.get('username')||name).toLowerCase();if(!/^[a-z0-9_-]{3,16}$/.test(target))throw imageError('Profile unavailable.',404);
  const profile=await db.prepare(`SELECT p.user_id,p.username,COALESCE(v.private_profile,0) private_profile FROM dashboard_players p LEFT JOIN dashboard_profile_privacy v ON v.username=p.username WHERE p.username=? AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=p.username) OR (b.blocked=? AND b.blocker=p.username))`).bind(target,name,name).first();if(!profile)throw imageError('Profile unavailable.',404);
  const own=profile.user_id===user.id;
  profile.locked=profile.private_profile&&!own&&!await db.prepare("SELECT 1 FROM dashboard_friendships WHERE status='accepted' AND ((player_a=? AND player_b=?) OR (player_b=? AND player_a=?))").bind(name,target,name,target).first();
  if(profile.locked)throw imageError('This profile is private.',403);
  if(url.searchParams.has('metadata')){const photo=await db.prepare('SELECT version,enabled FROM dashboard_profile_photos WHERE user_id=?').bind(profile.user_id).first();return json({username:target,photo_version:photo?.enabled?photo.version:null,...(own?{stored_photo_version:photo?.version||null}:{})});}
  return await readPhoto(db,profile,url.searchParams.get('v'),now,own);
 }catch(e){return json({error:e.status?e.message:'Profile pictures are temporarily unavailable.'},e.status||503);}
}
