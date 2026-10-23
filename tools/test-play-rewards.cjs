const fs=require('node:fs'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
 const {rewardHeartbeat,reconcilePlayRewards}=await import('../lib/play-rewards.mjs');
 const sql=new DatabaseSync(':memory:'),pg=new PGlite();
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const prepare=(query,args=[])=>({bind(...v){return prepare(query,v);},async first(){return sql.prepare(query).get(...args)||null;},async all(){return {results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}});
 const db={prepare,async batch(items){sql.exec('BEGIN');try{for(const s of items)await s.run();sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 try{
  for(const f of ['dashboard-playtime-schema.sql','dashboard-play-rewards-schema.sql','dashboard-comp-run-schema.sql'])sql.exec(fs.readFileSync(f,'utf8'));
  sql.exec("UPDATE dashboard_reward_config SET value=0;CREATE TABLE morogue_results(run_id TEXT,user_id TEXT,mode TEXT,outcome TEXT,majors INTEGER,finales INTEGER,wave_ms INTEGER,finished_at INTEGER)");
  await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE TABLE public.characters(user_id uuid UNIQUE,gp bigint NOT NULL);GRANT SELECT,UPDATE ON public.characters TO service_role;INSERT INTO public.characters VALUES('${a}',1000),('${b}',1000);`);
  const migration=fs.readFileSync('supabase/migrations/20261023102449_verified_play_rewards.sql','utf8');await pg.exec(migration);
  let now=1800000000000,seq=0,session='a',game='comp-run';
  const tick=async(action='tick',rewardActive=true,advance=30000)=>{
   now+=advance;const v={me:'alice',userId:a,session,game,sequence:seq++,action,active:action!=='stop',rewardActive,now};
   const items=rewardHeartbeat(db,v);
   items.push(action==='start'?prepare('INSERT INTO dashboard_play_sessions VALUES(?,?,?,?,?,?) ON CONFLICT(username) DO UPDATE SET session_id=excluded.session_id,game=excluded.game,last_tick=excluded.last_tick,sequence=excluded.sequence,active=excluded.active').bind('alice',session,game,now,v.sequence,1):prepare('UPDATE dashboard_play_sessions SET last_tick=?,sequence=?,active=? WHERE username=? AND session_id=? AND sequence<?').bind(now,v.sequence,action==='stop'?0:1,'alice',session,v.sequence));
   await db.batch(items);return v;
  };
  let calls=0;global.fetch=async(url,options)=>{
   assert.equal(options.headers.apikey,'sb_secret_test');assert(!options.headers.Authorization);calls++;
   const {p_user_id,p_earned_total}=JSON.parse(options.body);await pg.exec('SET ROLE service_role');
   const result=await pg.query('SELECT * FROM public.credit_verified_play_rewards($1,$2)',[p_user_id,p_earned_total]);await pg.exec('RESET ROLE');return Response.json(result.rows);
  };
  const env={DASHBOARD_DB:db,MOROGUE_DB:db,ACCOUNT_ADMIN_KEY:'sb_secret_test'},config={url:'https://auth.test'};
  const claim=()=>reconcilePlayRewards(env,config,a,'alice',now);
  await tick('start');await tick();await tick();assert.equal((await claim()).awarded,20);
  assert.equal((await claim()).awarded,0,'Duplicate settlement pays once');
  const replay=await tick();const minutes=sql.prepare('SELECT SUM(active_ms) n FROM dashboard_reward_days').get().n;
  await db.batch(rewardHeartbeat(db,replay));assert.equal(sql.prepare('SELECT SUM(active_ms) n FROM dashboard_reward_days').get().n,minutes);
  await tick('tick',false);const paused=sql.prepare('SELECT SUM(active_ms) n FROM dashboard_reward_days').get().n;
  await tick('tick',false);await tick('tick',true,90000);assert.equal(sql.prepare('SELECT SUM(active_ms) n FROM dashboard_reward_days').get().n,paused,'Menus and offline gaps excluded');
  await tick();session='b';seq=0;game='morogue';await tick('start');await tick();
  await db.batch(rewardHeartbeat(db,{...replay,now:now+10000,sequence:100}));assert.equal(sql.prepare('SELECT session_id FROM dashboard_reward_sessions').get().session_id,'b','Old game cannot take lease back');
  let result=await claim();assert.equal(result.earned,60,'Fractions carry across games and sessions');
  const day=Math.floor(now/86400000);
  sql.prepare('INSERT INTO comp_run_sessions VALUES(?,?,?,?,?,?,?,?,?,?)').run('clear','alice','uncrowned','normal','test','2.7.0',now-600000,now+999999,600000,now);
  sql.prepare('INSERT INTO comp_run_sessions VALUES(?,?,?,?,?,?,?,?,?,?)').run('clear-again','alice','uncrowned','normal','test','2.7.0',now-600000,now+999999,600000,now);
  sql.prepare('INSERT INTO morogue_results VALUES(?,?,?,?,?,?,?,?)').run('mora-win',a,'mora','won',12,1,3600000,now);
  sql.prepare('INSERT INTO morogue_results VALUES(?,?,?,?,?,?,?,?)').run('mora-fake',a,'mora','won',1,0,3600000,now);
  result=await claim();assert.equal(result.earned,410,'One daily map bonus plus a complete verified Mora win');assert.equal((await claim()).awarded,0);
  sql.prepare('UPDATE dashboard_reward_days SET active_ms=21600000 WHERE user_id=? AND day=?').run(a,day);await tick();result=await claim();assert.equal(result.earned,7550,'Six-hour shared daily play cap');
  for(let i=0;i<9;i++)sql.prepare('INSERT INTO morogue_results VALUES(?,?,?,?,?,?,?,?)').run('mora-more-'+i,a,'mora','won',12,1,3600000,now);
  assert.equal((await claim()).earned,8400,'Shared completion allowance');
  await pg.exec('SET ROLE authenticated');await assert.rejects(pg.query('SELECT * FROM public.credit_verified_play_rewards($1,999999)',[a]),/permission denied/);await assert.rejects(pg.query('SELECT * FROM game_reward_private.wallet_credits'),/permission denied/);
  await pg.exec('RESET ROLE;SET ROLE anon');await assert.rejects(pg.query('SELECT * FROM public.credit_verified_play_rewards($1,999999)',[a]),/permission denied/);
  await pg.exec('RESET ROLE;SET ROLE service_role');result=(await pg.query('SELECT * FROM public.credit_verified_play_rewards($1,20)',[a])).rows[0];assert.equal(Number(result.awarded),0,'Delayed lower total never re-awards');
  await pg.exec('RESET ROLE');assert.equal(Number((await pg.query('SELECT gp FROM public.characters WHERE user_id=$1',[b])).rows[0].gp),1000,'Other accounts untouched');
  await pg.exec(migration);assert.equal(Number((await pg.query('SELECT credited_total FROM game_reward_private.wallet_credits WHERE user_id=$1',[a])).rows[0].credited_total),8400);
  console.log('PASS: active time, pauses, gaps, cross-game fractions, duplicates, stale sessions, verified completions, caps, atomic wallet watermark, role denial and repeatable migration.');
 }finally{sql.close();await pg.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
