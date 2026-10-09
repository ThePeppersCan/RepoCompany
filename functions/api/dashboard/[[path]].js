import config from '../../../dashboard-config.json';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const cleanName=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{3,16}$/.test(value)?value.toLowerCase():null;
const allowedGames=new Set(['','moratales','manager','morogue','dragonbound','diver','goblin','rooftops','seas','sports']);
async function upstream(path,token,body){
 const response=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error(response.status===401?'AUTH':'UPSTREAM');return response.json();
}
export async function onRequest({request,env,params}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin)return json({error:'This action must come from this dashboard.'},403);
  if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed.'},405);
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return json({error:'Sign in to continue.'},401);
  const user=await upstream('/auth/v1/user',token);if(!user?.id)return json({error:'Sign in again.'},401);
  const rows=await upstream('/rest/v1/rpc/get_my_character',token,{}),character=Array.isArray(rows)?rows[0]:rows;
  const me=cleanName(character?.username);if(!me)return json({error:'Your player profile could not be loaded.'},409);
  const db=env.DASHBOARD_DB;if(!db)return json({error:'Friends service is not configured.'},503);
  const now=Date.now();
  await db.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id').bind(me,user.id,character.username).run();
  const route=Array.isArray(params.path)?params.path.join('/'):params.path||'';
  if(request.method==='GET'&&route==='state'){
   const profile=await db.prepare('SELECT display_name,bio,invisible,repo_score FROM dashboard_players WHERE username=?').bind(me).first();
   const friends=await db.prepare(`SELECT f.status,f.requester,p.username,p.display_name,p.repo_score,CASE WHEN p.invisible=0 AND p.last_seen>? THEN 1 ELSE 0 END AS online,CASE WHEN p.invisible=0 AND p.last_seen>? THEN p.current_game ELSE '' END AS current_game FROM dashboard_friendships f JOIN dashboard_players p ON p.username=CASE WHEN f.player_a=? THEN f.player_b ELSE f.player_a END WHERE (f.player_a=? OR f.player_b=?) AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=p.username) OR (b.blocker=p.username AND b.blocked=?)) ORDER BY online DESC,p.username`).bind(now-90000,now-90000,me,me,me,me,me).all();
   const blocks=await db.prepare('SELECT blocked AS username FROM dashboard_blocks WHERE blocker=?').bind(me).all();
   return json({username:character.username,profile,friends:friends.results,blocks:blocks.results});
  }
  if(request.method==='GET'&&route==='search'){
   const target=cleanName(url.searchParams.get('username'));if(!target)return json({error:'Enter an exact player name (3–16 letters, numbers, _ or -).'},400);
   const blocked=await db.prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)').bind(me,target,target,me).first();
   if(blocked||target===me)return json({players:[]});
   const rows=await upstream('/rest/v1/rpc/get_public_character',token,{p_username:target}),player=Array.isArray(rows)?rows[0]:rows;
   if(!player||cleanName(player.username)!==target)return json({players:[]});
   return json({players:[{username:player.username}]});
  }
  if(request.method!=='POST')return json({error:'Not found.'},404);
  const raw=await request.text();if(raw.length>2048)return json({error:'Request too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid request.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Invalid request.'},400);
  const minute=Math.floor(now/60000);
  const rate=await db.prepare('INSERT INTO dashboard_rate_limits(player,window_start,count) VALUES(?,?,1) ON CONFLICT(player) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count').bind(me,minute).first();
  if(rate.count>35)return json({error:'Please wait a moment before trying again.'},429);
  if(route==='presence'){
   const game=allowedGames.has(body.game)?body.game:'';
   await db.prepare('UPDATE dashboard_players SET last_seen=?,current_game=? WHERE username=?').bind(body.online===false?0:now,game,me).run();return json({ok:true});
  }
  if(route==='profile'){
   const display=typeof body.displayName==='string'?body.displayName.trim():character.username,bio=typeof body.bio==='string'?body.bio.trim():'';
   if(!display||display.length>24||bio.length>100)return json({error:'Use a name up to 24 characters and a profile line up to 100.'},400);
   await db.prepare('UPDATE dashboard_players SET display_name=?,bio=?,invisible=? WHERE username=?').bind(display,bio,body.invisible===true?1:0,me).run();return json({ok:true});
  }
  if(route!=='friends')return json({error:'Not found.'},404);
  const target=cleanName(body.username);if(!target||target===me)return json({error:'Choose another player.'},400);
  const [a,b]=[me,target].sort(),action=body.action;
  if(!['request','accept','decline','cancel','remove','block','unblock'].includes(action))return json({error:'Unknown action.'},400);
  if(action==='block'){
   await db.batch([db.prepare('INSERT OR IGNORE INTO dashboard_blocks(blocker,blocked) VALUES(?,?)').bind(me,target),db.prepare('DELETE FROM dashboard_friendships WHERE player_a=? AND player_b=?').bind(a,b)]);return json({ok:true});
  }
  if(action==='unblock'){await db.prepare('DELETE FROM dashboard_blocks WHERE blocker=? AND blocked=?').bind(me,target).run();return json({ok:true});}
  const blocked=await db.prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)').bind(me,target,target,me).first();if(blocked)return json({error:'This player is unavailable.'},404);
  if(action==='request'){
   const count=await db.prepare('SELECT count(*) AS n FROM dashboard_friendships WHERE requester=? AND status=?').bind(me,'pending').first();if(count.n>=30)return json({error:'You have 30 pending requests. Cancel a request before adding another.'},409);
   const rows=await upstream('/rest/v1/rpc/get_public_character',token,{p_username:target}),player=Array.isArray(rows)?rows[0]:rows;
   if(!player||cleanName(player.username)!==target)return json({error:'Player not found.'},404);
   await db.batch([db.prepare('INSERT OR IGNORE INTO dashboard_players(username,display_name) VALUES(?,?)').bind(target,player.username),db.prepare('INSERT OR IGNORE INTO dashboard_friendships(player_a,player_b,requester,status,created_at) VALUES(?,?,?,?,?)').bind(a,b,me,'pending',now)]);return json({ok:true});
  }
  if(action==='accept')await db.prepare("UPDATE dashboard_friendships SET status='accepted' WHERE player_a=? AND player_b=? AND requester=? AND status='pending'").bind(a,b,target).run();
  else if(action==='decline')await db.prepare("DELETE FROM dashboard_friendships WHERE player_a=? AND player_b=? AND requester=? AND status='pending'").bind(a,b,target).run();
  else if(action==='cancel')await db.prepare("DELETE FROM dashboard_friendships WHERE player_a=? AND player_b=? AND requester=? AND status='pending'").bind(a,b,me).run();
  else if(action==='remove')await db.prepare("DELETE FROM dashboard_friendships WHERE player_a=? AND player_b=? AND status='accepted'").bind(a,b).run();
  return json({ok:true});
 }catch(error){return json({error:error.message==='AUTH'?'Your session expired. Sign in again.':'The account service is unavailable. Please try again.'},error.message==='AUTH'?401:503);}
}
