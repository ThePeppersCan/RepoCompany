import {activitySettings,saveActivitySettings,externalHeartbeat,attachActivity} from '../../../lib/wibs-activity.mjs';
import {communityInbox,readCommunityChannel} from '../../../lib/community-inbox.mjs';
import {writeTyping,readTyping} from '../../../lib/chat-typing.mjs';
import {validateMessageImage,attachMessageImage} from '../../../lib/chat-images.mjs';
import config from '../../../dashboard-config.json';

const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const username=v=>typeof v==='string'&&/^[a-z0-9_-]{3,16}$/i.test(v);
const developer='EXISTS(SELECT 1 FROM community_roles WHERE user_id=? AND role=\'Developer\')';
const wibsIds=new Set(['wave','love','laugh','hype','wow','sad','angry','sleepy'].map(id=>'wibs-'+id));
const oldEmotes={'👍':'wibs-wave','❤️':'wibs-love','😂':'wibs-laugh','🎉':'wibs-hype','👀':'wibs-wow','🌿':'wibs-sleepy'};
function wibsEmote(value){if(typeof value!=='string')return null;if(wibsIds.has(value))return value;if(Object.hasOwn(oldEmotes,value))return oldEmotes[value];const m=value.match(/^(?:morogue|moratales|manager)-(up|down|laugh|angry|love)$/);return m?'wibs-'+({up:'wave',down:'sad'}[m[1]]||m[1]):null;}
function wibsReactions(rows,key,count){const merged=new Map();for(const r of rows){const id=wibsEmote(r[key]);if(!id)continue;const k=r.message_id+':'+id,prev=merged.get(k);if(prev){prev[count]+=r[count];prev.mine=Math.max(prev.mine,r.mine);}else merged.set(k,{...r,[key]:id});}return [...merged.values()];}
async function identity(request){
 const token=request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];
 if(!token)throw fail('Sign in to join the community.',401);
 const headers={apikey:config.key,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const auth=await fetch(config.url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});
 if(!auth.ok)throw fail('Sign in again.',401);
 const user=await auth.json();if(!uuid(user.id)||user.is_anonymous)throw fail('Sign in with your Repo Company account.',401);
 const response=await fetch(config.url+'/rest/v1/rpc/get_my_character',{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw fail('Your account is temporarily unavailable.',503);
 const data=await response.json(),profile=Array.isArray(data)?data[0]:data;
 if(!username(profile?.username))throw fail('Create your player profile first.',409);
 return{id:user.id.toLowerCase(),name:profile.username.toLowerCase(),display:profile.username};
}
async function bodyOf(request,limit){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('Send a JSON request.',415);
 const reader=request.body?.getReader();if(!reader)throw fail('Request required.');
 let length=0;const parts=[];
 try{for(;;){const p=await reader.read();if(p.done)break;length+=p.value.length;if(length>limit){await reader.cancel();throw fail('The upload is too large. Use a file up to 1 MB.',413);}parts.push(p.value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}
 let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw fail('Invalid request.');}
 if(!body||typeof body!=='object'||Array.isArray(body))throw fail('Invalid request.');return body;
}
async function rate(db,me,scope,max,now){
 const row=await db.prepare(`INSERT INTO social_rate_limits(user_id,scope,window_start,count) VALUES(?,?,?,1) ON CONFLICT(user_id,scope) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count`).bind(me.id,'community-'+scope,Math.floor(now/60000)).first();
 if(row.count>max)throw fail('Please wait a moment before trying again.',429);
}
const settingsView=row=>({title:row.title,bannerVersion:row.banner_version,height:row.banner_height,zoom:row.banner_zoom,x:row.banner_x,y:row.banner_y});
const games=new Set(['moratales','manager','morogue','broomflight','runners','dragonbound','diver','goblin','rooftops','seas','sports']);
function activityFor(p,now){
 if(p.locked||p.invisible)return null;
 let game='',seen=0,startedAt=null;
 if(p.presence_seen>now-90000){if(!p.running)return null;game=p.presence_game;seen=p.presence_seen;startedAt=p.started_at;}
 else if(p.active&&p.last_tick>now-90000){game=p.session_game;seen=p.last_tick;}
 else if(p.dashboard_seen>now-90000){game=p.current_game;seen=p.dashboard_seen;}
 return games.has(game)?{game,startedAt,expiresAt:seen+90000}:null;
}
async function profileFor(db,me,target){
 if(!username(target))throw fail('Player not found.',404);
 const p=await db.prepare(`SELECT p.user_id,p.username,COALESCE(d.display_name,p.display_name) display_name,COALESCE(d.bio,p.bio) bio,p.repo_score,d.background,d.accent,w.name_color,p.invisible,p.last_seen dashboard_seen,p.current_game,g.game presence_game,g.started_at,g.last_seen presence_seen,g.running,s.game session_game,s.last_tick,s.active,a.config avatar,f.frame_id,(SELECT version FROM dashboard_profile_photos WHERE user_id=p.user_id AND enabled=1) photo_version,COALESCE(v.private_profile,0) private_profile,r.role FROM dashboard_players p LEFT JOIN community_profile_details d ON d.user_id=p.user_id LEFT JOIN community_appearance w ON w.user_id=p.user_id LEFT JOIN dashboard_avatars a ON a.username=p.username LEFT JOIN dashboard_avatar_frames f ON f.username=p.username LEFT JOIN dashboard_profile_privacy v ON v.username=p.username LEFT JOIN community_roles r ON r.user_id=p.user_id  LEFT JOIN dashboard_game_presence g ON g.username=p.username LEFT JOIN dashboard_play_sessions s ON s.username=p.username WHERE p.username=?`).bind(target).first();
 if(!p||await db.prepare('SELECT 1 FROM dashboard_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)').bind(me.name,p.username,p.username,me.name).first())throw fail('Profile unavailable.',404);
 const friend=!!await db.prepare("SELECT 1 FROM dashboard_friendships WHERE status='accepted' AND ((player_a=? AND player_b=?) OR (player_b=? AND player_a=?))").bind(me.name,p.username,me.name,p.username).first();
 p.locked=!!p.private_profile&&p.user_id!==me.id&&!friend;p.friend=friend;return p;
}
function cleanText(v,max,label){if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw fail(label);return v.trim();}
export async function onRequest({request,env,params}){
 try{
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(origin&&origin!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')throw fail('Use the Repo Company website or client.',403);
  if(!['GET','POST'].includes(request.method))throw fail('Method not allowed.',405);
  const route=Array.isArray(params.path)?params.path.join('/'):params.path;
  const me=await identity(request),db=env.DASHBOARD_DB?.withSession?.('first-primary')||env.DASHBOARD_DB,now=Date.now();
  if(!db)throw fail('Community is temporarily unavailable.',503);
  await db.prepare(`INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id WHERE dashboard_players.user_id IS NULL`).bind(me.name,me.id,me.display).run();
  if((await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(me.name).first())?.user_id!==me.id)throw fail('Refresh your player profile.',409);
  const isDeveloper=!!await db.prepare("SELECT 1 FROM community_roles WHERE user_id=? AND role='Developer'").bind(me.id).first();
  if(route==='banner'||route==='settings')throw fail('The shared Wibs header has been removed.',410);
  if(request.method==='POST'&&route==='typing'){
   const body=await bodyOf(request,1024);
   if(typeof body.active!=='boolean'||typeof body.channel!=='string'||body.channel.length>64)throw fail('Invalid typing activity.');
   if(!await db.prepare('SELECT id FROM community_channels WHERE id=?').bind(body.channel).first())throw fail('Channel not found.',404);
   await writeTyping(db,me,'community',body.channel,body.active,now);return json({ok:true});
  }
  if(request.method==='GET'&&route==='activity-settings')return json({...await activitySettings(db,me.id),invisible:!!(await db.prepare('SELECT invisible FROM dashboard_players WHERE user_id=?').bind(me.id).first())?.invisible});
  if(request.method==='POST'&&route==='activity-settings'){await rate(db,me,'activity-settings',20,now);return json(await saveActivitySettings(db,me.id,await bodyOf(request,1024)));}
  if(request.method==='POST'&&route==='external-activity'){await rate(db,me,'external-activity',16,now);return json(await externalHeartbeat(db,me,await bodyOf(request,2048),now));}
  if(request.method==='GET'&&route==='inbox')return json(await communityInbox(db,me));
  if(request.method==='POST'&&route==='read'){await rate(db,me,'read',120,now);return json(await readCommunityChannel(db,me,await bodyOf(request,1024)));}
  if(request.method==='GET'&&route==='state'){
   await db.prepare('INSERT INTO community_members(user_id,joined_at,last_seen) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET last_seen=excluded.last_seen WHERE last_seen<?').bind(me.id,now,now,now-20000).run();
   const settings=await db.prepare('SELECT title,banner_version,banner_height,banner_zoom,banner_x,banner_y FROM community_settings WHERE id=1').first();
   const voice=await db.prepare('SELECT name FROM community_voice_settings WHERE id=1').first();
   const appearance=await db.prepare('SELECT theme_background background,theme_accent accent FROM community_appearance WHERE user_id=?').bind(me.id).first();
   const channels=await db.prepare('SELECT id,name,description FROM community_channels ORDER BY created_at,id').all();
   const people=await db.prepare(`SELECT p.username,COALESCE(d.display_name,p.display_name) display_name,w.name_color,r.role,p.invisible,p.last_seen dashboard_seen,p.current_game,g.game presence_game,g.started_at,g.last_seen presence_seen,g.running,s.game session_game,s.last_tick,s.active,a.config avatar,f.frame_id,(SELECT version FROM dashboard_profile_photos WHERE user_id=p.user_id AND enabled=1) photo_version,CASE WHEN p.user_id=? OR COALESCE(v.private_profile,0)=0 OR EXISTS(SELECT 1 FROM dashboard_friendships q WHERE q.status='accepted' AND ((q.player_a=? AND q.player_b=p.username) OR (q.player_b=? AND q.player_a=p.username))) THEN 0 ELSE 1 END locked,CASE WHEN p.invisible=0 AND m.last_seen>? THEN 1 ELSE 0 END online FROM community_members m JOIN dashboard_players p ON p.user_id=m.user_id LEFT JOIN community_profile_details d ON d.user_id=p.user_id LEFT JOIN community_appearance w ON w.user_id=p.user_id LEFT JOIN community_roles r ON r.user_id=m.user_id LEFT JOIN dashboard_avatars a ON a.username=p.username LEFT JOIN dashboard_avatar_frames f ON f.username=p.username LEFT JOIN dashboard_profile_privacy v ON v.username=p.username  LEFT JOIN dashboard_game_presence g ON g.username=p.username LEFT JOIN dashboard_play_sessions s ON s.username=p.username WHERE NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=p.username) OR (b.blocked=? AND b.blocker=p.username)) ORDER BY (r.role IS NOT NULL) DESC,online DESC,p.username LIMIT 200`).bind(me.id,me.name,me.name,now-60000,me.name,me.name).all();
   for(const p of people.results)p.activity=activityFor(p,now);
   await attachActivity(db,people.results,now);
   for(const p of people.results){if(p.activity)p.online=1;for(const key of ['invisible','dashboard_seen','current_game','presence_game','started_at','presence_seen','running','session_game','last_tick','active'])delete p[key];if(p.locked){p.avatar=null;p.frame_id=null;p.photo_version=null;p.display_name=p.username;p.name_color=null;p.online=0;}else{try{p.avatar=JSON.parse(p.avatar);}catch{p.avatar=null;}}delete p.locked;}
   const developers=isDeveloper?(await db.prepare('SELECT p.username,p.display_name FROM community_roles r JOIN dashboard_players p ON p.user_id=r.user_id ORDER BY p.username').all()).results:[];
   return json({settings:settingsView(settings),voiceName:voice?.name||'RE-COMP',appearance:appearance||{background:'#0c1913',accent:'#b5d39c'},channels:channels.results,members:people.results,developer:isDeveloper,developers,username:me.name});
  }
  if(request.method==='GET'&&route==='profile'){
   const p=await profileFor(db,me,url.searchParams.get('username')||me.name);
   if(p.locked)return json({username:p.username,display:p.username,locked:true,role:p.role});
   p.activity=activityFor(p,now);await attachActivity(db,[p],now);
   const row=await db.prepare('SELECT banner_version,banner_height,banner_zoom,banner_x,banner_y FROM community_profiles WHERE user_id=?').bind(p.user_id).first();
   let avatar=null;try{avatar=JSON.parse(p.avatar);}catch{}
   return json({username:p.username,display:p.display_name,nameColor:p.name_color,bio:p.bio,repoScore:p.repo_score,colors:{background:p.background||'#14231b',accent:p.accent||'#b5d39c'},activity:p.activity,recentActivity:p.recentActivity,photo_version:p.photo_version,avatar,frame_id:p.frame_id,role:p.role,friend:p.friend,own:p.user_id===me.id,settings:row?settingsView(row):{bannerVersion:null,height:180,zoom:100,x:50,y:50}});
  }
  if(request.method==='GET'&&(route==='banner'||route==='profile-banner')){
   let row;
   if(route==='profile-banner'){const p=await profileFor(db,me,url.searchParams.get('username')||me.name);if(p.locked)throw fail('This profile is private.',403);row=await db.prepare('SELECT banner_data,banner_type FROM community_profiles WHERE user_id=?').bind(p.user_id).first();}
   else row=await db.prepare('SELECT banner_data,banner_type FROM community_settings WHERE id=1').first();
   if(!row?.banner_data)throw fail('No banner uploaded.',404);
   return new Response(Uint8Array.from(atob(row.banner_data),c=>c.charCodeAt(0)),{headers:{'Content-Type':row.banner_type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',Vary:'Authorization'}});
  }
  const visibility=`NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=m.sender_name) OR (b.blocked=? AND b.blocker=m.sender_name))`;
  if(request.method==='GET'&&route==='messages'){
   const channel=url.searchParams.get('channel')||'general',before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER),after=Number(url.searchParams.get('after')||0),search=(url.searchParams.get('search')||'').slice(0,100);
   if(!Number.isSafeInteger(before)||before<1||!Number.isSafeInteger(after)||after<0)throw fail('Invalid message cursor.');
   const revision=(await db.prepare("SELECT revision FROM wibs_revisions WHERE scope='community' AND target=?").bind(channel).first())?.revision||0;
   // Include block state in the token: blocking must invalidate previously visible messages.
   const blocks=await db.prepare('SELECT blocker,blocked FROM dashboard_blocks WHERE blocker=? OR blocked=? ORDER BY blocker,blocked').bind(me.name,me.name).all();
   const token=revision+':'+JSON.stringify(blocks.results);
   const activity=await readTyping(db,me,'community',channel,now);
   if(url.searchParams.get('revision')===token)return json({...activity,unchanged:true,revision:token});
   const rows=await db.prepare(`SELECT m.*,COALESCE(d.display_name,p.display_name) display_name,w.name_color,r.role FROM community_messages m LEFT JOIN dashboard_players p ON p.user_id=m.sender_id LEFT JOIN community_profile_details d ON d.user_id=p.user_id LEFT JOIN community_appearance w ON w.user_id=p.user_id LEFT JOIN community_roles r ON r.user_id=m.sender_id WHERE m.channel_id=? AND m.id<? AND m.id>? AND instr(lower(m.text),lower(?))>0 AND ${visibility} ORDER BY m.id ${after?'ASC':'DESC'} LIMIT 51`).bind(channel,before,after,search,me.name,me.name).all();
   const page=rows.results.slice(0,50);if(!after)page.reverse();
   let reactions=[];if(page.length)reactions=(await db.prepare(`SELECT message_id,emoji,COUNT(*) count,MAX(user_id=?) mine FROM community_reactions WHERE message_id IN (${page.map(()=>'?').join(',')}) GROUP BY message_id,emoji`).bind(me.id,...page.map(m=>m.id)).all()).results;
   reactions=wibsReactions(reactions,'emoji','count');
   return json({...activity,revision:token,messages:page.map(m=>({id:m.id,sender:m.sender_name,display:m.display_name||m.sender_name,nameColor:m.name_color,role:m.role,text:m.text,createdAt:m.created_at,mine:m.sender_id===me.id,reactions:reactions.filter(r=>r.message_id===m.id)})),hasMore:rows.results.length>50});
  }
  if(request.method!=='POST')throw fail('Not found.',404);
  const restricted=['settings','banner','channel','voice-name','role'].includes(route);
  if(restricted&&!isDeveloper)throw fail('Only Developers can change community settings.',403);
  await rate(db,me,restricted?'manage':'write',restricted?20:40,now);
  const body=await bodyOf(request,route==='banner'||route==='profile-banner'?1450000:20000);
  if(route==='messages'){
   const text=cleanText(body.text,4000,'Write a message of up to 4,000 characters.');if(!uuid(body.clientId))throw fail('Invalid message identifier.');
   if(!await db.prepare('SELECT id FROM community_channels WHERE id=?').bind(body.channel).first())throw fail('Channel not found.',404);
   await writeTyping(db,me,'community',body.channel,false,now);
   const imageId=await validateMessageImage(db,me,'community',body.channel,body.clientId,text);
   await db.prepare('INSERT INTO community_messages(channel_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(sender_id,client_id) DO NOTHING').bind(body.channel,me.id,me.name,body.clientId,text,now).run();
   const row=await db.prepare('SELECT id,channel_id,text FROM community_messages WHERE sender_id=? AND client_id=?').bind(me.id,body.clientId).first();
   if(row.channel_id!==body.channel||row.text!==text)throw fail('This message identifier was already used.',409);
   await attachMessageImage(db,imageId,row.id);return json({id:row.id});
  }
  if(route==='reaction'||route==='delete'){
   if(!Number.isSafeInteger(body.id))throw fail('Invalid message.');
   const row=await db.prepare(`SELECT m.sender_id FROM community_messages m WHERE m.id=? AND ${visibility}`).bind(body.id,me.name,me.name).first();
   if(!row)throw fail('Message not found.',404);
   if(route==='delete'){
    if(row.sender_id!==me.id&&!isDeveloper)throw fail('You can only delete your own messages.',403);
    await db.prepare(`DELETE FROM community_messages WHERE id=? AND (sender_id=? OR ${developer})`).bind(body.id,me.id,me.id).run();
   }else{
    const selected=body.emoji===null?null:wibsEmote(body.emoji);if(body.emoji!==null&&!selected)throw fail('Choose a reaction.');
    if(body.emoji===null)await db.prepare('DELETE FROM community_reactions WHERE message_id=? AND user_id=?').bind(body.id,me.id).run();
    else await db.prepare('INSERT INTO community_reactions(message_id,user_id,emoji) VALUES(?,?,?) ON CONFLICT(message_id,user_id) DO UPDATE SET emoji=excluded.emoji').bind(body.id,me.id,selected).run();
   }return json({ok:true});
  }
  if(route==='voice-name'){
   const name=cleanText(body.name,32,'Use a voice channel name of up to 32 characters.');
   if(/[\r\n\t]/.test(name))throw fail('Use a single line for the voice channel name.');
   await db.prepare(`UPDATE community_voice_settings SET name=? WHERE id=1 AND ${developer}`).bind(name,me.id).run();return json({ok:true});
  }
  if(route==='profile-details'){
   const display=cleanText(body.display,32,'Use a Wibs display name of up to 32 characters.');
   if(typeof body.bio!=='string'||body.bio.length>300||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body.bio))throw fail('Use a bio of up to 300 characters.');
   for(const key of ['background','accent'])if(typeof body[key]!=='string'||!/^#[a-f0-9]{6}$/i.test(body[key]))throw fail('Choose a valid profile colour.');
   if(body.nameColor!==undefined&&body.nameColor!==null&&!/^#[a-f0-9]{6}$/i.test(body.nameColor))throw fail('Choose a valid name colour.');
   if(body.theme!==undefined&&(!body.theme||!['background','accent'].every(k=>typeof body.theme[k]==='string'&&/^#[a-f0-9]{6}$/i.test(body.theme[k]))))throw fail('Choose valid theme colours.');
   const changes=[db.prepare('INSERT INTO community_profile_details(user_id,display_name,bio,background,accent) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,background=excluded.background,accent=excluded.accent').bind(me.id,display,body.bio.trim(),body.background.toLowerCase(),body.accent.toLowerCase())];
   if(body.nameColor!==undefined)changes.push(db.prepare('INSERT INTO community_appearance(user_id,name_color) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET name_color=excluded.name_color').bind(me.id,body.nameColor?.toLowerCase()||null));
   if(body.theme!==undefined)changes.push(db.prepare('INSERT INTO community_appearance(user_id,theme_background,theme_accent) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET theme_background=excluded.theme_background,theme_accent=excluded.theme_accent').bind(me.id,body.theme.background.toLowerCase(),body.theme.accent.toLowerCase()));
   await db.batch(changes);return json({ok:true});
  }
  if(route==='settings'||route==='profile-settings'){
   const title=route==='settings'?cleanText(body.title,48,'Use a community title of up to 48 characters.'):'Profile';
   for(const [key,min,max]of [['height',140,360],['zoom',100,250],['x',0,100],['y',0,100]])if(!Number.isInteger(body[key])||body[key]<min||body[key]>max)throw fail('Invalid banner position.');
   if(route==='profile-settings')await db.prepare('INSERT INTO community_profiles(user_id,banner_height,banner_zoom,banner_x,banner_y) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET banner_height=excluded.banner_height,banner_zoom=excluded.banner_zoom,banner_x=excluded.banner_x,banner_y=excluded.banner_y').bind(me.id,body.height,body.zoom,body.x,body.y).run();
   else await db.prepare(`UPDATE community_settings SET title=?,banner_height=?,banner_zoom=?,banner_x=?,banner_y=? WHERE id=1 AND ${developer}`).bind(title,body.height,body.zoom,body.x,body.y,me.id).run();return json({ok:true});
  }
  if(route==='banner'||route==='profile-banner'){
   let data=null,type=null;
   if(body.data!==null){
    if(typeof body.data!=='string'||body.data.length>1398104||!/^[A-Za-z0-9+/]*={0,2}$/.test(body.data))throw fail('Choose an image or GIF up to 1 MB.');
    let bytes;try{bytes=Uint8Array.from(atob(body.data),c=>c.charCodeAt(0));}catch{throw fail('Invalid image.');}
    if(bytes.length>1048576||bytes.length<12)throw fail('Choose an image or GIF up to 1 MB.');
    const s=new TextDecoder('latin1').decode(bytes.slice(0,12));
    type=bytes[0]===137&&s.slice(1,4)==='PNG'?'image/png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'image/jpeg':/^GIF8[79]a/.test(s)?'image/gif':s.startsWith('RIFF')&&s.endsWith('WEBP')?'image/webp':null;
    if(!type)throw fail('Use a PNG, JPEG, WebP or GIF image.');data=body.data;
   }
   const version=data?crypto.randomUUID():null;
   if(route==='profile-banner')await db.prepare('INSERT INTO community_profiles(user_id,banner_data,banner_type,banner_version) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET banner_data=excluded.banner_data,banner_type=excluded.banner_type,banner_version=excluded.banner_version').bind(me.id,data,type,version).run();
   else await db.prepare(`UPDATE community_settings SET banner_data=?,banner_type=?,banner_version=? WHERE id=1 AND ${developer}`).bind(data,type,version,me.id).run();return json({ok:true});
  }
  if(route==='channel'){
   const name=cleanText(body.name,32,'Use a channel name of up to 32 characters.').toLowerCase().replace(/\s+/g,'-');
   if(!/^[a-z0-9][a-z0-9_-]*$/.test(name))throw fail('Use letters, numbers, hyphens or underscores.');
   const description=typeof body.description==='string'?body.description.trim().slice(0,180):'';
   if(body.id){
    if(!await db.prepare('SELECT id FROM community_channels WHERE id=?').bind(body.id).first())throw fail('Channel not found.',404);
    await db.prepare(`UPDATE community_channels SET name=?,description=? WHERE id=? AND ${developer}`).bind(name,description,body.id,me.id).run();
   }else await db.prepare(`INSERT INTO community_channels(id,name,description,created_at) SELECT ?,?,?,? WHERE ${developer} AND (SELECT COUNT(*) FROM community_channels)<20`).bind(crypto.randomUUID(),name,description,now,me.id).run();
   return json({ok:true});
  }
  if(route==='role'){
   if(!username(body.username)||typeof body.enabled!=='boolean')throw fail('Choose a valid username.');
   const target=await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(body.username.toLowerCase()).first();
   if(!target?.user_id)throw fail('That player must sign in to Repo Company first.',404);
   if(target.user_id===me.id&&!body.enabled)throw fail('Another Developer must remove your role.');
   if(body.enabled)await db.prepare(`INSERT OR IGNORE INTO community_roles(user_id,role,granted_by,created_at) SELECT ?,'Developer',?,? WHERE ${developer}`).bind(target.user_id,me.id,now,me.id).run();
   else await db.prepare(`DELETE FROM community_roles WHERE user_id=? AND ${developer}`).bind(target.user_id,me.id).run();return json({ok:true});
  }
  throw fail('Not found.',404);
 }catch(error){return json({error:error.status?error.message:String(error.message).includes('UNIQUE constraint')?'That channel name is already in use.':'Community is temporarily unavailable.'},error.status||503);}
}
