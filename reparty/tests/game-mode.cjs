const fs=require('fs');const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const path=require('path');
const root=path.resolve(__dirname,'..');
const upgrade=path.join(root,'supabase/migrations',fs.readdirSync(path.join(root,'supabase/migrations')).find(f=>f.endsWith('_reparty_game_mode.sql')));
async function init(){
 const pg=new PGlite();
 await pg.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb); create table public.characters(user_id uuid,username text); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; create publication supabase_realtime;`);
 await pg.exec(fs.readFileSync(root+'/migration.sql','utf8'));
 await pg.exec(fs.readFileSync(upgrade,'utf8'));
 return pg;
}
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002',c='00000000-0000-0000-0000-000000000003';
async function seed(pg){await pg.exec(`insert into auth.users values ('${a}','{"username":"Isaac"}'),('${b}','{"username":"Rory"}'),('${c}','{"username":"Outsider"}');`);}
async function call(pg,user,fn,action,room,data={}){
 await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await pg.exec('set role authenticated');
 try{return (await pg.query(`select public.${fn}($1,$2,$3::jsonb) result`,[action,room,JSON.stringify(data)])).rows[0].result;}finally{await pg.exec('reset role');}
}
async function test(){
 const pg=await init();await seed(pg);let checks=0;
 const ok=(condition,label)=>{assert.ok(condition,label);console.log('PASS '+label);checks++;};
 const action=(user,name,room,data)=>call(pg,user,'reparty_action',name,room,data);
 const game=(user,name,room,data)=>call(pg,user,'reparty_game_action',name,room,data);
 const room=(await action(a,'create',null,{name:'Game QA'})).id;
 await action(b,'join',room);
 await pg.exec(`update public.reparty_rooms set playback='{"video_id":"abcdefghijk","item_id":"v1","playing":true,"position":42,"updated_at":"${new Date().toISOString()}"}' where id='${room}';`);
 const before=(await action(a,'snapshot',room)).room;
 let s=await game(a,'enter',room,{revision:0});ok(s.room.settings.game.mode==='game'&&s.room.playback.playing,'enter keeps video playing');
 await assert.rejects(game(c,'enter',room,{revision:0}),/Join this room/);checks++;
 await assert.rejects(game(b,'exit',room,{revision:1}),/host/);checks++;
 await action(a,'playback',room,{item_id:'v1',playing:true,position:42});checks++;
 await assert.rejects(game(a,'start',room,{revision:1,players:[{name:'A',avatar_id:0}],packs:['Base Pack'],turns:3,seconds:30}),/2 and 24/);checks++;
 const players=[{name:'Isaac',avatar_id:0},{name:'Rory',avatar_id:2}];
 s=await game(a,'start',room,{revision:1,players,packs:['Base Pack','Occult Pack','IRL Pack','Digital Pack'],turns:3,seconds:30});
 let g=s.room.settings.game;ok(g.round===1&&g.current.text&&!/%[A-Z0-9_]+%/.test(g.current.text),'draw resolves placeholders');
 ok(g.deck.length===388&&new Set(g.deck.map(c=>c.id)).size===388,'all eligible cards shuffled without duplicates');
 const stale=await game(a,'next',room,{revision:1});ok(stale.game_stale&&stale.room.settings.game.round===1,'stale Next does not double-advance');
 const joined=await action(b,'snapshot',room);ok(JSON.stringify(joined.room.settings.game.current)===JSON.stringify(g.current),'second player sees same card');
 await assert.rejects(game(b,'next',room,{revision:g.revision}),/host/);checks++;
 const catalog=(await import(require('node:url').pathToFileURL(path.join(root,'game-cards.mjs')).href)).cards;const timed=catalog.find(c=>c.text.includes('%TIME_LIMIT%'));const rule=catalog.find(c=>c.text.includes('%TURNS%'));
 // Controlled deck exercises timer, expiry and skip semantics against the actual SQL engine.
 g={...g,deck:[rule,timed,...catalog.filter(c=>c.minPlayers===2).slice(0,6)],round:0,current:null,rules:[],history:[]};
 await pg.query("update public.reparty_rooms set settings=jsonb_set(settings,'{game}',$1::jsonb) where id=$2",[JSON.stringify(g),room]);
 s=await game(a,'next',room,{revision:g.revision});g=s.room.settings.game;ok(g.rules.length===1&&g.rules[0].expires===4,'duration card stored on table');
 s=await game(a,'next',room,{revision:g.revision});g=s.room.settings.game;ok(g.current.timed&&g.rules.length===1,'active rule persists into next turn');
 s=await game(a,'timer',room,{revision:g.revision});g=s.room.settings.game;ok(Date.parse(g.timer_end)>Date.now(),'timer uses server deadline');
 s=await game(a,'pin',room,{revision:g.revision});g=s.room.settings.game;ok(g.rules.some(r=>r.expires===null),'save card persists until cleared');
 s=await game(a,'next',room,{revision:g.revision});g=s.room.settings.game;
 s=await game(a,'next',room,{revision:g.revision});g=s.room.settings.game;ok(!g.rules.some(r=>r.instance==='1'),'rule expires after selected turns');
 const exiting=await game(a,'exit',room,{revision:g.revision});ok(exiting.room.settings.game.mode==='watch'&&JSON.stringify(exiting.room.playlists)===JSON.stringify(before.playlists)&&exiting.room.playback.position>=42,'exit preserves playlist and video position');
 s=await game(b,'enter',room,{revision:exiting.room.settings.game.revision});g=s.room.settings.game;ok(g.host===b&&g.round===4,'resume keeps game and transfers host to starter');
 await pg.exec(`update public.reparty_members set last_seen=now()-interval '2 minutes' where room_id='${room}' and user_id='${b}';`);
 s=await game(a,'takeover',room,{revision:g.revision});g=s.room.settings.game;ok(g.host===a,'host recovery after disconnect');
 s=await game(a,'reset',room,{revision:g.revision});ok(!s.room.settings.game.deck,'new game returns to setup');
 await pg.exec(fs.readFileSync(upgrade,'utf8'));ok((await action(a,'snapshot',room)).room.id===room,'migration reruns without losing room');
 await assert.rejects(call(pg,null,'reparty_game_action','enter',room,{revision:0}),/Sign in/);checks++;
 console.log(`${checks} checks passed`);await pg.close();
}
module.exports={init,seed,call,a,b,c};if(require.main===module)test().catch(e=>{console.error(e);process.exitCode=1;});
