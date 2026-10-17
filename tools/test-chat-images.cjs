const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const nativeFetch=global.fetch,f=await createFixture(),{cleanupImages,RETENTION,TRANSFER_LIMIT}=await import('../lib/chat-images.mjs');
 // A minimal JPEG frame is enough to exercise server-side bounds independently
 // of the real browser encoder, covered by the companion client test.
 const jpeg=Buffer.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,217]);
 const auth=who=>who?{Authorization:'Bearer '+f.sessions[who].access_token}:{};
 const upload=(who,clientId=crypto.randomUUID(),scope='community',target='general',body=jpeg)=>nativeFetch(f.base+'/api/chat-images/upload?'+new URLSearchParams({clientId,scope,target}),{method:'POST',headers:{...auth(who),'Content-Type':'image/jpeg'},body});
 const get=(who,id)=>nativeFetch(f.base+'/api/chat-images/'+id,{headers:auth(who)});
 const request=async(who,area,route,body,status=200)=>{const r=await nativeFetch(f.base+'/api/'+area+'/'+route,{method:body?'POST':'GET',headers:{...auth(who),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const result=await r.json();assert.equal(r.status,status,JSON.stringify(result));return result;};
 try{
  assert.equal((await upload(null)).status,401);
  assert.equal((await upload('alice',crypto.randomUUID(),'dm','mallory')).status,403);
  assert.equal((await upload('alice',crypto.randomUUID(),'community','general',Buffer.alloc(1048577))).status,413);
  assert.equal((await upload('alice',crypto.randomUUID(),'community','general',Buffer.from('<svg/>'))).status,400);
  const oversized=Buffer.from(jpeg);oversized[9]=7;assert.equal((await upload('alice',crypto.randomUUID(),'community','general',oversized)).status,400);
  const clientId=crypto.randomUUID(),r=await upload('alice',clientId);assert.equal(r.status,200);const image=await r.json();
  assert.equal((await get('bob',image.id)).status,404,'unattached image is private');
  assert.equal((await (await upload('alice',clientId)).json()).id,image.id,'retry cannot duplicate storage');
  const text='A screenshot [[wibs-image:'+image.id+']]';
  await request('bob','community','messages',{channel:'general',text,clientId},409);
  await request('alice','community','messages',{channel:'general',text,clientId});
  assert.equal((await get('bob',image.id)).status,200);
  f.sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('bob','alice');assert.equal((await get('bob',image.id)).status,404);f.sql.prepare('DELETE FROM dashboard_blocks WHERE blocker=?').run('bob');
  const privateClient=crypto.randomUUID(),privateImage=await (await upload('alice',privateClient,'dm','bob')).json();
  await request('alice','social','messages',{username:'bob',clientId:privateClient,text:'[[wibs-image:'+privateImage.id+']]'});
  assert.equal((await get('bob',privateImage.id)).status,200);assert.equal((await get('mallory',privateImage.id)).status,404);
  f.sql.prepare("UPDATE dashboard_friendships SET status='pending'").run();assert.equal((await get('bob',privateImage.id)).status,404);f.sql.prepare("UPDATE dashboard_friendships SET status='accepted'").run();
  f.sql.prepare('UPDATE wibs_images SET expires_at=? WHERE id=?').run(Date.now()-1,image.id);assert.equal((await get('alice',image.id)).status,410);
  assert(f.imageObjects.has(image.id+'.jpg'));await cleanupImages(f.env.DASHBOARD_DB,f.env,f.config);assert(!f.imageObjects.has(image.id+'.jpg'),'cleanup removes actual storage bytes');
  const month=new Date().toISOString().slice(0,7);f.sql.prepare('UPDATE wibs_image_transfer SET bytes=? WHERE month=?').run(TRANSFER_LIMIT,month);assert.equal((await get('bob',privateImage.id)).status,429);
  f.sql.exec('DELETE FROM wibs_images;');
  const responses=await Promise.all(Array.from({length:31},()=>upload('mallory')));assert.equal(responses.filter(r=>r.status===200).length,30);assert.equal(responses.filter(r=>r.status===429).length,1,'concurrent uploads respect quota');
  // A stale upload is an orphan; the same storage removal path handles it.
  const orphan=f.sql.prepare('SELECT id FROM wibs_images LIMIT 1').get().id;f.sql.prepare('UPDATE wibs_images SET created_at=? WHERE id=?').run(Date.now()-3600001,orphan);await cleanupImages(f.env.DASHBOARD_DB,f.env,f.config);assert(!f.imageObjects.has(orphan+'.jpg'));
  console.log('PASS: private images, friendship/block checks, attachment ownership, upload retry, size/type/dimension limits, concurrent per-user quota, transfer ceiling, seven-day expiry and actual orphan/expired-file removal.');
 }finally{await f.close();}
 const broken=await createFixture({failStorageDelete:true});try{
  const id=crypto.randomUUID(),now=Date.now();broken.sql.prepare("INSERT INTO wibs_images(id,owner_id,owner_name,client_id,scope,target,bytes,width,height,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id,broken.sessions.alice.user.id,'alice',crypto.randomUUID(),'community','general',12,1,1,now-RETENTION,now-1);
  await assert.rejects(cleanupImages(broken.env.DASHBOARD_DB,broken.env,broken.config));assert.equal(broken.sql.prepare('SELECT deleted_at FROM wibs_images').get().deleted_at,null,'failed deletion must not release storage capacity');console.log('PASS: cleanup failure keeps reservations and retries safely.');
 }finally{await broken.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
