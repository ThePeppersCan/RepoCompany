const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {setup}=require('./soundtrack.cjs'),{call,a}=require('./game-mode.cjs');
const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260927070000_reparty_guests.sql'),'utf8');
async function test(){
 const pg=await setup(),g='00000000-0000-0000-0000-000000000004',m='00000000-0000-0000-0000-000000000005';
 await pg.exec(fs.readFileSync(path.join(__dirname,'../supabase/migrations/20260927040000_reparty_lobby.sql'),'utf8'));
 await pg.exec('alter table auth.users add column is_anonymous boolean default false');
 await pg.exec(migration);
 await pg.exec('create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user()');
 await pg.query("insert into auth.users values($1,'{\"reparty_name\":\"Forest Friend\"}',true)",[g]);
 assert.equal((await pg.query('select * from characters where user_id=$1',[g])).rows.length,0);
 await assert.rejects(pg.query("insert into auth.users values($1,'{}',false)",[m]),/Invalid username/);
 await pg.query("insert into auth.users values($1,'{\"username\":\"NewMember\"}',false)",[m]);
 assert.equal((await pg.query('select username from characters where user_id=$1',[m])).rows[0].username,'NewMember');
 const action=(u,n,r,d)=>call(pg,u,'reparty_action',n,r,d),lobby=(u,n,d)=>call(pg,u,'reparty_lobby_action',n,null,d);
 const room=(await lobby(g,'create',{mode:'video',name:'Guest room'})).id;
 let snap=await action(g,'snapshot',room);assert.equal(snap.members.find(x=>x.user_id===g).name,'Forest Friend (Guest)');
 assert.ok((await lobby(m,'list',{mode:'video'})).rooms.some(r=>r.id===room));
 await action(a,'join',room);
 await action(g,'avatar',null,{avatar_id:3});
 assert.equal((await action(g,'profile')).avatar_id,3);
 await pg.query("insert into reparty_private.soundtracks values('guest-test','game','Witcher','Theme','Composer',2015,1,'[\"witcher\"]','abcdefghijk',0)");
 let state;const quiz=async(u,n,d={})=>{const s=await call(pg,u,'reparty_soundtrack_action',n,room,{revision:state?.revision,token:state?.token,...d});state=s.room.settings.soundtrack;return s;};
 await quiz(a,'enter');
 await quiz(a,'start',{mode:'chill',category:'game',seconds:15,rounds:10,difficulty:2,players:[{id:a,team:'1'},{id:g,team:'1'}]});
 await quiz(a,'ready');await quiz(g,'ready');
 await pg.query("update reparty_private.soundtrack_sessions set state=jsonb_set(state,'{deadline}',to_jsonb((clock_timestamp()-interval '1 second')::text)) where room_id=$1",[room]);
 await quiz(a,'tick');assert.equal(state.phase,'guess');
 assert.equal((await quiz(g,'guess',{answer:'witcher'})).quiz_feedback,'correct');
 await quiz(g,'pause');assert.equal(state.paused,true);await quiz(g,'resume');assert.equal(state.paused,false);
 await assert.rejects(quiz(g,'reset'),/host/);
 await assert.rejects(lobby(null,'list',{mode:'video'}),/sign in/i);
 await pg.exec('set role authenticated');try{await assert.rejects(pg.exec('select * from reparty_private.soundtracks'),/permission/);await assert.rejects(pg.query('select reparty_private.display_name($1)',[a]),/permission/);}finally{await pg.exec('reset role');}
 await pg.exec(migration);assert.ok((await action(g,'snapshot',room)).room);
 console.log('Guest creation, names, account signup, rooms, avatar, guessing, pause, host permissions and private data checks passed');await pg.close();
}
test().catch(e=>{console.error(e);process.exitCode=1;});

