const fail=message=>Object.assign(new Error(message),{status:400});
export const LISTENING_LEASE_MS=90000;
const validText=(value,max=160)=>typeof value==='string'&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
export function listeningTrack(value){
 if(!value||!['youtube','suno','spotify'].includes(value.provider)||!validText(value.title)||!value.title.trim()||!validText(value.artist||''))throw fail('Invalid song details.');
 const {provider,id}=value;
 if(typeof id!=='string'||!(provider==='youtube'?/^[\w-]{11}$/:provider==='suno'?/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i:/^[a-zA-Z0-9]{22}$/).test(id))throw fail('Invalid song.');
 if(!Number.isFinite(value.duration)||value.duration<0||value.duration>86400||!Number.isFinite(value.position)||value.position<0||value.position>86400)throw fail('Invalid song timing.');
 let artwork='';
 if(provider==='youtube')artwork=`https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
 else if(value.artwork){
  let url;try{url=new URL(value.artwork);}catch{throw fail('Invalid cover image.');}
  if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash||url.search||url.href.length>512)throw fail('Invalid cover image.');
  const allowed=provider==='spotify'?url.hostname==='i.scdn.co'&&/^\/image\/[a-f0-9]+$/i.test(url.pathname):/^cdn[0-9]*\.suno\.(ai|com)$/.test(url.hostname)&&/^\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp)$/i.test(url.pathname);
  if(!allowed)throw fail('Invalid cover image.');artwork=url.href;
 }
 return {provider,id,title:value.title.trim(),artist:value.artist||'',artwork,position:Math.min(value.position,value.duration||86400),duration:value.duration,approximate:provider==='suno',url:provider==='youtube'?`https://www.youtube.com/watch?v=${id}`:provider==='suno'?`https://suno.com/song/${id}`:`https://open.spotify.com/track/${id}`};
}
export async function listeningSettings(db,id,env={}){
 const row=await db.prepare('SELECT reparty,spotify FROM community_listening_preferences WHERE user_id=?').bind(id).first();
 const clientId=/^[a-f0-9]{32}$/i.test(env.SPOTIFY_CLIENT_ID||'')?env.SPOTIFY_CLIENT_ID:'';
 return {reparty:row?.reparty===1,spotify:row?.spotify===1,spotifyClientId:clientId};
}
export async function saveListeningSettings(db,id,body,env){
 if(typeof body.reparty!=='boolean'||typeof body.spotify!=='boolean')throw fail('Choose valid listening settings.');
 await db.batch([
  db.prepare('INSERT INTO community_listening_preferences VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET reparty=excluded.reparty,spotify=excluded.spotify').bind(id,+body.reparty,+body.spotify),
  db.prepare("DELETE FROM community_listening WHERE user_id=? AND ((source='reparty' AND ?=0) OR (source='spotify' AND ?=0))").bind(id,+body.reparty,+body.spotify)
 ]);
 return listeningSettings(db,id,env);
}
export async function listeningHeartbeat(db,me,body,now){
 if(!['reparty','spotify'].includes(body.source)||typeof body.session!=='string'||!/^[a-f0-9-]{36}$/i.test(body.session)||!Number.isSafeInteger(body.sequence)||body.sequence<0||body.sequence>1e9||!['start','tick','stop'].includes(body.action))throw fail('Invalid listening status.');
 if(body.action==='stop'){
  // Keep only an empty, expired tombstone so delayed ticks cannot revive a stop.
  await db.prepare('UPDATE community_listening SET track=\'{}\',expires_at=0,sequence=? WHERE user_id=? AND source=? AND session_id=? AND sequence<?').bind(body.sequence,me.id,body.source,body.session,body.sequence).run();
  return {ok:true};
 }
 const settings=await listeningSettings(db,me.id),player=await db.prepare('SELECT invisible FROM dashboard_players WHERE user_id=?').bind(me.id).first();
 if(!settings[body.source]||player?.invisible){await db.prepare('DELETE FROM community_listening WHERE user_id=? AND source=?').bind(me.id,body.source).run();return {ok:true,sharing:false};}
 const track=listeningTrack(body.track);
 if((body.source==='spotify')!==(track.provider==='spotify'))throw fail('Invalid music source.');
 // A client supplies a position, never the lease or the public sample timestamp.
 await db.prepare(`INSERT INTO community_listening VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,source) DO UPDATE SET session_id=excluded.session_id,sequence=excluded.sequence,track=excluded.track,sampled_at=excluded.sampled_at,expires_at=excluded.expires_at WHERE (community_listening.session_id=excluded.session_id AND community_listening.sequence<excluded.sequence AND (community_listening.expires_at>0 OR ?=1)) OR (community_listening.session_id!=excluded.session_id AND ?=1)`).bind(me.id,body.source,body.session,body.sequence,JSON.stringify(track),now,now+LISTENING_LEASE_MS,+(body.action==='start'),+(body.action==='start')).run();
 return {ok:true,sharing:true};
}
export async function attachListening(db,people,now){
 for(const person of people)person.listening=null;
 const visible=people.filter(p=>!p.locked&&!p.invisible);
 for(let offset=0;offset<visible.length;offset+=70){
  const group=visible.slice(offset,offset+70),marks=group.map(()=>'?').join(',');
  const rows=await db.prepare(`SELECT p.username,l.source,l.track,l.sampled_at,l.expires_at FROM community_listening l JOIN dashboard_players p ON p.user_id=l.user_id JOIN community_listening_preferences s ON s.user_id=l.user_id WHERE p.username IN (${marks}) AND p.invisible=0 AND l.expires_at>? AND ((l.source='reparty' AND s.reparty=1) OR (l.source='spotify' AND s.spotify=1)) ORDER BY CASE l.source WHEN 'reparty' THEN 0 ELSE 1 END`).bind(...group.map(p=>p.username),now).all();
  for(const person of group){const row=rows.results.find(r=>r.username===person.username);if(!row)continue;try{const track=listeningTrack(JSON.parse(row.track));const end=track.duration?row.sampled_at+Math.max(0,track.duration-track.position)*1000:row.expires_at;const expiresAt=Math.min(row.expires_at,end);if(expiresAt>now)person.listening={...track,source:row.source,sampledAt:row.sampled_at,expiresAt};}catch{}}
 }
}
