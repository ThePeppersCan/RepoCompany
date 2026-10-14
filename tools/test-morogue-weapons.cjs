// Run against local reviewed overrides, or use --live after publishing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const check=require('./morogue-weapon-checks.cjs');
const root=path.resolve(__dirname,'..'),live=process.argv.includes('--live');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(!live)await page.route('**/*',route=>{
   const url=new URL(route.request().url()),name=path.posix.basename(url.pathname);
   const gamePath=url.pathname.startsWith('/interface/vampire-survivor/')||url.pathname.startsWith('/game-integrations/morogue/');
   if(['morogue.repocompany.uk','moratales.repocompany.uk','repocompany.uk'].includes(url.hostname)&&gamePath&&['game.js','builds.js','build-art.js','app.js','art.js','food-cards.js'].includes(name))return route.fulfill({path:path.join(root,'game-integrations/morogue',name),headers:{'Access-Control-Allow-Origin':'*'}});
   return route.continue();
  });
  await page.goto('https://morogue.repocompany.uk/',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.MORATALES_SURVIVOR&&window.MOROGUE_FOOD_CARDS);
  console.log(await page.evaluate(check));
  assert.deepEqual(errors,[]);
  console.log('PASS weapon mechanics and upgrade eligibility ('+(live?'live':'candidate')+')');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
