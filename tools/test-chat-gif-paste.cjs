const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs'),{gif}=require('./test-wibs-media.cjs');
(async()=>{
 const f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],requests=[];
 try{
  const a=await f.browserContext(browser,'alice'),b=await f.browserContext(browser,'bob'),page=await a.newPage(),peer=await b.newPage();
  await a.addCookies([{name:'private-cookie',value:'must-not-send',url:'https://media.example.com'}]);
  await a.route('https://media.example.com/**',async route=>{
   requests.push({url:route.request().url(),headers:await route.request().allHeaders()});
   const name=new URL(route.request().url()).pathname;
   if(name==='/blocked.gif')return route.abort();
   if(name==='/large.gif')return route.fulfill({contentType:'image/gif',body:Buffer.concat([gif,Buffer.alloc(1048576)])});
   if(name==='/invalid.gif')return route.fulfill({contentType:'image/gif',body:'not a GIF'});
   return route.fulfill({contentType:'application/octet-stream',body:gif,headers:{'Access-Control-Allow-Origin':'*'}});
  });
  for(const p of [page,peer]){p.on('pageerror',e=>errors.push(e.message));await p.goto(f.base);await p.waitForFunction(()=>window.repoCommunity&&window.repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());await p.locator('.rc-composer textarea').waitFor();}
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=1;c.getContext('2d').fillRect(0,0,1,1);return c.toDataURL().split(',')[1];});
  const paste=async({html='',text='',files=['png']}={})=>page.locator('.rc-composer textarea').evaluate((input,{png,gif,html,text,files})=>{
   const dt=new DataTransfer();for(const type of files){const bytes=Uint8Array.from(atob(type==='gif'?gif:png),c=>c.charCodeAt(0));dt.items.add(new File([bytes],'copied.'+type,{type:'image/'+type}));}
   if(html)dt.setData('text/html',html);if(text)dt.setData('text/plain',text);
   const event=new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt});input.dispatchEvent(event);return event.defaultPrevented;
  },{png,gif:gif.toString('base64'),html,text,files});
  const draft=page.locator('.rc-channel-view .repo-image-draft');
  const remove=()=>page.getByRole('button',{name:'Remove attached image',exact:true}).click();
  const animation=async locator=>locator.evaluate(async img=>{const blob=await (await fetch(img.src)).blob(),decoder=new ImageDecoder({data:await blob.arrayBuffer(),type:blob.type});await decoder.tracks.ready;const colors=[];for(let i=0;i<2;i++){const {image}=await decoder.decode({frameIndex:i}),canvas=new OffscreenCanvas(1,1),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);colors.push([...ctx.getImageData(0,0,1,1).data]);image.close();}const count=decoder.tracks.selectedTrack.frameCount;decoder.close();return {type:blob.type,count,colors};});
  // A website normally offers a flattened PNG plus the original address in HTML.
  await paste({html:'<img src="https://media.example.com/original.gif" onerror="window.badPaste=true"><script>window.badPaste=true</script>'});await draft.locator('img').waitFor();
  let frames=await animation(draft.locator('img'));assert.equal(frames.type,'image/gif');assert.equal(frames.count,2);assert.notDeepEqual(frames.colors[0],frames.colors[1]);assert.equal(await page.evaluate(()=>window.badPaste),undefined);
  assert.equal(requests[0].headers.authorization,undefined);assert.equal(requests[0].headers.cookie,undefined);assert.equal(requests[0].headers.referer,undefined);
  await page.locator('.rc-send').click();await peer.locator('.repo-shared-image').waitFor({timeout:15000});frames=await animation(peer.locator('.repo-shared-image'));assert.equal(frames.count,2);assert.notDeepEqual(frames.colors[0],frames.colors[1]);assert.deepEqual(Buffer.from([...f.imageObjects.values()][0]),gif,'recipient gets the original animated bytes');
  // Prefer the real GIF when both a still preview and GIF file are on the clipboard.
  const count=requests.length;await paste({files:['png','gif'],html:'<img src="https://media.example.com/unneeded.gif">'});await draft.locator('img').waitFor();assert.equal((await animation(draft.locator('img'))).type,'image/gif');assert.equal(requests.length,count);await remove();
  // Extensionless source URLs and directly copied GIF addresses work too.
  await paste({html:'<img src="https://media.example.com/image?id=123">'});await draft.locator('img').waitFor();assert.equal((await animation(draft.locator('img'))).count,2);await remove();
  await paste({text:'https://media.example.com/link.gif',files:[]});await draft.locator('img').waitFor();await remove();
  assert.equal(await paste({text:'Some normal copied text',files:[]}),false,'ordinary text paste is untouched');
  for(const name of ['blocked','invalid']){await paste({html:`<img src="https://media.example.com/${name}.gif">`});await page.getByText('The website did not provide an accessible GIF. Save the original GIF and attach it to keep the animation.',{exact:true}).waitFor();assert(await draft.isHidden(),'do not silently send a still frame for a known GIF');}
  await paste({html:'<img src="https://media.example.com/large.gif">'});await page.getByText('Choose an animated GIF up to 1 MB.',{exact:true}).waitFor();assert(await draft.isHidden());
  const beforeUnsafe=requests.length;await paste({html:'<img src="http://127.0.0.1/private.gif">'});await page.getByText('The website did not provide an accessible GIF. Save the original GIF and attach it to keep the animation.',{exact:true}).waitFor();assert.equal(requests.length,beforeUnsafe);
  await paste({html:'<img src="data:image/png;base64,'+png+'">'});await draft.locator('img').waitFor();assert(await draft.getByText('Only a still image was copied. If this was a GIF, save and attach the original to keep the animation.',{exact:true}).isVisible());await remove();
  // A response arriving after sign-out must not resurrect a private draft.
  await page.evaluate(()=>{const native=window.fetch;window.fetch=(url,options)=>String(url)==='https://media.example.com/slow.gif'?new Promise((resolve,reject)=>{window.slowPasteStarted=true;options.signal.addEventListener('abort',()=>{window.slowPasteAborted=true;reject(new DOMException('Aborted','AbortError'));},{once:true});}):native(url,options);});
  await paste({html:'<img src="https://media.example.com/slow.gif">'});await page.waitForFunction(()=>window.slowPasteStarted);await page.evaluate(()=>{repoAccount.state.user=null;dispatchEvent(new Event('repo-account-state'));});await page.waitForFunction(()=>window.slowPasteAborted);assert(await draft.isHidden());
  assert.deepEqual(errors,[]);console.log('PASS: website PNG+HTML paste preserves GIF frames for recipient; GIF-file priority, extensionless/direct URLs, privacy, inert HTML, size limit, blocked/invalid source guidance, plain text and sign-out cancellation.');
 }finally{await browser.close();await f.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
