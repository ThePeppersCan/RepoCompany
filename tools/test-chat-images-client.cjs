const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  const a=await f.browserContext(browser,'alice'),b=await f.browserContext(browser,'bob'),page=await a.newPage(),peer=await b.newPage();
  for(const p of [page,peer]){p.on('pageerror',e=>errors.push(e.message));await p.goto(f.base);await p.waitForFunction(()=>window.repoCommunity&&window.repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());await p.locator('.rc-composer textarea').waitFor();}
  // Generate a real raster fixture in-browser; no external image or account.
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=360;const x=c.getContext('2d');x.fillStyle='#163e2b';x.fillRect(0,0,600,360);x.fillStyle='#d8e6b0';x.font='bold 36px sans-serif';x.fillText('A moment worth sharing',60,160);x.font='22px sans-serif';x.fillText('Wibs · disappears after seven days',60,210);return c.toDataURL('image/png').split(',')[1];});
  await page.locator('.rc-composer input[type=file]').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.locator('.rc-image-unused').count(); // Keep selectors independent of generated message IDs.
  await page.locator('.rc-channel-view .repo-image-draft img').waitFor();assert(await page.getByRole('button',{name:'Remove attached image',exact:true}).isVisible());
  await page.locator('.rc-composer textarea').fill('Our first image');await page.locator('.rc-send').click();
  await page.locator('.rc-log .repo-shared-image').waitFor();await peer.locator('.rc-log .repo-shared-image').waitFor({timeout:15000});
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM wibs_images').get().n,1);
  const before=f.sql.prepare('SELECT bytes FROM wibs_image_transfer').get().bytes;
  await page.evaluate(()=>{repoCommunity.show('dm');repoCommunity.show('community');});await page.waitForTimeout(5500);
  assert.equal(f.sql.prepare('SELECT bytes FROM wibs_image_transfer').get().bytes,before,'unchanged polls/repaints do not redownload images');
  const out=path.resolve(__dirname,'../../../outputs');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'wibs-image-sharing.png')});
  // Pasting an image uses the same preview and bounded upload path in DMs.
  await page.getByRole('button',{name:'Direct messages',exact:true}).click();await page.getByRole('button',{name:'Message Bob',exact:true}).click();
  await page.locator('.repo-message-composer textarea').evaluate((input,png)=>{const bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0)),dt=new DataTransfer();dt.items.add(new File([bytes],'paste.png',{type:'image/png'}));input.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}));},png);
  await page.locator('.repo-message-conversation .repo-image-draft img').waitFor();await page.locator('.repo-message-send').click();await page.locator('.repo-message-bubble .repo-shared-image').waitFor();
  assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM wibs_images WHERE scope='dm'").get().n,1);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.querySelector('.rc-page').scrollWidth>innerWidth),false);await page.screenshot({path:path.join(out,'wibs-image-sharing-mobile.png')});
  // Expired files show a stable placeholder instead of requesting a public URL.
  const image=f.sql.prepare("SELECT id FROM wibs_images WHERE scope='dm'").get();f.sql.prepare('UPDATE wibs_images SET expires_at=? WHERE id=?').run(Date.now()-1,image.id);
  await peer.getByRole('button',{name:'Direct messages',exact:true}).click();await peer.getByRole('button',{name:'Message Alice',exact:true}).click();await peer.getByText('Image expired',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: picker upload, preview, image-only DM paste, recipient rendering, no repeat downloads, mobile layout, expiry placeholder and no browser errors.');
 }finally{await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
