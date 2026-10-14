'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),game=process.env.MORATALES_SOURCE;
if(!game)throw Error('Set MORATALES_SOURCE to the Moratales source directory for the actual bridge integration test.');
const portal='https://repocompany.uk',origin='https://moratales.repocompany.uk',A='11111111-2222-4333-8444-555555555555',B='66666666-7777-4888-8999-aaaaaaaaaaaa';
const look=name=>({name,skin:'honey',hair:'f14',shirt:'shirt_linen'}),character=(id,name)=>({id,name,look:look(name)});
async function setup(browser,{empty=false,delayPost=false,signedOut=false,collision=false}={}){
 const context=await browser.newContext(),page=await context.newPage(),posts=[],errors=[];let releasePost;const gate=new Promise(resolve=>releasePost=resolve);
 const clouds={[A]:{userId:A,revision:1,characters:[character('slot-2','Cloud only')]},[B]:{userId:B,revision:1,characters:[character('slot-2','B only')]}};
 if(collision)clouds[A].characters.push(character('slot-0','Other device character'));
 page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(({portal,origin,A,B,empty,signedOut})=>{
  if(location.origin===origin&&!sessionStorage.getItem('qa-ready')){sessionStorage.setItem('qa-ready','1');if(!empty){const look={name:'Nora',skin:'honey',hair:'f14',shirt:'shirt_linen'};localStorage.setItem('hearthfolk-appearance-v7',JSON.stringify(look));localStorage.setItem('moratales-save-slots-v1',JSON.stringify({version:1,active:0,slots:[{entries:{'hearthfolk-appearance-v7':JSON.stringify(look)}},null,null]}));}}
  if(location.origin===portal){let session=signedOut?null:{user:{id:A},access_token:'token-a'};const listeners=[];window.qaSignin=id=>{session=id?{user:{id},access_token:id===A?'token-a':'token-b'}:null;window.repoAccount.state.user=session?.user||null;listeners.forEach(f=>f('SIGNED_IN',session));dispatchEvent(new CustomEvent('repo-account-state'));};window.repoAccount={state:{user:session?.user||null},db:{auth:{getSession:async()=>({data:{session}}),onAuthStateChange:f=>listeners.push(f)}}};}
 },{portal,origin,A,B,empty,signedOut});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===portal&&url.pathname==='/api/characters/moratales'){
   const id=route.request().headers().authorization==='Bearer token-a'?A:B;
   if(route.request().method()==='POST'){const payload=route.request().postDataJSON();posts.push({id,payload});if(delayPost&&id===A)await gate;if(payload.revision!==clouds[id].revision)return route.fulfill({status:409,contentType:'application/json',body:'{}'});clouds[id]={userId:id,revision:payload.revision+1,characters:payload.characters};}
   return route.fulfill({contentType:'application/json',body:JSON.stringify(clouds[id])}).catch(()=>{});
  }
  if(url.origin===portal&&url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><body><h1>Existing Repo Company website</h1><dialog id="account-menu" open><nav class="account-tabs">Your account</nav></dialog><script src="/repo-character-sync.js"></script></body>'});
  let file;if(url.origin===portal&&url.pathname==='/repo-character-sync.js')file=path.join(root,'repo-character-sync.js');else if(url.origin===origin&&url.pathname.startsWith('/interface/'))file=path.join(game,url.pathname);else return route.abort();
  return route.fulfill({contentType:file.endsWith('.html')?'text/html':'text/javascript',body:await fs.readFile(file)});
 });
 await page.goto(portal);await page.waitForFunction(()=>window.repoCharacterSync);await page.evaluate(()=>repoCharacterSync.ready());
 return {page,context,posts,clouds,releasePost,async sync(){return page.evaluate(()=>repoCharacterSync.ready());},async close(){assert.deepEqual(errors,[]);await context.close();}};
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const f=await setup(browser,{signedOut:true});assert.equal(f.posts.length,0);await f.page.evaluate(id=>qaSignin(id),A);const first=await f.sync();assert.equal(first.status,'connected');assert.deepEqual(first.characters.map(c=>c.name),['Cloud only','Nora']);assert.equal(f.posts.length,1);
  const iframe=f.page.frames().find(frame=>frame.url().startsWith(origin));assert.ok(iframe);assert.equal(await iframe.evaluate(()=>MORATALES_CHARACTER_LINK.read(localStorage).userId),A);
  await f.page.evaluate(id=>qaSignin(id),B);let state=await f.sync();assert.equal(state.status,'account');assert.deepEqual(state.characters.map(c=>c.name),['B only']);assert.equal(f.posts.length,1,'switching account cannot move browser characters');
  await f.page.evaluate(id=>qaSignin(id),A);await f.sync();f.clouds[A]={userId:A,revision:3,characters:[character('slot-2','Cloud only'),character('slot-0','Remote Nora')]};state=await f.sync();assert.equal(f.posts.length,1);assert.equal(state.characters[1].name,'Remote Nora');await f.sync();assert.equal(f.posts.length,1,'unchanged browser must not overwrite newly acknowledged remote data');
  await iframe.evaluate(()=>{const value=JSON.parse(localStorage.getItem('hearthfolk-appearance-v7'));value.name='New Nora';localStorage.setItem('hearthfolk-appearance-v7',JSON.stringify(value));});state=await f.sync();assert.equal(state.characters[1].name,'New Nora');assert.equal(f.posts.length,2);
  await iframe.evaluate(()=>{const slots=JSON.parse(localStorage.getItem('moratales-save-slots-v1'));slots.slots[1]={entries:{'hearthfolk-appearance-v7':JSON.stringify({name:'New slot',skin:'honey',hair:'f14',shirt:'shirt_linen'})}};localStorage.setItem('moratales-save-slots-v1',JSON.stringify(slots));});state=await f.sync();assert.equal(state.characters.at(-1).name,'New slot');assert.equal(f.posts.length,3);await f.close();console.log('PASS website automatic sign-in, immutable owner, cloud preservation and fresh local character changes');
  const empty=await setup(browser,{empty:true});state=await empty.sync();assert.equal(state.status,'connected');assert.deepEqual(state.characters.map(c=>c.name),['Cloud only']);assert.equal(empty.posts.length,0);await empty.close();console.log('PASS empty browser consumes cloud without overwriting it');
  const collision=await setup(browser,{collision:true});state=await collision.sync();assert.equal(state.status,'conflict');assert.deepEqual(state.characters.map(c=>c.name),['Cloud only','Other device character']);assert.equal(collision.posts.length,0);assert.match(await collision.page.locator('#repo-character-sync-status').innerText(),/Both appearances have been kept/);await collision.sync();assert.equal(collision.posts.length,0,'repeated sync cannot overwrite an unresolved first-time slot collision');const localName=await collision.page.frames().find(frame=>frame.url().startsWith(origin)).evaluate(()=>MORATALES_CHARACTER_LINK.local(localStorage)[0].name);assert.equal(localName,'Nora');await collision.close();console.log('PASS first-time local/cloud slot collision preserves both characters and reports inline conflict');
  const delayed=await setup(browser,{signedOut:true,delayPost:true});await delayed.page.evaluate(id=>qaSignin(id),A);await delayed.page.waitForTimeout(200);for(let i=0;i<60&&!delayed.posts.length;i++)await delayed.page.waitForTimeout(50);assert.equal(delayed.posts.length,1);await delayed.page.evaluate(id=>qaSignin(id),B);delayed.releasePost();state=await delayed.sync();assert.equal(state.userId,B);assert.deepEqual(state.characters.map(c=>c.name),['B only']);assert.equal(delayed.posts.length,1);const owned=await delayed.page.frames().find(frame=>frame.url().startsWith(origin)).evaluate(()=>MORATALES_CHARACTER_LINK.read(localStorage));assert.equal(owned.userId,A);assert.deepEqual(owned.ids,[],'late previous-account save cannot acknowledge a marker after account switch');await delayed.close();console.log('PASS delayed previous-account response cannot switch ownership or populate the new account');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
