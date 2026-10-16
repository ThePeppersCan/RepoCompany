'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const run=promisify(execFile),win=path.win32;
const normalize=value=>win.normalize(String(value||'')).replace(/\\+$/,'').toLowerCase();
const inside=(file,root)=>normalize(file).startsWith(normalize(root)+'\\');
function parseVdf(text){
 const tokens=String(text).replace(/\/\/[^\r\n]*/g,'').match(/"(?:\\.|[^"\\])*"|[{}]/g)||[];let at=0;
 const unquote=t=>t.slice(1,-1).replace(/\\([\\"])/g,'$1');
 function object(depth){if(depth>12)throw Error('Invalid Steam manifest.');const out=Object.create(null);while(at<tokens.length){const key=tokens[at++];if(key==='}')break;if(!key.startsWith('"'))throw Error('Invalid Steam manifest.');const value=tokens[at++];if(!value)break;out[unquote(key)]=value==='{'?object(depth+1):unquote(value);}return out;}
 return object(0);
}
const powershell=script=>run(path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:10000,maxBuffer:2*1024*1024,encoding:'utf8'});
async function processList(){
 const {stdout}=await powershell("$ErrorActionPreference='SilentlyContinue';$activitySession=(Get-Process -Id $PID).SessionId;@(Get-Process | Where-Object {$_.SessionId -eq $activitySession} | ForEach-Object {if($_.Path){[pscustomobject]@{file=$_.Path;window=($_.MainWindowHandle -ne 0)}}}) | ConvertTo-Json -Compress");
 const rows=JSON.parse(stdout.replace(/^\uFEFF/,'')||'[]');return Array.isArray(rows)?rows:[];
}
async function steamRoots(){
 const roots=[path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Steam')];
 try{const {stdout}=await powershell("(Get-ItemProperty -LiteralPath 'HKCU:\\Software\\Valve\\Steam' -ErrorAction SilentlyContinue).SteamPath");if(stdout.trim())roots.push(stdout.trim());}catch{}
 return [...new Set(roots.map(normalize))];
}
async function steamGames(roots){
 const libraries=new Set(roots);
 for(const root of roots){try{const vdf=parseVdf(await fs.readFile(win.join(root,'steamapps','libraryfolders.vdf'),'utf8'));for(const item of Object.values(vdf.libraryfolders||vdf.LibraryFolders||{})){const folder=typeof item==='object'?item.path:item;if(typeof folder==='string'&&win.isAbsolute(folder))libraries.add(folder);}}catch{}}
 const games=[];
 for(const library of libraries){
  const apps=win.join(library,'steamapps');let files=[];try{files=await fs.readdir(apps);}catch{continue;}
  for(const file of files.filter(f=>/^appmanifest_[0-9]+\.acf$/.test(f)).slice(0,2000))try{
   const stat=await fs.stat(win.join(apps,file));if(stat.size>256000)continue;
   const manifest=parseVdf(await fs.readFile(win.join(apps,file),'utf8')).AppState;
   if(!manifest||!/^\d{1,10}$/.test(manifest.appid)||!manifest.name||manifest.name.length>100||!manifest.installdir)continue;
   const folder=win.resolve(apps,'common',manifest.installdir);if(!inside(folder,win.join(apps,'common')))continue;
   games.push({game:'steam:'+manifest.appid,title:manifest.name,folder});
  }catch{}
 }
 return games;
}
function detectGame(processes,catalog,registered=[],previous=''){
 const matches=new Map();
 for(const p of processes){
  if(typeof p.file!=='string'||!p.window)continue;
  const file=normalize(p.file),name=win.basename(file);
  if(/^(?:steam|steamwebhelper|crashpad_handler|crashreporter|unitycrashhandler\d*|unins\d*|setup|updater|launcher|easyanticheat.*|beservice)\.exe$/i.test(name))continue;
  const custom=registered.find(g=>normalize(g.file)===file);
  if(custom){matches.set(custom.game,{game:custom.game,title:custom.title});continue;}
  if(name==='runelite.exe'||/\\runelite\\(?:jre\\|jre-[^\\]+\\|runtime\\).*\\javaw?\.exe$/.test(file)){
   matches.set('runelite',{game:'runelite',title:'RuneLite'});continue;
  }
  const game=catalog.find(g=>inside(file,g.folder));if(game)matches.set(game.game,{game:game.game,title:game.title});
 }
 // Keep an existing session stable when two games are open.
 return matches.get(previous)||matches.values().next().value||null;
}
class ExternalActivity {
 constructor({account,origin,fetchImpl,file,onChange=()=>{},managedGame=()=>false,disabled=false},deps={}){
  Object.assign(this,{account,origin,fetch:fetchImpl,file,onChange,managedGame,disabled});
  this.processes=deps.processes||processList;this.roots=deps.roots||steamRoots;this.catalogue=deps.catalogue||steamGames;this.now=deps.now||Date.now;
  this.catalog=[];this.catalogAt=0;this.context=null;this.current=null;this.pending=null;this.settings=null;this.registered=[];this.disposed=false;this.error='';
 }
 start(){if(this.timer)return;this.timer=setInterval(()=>void this.tick(),15000);this.timer.unref?.();void this.tick();}
 snapshot(){if(this.account.state.status!=='online'||this.context?.id!==this.account.identity)return {current:'',registered:[],error:''};return {current:this.current?.title||'',registered:this.registered.map(({game,title})=>({game,title})),error:this.error};}
 async request(context,route,body){
  const response=await this.fetch(this.origin+'/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+context.token,...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Game activity could not connect.');return response.json();
 }
 async readRegistry(id){try{const data=JSON.parse(await fs.readFile(this.file,'utf8'));return (Array.isArray(data[id])?data[id]:[]).filter(g=>/^custom:[a-f0-9]{24}$/.test(g.game)&&typeof g.title==='string'&&g.title.length<=100&&typeof g.file==='string'&&win.isAbsolute(g.file)).slice(0,40);}catch{return [];}}
 async register(file,title){
  const id=this.account.identity;if(!id||this.account.state.status!=='online')throw Error('Sign in first.');
  if(typeof file!=='string'||!win.isAbsolute(file)||!file.toLowerCase().endsWith('.exe')||typeof title!=='string'||!title.trim()||title.trim().length>100||/[\u0000-\u001f]/.test(title))throw Error('Choose a game executable and name.');
  const entry={game:'custom:'+crypto.createHash('sha256').update(normalize(file)).digest('hex').slice(0,24),title:title.trim(),file};
  const entries=await this.readRegistry(id);if(entries.length>=40&&!entries.some(g=>g.game===entry.game))throw Error('Remove a registered game before adding another.');
  await this.writeRegistry(id,[...entries.filter(g=>g.game!==entry.game),entry]);return entry.game;
 }
 async remove(game){const id=this.account.identity;if(!id||!/^custom:[a-f0-9]{24}$/.test(game))throw Error('Choose a registered game.');await this.writeRegistry(id,(await this.readRegistry(id)).filter(g=>g.game!==game));}
 async writeRegistry(id,entries){
  let data={};try{data=JSON.parse(await fs.readFile(this.file,'utf8'));}catch{}if(!data||typeof data!=='object'||Array.isArray(data))data={};
  data[id]=entries;await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',JSON.stringify(data),{mode:0o600});await fs.rename(this.file+'.tmp',this.file);
  if(this.account.identity===id){this.registered=entries;this.onChange();}void this.tick();
 }
 async send(context,session,action){return this.request(context,'external-activity',{game:session.game,title:session.title,session:session.id,sequence:++session.sequence,action});}
 async stop(){const current=this.current,context=this.context;this.current=null;if(current&&context)await this.send(context,current,'stop').catch(()=>{});}
 tick(){if(this.disposed||this.disabled)return Promise.resolve();if(this.pending)return this.pending.then(()=>{const id=this.account.state.status==='online'?this.account.identity:null;if(!this.disposed&&(this.context?.id||null)!==id)return this.tick();});this.pending=this.sample().catch(()=>{this.error='Activity detection will retry shortly.';}).finally(()=>{this.pending=null;this.onChange();});return this.pending;}
 async sample(){
  const id=this.account.state.status==='online'?this.account.identity:null;
  if(this.context?.id!==id){await this.stop();this.context=null;this.settings=null;this.registered=[];if(id){this.context={id,token:this.account.token};this.registered=await this.readRegistry(id);}}
  if(!id||this.disposed)return;
  const context=this.context;context.token=this.account.token;
  const valid=()=>!this.disposed&&this.account.state.status==='online'&&this.account.identity===id&&context===this.context;
  this.settings=await this.request(context,'activity-settings');if(!valid())return;
  if(!this.settings.shareActivity||!this.settings.externalGames||this.settings.invisible||this.managedGame()){await this.stop();this.error='';return;}
  if(!this.catalogAt||this.now()-this.catalogAt>300000){this.catalog=await this.catalogue(await this.roots());this.catalogAt=this.now();}
  if(!valid())return;
  const list=await this.processes();if(!valid())return;
  const next=detectGame(list,this.catalog,this.registered,this.current?.game);
  if(next?.game!==this.current?.game){await this.stop();if(!valid())return;if(next)this.current={...next,id:crypto.randomUUID(),sequence:-1,started:false};}
  if(this.current){const current=this.current,result=await this.send(context,current,current.started?'tick':'start');if(valid()&&this.current===current){if(result.superseded||result.sharing===false)this.current=null;else current.started=true;}}
  this.error='';
 }
 dispose(){if(this.disposed)return;this.disposed=true;clearInterval(this.timer);void this.stop();this.registered=[];}
}
module.exports={ExternalActivity,parseVdf,steamGames,detectGame,processList,steamRoots};
