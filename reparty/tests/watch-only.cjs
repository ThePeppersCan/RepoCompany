const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs'),{call,a,b,c}=require('./game-mode.cjs');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261016010000_reparty_watch_only.sql'),'utf8');
async function prepare(){const pg=await setup();await pg.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260927040000_reparty_lobby.sql'),'utf8'));return pg;}
async function test(){const pg=await prepare();try{const lobby=(u,n,d)=>call(pg,u,'reparty_lobby_action',n,null,d),action=(u,n,r,d)=>call(pg,u,'reparty_action',n,r,d);
 const game=(await lobby(a,'create',{mode:'game',name:'Existing party'})).id;const before=(await action(a,'snapshot',game)).room;await action(a,'chat',game,{body:'Keep this conversation'});
 await pg.exec(migration);await pg.exec(migration);const after=await action(a,'snapshot',game);assert.deepEqual(after.room.playlists,before.playlists);assert.deepEqual(after.room.playback,before.playback);assert(!after.room.settings.game&&!after.room.settings.soundtrack);assert.equal(after.messages[0].body,'Keep this conversation');
 assert((await lobby(b,'list',{mode:'video'})).rooms.some(r=>r.id===game));for(const mode of ['game','soundtrack'])await assert.rejects(lobby(a,'create',{mode}),/watching and listening/);
 await assert.rejects(call(pg,a,'reparty_game_action','enter',game),/permission denied/);await assert.rejects(call(pg,a,'reparty_soundtrack_action','enter',game),/permission denied/);await assert.rejects(lobby(null,'list',{}),/sign in/);await assert.rejects(action(c,'snapshot',game),/Join this room/);
 const room=(await lobby(b,'create',{name:'Music room'})).id;await action(a,'join',room);await action(b,'chat',room,{body:'We are here'});assert((await action(a,'snapshot',room)).messages.some(m=>m.body==='We are here'));
 console.log('PASS: watch-only migration retains rooms/playlists/chat/playback; old game RPCs and creation denied; discovery, membership and new rooms work; rerunnable.');
 }finally{await pg.close();}}
module.exports={prepare,migration};if(require.main===module)test().catch(e=>{console.error(e);process.exitCode=1;});
