import {recordPlayActivity} from '../../../lib/play-activity.mjs';
import {cosmeticsRequest} from '../../../lib/comp-run-cosmetics.mjs';
import config from '../../../dashboard-config.json';
import boards from '../../../comp-run-boards.json';
const origins=new Set(['https://comp-run.fluffy-star-4855.chatgpt.site','https://repocompany.uk','http://127.0.0.1:4193']);
const acceptedVersions=new Set([boards.version,...(boards.compatibleVersions||[])]);
const maps=new Map(boards.maps.map(m=>[m.id,m]));
const seasonFor=(map,rules)=>rules==='race'?'race:'+map.season:map.season;
function validFrames(frames,time){
 if(!Array.isArray(frames)||frames.length<2||frames.length>18000)return false;
 let prev=-1;
 for(const f of frames){if(!Array.isArray(f)||f.length!==5||f.some(v=>!Number.isFinite(v)||Math.abs(v)>1e6)||f[0]<0||f[0]<=prev||f[0]>time/1000+.002)return false;prev=f[0];}
 return frames[0][0]<=.2&&Math.abs(frames.at(-1)[0]-time/1000)<.02;
}
async function readBody(request,limit){
 const declared=Number(request.headers.get('Content-Length')||0);if(declared>limit)return null;
 const reader=request.body?.getReader();let size=0,raw='';const decoder=new TextDecoder();
 if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>limit){await reader.cancel();return null;}raw+=decoder.decode(part.value,{stream:true});}
 raw+=decoder.decode();try{return JSON.parse(raw);}catch{return null;}
}
const reply=(body,status=200,origin=null)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(origin&&origins.has(origin)?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})}});
async function upstream(path,token,body){
 const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error(r.status===401||path==='/auth/v1/user'?'AUTH':'UPSTREAM');return r.json();
}
export async function onRequest({request,env,params}){
 const url=new URL(request.url),origin=request.headers.get('Origin'),route=Array.isArray(params.path)?params.path.join('/'):params.path;
 if(route==='races'||route?.startsWith('races/'))return env.COMP_RUN_RACES?env.COMP_RUN_RACES.fetch(request):reply({error:'Races are temporarily unavailable.'},503,origin);
 try{
  const db=env.DASHBOARD_DB;if(!db)return reply({error:'Rankings are temporarily unavailable.'},503,origin);
  if(route==='cosmetics'){
   if(origin&&origin!=='null'&&!origins.has(origin))return reply({error:'Open COMP-RUN to use its shop.'},403,origin);
   const corsOrigin=origin==='null'?'null':origins.has(origin)?origin:null;
   const send=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(corsOrigin?{'Access-Control-Allow-Origin':corsOrigin,Vary:'Origin'}:{})}});
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...(corsOrigin?{'Access-Control-Allow-Origin':corsOrigin}:{}),'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type',Vary:'Origin'}});
   if(request.method!=='POST')return send({error:'Method not allowed.'},405);
   return cosmeticsRequest({request,env,config,reply:send,readBody});
  }
  if(route==='activity'&&request.method==='POST'){
   if(origin&&!origins.has(origin))return reply({error:'Open COMP-RUN to record activity.'},403,origin);
   const body=await readBody(request,2048);if(!body||typeof body.session!=='string'||body.session.length!==36)return reply({error:'Reconnect your account.'},401,origin);
   // This capability comes only from authenticated achievement start. It grants
   // bounded COMP-RUN heartbeats, never access to account credentials or scores.
   const owner=await db.prepare(`SELECT s.username,p.user_id FROM dashboard_achievement_sessions s JOIN dashboard_players p ON p.username=s.username WHERE s.id=? AND s.game='comp-run' AND s.expires_at>?`).bind(body.session,Date.now()).first();
   if(!owner?.user_id)return reply({error:'Reconnect your account.'},401,origin);
   return await recordPlayActivity({env,config,me:owner.username,userId:owner.user_id,body:{...body,game:'comp-run'},json:(data,status=200)=>reply(data,status,origin)});
  }
  if(route==='ghost'&&request.method==='GET'){
   const course=url.searchParams.get('map'),mode=url.searchParams.get('mode'),map=maps.get(course),rules=url.searchParams.get('rules')||'one-life';
   if(!map||!['normal','nightmare'].includes(mode)||!['one-life','race'].includes(rules))return reply({error:'Choose a map and difficulty.'},400,origin);
   const season=seasonFor(map,rules);
   // Select the actual first leaderboard row, even when its replay is missing.
   const best=await db.prepare(`SELECT r.run_id,r.username,COALESCE(p.display_name,r.username) AS name,r.time_ms AS timeMs,g.frames FROM comp_run_records r LEFT JOIN dashboard_players p ON p.username=r.username LEFT JOIN comp_run_replays g ON g.run_id=r.run_id WHERE r.course=? AND r.mode=? AND r.season=? ORDER BY r.time_ms,r.achieved_at,r.username LIMIT 1`).bind(course,mode,season).first();
   return reply({map:course,mode,season,rules,available:!!best?.frames,record:best?{name:best.name,timeMs:best.timeMs,run:best.run_id}:null,frames:best?.frames?JSON.parse(best.frames):[]},200,origin);
  }
  if(route==='ghost-upload'&&request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origins.has(origin)?origin:'https://comp-run.fluffy-star-4855.chatgpt.site','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type',Vary:'Origin'}});
  if(route==='ghost-upload'&&request.method==='POST'){
   if(origin&&origin!=='null'&&!origins.has(origin))return reply({error:'Open COMP-RUN to upload a replay.'},403,origin);
   const body=await readBody(request,1500000);
   if(!body||typeof body.run!=='string'||typeof body.token!=='string'||body.token.length!==36)return reply({error:'Invalid replay.'},400,origin);
   const row=await db.prepare(`SELECT g.run_id,g.frames,r.time_ms FROM comp_run_replays g JOIN comp_run_records r ON r.run_id=g.run_id WHERE g.run_id=? AND g.upload_token=?`).bind(body.run,body.token).first();
   if(!row)return reply({error:'This replay no longer belongs to an accepted personal best.'},409,origin);
   if(!validFrames(body.frames,row.time_ms))return reply({error:'Incomplete replay.'},400,origin);
   // Immutable for this accepted run; delayed retries cannot rewrite it.
   await db.prepare('UPDATE comp_run_replays SET frames=? WHERE run_id=? AND upload_token=? AND frames IS NULL').bind(JSON.stringify(body.frames),body.run,body.token).run();
   return reply({accepted:true},200,origin);
  }
  if(route==='board'&&request.method==='GET'){
   const course=url.searchParams.get('map'),mode=url.searchParams.get('mode'),map=maps.get(course),page=Number(url.searchParams.get('page')||0);
   if(!map||!['normal','nightmare'].includes(mode)||!Number.isSafeInteger(page)||page<0||page>200)return reply({error:'Choose a map and difficulty.'},400,origin);
   const rules=url.searchParams.get('rules')||'one-life';if(!['one-life','race'].includes(rules))return reply({error:'Choose race rules.'},400,origin);const season=seasonFor(map,rules);
   const args=[course,mode,season];
   const rows=await db.prepare(`SELECT RANK() OVER (ORDER BY r.time_ms) AS rank,r.username,COALESCE(p.display_name,r.username) AS name,r.time_ms AS timeMs,r.achieved_at AS achievedAt FROM comp_run_records r LEFT JOIN dashboard_players p ON p.username=r.username WHERE r.course=? AND r.mode=? AND r.season=? ORDER BY r.time_ms,r.achieved_at,r.username LIMIT 50 OFFSET ?`).bind(...args,page*50).all();
   const count=await db.prepare('SELECT COUNT(*) AS total FROM comp_run_records WHERE course=? AND mode=? AND season=?').bind(...args).first();
   return reply({map:course,mode,season,rules,rows:rows.results,total:count.total,page,pageSize:50},200,origin);
  }
  if(request.method!=='POST'||!['run-start','run-finish'].includes(route))return reply({error:'Not found.'},404,origin);
  if(origin&&origin!==url.origin)return reply({error:'Use your Repo Company account connection.'},403);
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return reply({error:'Sign in before starting a ranked run.'},401);
  const body=await readBody(request,4096);
  if(!body||typeof body!=='object'||Array.isArray(body)||['username','userId','score','rank'].some(k=>Object.hasOwn(body,k)))return reply({error:'Player identity comes from your account.'},400);
  const map=maps.get(body.courseId);if(!map||!['normal','nightmare'].includes(body.mode)||!acceptedVersions.has(body.version))return reply({error:'Update COMP-RUN to submit ranked times.'},400);
  const season=body.season||map.season;if(![map.season,'race:'+map.season].includes(season))return reply({error:'This route has changed. Update the game.'},400);
  const user=await upstream('/auth/v1/user',token);if(!user?.id)return reply({error:'Sign in again.'},401);
  const result=await upstream('/rest/v1/rpc/get_my_character',token,{}),character=Array.isArray(result)?result[0]:result;
  if(!/^[a-zA-Z0-9_-]{3,16}$/.test(character?.username||''))return reply({error:'Create your player profile first.'},409);
  const me=character.username.toLowerCase(),now=Date.now(),minute=Math.floor(now/60000);
  await db.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id WHERE dashboard_players.user_id IS NULL').bind(me,user.id,character.username).run();
  if((await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(me).first())?.user_id!==user.id)return reply({error:'Refresh your player profile.'},409);
  const rate=await db.prepare('INSERT INTO comp_run_rate(username,minute,count) VALUES(?,?,1) ON CONFLICT(username) DO UPDATE SET count=CASE WHEN minute=excluded.minute THEN count+1 ELSE 1 END,minute=excluded.minute RETURNING count').bind(me,minute).first();
  if(rate.count>20)return reply({error:'Please wait a moment before retrying.'},429);
  if(route==='run-start'){
   if(![map.season,'race:'+map.season].includes(body.season))return reply({error:'This route has changed. Update the game.'},400);
   const id=crypto.randomUUID();await db.batch([
    db.prepare('DELETE FROM comp_run_sessions WHERE username=? AND expires_at<?').bind(me,now),
    db.prepare('INSERT INTO comp_run_sessions(id,username,course,mode,season,version,started_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,me,map.id,body.mode,season,body.version,now,now+86400000)
   ]);return reply({run:id});
  }
  const run=typeof body.run==='string'?await db.prepare('SELECT * FROM comp_run_sessions WHERE id=? AND username=? AND course=? AND mode=? AND season=? AND expires_at>?').bind(body.run,me,map.id,body.mode,season,now).first():null;
  if(!run)return reply({error:'This run could not be linked to your account. Start a new run while signed in.'},409);
  const time=body.timeMs,splits=body.splits;
  if(!Number.isSafeInteger(time)||time<10000||time>7200000||time>now-run.started_at+5000||!Array.isArray(splits)||splits.length!==map.gates||splits.some((v,i)=>!Number.isSafeInteger(v)||v<=0||v>time||(i>0&&v<=splits[i-1])))return reply({error:'The complete ordered run could not be validated.'},400);
  if(run.time_ms!==null&&run.time_ms!==time)return reply({error:'This run has already been submitted.'},409);
  await db.batch([
   db.prepare('UPDATE comp_run_sessions SET time_ms=?,submitted_at=? WHERE id=? AND time_ms IS NULL').bind(time,now,run.id),
   // The session row fixes the accepted result even when requests race each other.
   db.prepare(`INSERT INTO comp_run_records(username,course,mode,season,time_ms,achieved_at,run_id) SELECT username,course,mode,season,time_ms,submitted_at,id FROM comp_run_sessions WHERE id=? AND time_ms=? ON CONFLICT(username,course,mode,season) DO UPDATE SET time_ms=excluded.time_ms,achieved_at=excluded.achieved_at,run_id=excluded.run_id WHERE excluded.time_ms<comp_run_records.time_ms`).bind(run.id,time)
  ]);
  const best=await db.prepare('SELECT run_id FROM comp_run_records WHERE username=? AND course=? AND mode=? AND season=?').bind(me,map.id,body.mode,season).first();
  let replayToken=null;
  if(best?.run_id===run.id){
   // Guard the INSERT against a faster finish arriving between these queries.
   await db.prepare(`INSERT INTO comp_run_replays(username,course,mode,season,run_id,upload_token,created_at) SELECT username,course,mode,season,run_id,?,? FROM comp_run_records WHERE run_id=? ON CONFLICT(username,course,mode,season) DO UPDATE SET run_id=excluded.run_id,upload_token=excluded.upload_token,frames=NULL,created_at=excluded.created_at WHERE comp_run_replays.run_id<>excluded.run_id`).bind(crypto.randomUUID(),now,run.id).run();
   replayToken=(await db.prepare('SELECT upload_token FROM comp_run_replays WHERE run_id=?').bind(run.id).first())?.upload_token||null;
  }
  return reply({accepted:true,replayToken});
 }catch(error){return reply({error:error.message==='AUTH'?'Your session expired. Sign in again.':'Rankings could not connect. Please try again.'},error.message==='AUTH'?401:503,origin);}
}
