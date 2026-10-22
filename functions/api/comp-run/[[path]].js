import config from '../../../dashboard-config.json';
import boards from '../../../comp-run-boards.json';
const origins=new Set(['https://comp-run.fluffy-star-4855.chatgpt.site','https://repocompany.uk','http://127.0.0.1:4193']);
const maps=new Map(boards.maps.map(m=>[m.id,m]));
const reply=(body,status=200,origin=null)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(origin&&origins.has(origin)?{'Access-Control-Allow-Origin':origin,Vary:'Origin'}:{})}});
async function upstream(path,token,body){
 const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error(r.status===401||path==='/auth/v1/user'?'AUTH':'UPSTREAM');return r.json();
}
export async function onRequest({request,env,params}){
 const url=new URL(request.url),origin=request.headers.get('Origin'),route=Array.isArray(params.path)?params.path.join('/'):params.path;
 try{
  const db=env.DASHBOARD_DB;if(!db)return reply({error:'Rankings are temporarily unavailable.'},503,origin);
  if(route==='board'&&request.method==='GET'){
   const course=url.searchParams.get('map'),mode=url.searchParams.get('mode'),map=maps.get(course),page=Number(url.searchParams.get('page')||0);
   if(!map||!['normal','nightmare'].includes(mode)||!Number.isSafeInteger(page)||page<0||page>200)return reply({error:'Choose a map and difficulty.'},400,origin);
   const args=[course,mode,map.season];
   const rows=await db.prepare(`SELECT RANK() OVER (ORDER BY r.time_ms) AS rank,r.username,COALESCE(p.display_name,r.username) AS name,r.time_ms AS timeMs,r.achieved_at AS achievedAt FROM comp_run_records r LEFT JOIN dashboard_players p ON p.username=r.username WHERE r.course=? AND r.mode=? AND r.season=? ORDER BY r.time_ms,r.achieved_at,r.username LIMIT 50 OFFSET ?`).bind(...args,page*50).all();
   const count=await db.prepare('SELECT COUNT(*) AS total FROM comp_run_records WHERE course=? AND mode=? AND season=?').bind(...args).first();
   return reply({map:course,mode,season:map.season,rows:rows.results,total:count.total,page,pageSize:50},200,origin);
  }
  if(request.method!=='POST'||!['run-start','run-finish'].includes(route))return reply({error:'Not found.'},404,origin);
  if(origin&&origin!==url.origin)return reply({error:'Use your Repo Company account connection.'},403);
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return reply({error:'Sign in before starting a ranked run.'},401);
  const declared=Number(request.headers.get('Content-Length')||0);if(declared>4096)return reply({error:'Request too large.'},413);
  const reader=request.body?.getReader();let size=0,raw='';const decoder=new TextDecoder();
  if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>4096){await reader.cancel();return reply({error:'Request too large.'},413);}raw+=decoder.decode(part.value,{stream:true});}raw+=decoder.decode();
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid run.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||['username','userId','score','rank'].some(k=>Object.hasOwn(body,k)))return reply({error:'Player identity comes from your account.'},400);
  const map=maps.get(body.courseId);if(!map||!['normal','nightmare'].includes(body.mode)||body.version!==boards.version)return reply({error:'Update COMP-RUN to submit ranked times.'},400);
  const user=await upstream('/auth/v1/user',token);if(!user?.id)return reply({error:'Sign in again.'},401);
  const result=await upstream('/rest/v1/rpc/get_my_character',token,{}),character=Array.isArray(result)?result[0]:result;
  if(!/^[a-zA-Z0-9_-]{3,16}$/.test(character?.username||''))return reply({error:'Create your player profile first.'},409);
  const me=character.username.toLowerCase(),now=Date.now(),minute=Math.floor(now/60000);
  await db.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id WHERE dashboard_players.user_id IS NULL').bind(me,user.id,character.username).run();
  if((await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(me).first())?.user_id!==user.id)return reply({error:'Refresh your player profile.'},409);
  const rate=await db.prepare('INSERT INTO comp_run_rate(username,minute,count) VALUES(?,?,1) ON CONFLICT(username) DO UPDATE SET count=CASE WHEN minute=excluded.minute THEN count+1 ELSE 1 END,minute=excluded.minute RETURNING count').bind(me,minute).first();
  if(rate.count>20)return reply({error:'Please wait a moment before retrying.'},429);
  if(route==='run-start'){
   if(body.season!==map.season)return reply({error:'This route has changed. Update the game.'},400);
   const id=crypto.randomUUID();await db.batch([
    db.prepare('DELETE FROM comp_run_sessions WHERE username=? AND expires_at<?').bind(me,now),
    db.prepare('INSERT INTO comp_run_sessions(id,username,course,mode,season,version,started_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,me,map.id,body.mode,map.season,body.version,now,now+86400000)
   ]);return reply({run:id});
  }
  const run=typeof body.run==='string'?await db.prepare('SELECT * FROM comp_run_sessions WHERE id=? AND username=? AND course=? AND mode=? AND season=? AND expires_at>?').bind(body.run,me,map.id,body.mode,map.season,now).first():null;
  if(!run)return reply({error:'This run could not be linked to your account. Start a new run while signed in.'},409);
  const time=body.timeMs,splits=body.splits;
  if(!Number.isSafeInteger(time)||time<10000||time>7200000||time>now-run.started_at+5000||!Array.isArray(splits)||splits.length!==map.gates||splits.some((v,i)=>!Number.isSafeInteger(v)||v<=0||v>time||(i>0&&v<=splits[i-1])))return reply({error:'The complete ordered run could not be validated.'},400);
  if(run.time_ms!==null&&run.time_ms!==time)return reply({error:'This run has already been submitted.'},409);
  await db.batch([
   db.prepare('UPDATE comp_run_sessions SET time_ms=?,submitted_at=? WHERE id=? AND time_ms IS NULL').bind(time,now,run.id),
   // The session row fixes the accepted result even when requests race each other.
   db.prepare(`INSERT INTO comp_run_records(username,course,mode,season,time_ms,achieved_at,run_id) SELECT username,course,mode,season,time_ms,submitted_at,id FROM comp_run_sessions WHERE id=? AND time_ms=? ON CONFLICT(username,course,mode,season) DO UPDATE SET time_ms=excluded.time_ms,achieved_at=excluded.achieved_at,run_id=excluded.run_id WHERE excluded.time_ms<comp_run_records.time_ms`).bind(run.id,time)
  ]);
  return reply({accepted:true});
 }catch(error){return reply({error:error.message==='AUTH'?'Your session expired. Sign in again.':'Rankings could not connect. Please try again.'},error.message==='AUTH'?401:503,origin);}
}
