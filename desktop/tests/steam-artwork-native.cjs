'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{_electron:electron}=require('playwright');
(async()=>{
 const qa=path.resolve(__dirname,'../qa');await fs.mkdir(qa,{recursive:true});const profile=await fs.mkdtemp(path.join(qa,'steam-artwork-'));
 const env={...process.env,STEAM_ARTWORK_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'steam-artwork-fixture.cjs')],env});
 try{
  const p=await app.firstWindow(),blocked=process.argv.includes('--expect-blocked');
  if(blocked){
   for(let i=0;i<100;i++){if((await app.evaluate(()=>global.artworkTest.requests)).length>=8)break;await new Promise(r=>setTimeout(r,100));}
   const requests=await app.evaluate(()=>global.artworkTest.requests);assert(requests.length>=4);assert(requests.every(r=>r.status===403));console.log(JSON.stringify({reproduced:true,requests}));return;
  }
  await p.waitForFunction(()=>['1139980','3070070'].every(id=>{const img=document.getElementById('game-'+id);return img?.complete&&img.naturalWidth===184&&img.src.includes('steamstatic.com');}),null,{timeout:30000});
  const requests=await app.evaluate(()=>global.artworkTest.requests);assert.equal(requests.length,2);assert(requests.every(r=>r.status===200));
  const images=await p.locator('.rc-activity-art').evaluateAll(nodes=>nodes.map(n=>({id:n.id,url:n.src,width:n.naturalWidth,height:n.naturalHeight})));assert(images.every(i=>i.height===69));
  const screenshot=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined,{stayHidden:true,stayAwake:true})).toPNG().toString('base64'));
  await fs.writeFile(path.join(qa,'steam-artwork-native.png'),Buffer.from(screenshot,'base64'));
  console.log(JSON.stringify({result:'PASS',images,requests}));
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
