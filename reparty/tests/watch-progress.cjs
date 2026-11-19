const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {init, seed, call, a, b, c} = require('./game-mode.cjs');

async function test() {
  const {watchLevel, levelHue} = await import('../watch-levels.mjs');
  for (const level of [1, 2, 10, 25, 50, 99, 100, 101, 1000, 10000]) {
    const threshold = (level - 1) ** 2 * 600000;
    assert.deepEqual(watchLevel(threshold), {level,fraction:0});
    if (level > 1) assert.equal(watchLevel(threshold - 1).level, level - 1);
    assert.ok(Number.isFinite(levelHue(level)));
  }
  const pg = await init();
  try {
    await seed(pg);
    const sql = fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261119014538_reparty_watch_progress.sql'),'utf8');
    await pg.exec(sql);
    const room = (await call(pg,a,'reparty_action','create',null,{name:'Watch QA'})).id;
    await call(pg,b,'reparty_action','join',room);
    await pg.query("update public.reparty_rooms set playback=jsonb_build_object('item_id','track','video_id','abcdefghijk','playing',true,'updated_at',now()-interval '2 hours') where id=$1",[room]);
    let sequence = 0;
    async function pulse(user, viewer, item='track', active=true, ms=15000, seq=++sequence) {
      await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);
      await pg.exec('set role authenticated');
      try {
        return (await pg.query('select * from public.reparty_watch_tick($1,$2,$3,$4,$5,$6)',[room,viewer,item,active,ms,seq])).rows;
      } finally { await pg.exec('reset role'); }
    }
    const age = seconds => pg.query("update public.reparty_watch_progress set sampled_at=clock_timestamp()-make_interval(secs=>$2) where user_id=$1",[a,seconds]);
    const mine = rows => Number(rows.find(row=>row.member_id===a).watched_ms);
    assert.equal(mine(await pulse(a,a)),0);
    await age(20);
    assert.equal(mine(await pulse(a,b)),0,'second tab cannot claim the first tab’s lease');
    assert.equal(mine(await pulse(a,a)),15000);
    await age(5);
    assert.equal(mine(await pulse(a,a,'track',true,15000,sequence)),15000,'duplicate pulse is idempotent');
    assert.equal(mine(await pulse(b,b,null,false)),15000,'other room members see the level');
    await age(60);
    assert.equal(mine(await pulse(a,b)),15000,'reconnect never credits offline time');
    await age(20);
    assert.equal(mine(await pulse(a,b,'track',false,4000)),19000,'local pause settles only measured playback');
    await age(8);
    assert.equal(mine(await pulse(a,b)),19000,'resume starts a new interval');
    await age(8);
    assert.equal(mine(await pulse(a,b,'wrong')),19000,'wrong track never earns credit');
    await pg.query("update public.reparty_rooms set playback=jsonb_set(playback,'{playing}','false') where id=$1",[room]);
    assert.equal(mine(await pulse(a,b)),19000,'shared pause earns no credit');
    await assert.rejects(pulse(c,c),/Join the room first/);
    await pg.exec('set role anon');
    await assert.rejects(pg.query('select * from public.reparty_watch_tick($1,$2,null,false,0,1)',[room,a]),/permission denied/);
    await pg.exec('reset role; set role authenticated');
    await assert.rejects(pg.query('select * from public.reparty_watch_progress'),/permission denied/);
    console.log('PASS progression boundaries, roster visibility, membership, leases, pause, reconnect and access control');
  } finally { await pg.close(); }
}
test().catch(error => {console.error(error);process.exitCode=1;});
