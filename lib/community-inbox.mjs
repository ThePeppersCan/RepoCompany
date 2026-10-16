const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const visible=`NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=m.sender_name) OR (b.blocked=? AND b.blocker=m.sender_name))`;
export async function communityInbox(db,me) {
 // Establish a quiet baseline the first time an account sees each channel.
 // Existing history must not become a flood of new-message notifications.
 const channels=(await db.prepare(`SELECT c.id,COALESCE(MAX(m.id),0) latest FROM community_channels c LEFT JOIN community_reads r ON r.channel_id=c.id AND r.user_id=? LEFT JOIN community_messages m ON m.channel_id=c.id WHERE r.user_id IS NULL GROUP BY c.id`).bind(me.id).all()).results;
 if(channels.length)await db.batch(channels.map(c=>db.prepare('INSERT INTO community_reads(user_id,channel_id,read_through) VALUES(?,?,?) ON CONFLICT(user_id,channel_id) DO NOTHING').bind(me.id,c.id,c.latest)));
 const inbox=(await db.prepare(`SELECT c.id,c.name,r.read_through readThrough,COUNT(m.id) unread,MAX(m.id) latest FROM community_channels c JOIN community_reads r ON r.channel_id=c.id AND r.user_id=? LEFT JOIN community_messages m ON m.channel_id=c.id AND m.id>r.read_through AND m.sender_id<>? AND ${visible} GROUP BY c.id,c.name,r.read_through ORDER BY c.created_at,c.id`).bind(me.id,me.id,me.name,me.name).all()).results;
 const ids=inbox.map(c=>c.latest).filter(Boolean);
 const messages=ids.length?(await db.prepare(`SELECT m.id,m.sender_name sender,m.text,m.created_at createdAt,COALESCE(d.display_name,p.display_name,m.sender_name) display FROM community_messages m LEFT JOIN dashboard_players p ON p.user_id=m.sender_id LEFT JOIN community_profile_details d ON d.user_id=m.sender_id WHERE m.id IN (${ids.map(()=>'?').join(',')}) AND ${visible}`).bind(...ids,me.name,me.name).all()).results:[];
 return {channels:inbox.map(({latest,...c})=>({...c,lastMessage:messages.find(m=>m.id===latest)||null})),totalUnread:inbox.reduce((n,c)=>n+c.unread,0)};
}
export async function readCommunityChannel(db,me,body) {
 if(typeof body.channel!=='string'||body.channel.length>64||!Number.isSafeInteger(body.through)||body.through<0)throw fail('Invalid read position.');
 if(!await db.prepare('SELECT id FROM community_channels WHERE id=?').bind(body.channel).first())throw fail('Channel not found.',404);
 if(body.through&&!await db.prepare(`SELECT m.id FROM community_messages m WHERE m.id=? AND m.channel_id=? AND ${visible}`).bind(body.through,body.channel,me.name,me.name).first())throw fail('Message not found.',404);
 await db.prepare('INSERT INTO community_reads(user_id,channel_id,read_through) VALUES(?,?,?) ON CONFLICT(user_id,channel_id) DO UPDATE SET read_through=MAX(community_reads.read_through,excluded.read_through)').bind(me.id,body.channel,body.through).run();
 return {readThrough:(await db.prepare('SELECT read_through FROM community_reads WHERE user_id=? AND channel_id=?').bind(me.id,body.channel).first()).read_through};
}
