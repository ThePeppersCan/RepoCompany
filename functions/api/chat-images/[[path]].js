import config from '../../../dashboard-config.json';
import {BUCKET,RETENTION,TRANSFER_LIMIT,imageError,imageToken,readImageBody,storageFetch,storageHeaders,imagePath} from '../../../lib/chat-images.mjs';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(v);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const allowed=`EXISTS(SELECT 1 FROM dashboard_friendships f JOIN dashboard_players a ON a.username=c.a_name AND a.user_id=c.a_id JOIN dashboard_players b ON b.username=c.b_name AND b.user_id=c.b_id WHERE f.status='accepted' AND ((f.player_a=c.a_name AND f.player_b=c.b_name) OR (f.player_b=c.a_name AND f.player_a=c.b_name))) AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=c.a_name AND b.blocked=c.b_name) OR (b.blocker=c.b_name AND b.blocked=c.a_name))`;
async function identify(request,db){
 const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];if(!token)throw imageError('Sign in to share images.',401);
 const headers={apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const auth=await fetch(config.url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});if(!auth.ok)throw imageError('Sign in again.',401);
 const user=await auth.json();if(!user.id||user.is_anonymous)throw imageError('Sign in with your Repo Company account.',401);
 const profile=await fetch(config.url+'/rest/v1/rpc/get_my_character',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(8000)});if(!profile.ok)throw imageError('Account unavailable.',503);
 const data=await profile.json(),name=(Array.isArray(data)?data[0]:data)?.username?.toLowerCase();
 const owner=await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(name||'').first();
 if(owner?.user_id!==user.id)throw imageError('Open Wibs before sharing an image.',409);return {id:user.id,name};
}
async function targetAllowed(db,me,scope,target){
 if(scope==='community')return !!await db.prepare('SELECT id FROM community_channels WHERE id=?').bind(target).first();
 if(scope!=='dm'||!/^[a-z0-9_-]{3,16}$/.test(target)||target===me.name)return false;
 return !!await db.prepare(`SELECT 1 FROM dashboard_friendships f JOIN dashboard_players p ON p.username=? AND p.user_id IS NOT NULL WHERE f.status='accepted' AND ((f.player_a=? AND f.player_b=?) OR (f.player_b=? AND f.player_a=?)) AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=?) OR (b.blocker=? AND b.blocked=?))`).bind(target,me.name,target,me.name,target,me.name,target,target,me.name).first();
}
export async function onRequest({request,env,params}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin'),path=Array.isArray(params.path)?params.path.join('/'):params.path;
  if((origin&&origin!==url.origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')throw imageError('Use the Repo Company website or client.',403);
  if(!['GET','POST'].includes(request.method))throw imageError('Method not allowed.',405);
  const db=env.DASHBOARD_DB?.withSession?.('first-primary')||env.DASHBOARD_DB;if(!db)throw imageError('Images unavailable.',503);
  const me=await identify(request,db),now=Date.now();
  if(request.method==='POST'&&path==='upload'){
   storageHeaders(env);const scope=url.searchParams.get('scope'),target=url.searchParams.get('target'),clientId=url.searchParams.get('clientId');
   if(!uuid(clientId)||!await targetAllowed(db,me,scope,target))throw imageError('This conversation is unavailable.',403);
   const prior=await db.prepare('SELECT * FROM wibs_images WHERE owner_id=? AND client_id=?').bind(me.id,clientId).first();
   if(prior){if(prior.scope!==scope||prior.target!==target||prior.expires_at<=now||prior.deleted_at)throw imageError('Attach the image again.',409);if(prior.state==='ready')return json({id:prior.id,expiresAt:prior.expires_at});throw imageError('The previous upload is still being processed. Remove the image and attach it again.',409);}
   const {bytes,width,height,mime}=await readImageBody(request),id=crypto.randomUUID(),expiresAt=now+RETENTION;
   try{await db.prepare('INSERT INTO wibs_images(id,owner_id,owner_name,client_id,scope,target,bytes,width,height,created_at,expires_at,mime_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,me.id,me.name,clientId,scope,target,bytes.length,width,height,now,expiresAt,mime).run();}
   catch(e){if(String(e.message).includes('WIBS_PERSON_LIMIT'))throw imageError('You can send 20 images in 24 hours. Please try again later.',429);if(/WIBS_(DAILY|STORAGE)_LIMIT/.test(e.message))throw imageError('Wibs has reached its image allowance. Text chat is still available; please try again later.',429);throw e;}
   const stored=await storageFetch(config,env,'object/'+BUCKET+'/'+imagePath({id,mime_type:mime}),{method:'POST',headers:{'Content-Type':mime,'Cache-Control':'max-age=0','x-upsert':'false'},body:bytes});
   if(!stored.ok)throw imageError('The image could not be stored. Remove it and attach it again.',503);
   await db.prepare("UPDATE wibs_images SET state='ready' WHERE id=?").bind(id).run();return json({id,expiresAt});
  }
  if(request.method==='GET'&&uuid(path)){
   const row=await db.prepare("SELECT * FROM wibs_images WHERE id=? AND state='ready' AND deleted_at IS NULL AND expires_at>?").bind(path,now).first();
   if(!row)throw imageError('Image expired or unavailable.',410);
   let readable;
   if(row.scope==='community')readable=await db.prepare(`SELECT 1 FROM community_messages m WHERE m.id=? AND m.channel_id=? AND m.sender_id=? AND instr(m.text,?)>0 AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=m.sender_name) OR (b.blocked=? AND b.blocker=m.sender_name))`).bind(row.message_id,row.target,row.owner_id,imageToken(row.id),me.name,me.name).first();
   else readable=await db.prepare(`SELECT 1 FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE m.id=? AND m.sender_id=? AND instr(m.text,?)>0 AND (c.a_id=? OR c.b_id=?) AND ${allowed}`).bind(row.message_id,row.owner_id,imageToken(row.id),me.id,me.id).first();
   if(!readable)throw imageError('Image unavailable.',404);
   // A conservative transfer budget counts every download, including failures.
   const month=new Date(now).toISOString().slice(0,7);
   const budget=await db.prepare('INSERT INTO wibs_image_transfer(month,bytes) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET bytes=bytes+excluded.bytes WHERE bytes+excluded.bytes<=? RETURNING bytes').bind(month,row.bytes,TRANSFER_LIMIT).first();
   if(!budget)throw imageError('Image viewing has reached its monthly allowance. Text chat is still available.',429);
   const response=await storageFetch(config,env,'object/authenticated/'+BUCKET+'/'+imagePath(row));if(!response.ok)throw imageError('Image unavailable.',404);
   return new Response(response.body,{headers:{'Content-Type':row.mime_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Image-Expires':String(row.expires_at),Vary:'Authorization'}});
  }
  throw imageError('Not found.',404);
 }catch(e){return json({error:e.status?e.message:'Images are temporarily unavailable.'},e.status||503);}
}
