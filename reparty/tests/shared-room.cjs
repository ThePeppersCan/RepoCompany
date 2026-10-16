'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {prepare,migration}=require('./watch-only.cjs'),{call,a,b}=require('./game-mode.cjs');
const sharedMigration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261016020000_reparty_shared_room.sql'),'utf8');
(async()=>{const pg=await prepare();try{
 await pg.exec(migration);const lobby=(u,n,d={})=>call(pg,u,'reparty_lobby_action',n,null,d);
 const id=(await lobby(a,'create',{name:'Existing shared room'})).id;
 const before=(await pg.query('select * from public.reparty_rooms where id=$1',[id])).rows[0];
 await pg.exec(sharedMigration);await assert.rejects(lobby(a,'default'),/not configured/);
 await pg.query('insert into reparty_private.site_room values(true,$1)',[id]);await pg.exec(sharedMigration);
 assert.equal((await lobby(a,'default')).id,id);assert.equal((await lobby(b,'default')).id,id);
 assert.deepEqual((await pg.query('select * from public.reparty_rooms where id=$1',[id])).rows[0],before);
 const extra=(await lobby(b,'create',{name:'Second room'})).id;assert.notEqual(extra,id);assert.equal((await lobby(b,'default')).id,id);
 await pg.query("update reparty_private.room_activity set last_used=now()-interval '30 days' where room_id=$1",[id]);
 const rooms=(await lobby(b,'list')).rooms;assert.equal(rooms[0].id,id);assert.equal(rooms[0].is_default,true);assert(rooms.some(r=>r.id===extra));
 await assert.rejects(lobby(null,'default'),/sign in/);await assert.rejects(lobby(a,'set_default',{id:extra}),/Unknown lobby action/);
 await pg.exec('set role authenticated');try{await assert.rejects(pg.query('update reparty_private.site_room set room_id=$1',[extra]),/permission denied/);}finally{await pg.exec('reset role');}
 console.log('PASS: everyone receives the same configured room; new rooms cannot replace it; shared room remains listed when inactive; authenticated discovery; configuration protected; migration preserves all existing content and is rerunnable.');
}finally{await pg.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
