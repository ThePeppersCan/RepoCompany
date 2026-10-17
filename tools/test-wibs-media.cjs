const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
// Two real 1px frames: red then blue, looping forever.
const gif=Buffer.from('47494638396101000100800000ff00000000ff21ff0b4e45545343415045322e30030100000021f904000a0000002c000000000100010000020244010021f904000a0000002c00000000010001000002024c01003b','hex');
module.exports={gif};
async function main(){const nativeFetch=global.fetch,f=await createFixture(),{gifDimensions,cleanupImages,TRANSFER_LIMIT}=await import('../lib/chat-images.mjs');
 const jpeg=Buffer.from([255,216,255,192,0,11,8,0,1,0,1,1,1,17,0,255,217]);
 const request=async(who,route,body,status=200)=>{const r=await nativeFetch(f.base+(route.startsWith('profile-photo')?'/api/profile-picture'+route.slice('profile-photo'.length):'/api/community/'+route),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+f.sessions[who].access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert.equal(r.status,status,await r.clone().text());return r;};
 const upload=(body,clientId=crypto.randomUUID())=>nativeFetch(f.base+'/api/chat-images/upload?'+new URLSearchParams({clientId,scope:'community',target:'general'}),{method:'POST',headers:{Authorization:'Bearer '+f.sessions.alice.access_token,'Content-Type':'image/gif'},body});
 try{
  assert.equal(gifDimensions(gif).frames,2);assert.throws(()=>gifDimensions(gif.subarray(0,-1)));
  const oversize=Buffer.from(gif);oversize[6]=255;oversize[7]=255;assert.equal((await upload(oversize)).status,400);
  const frame=gif.subarray(38,-1);assert.throws(()=>gifDimensions(Buffer.concat([gif.subarray(0,38),...Array(151).fill(frame),Buffer.from([59])])));
  const clientId=crypto.randomUUID(),r=await upload(gif,clientId);assert.equal(r.status,200);const {id}=await r.json();
  await request('alice','messages',{channel:'general',clientId,text:'[[wibs-image:'+id+']]'});
  const viewed=await nativeFetch(f.base+'/api/chat-images/'+id,{headers:{Authorization:'Bearer '+f.sessions.bob.access_token}});assert.equal(viewed.headers.get('Content-Type'),'image/gif');assert.deepEqual(Buffer.from(await viewed.arrayBuffer()),gif,'animation bytes survive upload and download');
  f.sql.prepare('UPDATE wibs_images SET expires_at=? WHERE id=?').run(Date.now()-1,id);await cleanupImages(f.env.DASHBOARD_DB,f.env,f.config);assert(!f.imageObjects.has(id+'.gif'),'animated objects expire too');
  await request('alice','state');await request('bob','state');await request('mallory','state');
  await request('alice','profile-photo',{data:'<svg/>'},400);
  const tooWide=Buffer.from(jpeg);tooWide[9]=1;tooWide[10]=1;await request('alice','profile-photo',{data:tooWide.toString('base64')},400);
  const first=await (await request('alice','profile-photo',{data:jpeg.toString('base64')})).json();assert(first.photo_version);
  const profile=await (await request('bob','profile?username=alice')).json();assert.equal(profile.photo_version,first.photo_version);
  const state=await (await request('bob','state')).json();assert.equal(state.members.find(p=>p.username==='alice').photo_version,first.photo_version);assert(!JSON.stringify(state).includes(jpeg.toString('base64')),'no photo bytes in repeatedly polled roster');
  assert.equal((await request('bob','profile-photo?username=alice')).headers.get('Content-Type'),'image/jpeg');
  f.sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('bob','alice');await request('bob','profile-photo?username=alice',null,404);f.sql.prepare('DELETE FROM dashboard_blocks').run();
  f.sql.prepare('INSERT INTO dashboard_profile_privacy(username,private_profile) VALUES(?,1)').run('alice');await request('mallory','profile-photo?username=alice',null,403);await request('bob','profile-photo?username=alice');
  const privateState=await (await request('mallory','state')).json();assert.equal(privateState.members.find(p=>p.username==='alice').photo_version,null);
  await request('alice','profile-photo',{mode:'avatar'});await request('bob','profile-photo?username=alice',null,404);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM dashboard_profile_photos').get().n,1,'switching to avatar retains the upload');await request('alice','profile-photo',{mode:'photo'});await request('bob','profile-photo?username=alice');
  await request('alice','profile-photo',{data:jpeg.toString('base64'),username:'bob'});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM dashboard_profile_photos').get().n,1,'replacement is restricted to the authenticated account');
  await request('alice','profile-photo?username=alice&v='+first.photo_version,null,404);
  for(let i=0;i<3;i++)await request('alice','profile-photo',{data:jpeg.toString('base64')});await request('alice','profile-photo',{data:jpeg.toString('base64')},429);
  const month=new Date().toISOString().slice(0,7);f.sql.prepare('UPDATE wibs_image_transfer SET bytes=? WHERE month=?').run(TRANSFER_LIMIT,month);await request('bob','profile-photo?username=alice',null,429);
  f.sql.prepare("DELETE FROM social_rate_limits WHERE scope='profile-picture-write'").run();
  await request('alice','profile-photo',{data:null});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM dashboard_profile_photos').get().n,0,'removal works even after upload allowance is exhausted');
  // Force the small global storage budget to its limit with synthetic accounts.
  const insert=f.sql.prepare('INSERT INTO dashboard_profile_photos(user_id,data,bytes,version) VALUES(?,?,?,?)');for(let i=0;i<256;i++)insert.run('fixture-'+i,'AAAA',65536,'v');
  await request('bob','profile-photo',{data:jpeg.toString('base64')},429);
  console.log('PASS: animated GIF bytes and cleanup; malformed/oversized GIF rejection; profile ownership, privacy, replacement, removal, daily limit, shared transfer ceiling and total storage ceiling.');
 }finally{await f.close();}}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
