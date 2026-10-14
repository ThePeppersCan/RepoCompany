// Run with @electric-sql/pglite available through NODE_PATH, or point
// FRAME_SQL_TEST_RUNTIME at its installed package. Uses an isolated database.
const {PGlite}=require(process.env.FRAME_SQL_TEST_RUNTIME||'@electric-sql/pglite');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try{
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE TABLE public.characters(user_id uuid PRIMARY KEY,gp integer,bank_items jsonb);
 INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
 INSERT INTO public.characters VALUES('11111111-1111-4111-8111-111111111111',12000,'{"quidditch_tcg_pack":2}'),('22222222-2222-4222-8222-222222222222',900,'{}');`);
 await db.exec(fs.readFileSync('supabase-avatar-frames.sql','utf8'));
 const auth=async id=>db.exec(`SET request.jwt.claim.sub='${id}'; SET ROLE authenticated;`);
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 await auth(a);assert.deepEqual((await db.query('SELECT * FROM public.get_my_avatar_frames()')).rows[0].owned,[]);
 let r=(await db.query("SELECT * FROM public.buy_avatar_frame('ember-crown')")).rows[0];assert.equal(r.new_gp,10200);assert.equal(r.already_owned,false);
 await Promise.all(Array.from({length:8},()=>db.query("SELECT * FROM public.buy_avatar_frame('ember-crown')")));
 r=(await db.query("SELECT * FROM public.buy_avatar_frame('ember-crown')")).rows[0];assert.equal(r.new_gp,10200);assert.equal(r.already_owned,true);assert.deepEqual(r.owned,['ember-crown']);
 await assert.rejects(db.query("SELECT * FROM public.buy_avatar_frame('fake')"),/valid frame/);
 await assert.rejects(db.query('SELECT * FROM public.buy_avatar_frame(NULL)'),/valid frame/);
 await assert.rejects(db.query('SELECT * FROM public.repo_avatar_frame_ownership'),/permission denied/);
 await assert.rejects(db.query(`INSERT INTO public.repo_avatar_frame_ownership(user_id,frame_id,price_paid) VALUES('${a}','deepwater',0)`),/permission denied/);
 await auth(b);assert.deepEqual((await db.query('SELECT * FROM public.get_my_avatar_frames()')).rows[0].owned,[]);
 await assert.rejects(db.query("SELECT * FROM public.buy_avatar_frame('blossom-drift')"),/1000 Repoints/);
 await db.exec('RESET ROLE');let bank=(await db.query(`SELECT gp,bank_items FROM public.characters WHERE user_id='${b}'`)).rows[0];assert.equal(bank.gp,900);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.repo_avatar_frame_ownership')).rows[0].n,1);
 bank=(await db.query(`SELECT gp,bank_items FROM public.characters WHERE user_id='${a}'`)).rows[0];assert.equal(bank.gp,10200);assert.deepEqual(bank.bank_items,{quidditch_tcg_pack:2});
 await db.exec('SET ROLE anon');await assert.rejects(db.query('SELECT * FROM public.get_my_avatar_frames()'),/permission denied/);await assert.rejects(db.query("SELECT * FROM public.buy_avatar_frame('deepwater')"),/permission denied/);
 await auth('');await assert.rejects(db.query("SELECT * FROM public.buy_avatar_frame('deepwater')"),/Sign in/);
 await db.exec('RESET ROLE');await db.exec(fs.readFileSync('supabase-avatar-frames.sql','utf8'));
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.repo_avatar_frame_ownership')).rows[0].n,1,'Rerunning migration preserves purchases');
 console.log('PASS: actual PostgreSQL purchase transaction, fixed prices, duplicate requests, insufficient funds, account isolation, protected ownership, anonymous denial and repeatable migration.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
