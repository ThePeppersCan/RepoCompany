export const TYPING_TTL = 10000;

export async function writeTyping(db, me, scope, target, active, now) {
 if (active) {
  // The server also bounds writes, including forged rapid requests or many tabs.
  await db.prepare(`INSERT INTO wibs_typing(user_id,username,scope,target,updated_at,expires_at) VALUES(?,?,?,?,?,?)
   ON CONFLICT(user_id) DO UPDATE SET username=excluded.username,scope=excluded.scope,target=excluded.target,updated_at=excluded.updated_at,expires_at=excluded.expires_at
   WHERE wibs_typing.updated_at<=?`).bind(me.id,me.name,scope,target,now,now+TYPING_TTL,now-4000).run();
 } else {
  await db.prepare('UPDATE wibs_typing SET expires_at=0 WHERE user_id=? AND scope=? AND target=? AND expires_at>0').bind(me.id,scope,target).run();
 }
}

export async function readTyping(db, me, scope, target, now, sender = null) {
 const rows=await db.prepare(`SELECT t.username,COALESCE(d.display_name,p.display_name,p.username) display,t.expires_at
  FROM wibs_typing t JOIN dashboard_players p ON p.user_id=t.user_id AND p.username=t.username
  JOIN dashboard_players v ON v.user_id=? AND v.username=?
  LEFT JOIN community_profile_details d ON d.user_id=p.user_id
  WHERE t.scope=? AND t.target=? AND t.expires_at>? AND t.user_id!=? AND p.invisible=0
  AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=v.username AND b.blocked=p.username) OR (b.blocked=v.username AND b.blocker=p.username))
  AND (?='community' OR (t.user_id=? AND EXISTS(SELECT 1 FROM dashboard_friendships f WHERE f.status='accepted' AND ((f.player_a=v.username AND f.player_b=p.username) OR (f.player_b=v.username AND f.player_a=p.username)))))
  ORDER BY t.updated_at DESC LIMIT 5`).bind(me.id,me.name,scope,target,now,me.id,scope,sender).all();
 return {typing:rows.results.map(p=>({username:p.username,display:p.display,remainingMs:Math.min(TYPING_TTL,Math.max(0,p.expires_at-now))}))};
}
