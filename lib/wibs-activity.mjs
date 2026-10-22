const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const repoGames=new Set(['moratales','manager','morogue','comp-run','dragonbound','diver','goblin','rooftops','seas','sports']);
const externalGame=id=>typeof id==='string'&&/^(?:steam:[1-9][0-9]{0,9}|runelite|custom:[a-f0-9]{24})$/.test(id);
export async function activitySettings(db,id){
 const row=await db.prepare('SELECT share_activity,external_enabled FROM community_activity_preferences WHERE user_id=?').bind(id).first();
 return {shareActivity:row?.share_activity!==0,externalGames:row?.external_enabled===1};
}
export async function saveActivitySettings(db,id,body){
 if(typeof body.shareActivity!=='boolean'||typeof body.externalGames!=='boolean')throw fail('Choose valid activity settings.');
 await db.batch([
  db.prepare('INSERT INTO community_activity_preferences VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET share_activity=excluded.share_activity,external_enabled=excluded.external_enabled').bind(id,+body.shareActivity,+body.externalGames),
  db.prepare('UPDATE community_external_sessions SET running=0 WHERE user_id=? AND ?=0').bind(id,+(body.shareActivity&&body.externalGames))
 ]);
 return activitySettings(db,id);
}
export async function externalHeartbeat(db,me,b,now){
 if(!b||!externalGame(b.game)||typeof b.session!=='string'||!/^[a-f0-9-]{36}$/.test(b.session)||!Number.isSafeInteger(b.sequence)||b.sequence<0||b.sequence>1e9||!['start','tick','stop'].includes(b.action))throw fail('Invalid game activity.');
 const title=b.game==='runelite'?'RuneLite':typeof b.title==='string'?b.title.trim():'';
 if(!title||title.length>100||/[\u0000-\u001f\u007f]/.test(title))throw fail('Use a game name of up to 100 characters.');
 const prefs=await activitySettings(db,me.id),player=await db.prepare('SELECT invisible FROM dashboard_players WHERE user_id=?').bind(me.id).first();
 if(!prefs.shareActivity||!prefs.externalGames||player?.invisible){
  await db.prepare('UPDATE community_external_sessions SET running=0 WHERE user_id=?').bind(me.id).run();
  return {ok:true,sharing:false};
 }
 if(b.action==='start'){
  await db.batch([
   db.prepare('INSERT INTO community_external_sessions VALUES(?,?,?,?,?,?,?,1) ON CONFLICT(user_id) DO UPDATE SET session_id=excluded.session_id,game=excluded.game,title=excluded.title,started_at=excluded.started_at,last_seen=excluded.last_seen,sequence=excluded.sequence,running=1 WHERE community_external_sessions.session_id!=excluded.session_id').bind(me.id,b.session,b.game,title,now,now,b.sequence),
   db.prepare('INSERT INTO community_external_activity(user_id,game,title,last_played) VALUES(?,?,?,?) ON CONFLICT(user_id,game) DO NOTHING').bind(me.id,b.game,title,now)
  ]);
 }else{
  await db.batch([
   db.prepare(`UPDATE community_external_activity SET played_ms=played_ms+COALESCE((SELECT CASE WHEN ?-last_seen BETWEEN 0 AND 45000 THEN ?-last_seen ELSE 0 END FROM community_external_sessions WHERE user_id=? AND session_id=? AND game=? AND running=1 AND sequence<?),0),last_played=MAX(last_played,?),title=? WHERE user_id=? AND game=? AND EXISTS(SELECT 1 FROM community_external_sessions WHERE user_id=? AND session_id=? AND game=? AND running=1 AND sequence<?)`).bind(now,now,me.id,b.session,b.game,b.sequence,now,title,me.id,b.game,me.id,b.session,b.game,b.sequence),
   db.prepare('UPDATE community_external_sessions SET last_seen=MAX(last_seen,?),sequence=?,running=? WHERE user_id=? AND session_id=? AND game=? AND running=1 AND sequence<?').bind(now,b.sequence,+(b.action!=='stop'),me.id,b.session,b.game,b.sequence)
  ]);
 }
 const current=await db.prepare('SELECT session_id,running FROM community_external_sessions WHERE user_id=?').bind(me.id).first();
 return {ok:true,sharing:true,superseded:current?.session_id!==b.session||!current.running};
}
// Called before the API removes private fields. Only selected, visible members
// receive activity; no process paths, IDs, window titles or command lines leave
// the launcher. The public history contains the latest game per person.
export async function attachActivity(db,people,now){
 const visible=people.filter(p=>!p.locked&&!p.invisible);
 for(const person of people)person.recentActivity=null;
 for(let offset=0;offset<visible.length;offset+=70){
  const group=visible.slice(offset,offset+70),marks=group.map(()=>'?').join(','),names=group.map(p=>p.username);
  const prefs=await db.prepare(`SELECT p.username,COALESCE(a.share_activity,1) share_activity,COALESCE(a.external_enabled,0) external_enabled,e.game,e.title,e.started_at,e.last_seen,e.running FROM dashboard_players p LEFT JOIN community_activity_preferences a ON a.user_id=p.user_id LEFT JOIN community_external_sessions e ON e.user_id=p.user_id WHERE p.username IN (${marks})`).bind(...names).all();
  const history=await db.prepare(`SELECT * FROM (SELECT username,game,title,played_ms,last_played,ROW_NUMBER() OVER(PARTITION BY username ORDER BY last_played DESC,game) rank FROM (
   SELECT g.username,g.game,'' title,g.played_ms,g.last_played FROM dashboard_game_activity g JOIN dashboard_players p ON p.username=g.username LEFT JOIN community_activity_preferences a ON a.user_id=p.user_id WHERE COALESCE(a.share_activity,1)=1
   UNION ALL SELECT p.username,g.game,g.title,g.played_ms,g.last_played FROM community_external_activity g JOIN dashboard_players p ON p.user_id=g.user_id JOIN community_activity_preferences a ON a.user_id=p.user_id WHERE a.share_activity=1 AND a.external_enabled=1
  ) WHERE username IN (${marks}) AND last_played>?) WHERE rank=1`).bind(...names,now-14*86400000).all();
  for(const p of group){
   const settings=prefs.results.find(r=>r.username===p.username);
   if(settings?.share_activity===0){p.activity=null;continue;}
   const e=settings;
   if(!p.activity&&e?.external_enabled&&e.running&&e.last_seen>now-90000&&externalGame(e.game))p.activity={game:e.game,title:e.title,startedAt:e.started_at,expiresAt:e.last_seen+90000};
   const recent=history.results.find(r=>r.username===p.username),valid=recent&&(repoGames.has(recent.game)||externalGame(recent.game));
   if(p.activity){p.recentActivity={...p.activity,lastPlayed:now,playedMs:valid&&recent.game===p.activity.game?recent.played_ms:0};}
   else if(valid)p.recentActivity={game:recent.game,title:recent.title,lastPlayed:recent.last_played,playedMs:recent.played_ms};
  }
 }
}
