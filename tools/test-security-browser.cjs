'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),rules=[];
 for(const line of fs.readFileSync(path.join(dist,'_headers'),'utf8').split(/\r?\n/)){
  if(line.startsWith('/'))rules.push({pattern:line,headers:{}});
  else if(/^\s+[^:]+:/.test(line)){const at=line.indexOf(':'),key=line.slice(0,at).trim().toLowerCase();assert(!(key in rules.at(-1).headers),'Duplicate header within one rule');rules.at(-1).headers[key]=line.slice(at+1).trim();}
 }
 assert(rules.length<=100,'Cloudflare supports at most 100 static header rules');
 function headers(url){const result={};for(const rule of rules){const match=rule.pattern.endsWith('*')?url.startsWith(rule.pattern.slice(0,-1)):url===rule.pattern;if(match)for(const[key,value]of Object.entries(rule.headers))result[key]=result[key]?result[key]+', '+value:value;}return result;}
 for(const url of ['/','/app/','/Wibs','/Wibsworth','/Account','/account-access/']){assert.equal(headers(url)['strict-transport-security'],'max-age=31536000');assert(headers(url)['content-security-policy'].includes('frame-ancestors'));}
 for(const url of ['/morogue-account-bridge','/game-achievements-bridge']){assert(headers(url)['content-security-policy'].includes('https://morogue.repocompany.uk'));assert(!headers(url)['x-frame-options'],'Cross-origin game account bridge must remain usable');}
 const middleware=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'functions/api/_middleware.js'),'utf8')).toString('base64'));
 for(const status of [200,401,403]){const response=await middleware.onRequest({next:async()=>Response.json({fixture:true},{status,headers:{'Cache-Control':'private, no-store',Vary:'Authorization'}})});assert.equal(response.status,status);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Vary'),'Authorization');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(response.headers.get('Strict-Transport-Security'),'max-age=31536000');assert.equal(response.headers.get('Content-Security-Policy'),"default-src 'none'; frame-ancestors 'none'");assert.deepEqual(await response.json(),{fixture:true});}
 let submitted=[];
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=url.pathname;
  if(name.startsWith('/api/accounts/')){let body='';req.on('data',v=>body+=v);req.on('end',()=>{submitted.push({name,body:JSON.parse(body)});res.writeHead(name.endsWith('/complete')?503:200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(name.endsWith('/complete')?{error:'Fixture provider unavailable.'}:{message:'Fixture request accepted.'}));});return;}
  if(name==='/frame-test'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<iframe src="/account-access/"></iframe>');return;}
  const file=path.resolve(dist,'.'+name+(name.endsWith('/')?'index.html':''));
  if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{...headers(name),'Content-Type':{'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon'}[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.goto(base+'/account-access/?mode=recover');await p.getByRole('heading',{name:'Forgot your password?',exact:true}).waitFor();
  await p.evaluate(()=>{window.__violations=[];document.addEventListener('securitypolicyviolation',e=>window.__violations.push(e.effectiveDirective));const s=document.createElement('script');s.textContent='window.__injected=true';document.head.append(s);const b=document.createElement('base');b.href='https://untrusted.invalid/';document.head.append(b);});
  await p.waitForFunction(()=>window.__violations.length>=2);assert.equal(await p.evaluate(()=>window.__injected),undefined);assert((await p.evaluate(()=>document.baseURI)).startsWith(base));
  await p.getByLabel('Email',{exact:true}).fill('fixture@example.com');await p.getByRole('button',{name:'Send reset email',exact:true}).click();await p.getByText('Fixture request accepted.',{exact:true}).waitFor();assert.equal(submitted.at(-1).name,'/api/accounts/recover');
  const token='fixture'+crypto.randomUUID().replaceAll('-',''),password='fixture-long-password';
  await p.goto(base+'/account-access/#purpose=recovery&token='+token);await p.getByRole('heading',{name:'Choose a new password',exact:true}).waitFor();assert(!p.url().includes(token));
  await p.getByLabel('New password',{exact:true}).fill(password);await p.getByLabel('Confirm password',{exact:true}).fill(password);await p.getByRole('button',{name:'Save password',exact:true}).click();await p.getByText('Fixture provider unavailable.',{exact:true}).waitFor();
  assert.equal(submitted.at(-1).body.token,token);assert.equal(submitted.at(-1).body.password,password);assert.equal(await p.getByLabel('New password',{exact:true}).inputValue(),'');assert.equal(await p.getByLabel('Confirm password',{exact:true}).inputValue(),'');assert(!(await p.evaluate(()=>JSON.stringify(localStorage))).includes(password));
  const denied=p.waitForEvent('console',{predicate:m=>m.text().includes('frame-ancestors')});await p.goto(base+'/frame-test');await denied;assert.equal(await p.locator('iframe').contentFrame().locator('#account-access-content').count(),0);
  console.log('PASS: strict account CSP blocks injected scripts, hostile base URLs and framing; recovery still works; tokens leave the URL; password fields clear after errors; API protections preserve status, response data and private caching; game bridge allowlists remain usable.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
