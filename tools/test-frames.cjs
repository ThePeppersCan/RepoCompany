const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../frame-qa');fs.mkdirSync(out,{recursive:true});
const mime={'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1600,height:1080}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const config=JSON.parse(fs.readFileSync(path.join(root,'dashboard-config.json'))),avatar=JSON.parse(fs.readFileSync(path.join(root,'account-assets/avatar-v2/catalog.json'))).defaults;
 const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qaplayer@'+config.authDomain,user_metadata:{username:'QAPlayer'}};
 const token=Buffer.from('{"alg":"HS256"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.test';
 const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
 let bank={gp:12000,items:{}},owned=[],buyCount=0,equipped=null;
 const social={username:'QAPlayer',profile:{display_name:'QAPlayer',avatar,repo_score:0,frame_id:null},friends:[{username:'fern',display_name:'Fern',avatar,status:'accepted',frame_id:'moonlit-grove',online:1}],blocks:[],activity:[]};
 const send=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 await context.route(config.url+'/**',async route=>{const p=new URL(route.request().url()).pathname,rpc=p.split('/rpc/')[1];if(p.endsWith('/token'))return send(route,session);if(p.endsWith('/user'))return send(route,user);
  if(rpc==='get_my_character')return send(route,[{username:'QAPlayer'}]);if(rpc==='get_my_bank')return send(route,[bank]);if(rpc==='get_my_avatar_frames')return send(route,[{owned}]);
  if(rpc==='buy_avatar_frame'){const id=route.request().postDataJSON().p_frame_id;buyCount++;if(!owned.includes(id)){owned.push(id);bank.gp-=1800;}return send(route,[{owned,new_gp:bank.gp}]);}return send(route,[{}]);});
 await context.route(base+'/api/**',async route=>{const p=new URL(route.request().url()).pathname;if(p.endsWith('/state'))return send(route,social);if(p.endsWith('/frame')){equipped=route.request().postDataJSON().frameId;social.profile.frame_id=equipped;return send(route,{ok:true,frame_id:equipped});}return send(route,{ok:true,conversations:[],messages:[],unread:0});});
 await page.goto(base+'/#account/shop');await page.getByRole('button',{name:'Sign in →',exact:true}).click();await page.locator('[name=username]').fill('QAPlayer');await page.locator('[name=password]').fill('test-password-123');await page.locator('#account-login-form [type=submit]').click();await page.waitForFunction(()=>repoAccount.state.frames!==null);await page.waitForFunction(()=>!document.querySelector('#account-detail').open);
 await page.locator('#account-tab-shop').click();assert.equal(await page.locator('.frame-card').count(),8);await page.waitForFunction(()=>[...document.querySelectorAll('.frame-card img')].every(i=>i.complete&&i.naturalWidth));await page.waitForTimeout(1200);
 await page.screenshot({path:path.join(out,'store.png')});
 const moving=page.locator('.frame-card canvas:not([data-repo-avatar])').first();const before=await moving.evaluate(c=>c.toDataURL());await page.waitForTimeout(350);assert.notEqual(await moving.evaluate(c=>c.toDataURL()),before,'Frame motion changes over time');
 await page.locator('[data-frame="ember-crown"]').click();await page.locator('#frame-primary').click();await page.waitForFunction(()=>repoAccount.state.frames.includes('ember-crown'));assert.equal(buyCount,1);assert.equal(bank.gp,10200);assert.equal(await page.locator('#frame-primary').textContent(),'Equip frame');await page.locator('#frame-primary').click();await page.waitForFunction(()=>repoAccount.state.social.profile.frame_id==='ember-crown');assert.equal(equipped,'ember-crown');
 await page.screenshot({path:path.join(out,'detail.png')});await page.keyboard.press('Escape');await page.locator('#account-tab-profile').click();assert.equal(await page.locator('.profile-avatar [data-avatar-frame="ember-crown"]').count(),1);assert.equal(await page.locator('.profile-avatar').evaluate(el=>getComputedStyle(el).borderRadius),'50%');await page.screenshot({path:path.join(out,'profile.png')});
 await page.locator('#account-tab-inventory').click();assert.equal(await page.locator('.frame-card').count(),1);await page.locator('[data-remove-frame]').click();await page.waitForFunction(()=>repoAccount.state.social.profile.frame_id===null);assert.equal(owned.length,1);
 await page.locator('#account-tab-shop').click();await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await moving.evaluate(c=>getComputedStyle(c).display),'none');await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile.png')});assert(await page.locator('#account-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'No horizontal overflow');
 await page.setViewportSize({width:1600,height:1080});await page.locator('[data-frame="stormglass"]').click();await page.screenshot({path:path.join(out,'stormglass.png')});await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log('PASS: eight previews, motion, purchase, no duplicate buy, equip/remove, circular fit, profile, inventory, reduced motion and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
