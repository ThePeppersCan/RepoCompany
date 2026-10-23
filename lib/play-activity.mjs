import {rewardHeartbeat,reconcilePlayRewards} from './play-rewards.mjs';
const allowedGames=new Set(['moratales','manager','morogue','comp-run','broomflight','runners','dragonbound','diver','goblin','rooftops','seas','sports']);
export async function recordPlayActivity({env,config,me,userId,body,now=Date.now(),json}){
 const db=env.DASHBOARD_DB,user={id:userId};
   const session=typeof body.session==='string'&&/^[a-f0-9-]{36}$/.test(body.session)?body.session:null;
   const game=allowedGames.has(body.game)&&body.game?body.game:null;
   const sequence=body.sequence;
   if(!session||!game||!['start','tick','stop'].includes(body.action)||typeof body.active!=='boolean'||!Number.isSafeInteger(sequence)||sequence<0||sequence>1e9)return json({error:'Invalid game session.'},400);
   const rewards=rewardHeartbeat(db,{me,userId:user.id,session,game,sequence,action:body.action,active:body.active,rewardActive:body.rewardActive,now});
   if(body.action==='start'){
    // One active session per account prevents time being multiplied by several tabs.
    // Repeating the same start does not reset its last tick or credit any time.
    await db.batch([
     ...rewards,
     db.prepare(`INSERT INTO dashboard_play_sessions(username,session_id,game,last_tick,sequence,active) VALUES(?,?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET session_id=excluded.session_id,game=excluded.game,last_tick=excluded.last_tick,sequence=excluded.sequence,active=excluded.active WHERE dashboard_play_sessions.session_id!=excluded.session_id`).bind(me,session,game,now,sequence,body.active?1:0),
     db.prepare(`INSERT INTO dashboard_game_activity(username,game,last_played) VALUES(?,?,?) ON CONFLICT(username,game) DO UPDATE SET last_played=MAX(last_played,excluded.last_played)`).bind(me,game,now)
    ]);
   }else{
    // Both statements run atomically. The server clock is the only source of time;
    // a missing heartbeat (>45s), stale session or inactive tab earns no interval.
    await db.batch([
     ...rewards,
     db.prepare(`UPDATE dashboard_game_activity SET played_ms=played_ms+COALESCE((SELECT CASE WHEN active=1 AND ?-last_tick BETWEEN 0 AND 45000 THEN ?-last_tick ELSE 0 END FROM dashboard_play_sessions WHERE username=? AND session_id=? AND game=?),0),last_played=MAX(last_played,?) WHERE username=? AND game=? AND EXISTS(SELECT 1 FROM dashboard_play_sessions WHERE username=? AND session_id=? AND game=? AND sequence<?)`).bind(now,now,me,session,game,now,me,game,me,session,game,sequence),
     db.prepare('UPDATE dashboard_play_sessions SET last_tick=MAX(last_tick,?),sequence=?,active=? WHERE username=? AND session_id=? AND game=? AND sequence<?').bind(now,sequence,body.action==='stop'?0:body.active?1:0,me,session,game,sequence)
    ]);
   }
   const current=await db.prepare('SELECT session_id,game,active FROM dashboard_play_sessions WHERE username=?').bind(me).first();
   if(current?.session_id!==session||current?.game!==game)return json({error:'Another game session is active.',superseded:true},409);
   // Only the accepted sequence may change presence. Late ticks/stops from an
   // earlier session cannot revive a closed game or hide its replacement.
   await db.prepare(`INSERT INTO dashboard_game_presence(username,session_id,game,started_at,last_seen,running)
    SELECT username,session_id,game,?,?,? FROM dashboard_play_sessions WHERE username=? AND session_id=? AND sequence=?
    ON CONFLICT(username) DO UPDATE SET session_id=excluded.session_id,game=excluded.game,
    started_at=CASE WHEN dashboard_game_presence.session_id=excluded.session_id THEN dashboard_game_presence.started_at ELSE excluded.started_at END,
    last_seen=excluded.last_seen,running=excluded.running`).bind(now,now,body.action==='stop'?0:1,me,session,sequence).run();
   let reward=null;
   if(['comp-run','morogue'].includes(game))try{reward=await reconcilePlayRewards(env,config,user.id,me,now);}catch{reward={pending:true};}
   return json({ok:true,reward});
}
