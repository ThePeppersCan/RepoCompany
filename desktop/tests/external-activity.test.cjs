'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {ExternalActivity,parseVdf,steamGames,detectGame}=require('../lib/external-activity.cjs');
test('Steam manifests preserve escaped library paths and game names',()=>{
 const v=parseVdf('"libraryfolders" { "0" { "path" "D:\\\\Steam Library" "apps" {"413150" "123"} } }');assert.equal(v.libraryfolders['0'].path,'D:\\Steam Library');
 assert.equal(parseVdf('"AppState" {"name" "Game: A \\"quoted\\" story"}').AppState.name,'Game: A "quoted" story');
});
test('matches Steam installs and RuneLite without guessing from window titles or a generic java process',()=>{
 const catalog=[{game:'steam:413150',title:'Stardew Valley',folder:'D:\\Games\\Stardew Valley'}],row=file=>({file,window:true});
 assert.equal(detectGame([row('d:\\games\\stardew valley\\Stardew Valley.exe')],catalog).game,'steam:413150');
 assert.equal(detectGame([row('D:\\Games\\Stardew Valley Fake\\evil.exe')],catalog),null);
 assert.equal(detectGame([row('D:\\Games\\Stardew Valley\\UnityCrashHandler64.exe')],catalog),null);
 assert.equal(detectGame([{file:'D:\\Games\\Stardew Valley\\Game.exe',window:false}],catalog),null);
 assert.equal(detectGame([row('C:\\Users\\Example\\AppData\\Local\\RuneLite\\RuneLite.exe')],catalog).game,'runelite');
 assert.equal(detectGame([row('C:\\Users\\Example\\AppData\\Local\\RuneLite\\jre\\bin\\javaw.exe')],catalog).game,'runelite');
 assert.equal(detectGame([row('C:\\Java\\bin\\javaw.exe')],catalog),null);
 assert.equal(detectGame([row('C:\\RuneLite.exe'),row('D:\\Games\\Stardew Valley\\Game.exe')],catalog,[],'steam:413150').game,'steam:413150');
 const custom={game:'custom:'+'a'.repeat(24),title:'My game',file:'C:\\Game\\Play.exe'};assert.equal(detectGame([row(custom.file)],[],[custom]).title,'My game');assert.equal(detectGame([row('D:\\Game\\Play.exe')],[],[custom]),null);
});
test('reads actual Steam manifest structure across secondary library folders',async()=>{
 if(process.platform!=='win32')return;
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'repo-steam-fixture-')),second=path.join(root,'second');
 try{
  await fs.mkdir(path.join(root,'steamapps'),{recursive:true});await fs.mkdir(path.join(second,'steamapps'),{recursive:true});
  await fs.writeFile(path.join(root,'steamapps','libraryfolders.vdf'),'"libraryfolders" { "1" { "path" '+JSON.stringify(second)+' } }');
  await fs.writeFile(path.join(second,'steamapps','appmanifest_413150.acf'),'"AppState" { "appid" "413150" "name" "Stardew Valley" "installdir" "Stardew Valley" }');
  await fs.writeFile(path.join(second,'steamapps','appmanifest_1.acf'),'"AppState" { "appid" "1" "name" "Bad path" "installdir" "..\\\\..\\\\outside" }');
  const games=await steamGames([root]);assert.equal(games.length,1);assert.equal(games[0].game,'steam:413150');assert.equal(games[0].folder,path.join(second,'steamapps','common','Stardew Valley'));
 }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('opt-in, background detection, stopping, managed game priority, sign-out and path privacy',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'repo-activity-fixture-'));
 const account={identity:'alice',token:'alice-token',state:{status:'online'}};let enabled=false,invisible=false,scans=0,managed=false,list=[{file:'C:\\RuneLite.exe',window:true}];const sent=[];
 const instance=new ExternalActivity({account,origin:'https://repo.test',file:path.join(root,'registered.json'),managedGame:()=>managed,fetchImpl:async(url,init)=>{if(url.endsWith('/activity-settings'))return Response.json({shareActivity:true,externalGames:enabled,invisible});const b=JSON.parse(init.body);sent.push(b);return Response.json({ok:true,sharing:true});}},{processes:async()=>{scans++;return list;},roots:async()=>[],catalogue:async()=>[]});
 try{
  await instance.tick();assert.equal(scans,0,'does not scan before opt-in');enabled=true;await instance.tick();assert.equal(sent.at(-1).action,'start');assert.equal(instance.snapshot().current,'RuneLite');
  await instance.tick();assert.equal(sent.at(-1).action,'tick');assert.equal(sent.at(-1).sequence,1);assert(!JSON.stringify(sent).includes('C:\\'),'only game metadata leaves computer');
  list=[];await instance.tick();assert.equal(sent.at(-1).action,'stop');assert.equal(instance.current,null);
  list=[{file:'C:\\RuneLite.exe',window:true}];managed=true;const prior=scans;await instance.tick();assert.equal(scans,prior,'Repo games take priority without scanning');managed=false;
  invisible=true;await instance.tick();assert.equal(scans,prior,'no scan in invisible mode');invisible=false;await instance.tick();
  enabled=false;await instance.tick();assert.equal(sent.at(-1).action,'stop');
  const game=await instance.register('C:\\Private Folder\\my-game.exe','My game');assert.match(game,/^custom:[a-f0-9]{24}$/);assert.equal(instance.snapshot().registered[0].title,'My game');assert(!JSON.stringify(instance.snapshot()).includes('Private Folder'));
  account.identity='bob';account.token='bob-token';await instance.tick();assert.deepEqual(instance.snapshot().registered,[],'registered games scoped to account');
  account.state.status='signed-out';await instance.tick();assert.equal(instance.current,null);assert.deepEqual(instance.snapshot().registered,[]);
 }finally{instance.dispose();await instance.pending;await fs.rm(root,{recursive:true,force:true});}
});
test('account change during process scan cannot send activity to the next account',async()=>{
 let release;const scanning=new Promise(resolve=>{release=resolve;});const account={identity:'alice',token:'a',state:{status:'online'}},sent=[];
 const instance=new ExternalActivity({account,origin:'https://repo.test',file:path.join(os.tmpdir(),'missing-repo-activity.json'),fetchImpl:async(url,init)=>{if(init.method==='POST')sent.push(JSON.parse(init.body));return Response.json({shareActivity:true,externalGames:true});}},{roots:async()=>[],catalogue:async()=>[],processes:()=>scanning});
 const pending=instance.tick();await new Promise(r=>setTimeout(r,20));account.identity='bob';release([{file:'C:\\RuneLite.exe',window:true}]);await pending;assert.deepEqual(sent,[]);instance.dispose();
});
