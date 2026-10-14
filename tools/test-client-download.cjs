'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),origin='https://repocompany.uk';
(async()=>{
 const source=await fs.readFile(path.join(root,'functions/download/windows.js'),'utf8'),{onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const method of ['GET','HEAD','POST','PUT','DELETE']){const response=onRequest({request:new Request(origin+'/download/windows',{method})});assert.equal(response.headers.get('cache-control'),'no-store');if(['GET','HEAD'].includes(method)){assert.equal(response.status,302);assert.equal(response.headers.get('location'),'https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v0.1.2/Repo-Company-0.1.2-Windows-x64.exe');}else{assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'GET, HEAD');}}
 const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return route.abort();try{const body=await fs.readFile(file),type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';return route.fulfill({body,contentType:type});}catch{return route.fulfill({status:404,body:''});}});
 const output=process.env.REPO_DOWNLOAD_QA_OUTPUT;if(output)await fs.mkdir(output,{recursive:true});
 for(const [name,width,height] of [['desktop',1672,941],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto(origin,{waitUntil:'load'});await page.waitForFunction(()=>typeof window.fitDashboard==='function');await page.evaluate(()=>window.fitDashboard());await page.waitForTimeout(250);
  const link=page.locator('#download-client');assert.equal(await link.getAttribute('href'),'/download/windows');assert.equal(await link.isVisible(),true);
  const geometry=await page.evaluate(()=>{const link=document.getElementById('download-client'),account=document.querySelector('.account [data-note="Account"]'),brand=document.querySelector('#dashboard>.brand'),a=link.getBoundingClientRect(),b=account.getBoundingClientRect(),c=brand.getBoundingClientRect(),x=getComputedStyle(link),y=getComputedStyle(account);return {font:x.font===y.font,align:x.alignItems===y.alignItems,gap:x.gap===y.gap,inside:a.left>=0&&a.right<=innerWidth,ordered:a.right<b.left,brandClear:a.left>c.right,vertical:Math.abs(a.top-b.top)<1};});assert.deepEqual(geometry,{font:true,align:true,gap:true,inside:true,ordered:true,brandClear:true,vertical:true});
  if(output)await page.screenshot({path:path.join(output,'download-client-'+name+'.png'),fullPage:true});
  await page.evaluate(()=>document.documentElement.dataset.repoLauncher='true');assert.equal(await link.isVisible(),false);assert.equal(await page.locator('.account [data-note="Account"]').isVisible(),true);
 }
 console.log('PASS Download matches Account font, icon alignment and spacing on desktop/mobile; correct Windows route; hidden only inside launcher.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
