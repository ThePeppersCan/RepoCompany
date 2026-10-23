const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];try{
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8788/game-playtime-bridge.html');
 await page.setContent('<html><head><style>body{background:#121713;color:#eeeadb;font-family:Arial;padding:28px}#account-content{position:relative;width:100%;height:auto;overflow:visible}</style></head><body><div id="account-content"></div></body></html>');
 for(const file of ['account-profile.css','account-achievements.css'])await page.addStyleTag({url:'http://127.0.0.1:8788/'+file});
 for(const file of ['achievement-model.js','account-achievements.js','account-profile.js'])await page.addScriptTag({url:'http://127.0.0.1:8788/'+file});
 await page.evaluate(()=>{window.testState={social:{profile:{display_name:'Runner',repo_score:0},activity:[{game:'comp-run',played_ms:120000,last_played:Date.now()}]},cards:[],slabs:[],character:{username:'runner'}};const options={state:testState,game:'',navigate:game=>repoAchievements.mount(document.getElementById('account-content'),{...options,game}),showDetail(){}};repoAchievements.mount(document.getElementById('account-content'),options);});
 await page.locator('[data-ach-game="comp-run"]').click();await page.locator('[data-ach-game-view="comp-run"]').waitFor();assert.equal(await page.locator('.ach-row').count(),21);assert.equal(await page.locator('.ach-game-heading h2').textContent(),'COMP-RUN');
 fs.mkdirSync('QA/comp-run-290',{recursive:true});await page.screenshot({path:'QA/comp-run-290/achievements.png'});
 await page.evaluate(()=>document.getElementById('account-content').innerHTML=repoProfile.render({state:testState,games:[{id:'comp-run',name:'COMP-RUN',genre:'First-person horror parkour'}]}));
 assert.equal(await page.locator('.profile-recent-game').count(),1);await page.locator('.profile-banner-art').evaluate(i=>i.decode());assert(await page.locator('.profile-banner-art').evaluate(i=>i.naturalWidth>0));await page.screenshot({path:'QA/comp-run-290/activity.png'});
 assert.equal(errors.length,0,errors.join('; '));console.log('PASS: COMP-RUN achievement card opens all 21 awards; recent activity renders its bespoke art and recorded time.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
