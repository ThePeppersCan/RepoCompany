'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{origin,description,pages}=require('./public-pages.cjs');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.resolve(root,'../public-pages-qa');
const routes=['/','/games/',...pages.map(p=>p.path)];
const fileFor=route=>path.join(dist,route,route.endsWith('/')?'index.html':'');
async function main(){
 const sitemap=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
 assert.ok(sitemap.startsWith('<?xml'));assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),routes.map(r=>origin+r));
 assert.ok(fs.readFileSync(path.join(dist,'robots.txt'),'utf8').includes('Sitemap: '+origin+'/sitemap.xml'));
 const headers=fs.readFileSync(path.join(dist,'_headers'),'utf8');
 assert.ok(!headers.split(/\r?\n(?=\/)/)[0].includes('noindex'));
 assert.match(headers,/\/legacy-runtime\r?\n\s+X-Robots-Tag: noindex/);
 assert.match(headers,/\/reparty\/\*\r?\n\s+Cache-Control: no-cache\r?\n\s+X-Robots-Tag: noindex/);
 const titles=new Set();
 for(const route of routes){
  const html=fs.readFileSync(fileFor(route),'utf8');assert.ok(!/<meta name="robots"[^>]*noindex/.test(html),route);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,route);assert.ok(html.includes('rel="canonical" href="'+origin+route+'"'),route);
  const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title));titles.add(title);
  assert.equal((html.match(/name="description"/g)||[]).length,1);assert.ok(html.includes('property="og:description"'));
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);assert.equal(data['@context'],'https://schema.org');
  assert.ok(html.includes('/assets/brand/favicon.png'));assert.ok(html.includes('/favicon.ico'));
 }
 // Preview builds stay out of search; rebuilding production restores public pages.
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'repo-public-test-'));
 try{
  for(const production of [false,true]){
   fs.copyFileSync(path.join(root,'index.html'),path.join(temp,'index.html'));
   require('./build-public-pages.cjs')(root,temp,{production});
   for(const route of routes){const html=fs.readFileSync(path.join(temp,route,'index.html'),'utf8');assert.equal(html.includes('name="robots" content="noindex,nofollow"'),!production);}
   assert.ok(fs.readFileSync(path.join(temp,'404.html'),'utf8').includes('noindex'));
  }
 }finally{assert.ok(temp.startsWith(path.join(os.tmpdir(),'repo-public-test-')));fs.rmSync(temp,{recursive:true,force:true});}
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:960}});
  const failures=[];
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());if(u.origin!==origin)throw Error('Unexpected external request '+u.origin);
   const file=fileFor(decodeURIComponent(u.pathname));
   if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){failures.push(u.pathname);return route.fulfill({status:404,body:'Not found'});}
   const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'};
   return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
  });
  const page=await context.newPage();
  for(const route of routes){
   await page.goto(origin+route,{waitUntil:'networkidle'});
   if(route==='/'){assert.ok((await page.locator('#repo-public-info').innerText()).includes(description));assert.ok(await page.locator('#repo-public-info').isVisible());assert.equal(await page.locator('#viewport').isVisible(),false);}
   else{assert.equal(await page.locator('h1').count(),1);assert.ok(await page.locator('h1').isVisible());}
   for(const link of await page.locator(route==='/'?'#repo-public-info a[href]':'a[href]').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')))){
    assert.ok(link.startsWith('/'));assert.ok(fs.existsSync(fileFor(new URL(link,origin).pathname)),route+' -> '+link);
   }
   const slug=route==='/'?'home':route.split('/').filter(Boolean).join('-');
   await page.screenshot({path:path.join(out,slug+'-desktop.png'),fullPage:true});
   await page.setViewportSize({width:390,height:844});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow');
   await page.screenshot({path:path.join(out,slug+'-mobile.png'),fullPage:true});
   await page.setViewportSize({width:1440,height:960});
  }
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
 console.log('PASS: seven public URLs, unique metadata, canonical URLs, structured data, sitemap, preview noindex, private runtime noindex, links, desktop/mobile and JavaScript-disabled access.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
