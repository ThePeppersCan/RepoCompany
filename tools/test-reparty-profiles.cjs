'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
const fetchNetwork=global.fetch;
(async()=>{const f=await createFixture();try{
 const {alice,bob,mallory}=f.sessions,ids=[alice,bob,mallory].map(s=>s.user.id).join(',');
 for(const who of ['alice','bob','mallory'])f.sql.prepare('INSERT INTO dashboard_avatars(username,config,updated_at) VALUES(?,?,?)').run(who,JSON.stringify({version:2,body:'body-female',skin:'#e0b69c'}),Date.now());
 const get=(session,query=ids,extra={})=>fetchNetwork(f.base+'/api/reparty-profiles?ids='+query,{headers:{...(session?{Authorization:'Bearer '+session.access_token}:{}),...extra}});
 assert.equal((await get(null)).status,401);assert.equal((await get(alice,'alice')).status,400);assert.equal((await get(alice,ids,{Origin:'https://evil.test'})).status,403);
 let data=await(await get(alice)).json();assert.equal(data.profiles.length,3);assert.equal(typeof data.profiles[0].avatar,'object');assert(!JSON.stringify(data).includes('email'));
 f.sql.prepare('INSERT INTO dashboard_profile_privacy(username,private_profile) VALUES(?,?)').run('bob',1);
 assert((await(await get(alice)).json()).profiles.some(p=>p.user_id===bob.user.id),'accepted friend sees avatar');
 assert(!(await(await get(mallory)).json()).profiles.some(p=>p.user_id===bob.user.id),'private avatar hidden from unrelated account');
 assert((await(await get(bob)).json()).profiles.some(p=>p.user_id===bob.user.id),'owner sees own avatar');
 f.sql.prepare('INSERT INTO dashboard_blocks(blocker,blocked) VALUES(?,?)').run('alice','bob');
 assert(!(await(await get(alice)).json()).profiles.some(p=>p.user_id===bob.user.id),'blocked avatar hidden');
 const unknown='44444444-4444-4444-8444-444444444444';assert.deepEqual((await(await get(alice,unknown)).json()).profiles,[],'name is never used to impersonate account identity');
 console.log('PASS Reparty UUID avatar lookup, authenticated requests, portrait decoding, privacy, friendship, owner and block rules.');
}finally{await f.close();}})().catch(e=>{console.error(e);process.exitCode=1});
