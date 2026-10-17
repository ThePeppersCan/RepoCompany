const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs'),{gif}=require('./test-wibs-media.cjs');
const urls=['https://media.tenor.com/rt3TWpREfH4AAAAM/kermit-dance.gif','https://media0.giphy.com/media/v1.Y2lkPTZjMDliOTUyMTIyZGE1Z3U4OTZ4NWE4MG92bG4zYW8yem40bGtsZWR0ZmllcDRkbCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/euGq9pgXoOVJcVhwRF/200w.gif'];
(async()=>{
 const realFetch=global.fetch,f=await createFixture(),fixtureFetch=global.fetch,browser=await chromium.launch({channel:'msedge',headless:true});let scenario='normal',calls=0;
 global.fetch=async(input,options)=>{
  if(!String(input).startsWith('https://media.tenor.com/')&&!String(input).startsWith('https://media0.giphy.com/'))return fixtureFetch(input,options);
  calls++;assert.equal(new Headers(options?.headers).get('Authorization'),null);assert.equal(new Headers(options?.headers).get('Cookie'),null);assert.equal(options.redirect,'manual');
  if(scenario==='redirect')return new Response('',{status:302,headers:{Location:'https://127.0.0.1/private.gif'}});
  if(scenario==='large')return new Response(new Uint8Array(1048577),{headers:{'Content-Type':'image/gif'}});
  return process.env.WIBS_LIVE_GIFS==='1'?realFetch(input,options):new Response(gif,{headers:{'Content-Type':'image/gif'}});
 };
 try{
  const {gifSourceURL}=await import('../lib/gif-sources.mjs');for(const bad of ['https://media.tenor.com.evil.example/file.gif','https://user:password@media.tenor.com/file.gif','http://media.tenor.com/file.gif','https://media.tenor.com:444/file.gif','https://127.0.0.1/file.gif','https://giphy.com/page','file:///some.gif'])assert.throws(()=>gifSourceURL(bad));
  const request=url=>realFetch(f.base+'/api/chat-images/source?url='+encodeURIComponent(url),{headers:{Authorization:'Bearer '+f.sessions.alice.access_token}});
  const denied=await realFetch(f.base+'/api/chat-images/source?url='+encodeURIComponent(urls[0]));assert.equal(denied.status,401);assert.equal(calls,0);
  scenario='redirect';assert.equal((await request(urls[0])).status,400);assert.equal(calls,1,'a redirect cannot reach a private or unapproved host');scenario='large';assert.equal((await request(urls[0])).status,413);scenario='normal';
  const a=await f.browserContext(browser,'alice'),b=await f.browserContext(browser,'bob'),sender=await a.newPage(),recipient=await b.newPage();
  // External provider requests are blocked by the fixture, matching the native
  // launcher's origin policy. The authenticated same-origin import must work.
  for(const p of [sender,recipient]){await p.goto(f.base);await p.waitForFunction(()=>repoCommunity&&repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());}
  for(const [i,url]of urls.entries()){
   await sender.locator('.rc-composer textarea').evaluate((input,{url,i})=>{const dt=new DataTransfer();if(i===0)dt.setData('text/plain',url);else dt.setData('text/html','<img src="'+url+'">');if(i)dt.setData('text/plain',url);input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}));},{url,i});
   await sender.locator('.repo-image-draft img').waitFor();const result=await sender.locator('.repo-image-draft img').evaluate(async img=>{const blob=await(await fetch(img.src)).blob(),decoder=new ImageDecoder({data:await blob.arrayBuffer(),type:blob.type});await decoder.tracks.ready;const frames=decoder.tracks.selectedTrack.frameCount;decoder.close();return {type:blob.type,size:blob.size,frames};});assert.equal(result.type,'image/gif');assert(result.frames>1&&result.size<=1048576);console.log('GIF verified',new URL(url).host,result);
   await sender.locator('.rc-send').click();await recipient.waitForFunction(n=>document.querySelectorAll('.repo-shared-image').length===n,i+1,{timeout:15000});
  }
  for(let i=0;i<8;i++)await request(urls[0]);assert.equal((await request(urls[0])).status,429);assert(f.sql.prepare('SELECT bytes FROM wibs_image_transfer').get().bytes<=20e9);
  console.log('PASS: approved GIF sources only, no credential forwarding, bounded downloads and rate/transfer limits; direct GIF link and website-image paste animate and reach recipient with external client requests blocked.');
 }finally{await browser.close();await f.close();global.fetch=realFetch;}
})().catch(error=>{console.error(error);process.exitCode=1;});
