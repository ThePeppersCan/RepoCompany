'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),config=JSON.parse(fs.readFileSync(path.join(root,'dashboard-config.json'))),base='https://repocompany.uk';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1480,height:896}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE:',e.message);});
  const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'logintest@'+config.authDomain,user_metadata:{username:'LoginTest'},created_at:new Date().toISOString()};
  const token=Buffer.from('{"alg":"HS256"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.fixture';
  const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
  let hold=false,releaseLogin,signup=0;
  const send=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin===config.url){
    if(u.pathname.endsWith('/token')||u.pathname.endsWith('/signup')){if(u.pathname.endsWith('/signup'))signup++;if(route.request().postDataJSON()?.password==='wrong-password')return send(route,{error:'invalid_grant',error_description:'Invalid login credentials'},400);if(hold)await new Promise(r=>releaseLogin=r);return send(route,session);}
    if(u.pathname.endsWith('/user'))return send(route,user);
    const rpc=u.pathname.split('/rpc/')[1];
    if(rpc==='get_my_character')return send(route,[{id:user.id,username:'LoginTest'}]);
    if(rpc==='get_my_bank')return send(route,[{gp:2000,items:{}}]);
    if(rpc==='get_my_avatar_frames')return send(route,[{owned:[]}]);
    return send(route,[]);
   }
   if(u.origin===base&&u.pathname.startsWith('/api/'))return send(route,u.pathname.endsWith('/state')?{profile:{display_name:'LoginTest'},friends:[],blocks:[],activity:[]}:{ok:true});
   if(u.origin!==base)return send(route,{});
   const file=path.resolve(dist,'.'+(/^\/(?:Account(?:\/.*)?)?$/.test(u.pathname)?'/index.html':decodeURIComponent(u.pathname)));
   if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
   const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg'};
   return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
  });
  await page.goto(base+'/#account/friends');const login=page.locator('#repo-login'),form=login.locator('#sign-in-form');await form.waitFor({state:'visible'});
  assert.equal(await page.locator('#viewport').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await login.evaluate(e=>e.open),true);
  await page.evaluate(()=>accountMenu.open({tab:'settings'}));await form.waitFor({state:'visible'});assert.equal(await page.evaluate(()=>document.getElementById('repo-login').contains(document.activeElement)),true);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await login.locator('.entry-atmosphere').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
  const out=path.resolve(root,'../web-login-qa');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'desktop.png')});
  await page.setViewportSize({width:390,height:844});assert.ok(await login.locator('#sign-in-mode').evaluate(e=>e.getBoundingClientRect().right<=390));await page.screenshot({path:path.join(out,'mobile.png')});await page.setViewportSize({width:1480,height:896});
  await login.locator('#sign-in-username').fill('LoginTest');await login.locator('#sign-in-password').fill('wrong-password');await login.locator('#sign-in-submit').click();await login.locator('#sign-in-error').waitFor({state:'visible'});assert.equal(await login.locator('#sign-in-password').inputValue(),'');assert.equal(await page.locator('#viewport').isVisible(),false);
  hold=true;await login.locator('#sign-in-password').fill('fixture-password');await login.locator('#sign-in-submit').click();await page.waitForFunction(()=>document.querySelector('#repo-login>div').shadowRoot.querySelector('main').dataset.phase==='signing-in');assert.equal(await form.isVisible(),false);assert.equal(await login.locator('.motion-rest').getAttribute('opacity'),'1');
  while(!releaseLogin)await new Promise(r=>setTimeout(r,10));hold=false;releaseLogin();await page.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');assert.equal(await page.locator('#viewport').isVisible(),true);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');assert.equal(await login.evaluate(e=>e.open),false);
  await page.evaluate(()=>repoAccount.signOut());await form.waitFor({state:'visible'});assert.equal(await page.locator('#viewport').isVisible(),false);
  await login.locator('#sign-in-mode').click();assert.equal(await login.locator('#sign-in-submit').innerText(),'Create account');await login.locator('#sign-in-username').fill('LoginTest');await login.locator('#sign-in-password').fill('fixture-password');await login.locator('#sign-in-submit').click();await page.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');assert.equal(signup,1);
  await page.evaluate(()=>repoAccount.signOut());await form.waitFor({state:'visible'});await page.evaluate(()=>document.documentElement.dataset.repoLauncher='true');await page.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');assert.equal(await login.evaluate(e=>e.open),false);
  assert.deepEqual(errors,[]);console.log('PASS: logged-out gate, deep links, Escape, failed login, loading, remembered login, logout, signup, mobile, reduced motion and native launcher compatibility.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

