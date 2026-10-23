export const REWARD_POLICY=Object.freeze({pointsPerMinute:20,dailyMinutes:360,dailyBonus:1200});
const games=new Set(['comp-run','morogue']);
const dayOf=now=>Math.floor(now/86400000);

// Run in the SAME D1 transaction as the ordinary play-session update.
// Never derive rewards from historical visible-time totals or client durations.
export function rewardHeartbeat(db,{me,userId,session,game,sequence,action,active,rewardActive,now}){
 const eligible=games.has(game)&&active&&rewardActive===true&&action!=='stop';
 if(action==='start')return [db.prepare(`INSERT INTO dashboard_reward_sessions(username,session_id,game,last_tick,sequence,active) VALUES(?,?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET session_id=excluded.session_id,game=excluded.game,last_tick=excluded.last_tick,sequence=excluded.sequence,active=excluded.active WHERE dashboard_reward_sessions.session_id!=excluded.session_id`).bind(me,session,game,now,sequence,eligible?1:0)];
 const statements=[];
 if(games.has(game))statements.push(
  db.prepare('INSERT OR IGNORE INTO dashboard_reward_days(user_id,day) VALUES(?,?)').bind(userId,dayOf(now)),
  db.prepare(`UPDATE dashboard_reward_days SET active_ms=MIN(21600000,active_ms+COALESCE((SELECT CASE WHEN r.active=1 AND ?-r.last_tick BETWEEN 0 AND 45000 THEN ?-r.last_tick ELSE 0 END FROM dashboard_reward_sessions r JOIN dashboard_play_sessions p ON p.username=r.username AND p.session_id=r.session_id AND p.game=r.game WHERE r.username=? AND r.session_id=? AND r.game=? AND r.sequence<? AND p.sequence<?),0)) WHERE user_id=? AND day=?`).bind(now,now,me,session,game,sequence,sequence,userId,dayOf(now))
 );
 statements.push(db.prepare('UPDATE dashboard_reward_sessions SET last_tick=MAX(last_tick,?),sequence=?,active=? WHERE username=? AND session_id=? AND game=? AND sequence<? AND EXISTS(SELECT 1 FROM dashboard_play_sessions p WHERE p.username=? AND p.session_id=? AND p.sequence<?)').bind(now,sequence,eligible?1:0,me,session,game,sequence,me,session,sequence));
 return statements;
}

export async function reconcilePlayRewards(env,config,userId,me,now=Date.now()){
 const db=env.DASHBOARD_DB,start=await db.prepare("SELECT value FROM dashboard_reward_config WHERE key='started_at'").first();
 if(!start)return {available:false};
 const since=Math.max(start.value,now-7*86400000);
 const completed=await db.prepare('SELECT id,course,mode,time_ms,submitted_at FROM comp_run_sessions WHERE username=? AND submitted_at>=? AND time_ms>=60000 ORDER BY submitted_at LIMIT 500').bind(me,since).all();
 const statements=[];
 for(const run of completed.results||[]){
  const day=dayOf(run.submitted_at),points=Math.min(150,Math.max(10,Math.floor(run.time_ms/60000)*5));
  statements.push(db.prepare('INSERT OR IGNORE INTO dashboard_reward_completions(receipt,user_id,day,game,run_id,points,created_at) VALUES(?,?,?,?,?,?,?)').bind(`comp-run:${userId}:${run.course}:${run.mode}:${day}`,userId,day,'comp-run',run.id,points,run.submitted_at));
 }
 if(env.MOROGUE_DB)try{
  const victories=await env.MOROGUE_DB.prepare("SELECT run_id,wave_ms,finished_at FROM morogue_results WHERE user_id=? AND mode='mora' AND outcome='won' AND majors=12 AND finales=1 AND wave_ms>=3600000 AND finished_at>=? ORDER BY finished_at LIMIT 100").bind(userId,since).all();
  for(const run of victories.results||[])statements.push(db.prepare('INSERT OR IGNORE INTO dashboard_reward_completions(receipt,user_id,day,game,run_id,points,created_at) VALUES(?,?,?,?,?,?,?)').bind('morogue:'+run.run_id,userId,dayOf(run.finished_at),'morogue',run.run_id,Math.min(450,Math.floor(run.wave_ms/60000)*5),run.finished_at));
 }catch{ /* Retain and credit the other game's earned rewards; retry victories next heartbeat. */ }
 for(let i=0;i<statements.length;i+=80)await db.batch(statements.slice(i,i+80));
 const total=await db.prepare(`SELECT COALESCE((SELECT SUM(CAST(active_ms/60000 AS INTEGER)*20) FROM dashboard_reward_days WHERE user_id=?),0)+COALESCE((SELECT SUM(points) FROM (SELECT MIN(1200,SUM(points)) AS points FROM dashboard_reward_completions WHERE user_id=? GROUP BY day)),0) AS earned`).bind(userId,userId).first();
 const today=await db.prepare('SELECT active_ms FROM dashboard_reward_days WHERE user_id=? AND day=?').bind(userId,dayOf(now)).first();
 const result={available:true,earned:Number(total.earned),activeMinutes:Math.floor((today?.active_ms||0)/60000),...REWARD_POLICY};
 const key=env.ACCOUNT_ADMIN_KEY||env.WIBS_STORAGE_KEY;
 if(!key)return {...result,pending:true};
 try{
  const response=await fetch(config.url+'/rest/v1/rpc/credit_verified_play_rewards',{method:'POST',headers:{apikey:key,...(!key.startsWith('sb_secret_')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json'},body:JSON.stringify({p_user_id:userId,p_earned_total:result.earned}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {...result,pending:true};
  const data=await response.json(),row=Array.isArray(data)?data[0]:data;
  if(!Number.isSafeInteger(Number(row?.new_gp))||!Number.isSafeInteger(Number(row?.awarded)))return {...result,pending:true};
  return {...result,balance:Number(row.new_gp),awarded:Number(row.awarded),pending:false};
 }catch{return {...result,pending:true};}
}
