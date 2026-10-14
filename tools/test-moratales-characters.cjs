'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),site='https://repocompany.uk',origin='https://moratales.repocompany.uk';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const character=(id,name)=>({id,name,look:{name,skin:'warm',hair:'short',hair_colour:'brown',shirt:'plain',shirt_colour:'green'}});
const sessions={a:{access_token:'token-a',user:{id:A,email:'river@conofdrpepper.local',user_metadata:{username:'River'}}},b:{access_token:'token-b',user:{id:B,email:'fern@conofdrpepper.local',user_metadata:{username:'Fern'}}}};
async function fixture(browser,options={}){
  const context=await browser.newContext({viewport:{width:1280,height:1050}}),page=await context.newPage(),posts=[],bridgeCalls=[],errors=[];
  let getCount=0,linkCalls=0,releaseGet,releasePost;
  const getGate=new Promise(resolve=>releaseGet=resolve),postGate=new Promise(resolve=>releasePost=resolve);
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin===origin){
      const locals=options.locals??[character('slot-0','Rowan'),character('slot-1','<img src=x onerror=alert(1)>'),character('survivor','Separate Morogue character')];
      return route.fulfill({contentType:'text/html',body:`<!doctype html><script>const allowed='${site}',channel='morogue-characters-v1';addEventListener('message',e=>{const m=e.data;if(e.origin!==allowed||e.source!==parent||m.channel!==channel)return;parent.postMessage({qaBridgeCall:m},allowed);const send=result=>parent.postMessage({channel,nonce:m.nonce,id:m.id,result},allowed);if(m.action==='hello')send(true);else if(m.action==='characters'){parent.postMessage({channel,nonce:'wrong-nonce',id:m.id,result:[]},allowed);send(${JSON.stringify(locals)});}else if(m.action==='link'){window.linkCalls=(window.linkCalls||0)+1;if(${Boolean(options.failLink)}&&window.linkCalls===1)parent.postMessage({channel,nonce:m.nonce,id:m.id,error:'Marker failed'},allowed);else send(true);}});</script>`});
    }
    if(url.origin!==site)return route.abort();
    if(url.pathname==='/vendor/supabase.js')return route.fulfill({contentType:'text/javascript',body:`(()=>{let session=${JSON.stringify(options.signedOut?null:sessions.a)};const listeners=[];window.qaSessions=${JSON.stringify(sessions)};window.qaAuth=which=>{session=window.qaSessions[which]||null;for(const f of listeners)f('SIGNED_IN',session);};window.supabase={createClient:()=>({auth:{onAuthStateChange:f=>listeners.push(f),getSession:async()=>({data:{session},error:null}),signInWithPassword:async credentials=>{window.qaCredentials=credentials;window.qaAuth('a');return{data:{session},error:null};},signOut:async()=>{window.qaAuth(null);return{error:null};}}})};})();`});
    if(url.pathname==='/api/characters/moratales'){
      const token=route.request().headers().authorization,userId=token==='Bearer token-b'?B:A;
      if(route.request().method()==='POST'){
        const body=route.request().postDataJSON();posts.push({userId,body});
        if(options.delayPost&&userId===A)await postGate;
        const conflict=options.conflict&&posts.length===1;
        return route.fulfill({status:conflict?409:200,contentType:'application/json',body:JSON.stringify(conflict?{error:'conflict'}:{userId,revision:body.revision+1,characters:body.characters,updatedAt:10})}).catch(()=>{});
      }
      getCount++;
      if(options.delayGet&&userId===A)await getGate;
      const cloud=options.cloud??[character('slot-2',userId===A?'Existing Rowan':'Fern only')];
      return route.fulfill({contentType:'application/json',body:JSON.stringify({userId,revision:options.conflict&&getCount>1?8:2,characters:cloud,updatedAt:1})}).catch(()=>{});
    }
    const file=path.join(root,url.pathname==='/'?'moratales-characters.html':url.pathname);
    if(!file.startsWith(root+path.sep))return route.abort();
    try{return route.fulfill({contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'image/png',body:await fs.readFile(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.addInitScript(()=>{window.qaBridgeCalls=[];addEventListener('message',event=>{if(event.origin==='https://moratales.repocompany.uk'&&event.data.qaBridgeCall)window.qaBridgeCalls.push(event.data.qaBridgeCall);});});
  await page.goto(site+'/moratales-characters.html');
  return{context,page,posts,errors,releaseGet,releasePost,async ready(){await page.waitForFunction(()=>document.getElementById('link-panel').getAttribute('aria-busy')==='false'&&!document.getElementById('signed-in').hidden);},async close(){assert.deepEqual(errors,[]);await context.close();}};
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const f=await fixture(browser,{signedOut:true});
    await f.page.locator('#login-form').waitFor({state:'visible'});await f.page.locator('#username').fill('River');await f.page.locator('#password').fill('test-password');await f.page.locator('#login-form button').click();await f.ready();
    assert.equal((await f.page.evaluate(()=>qaCredentials)).email,'river@conofdrpepper.local');
    assert.equal(await f.page.locator('#character-list input:checked').count(),2);assert.equal(f.posts.length,0);
    assert.equal(await f.page.locator('#character-list img').count(),0);assert.match(await f.page.locator('#character-list').textContent(),/<img src=x/);
    await f.page.locator('input[value="slot-1"]').uncheck();assert.equal(await f.page.locator('#link-characters').isDisabled(),false,await f.page.locator('#signed-in').innerText());await f.page.locator('#link-characters').click();await f.page.waitForFunction(()=>document.getElementById('result-title').textContent==='Your characters are linked.');
    assert.equal(f.posts.length,1);assert.equal(f.posts[0].userId,A);assert.deepEqual(f.posts[0].body.characters.map(c=>c.id),['slot-2','slot-0']);assert.equal(await f.page.locator('input[value="survivor"]').count(),0);
    const marker=(await f.page.evaluate(()=>qaBridgeCalls)).filter(x=>x.action==='link');assert.equal(marker.length,1);assert.deepEqual(marker[0].payload.ids,['slot-0']);assert.equal(marker[0].payload.userId,A);
    assert.equal(marker[0].payload.revision,3);await f.close();console.log('PASS explicit username sign-in, safe names, selection, cloud preservation and marker');

    const empty=await fixture(browser,{locals:[]});await empty.ready();assert.match(await empty.page.locator('#local-status').textContent(),/browser and browser profile/);assert.match(await empty.page.locator('#cloud-names').textContent(),/Existing Rowan/);assert.equal(empty.posts.length,0);assert.equal(await empty.page.locator('#link-characters').isDisabled(),true);await empty.close();console.log('PASS empty browser preserves existing account characters');

    const retry=await fixture(browser,{failLink:true});await retry.ready();await retry.page.locator('#link-characters').click();await retry.page.locator('#retry-link').waitFor({state:'visible'});assert.equal(retry.posts.length,1);await retry.page.locator('#retry-link').click();await retry.page.waitForFunction(()=>document.getElementById('result-title').textContent==='Your characters are linked.');assert.equal(retry.posts.length,1);await retry.close();console.log('PASS marker retry without a duplicate save');

    const conflict=await fixture(browser,{conflict:true});await conflict.ready();await conflict.page.locator('#link-characters').click();await conflict.page.waitForFunction(()=>document.getElementById('cloud-status').textContent.includes('changed elsewhere'));assert.equal(await conflict.page.locator('#link-characters').isDisabled(),true);await conflict.page.locator('#refresh').click();await conflict.ready();await conflict.page.locator('#link-characters').click();await conflict.page.waitForFunction(()=>document.getElementById('result-title').textContent==='Your characters are linked.');assert.equal(conflict.posts[1].body.revision,8);await conflict.close();console.log('PASS conflict requires explicit refresh');

    const late=await fixture(browser,{delayGet:true});await late.page.waitForFunction(()=>document.getElementById('panel-title').textContent.includes('River'));await late.page.evaluate(()=>qaAuth('b'));await late.ready();late.releaseGet();await late.page.waitForTimeout(120);assert.match(await late.page.locator('#panel-title').textContent(),/Fern/);assert.match(await late.page.locator('#cloud-names').textContent(),/Fern only/);assert.doesNotMatch(await late.page.locator('#cloud-names').textContent(),/Existing Rowan/);await late.page.locator('#link-characters').click();await late.page.waitForFunction(()=>document.getElementById('result-title').textContent==='Your characters are linked.');assert.equal(late.posts[0].userId,B);await late.close();console.log('PASS stale account GET discarded');

    const switching=await fixture(browser,{delayPost:true});await switching.ready();await switching.page.locator('#link-characters').click();await switching.page.waitForFunction(()=>document.getElementById('link-characters').textContent==='Linking…');await switching.page.evaluate(()=>qaAuth('b'));await switching.ready();switching.releasePost();await switching.page.waitForTimeout(150);assert.match(await switching.page.locator('#panel-title').textContent(),/Fern/);assert.equal(await switching.page.locator('#result').isVisible(),false);assert.equal((await switching.page.evaluate(()=>qaBridgeCalls)).filter(x=>x.action==='link').length,0);await switching.close();console.log('PASS stale account POST cannot attach an owner marker');

    const visual=await fixture(browser,{locals:[character('slot-0','Rowan'),character('slot-1','Clover')]});await visual.ready();const out=process.env.REPO_CHARACTER_QA_OUTPUT;if(out){await fs.mkdir(out,{recursive:true});await visual.page.screenshot({path:path.join(out,'moratales-characters-desktop.png'),fullPage:true});await visual.page.setViewportSize({width:390,height:844});await visual.page.screenshot({path:path.join(out,'moratales-characters-mobile.png'),fullPage:true});assert.equal(await visual.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}await visual.close();
    console.log('Character linking page checks passed. No production services contacted.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
