'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),origin='https://repocompany.uk';
(async()=>{
 const source=await fs.readFile(path.join(root,'functions/download/windows.js'),'utf8'),{onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const version='0.1.6',installer='https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v'+version+'/Repo-Company-'+version+'-Windows-x64.exe';
 const payload={version,appId:'uk.repocompany.launcher',channel:'stable',platform:'win32',arch:'x64',installer:{url:installer}};
 const envelope=value=>({schemaVersion:1,keyId:'repo-launcher-2026-01',payload:Buffer.from(JSON.stringify(value)).toString('base64')});
 let assetRequests=0;
 const env={ASSETS:{fetch:async request=>{assetRequests++;assert.equal(request.url,origin+'/releases/launcher/latest.json');return Response.json(envelope(payload));}}};
 for(const method of ['GET','HEAD','POST','PUT','DELETE']){const response=await onRequest({request:new Request(origin+'/download/windows',{method}),env});assert.equal(response.headers.get('cache-control'),'no-store');if(['GET','HEAD'].includes(method)){assert.equal(response.status,302);assert.equal(response.headers.get('location'),installer);}else{assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'GET, HEAD');}}
 assert.equal(assetRequests,2);
 for(const reply of [()=>new Response('',{status:404}),()=>Response.json(envelope({...payload,installer:{url:'https://example.com/untrusted.exe'}})),()=>Response.json(envelope({...payload,version:'../bad'})),()=>Response.json({schemaVersion:1,payload:'broken'})]){const response=await onRequest({request:new Request(origin+'/download/windows'),env:{ASSETS:{fetch:async()=>reply()}}});assert.equal(response.status,503);assert.equal(response.headers.get('location'),null);}
 const fixture=await require('./messaging-test-server.cjs').createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await fixture.browserContext(browser,'alice'),page=await context.newPage();
 await context.route(fixture.base+'/api/accounts/status',r=>r.fulfill({json:{verified:true,email:'alice@example.com',canApprove:false}}));
 const output=process.env.REPO_DOWNLOAD_QA_OUTPUT;if(output)await fs.mkdir(output,{recursive:true});
 for(const [name,width,height] of [['desktop',1672,941],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto(fixture.base,{waitUntil:'load'});await page.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');await page.waitForFunction(()=>typeof window.fitDashboard==='function');await page.evaluate(()=>window.fitDashboard());await page.waitForTimeout(250);
  const link=page.locator('#download-client');assert.equal(await link.getAttribute('href'),'/app/?install=1');assert.equal(await link.isVisible(),true);
  const geometry=await page.evaluate(()=>{const link=document.getElementById('download-client'),account=document.querySelector('.account [data-note="Account"]'),brand=document.querySelector('#dashboard>.brand'),a=link.getBoundingClientRect(),b=account.getBoundingClientRect(),c=brand.getBoundingClientRect(),x=getComputedStyle(link),y=getComputedStyle(account);return {font:x.font===y.font,align:x.alignItems===y.alignItems,gap:x.gap===y.gap,inside:a.left>=0&&a.right<=innerWidth,ordered:a.right<b.left,brandClear:a.left>c.right,vertical:Math.abs(a.top+a.height/2-b.top-b.height/2)<1};});assert.deepEqual(geometry,{font:true,align:true,gap:true,inside:true,ordered:true,brandClear:true,vertical:true});
  await link.click();await page.getByRole('heading',{name:'Get Repo Company',exact:true}).waitFor();
  const dialog=page.locator('#repo-downloads');assert.equal(await dialog.locator('a[href="/app/?install=1"]').count(),1);assert.equal(await dialog.locator('a[href="/download/windows"]').count(),1);assert(await dialog.getByText('iPhone & Android',{exact:true}).isVisible());assert(await page.evaluate(()=>document.getElementById('repo-downloads').getBoundingClientRect().right<=innerWidth));
  if(output)await page.screenshot({path:path.join(output,'download-options-'+name+'.png')});
  await page.getByRole('button',{name:'Close downloads',exact:true}).click();assert.equal(await dialog.isVisible(),false);
  if(output)await page.screenshot({path:path.join(output,'download-client-'+name+'.png'),fullPage:true});
  await page.evaluate(()=>document.documentElement.dataset.repoLauncher='true');assert.equal(await link.isVisible(),false);assert.equal(await page.locator('.account [data-note="Account"]').isVisible(),true);
 }
 console.log('PASS Download matches Account font, icon alignment and spacing on desktop/mobile; phone/Windows chooser, close and mobile fit; correct installer route; hidden only inside launcher.');
}finally{await browser.close();await fixture.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
