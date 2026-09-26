const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs');const {call,a,b,c}=require('./game-mode.cjs');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260927040000_reparty_lobby.sql'),'utf8');
async function test(){
 const pg=await setup();await pg.exec(migration);let checks=0;
 const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
 const lobby=(u,action,data={})=>call(pg,u,'reparty_lobby_action',action,null,data);
 const room=(await lobby(a,'create',{mode:'video',name:'The forest lounge'})).id;
 let list=await lobby(b,'list',{mode:'video'});ok(list.rooms.some(r=>r.id===room),'signed-in users can discover rooms before joining');
 ok(Object.keys(list.rooms[0]).sort().join(',')==='id,last_used,mode,name,people','directory exposes only room metadata');
 await assert.rejects(call(pg,b,'reparty_action','snapshot',room),/Join this room/);checks++;
 await assert.rejects(lobby(null,'list'),/sign in/i);checks++;
 await assert.rejects(lobby(a,'list',{mode:'secret'}),/Invalid room list/);checks++;
 await assert.rejects(lobby(a,'create',{mode:'bad'}),/room type/);checks++;
 const cards=(await lobby(a,'create',{mode:'game',name:'Card night'})).id;
 const sounds=(await lobby(a,'create',{mode:'soundtrack',name:'Music night'})).id;
 list=await lobby(c,'list',{mode:'game'});ok(list.rooms.length===2&&list.rooms.some(r=>r.id===cards&&r.mode==='game')&&list.rooms.some(r=>r.id===sounds&&r.mode==='soundtrack'),'game rooms start in the chosen game and are separated from video rooms');
 let joined=await call(pg,b,'reparty_action','join',sounds);ok(joined.room.settings.soundtrack.phase==='setup'&&joined.room.settings.soundtrack.host===a,'joining a game keeps the original host and setup');
 await pg.query("update reparty_private.room_activity set last_used=clock_timestamp()-interval '7 days 1 second' where room_id=$1",[room]);
 list=await lobby(c,'list',{mode:'video'});ok(!list.rooms.some(r=>r.id===room),'rooms leave the directory after seven unused days');
 await pg.exec(migration);ok(!(await lobby(c,'list',{mode:'video'})).rooms.some(r=>r.id===room),'rerunning the migration does not revive inactive rooms');
 joined=await call(pg,b,'reparty_action','join',room);list=await lobby(c,'list',{mode:'video'});ok(list.rooms.some(r=>r.id===room)&&joined.room.playlists.length===1,'old room links restore discovery and retain playlists');
 const used=(await pg.query('select last_used from reparty_private.room_activity where room_id=$1',[room])).rows[0].last_used;
 await call(pg,b,'reparty_action','leave',room);ok(String((await pg.query('select last_used from reparty_private.room_activity where room_id=$1',[room])).rows[0].last_used)===String(used),'leaving never backdates room activity');
 await pg.query("update reparty_private.room_activity set last_used=clock_timestamp()-interval '8 days' where room_id=$1",[room]);
 await call(pg,a,'reparty_action','snapshot',room);ok((await lobby(c,'list',{mode:'video'})).rooms.some(r=>r.id===room),'watching presence keeps a room active without queue edits');
 await pg.exec('set role authenticated');try{await assert.rejects(pg.exec('select * from reparty_private.room_activity'),/permission/);checks++;}finally{await pg.exec('reset role');}
 // Seed enough directory entries to exercise pagination without the create rate limit.
 for(let i=0;i<55;i++)await pg.query("insert into public.reparty_rooms(id,owner_id,name,playlists) values($1,$2,$3,'[]')",[i.toString(16).padStart(12,'0'),a,'Room '+i]);
 await pg.exec(migration);const first=await lobby(c,'list',{mode:'video'}),second=await lobby(c,'list',{mode:'video',offset:50});
 ok(first.rooms.length===50&&first.has_more&&second.rooms.length===6&&!second.has_more&&new Set([...first.rooms,...second.rooms].map(r=>r.id)).size===56,'pagination makes every active room reachable');
 console.log(`${checks} lobby checks passed`);await pg.close();
}
test().catch(e=>{console.error(e);process.exitCode=1;});
