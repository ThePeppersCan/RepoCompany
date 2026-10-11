import config from '../../../dashboard-config.json';
import catalogue from '../../../assets/achievements/catalogue.json';
const games=new Map(catalogue.games.map(g=>[g.id,g]));
const response=(body,status=200,publicData=false)=>Response.json(body,{status,headers:{'Cache-Control':publicData?'public, max-age=30':'no-store','X-Content-Type-Options':'nosniff'}});
const name=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{3,16}$/.test(value)?value.toLowerCase():null;
async function upstream(path,token,body){
 const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error(r.status===401?'AUTH':'UPSTREAM');return r.json();
}
async function own(db,me,game){
 const rows=await db.prepare(`SELECT r.id,r.game,r.metric,r.target,COALESCE(p.value,0) AS progress,u.unlocked_at,u.score FROM dashboard_achievement_rules r LEFT JOIN dashboard_achievement_progress p ON p.achievement_id=r.id AND p.username=? LEFT JOIN dashboard_achievement_unlocks u ON u.achievement_id=r.id AND u.username=? WHERE (?='' OR r.game=?) ORDER BY r.id`).bind(me,me,game,game).all();
 const profile=await db.prepare('SELECT repo_score FROM dashboard_players WHERE username=?').bind(me).first();
 return {achievements:rows.results,repoScore:profile?.repo_score||0};
}
export async function onRequest({request,env,params}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin)return response({error:'Use your Repo Company account connection.'},403);
  if(!['GET','POST'].includes(request.method))return response({error:'Method not allowed.'},405);
  const db=env.DASHBOARD_DB;if(!db)return response({error:'Achievements are temporarily unavailable.'},503);
  const route=Array.isArray(params.path)?params.path.join('/'):params.path||'';
  if(route==='global'&&request.method==='GET'){
   const game=url.searchParams.get('game')||'';if(game&&!games.has(game))return response({error:'Unknown game.'},400);
   const players=await db.prepare('SELECT game,COUNT(*) AS players FROM dashboard_achievement_players GROUP BY game').all();
   const counts=await db.prepare(`SELECT r.id,r.game,COUNT(u.username) AS completed FROM dashboard_achievement_rules r LEFT JOIN dashboard_achievement_unlocks u ON u.achievement_id=r.id WHERE (?='' OR r.game=?) GROUP BY r.id,r.game`).bind(game,game).all();
   const totals=Object.fromEntries(players.results.map(row=>[row.game,row.players]));
   return response({players:totals,achievements:counts.results.map(row=>({...row,players:totals[row.game]||0,percent:totals[row.game]?100*row.completed/totals[row.game]:null}))},200,true);
  }
  const token=request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return response({error:'Sign in to earn achievements.'},401);
  const user=await upstream('/auth/v1/user',token);if(!user?.id)return response({error:'Sign in again.'},401);
  const record=await upstream('/rest/v1/rpc/get_my_character',token,{}),character=Array.isArray(record)?record[0]:record,me=name(character?.username);
  if(!me)return response({error:'Your player profile is unavailable.'},409);
  await db.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id').bind(me,user.id,character.username).run();
  if(route==='mine'&&request.method==='GET'){
   const game=url.searchParams.get('game')||'';if(game&&!games.has(game))return response({error:'Unknown game.'},400);
   return response(await own(db,me,game));
  }
  if(request.method!=='POST'||!['start','progress'].includes(route))return response({error:'Not found.'},404);
  const raw=await request.text();if(raw.length>16000)return response({error:'Request too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return response({error:'Invalid request.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||!games.has(body.game))return response({error:'Unknown game.'},400);
  // Games submit bounded observations, never score, unlock dates or another identity.
  if(['username','userId','repoScore','repo_score','score','unlocked_at','unlocks','achievementId'].some(key=>Object.hasOwn(body,key)))return response({error:'Rewards are calculated by the achievement service.'},400);
  const now=Date.now(),minute=Math.floor(now/60000);
  const rate=await db.prepare('INSERT INTO dashboard_achievement_rate(username,minute,count) VALUES(?,?,1) ON CONFLICT(username) DO UPDATE SET count=CASE WHEN minute=excluded.minute THEN count+1 ELSE 1 END,minute=excluded.minute RETURNING count').bind(me,minute).first();
  if(rate.count>30)return response({error:'Achievement syncing will resume shortly.'},429);
  if(route==='start'){
   if(body.practice===true||body.testing===true)return response({error:'Practice and test games do not award achievements.'},400);
   const id=crypto.randomUUID();
   await db.batch([
    db.prepare('DELETE FROM dashboard_achievement_sessions WHERE username=? AND expires_at<?').bind(me,now),
    db.prepare('INSERT INTO dashboard_achievement_sessions(id,username,game,expires_at) VALUES(?,?,?,?)').bind(id,me,body.game,now+86400000),
    db.prepare('INSERT OR IGNORE INTO dashboard_achievement_players(username,game,started_at) VALUES(?,?,?)').bind(me,body.game,now)
   ]);
   return response({session:id,...await own(db,me,body.game)});
  }
  if(typeof body.session!=='string'||!body.facts||typeof body.facts!=='object'||Array.isArray(body.facts))return response({error:'Invalid gameplay observations.'},400);
  const session=await db.prepare('SELECT id FROM dashboard_achievement_sessions WHERE id=? AND username=? AND game=? AND expires_at>?').bind(body.session,me,body.game,now).first();
  if(!session)return response({error:'Reconnect this game to sync achievements.',reconnect:true},409);
  const limits=new Map();for(const a of games.get(body.game).achievements){const r=a.progress;limits.set(r.metric,Math.max(limits.get(r.metric)||0,r.target));}
  const entries=Object.entries(body.facts);if(entries.length>100||entries.some(([k,v])=>!limits.has(k)||!Number.isSafeInteger(v)||v<0||v>100000000))return response({error:'Invalid gameplay observations.'},400);
  const facts=Object.fromEntries(entries.map(([k,v])=>[k,Math.min(v,limits.get(k))]));
  const batch=await db.batch([
   db.prepare(`INSERT INTO dashboard_achievement_progress(username,achievement_id,value,updated_at) SELECT ?,r.id,MIN(CAST(j.value AS INTEGER),r.target),? FROM dashboard_achievement_rules r JOIN json_each(?) j ON j.key=r.metric WHERE r.game=? AND j.value>0 ON CONFLICT(username,achievement_id) DO UPDATE SET value=MAX(value,excluded.value),updated_at=excluded.updated_at WHERE excluded.value>value`).bind(me,now,JSON.stringify(facts),body.game),
   db.prepare(`INSERT OR IGNORE INTO dashboard_achievement_unlocks(username,achievement_id,score,unlocked_at) SELECT ?,r.id,r.score,? FROM dashboard_achievement_rules r JOIN dashboard_achievement_progress p ON p.achievement_id=r.id WHERE p.username=? AND r.game=? AND p.value>=r.target RETURNING achievement_id AS id,score,unlocked_at`).bind(me,now,me,body.game)
  ]);
  return response({newUnlocks:batch[1].results||[],...await own(db,me,body.game)});
 }catch(error){return response({error:error.message==='AUTH'?'Your session expired. Sign in again.':'Achievements could not sync. Your progress will retry.'},error.message==='AUTH'?401:503);}
}
