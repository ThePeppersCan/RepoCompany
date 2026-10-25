// Real PostgreSQL statements in an isolated, disposable local database.
const {PGlite}=require(process.env.FRAME_SQL_TEST_RUNTIME||'@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite(),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const {COMP_RUN_COSMETICS}=await import('../lib/comp-run-cosmetic-catalog.mjs');
 const finishes=COMP_RUN_COSMETICS.finishes.filter(f=>f.premium),runners=COMP_RUN_COSMETICS.runners.filter(r=>r.paid);
 try{
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
   CREATE TABLE auth.users(id uuid PRIMARY KEY);
   CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   CREATE TABLE public.characters(user_id uuid PRIMARY KEY,gp bigint,bank_items jsonb);
   INSERT INTO auth.users VALUES('${a}'),('${b}');
   INSERT INTO public.characters VALUES('${a}',100000,'{"existing_pack":3}'),('${b}',599,'{}');`);
  const migration=fs.readFileSync('supabase-comp-run-finishes.sql','utf8');await db.exec(migration);const expansion=fs.readFileSync('supabase/migrations/20261025185552_comp_run_monsters_and_animated_runners.sql','utf8');await db.exec(expansion);
  const auth=async id=>db.exec(`RESET ROLE;SET request.jwt.claim.sub='${id}';SET ROLE authenticated;`);
  await auth(a);assert.deepEqual((await db.query('SELECT * FROM public.get_my_comp_run_finishes()')).rows[0].owned,[]);
  let balance=100000;
  for(const finish of finishes){
   const row=(await db.query('SELECT * FROM public.buy_comp_run_finish($1)',[finish.id])).rows[0];balance-=finish.price;
   assert.equal(Number(row.new_gp),balance,finish.id+' server and shop prices disagree');assert.equal(row.already_owned,false);assert(row.owned.includes(finish.id));
  }
  assert.equal(finishes.length,30);assert.equal(balance,46000);
  assert.equal(runners.length,20);
  for(const runner of runners){const row=(await db.query('SELECT * FROM public.buy_comp_run_runner($1)',[runner.id])).rows[0];balance-=runner.price;assert.equal(Number(row.new_gp),balance);assert(row.owned.includes(runner.id));assert.equal(row.already_owned,false);}
  assert.equal(balance,12400);
  const repeatedRunner=(await db.query("SELECT * FROM public.buy_comp_run_runner('archfiend')")).rows[0];assert.equal(Number(repeatedRunner.new_gp),balance);assert.equal(repeatedRunner.already_owned,true);
  for(const id of ['rowan','cinder-saint','invalid',null])await assert.rejects(db.query('SELECT * FROM public.buy_comp_run_runner($1)',[id]),/valid runner/);
  await assert.rejects(db.query(`SELECT * FROM public.buy_comp_run_runner_for_user('${b}','archfiend')`),/permission denied/);
  await assert.rejects(db.query(`SELECT * FROM public.comp_run_cosmetics_for_user('${b}')`),/permission denied/);
  await assert.rejects(db.query('SELECT * FROM public.repo_comp_run_runner_ownership'),/permission denied/);
  await assert.rejects(db.query(`INSERT INTO public.repo_comp_run_runner_ownership(user_id,runner_id,price_paid) VALUES('${b}','archfiend',0)`),/permission denied/);
  const duplicates=await Promise.all(Array.from({length:12},()=>db.query("SELECT * FROM public.buy_comp_run_finish('jester')")));
  for(const value of duplicates){assert.equal(Number(value.rows[0].new_gp),balance);assert.equal(value.rows[0].already_owned,true);}
  for(const id of ['brushed','invalid',null])await assert.rejects(db.query('SELECT * FROM public.buy_comp_run_finish($1)',[id]),/valid knife finish/);
  await assert.rejects(db.query(`SELECT * FROM public.buy_comp_run_finish_for_user('${b}','jester')`),/permission denied/);
  await assert.rejects(db.query('SELECT * FROM public.repo_comp_run_finish_ownership'),/permission denied/);
  await assert.rejects(db.query(`INSERT INTO public.repo_comp_run_finish_ownership(user_id,finish_id,price_paid) VALUES('${b}','jester',0)`),/permission denied/);
  await auth(b);assert.deepEqual((await db.query('SELECT * FROM public.get_my_comp_run_finishes()')).rows[0].owned,[]);
  await assert.rejects(db.query("SELECT * FROM public.buy_comp_run_finish('argent')"),/600 Repoints/);
  assert.equal(Number((await db.query('SELECT * FROM public.get_my_comp_run_finishes()')).rows[0].new_gp),599);
  await assert.rejects(db.query("SELECT * FROM public.buy_comp_run_runner('blackstitch')"),/1200 Repoints/);assert.deepEqual((await db.query('SELECT * FROM public.get_my_comp_run_runners()')).rows[0].owned,[]);
  await auth('');await assert.rejects(db.query("SELECT * FROM public.buy_comp_run_runner('archfiend')"),/Sign in/);await assert.rejects(db.query("SELECT * FROM public.buy_comp_run_finish('argent')"),/Sign in/);
  await db.exec('RESET ROLE;SET ROLE anon');await assert.rejects(db.query('SELECT * FROM public.get_my_comp_run_finishes()'),/permission denied/);
  await db.exec('RESET ROLE');await db.exec(expansion);
  assert.equal(Number((await db.query('SELECT count(*) AS n FROM public.repo_comp_run_finish_ownership')).rows[0].n),30);
  const bank=(await db.query('SELECT gp,bank_items FROM public.characters WHERE user_id=$1',[a])).rows[0];assert.equal(Number(bank.gp),12400);assert.deepEqual(bank.bank_items,{existing_pack:3});
  const snapshot=(await db.query('SELECT * FROM public.comp_run_cosmetics_for_user($1)',[a])).rows[0];assert.equal(snapshot.owned.length,30);assert.equal(snapshot.runners.length,20);assert.equal(Number(snapshot.new_gp),12400);
  await db.exec(`UPDATE public.characters SET gp=3600 WHERE user_id='${b}';SET ROLE service_role;`);
  const outcomes=await Promise.allSettled([db.query("SELECT * FROM public.buy_comp_run_cosmetic_for_user($1,'knife','mawbound')",[b]),db.query("SELECT * FROM public.buy_comp_run_cosmetic_for_user($1,'runner','archfiend')",[b])]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);const remaining=(await db.query('SELECT * FROM public.comp_run_cosmetics_for_user($1)',[b])).rows[0];assert(Number(remaining.new_gp)>=0);assert.equal(remaining.owned.length+remaining.runners.length,1);
  console.log('PASS: all 50 fixed prices, shared-wallet purchase serialization, duplicate purchases, account isolation, insufficient funds, role restrictions, preserved inventory, repeatable migration.');
 }finally{await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
