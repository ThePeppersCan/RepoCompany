'use strict';
const path=require('node:path'),{spawn}=require('node:child_process'),crypto=require('node:crypto');
const SHORTCUT='Control+Alt+Shift+F12';
function validMouse(v){return v&&(!v.kind||v.kind==='mouse')&&Number.isInteger(v.x)&&v.x>=0&&v.x<=65535&&Number.isInteger(v.y)&&v.y>=0&&v.y<=65535&&Number.isInteger(v.buttons)&&v.buttons>=0&&v.buttons<=7&&Number.isInteger(v.wheel)&&Math.abs(v.wheel)<=1200;}
function allowedKey(k){return Number.isInteger(k)&&([8,9,13,20,27,45,46,144,145].includes(k)||(k>=32&&k<=40)||(k>=48&&k<=57)||(k>=65&&k<=93)||(k>=96&&k<=123)||(k>=160&&k<=165)||(k>=186&&k<=192)||(k>=219&&k<=222));}
function validKeyboard(v){return v?.kind==='release'||(v?.kind==='key'&&allowedKey(v.key)&&typeof v.down==='boolean')||(v?.kind==='text'&&typeof v.text==='string'&&v.text.length>0&&v.text.length<=32&&!/[\u0000-\u001f\u007f]/.test(v.text));}
function createMouseControl({BrowserWindow,ipcMain,globalShortcut,screen,dialog,getWindow,getPortal,getAccount,isPortalUrl,spawnHelper=spawn}){
 let source=null,current=null,generation=0,pending=false;
 const identity=()=>getAccount()?.state.status==='online'?getAccount().identity:null;
 const trusted=e=>{try{return !!identity()&&e.sender===getPortal()&&!e.sender.isDestroyed()&&e.senderFrame===e.sender.mainFrame&&isPortalUrl(e.sender.getURL());}catch{return false;}};
 function notify(data){const p=getPortal();if(p&&!p.isDestroyed())p.send('launcher:mouse-state',data);}
 function stop(reason='Remote control stopped.'){
  generation++;const c=current;current=null;globalShortcut.unregister(SHORTCUT);
  if(c){clearInterval(c.timer);globalShortcut.unregister(SHORTCUT);c.child.stdin.end('stop\n');if(c.bar&&!c.bar.isDestroyed())c.bar.destroy();setTimeout(()=>{if(c.child.exitCode===null)c.child.kill();},2200).unref();}
  notify({active:false,reason});
 }
 function select(value){stop();source=value?.id?.startsWith('screen:')?{display:String(value.display_id),identity:identity()}:null;notify({capable:!!source});}
 async function start(event,value){
  if(!trusted(event)||pending||process.platform!=='win32')throw Error('Remote control is unavailable.');
  stop();const rev=generation,user=identity(),selected=source;
  if(!selected||selected.identity!==user)throw Error('Share an entire screen to give mouse control.');
  const display=screen.getAllDisplays().find(d=>String(d.id)===selected.display);
  if(!display)throw Error('The shared display is no longer available.');
  if(typeof value?.name!=='string'||!value.name.trim()||value.name.length>80)throw Error('Choose a viewer.');
  const valid=()=>rev===generation&&user===identity()&&source===selected&&trusted(event);
  pending=true;
  try{
   const answer=await dialog.showMessageBox(getWindow(),{type:'question',title:'Give control',message:'Give '+value.name+' mouse and keyboard control?',detail:'They can move, click, drag, scroll and type in applications on the shared screen. Press Ctrl+Alt+Shift+F12 or Stop control to end access. Clipboard and file transfer are not shared.',buttons:['Cancel','Give control'],defaultId:0,cancelId:0,noLink:true});
   if(answer.response!==1||!valid())throw Error('Remote control was cancelled.');
   if(!globalShortcut.register(SHORTCUT,()=>stop('Remote control stopped by emergency shortcut.')))throw Error('The emergency shortcut is unavailable. Remote control was not started.');
   const rect=screen.dipToScreenRect(null,display.bounds);
   const sourceCode=require('node:fs').readFileSync(path.join(__dirname,'mouse-input.cs')).toString('base64');
   const executable=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
   const child=spawnHelper(executable,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; Add-Type -TypeDefinition ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('"+sourceCode+"'))); [WibsMouse]::Run()"],{windowsHide:true,stdio:['pipe','pipe','pipe']});
   const c={id:crypto.randomUUID(),child,display:display.id,rect,user,deadline:Date.now()+15000,bar:null,last:0,timer:null};current=c;
   child.stdin.on('error',()=>{if(current===c)stop('Remote control disconnected.');});
   child.on('error',()=>{if(current===c)stop('Windows mouse control could not start.');});
   child.on('exit',()=>{if(current===c)stop('Windows mouse control ended.');});
   await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(Error('Windows mouse control did not start.')),12000);
    child.stdout.once('data',chunk=>{clearTimeout(timeout);String(chunk).trim()==='ready'?resolve():reject(Error('Windows mouse control could not start.'));});
    child.once('error',()=>{clearTimeout(timeout);reject(Error('Windows mouse control could not start.'));});
    child.once('exit',()=>{clearTimeout(timeout);reject(Error('Windows mouse control ended.'));});
   });
   if(!valid()||current!==c)throw Error('Remote control was cancelled.');
   child.stdin.write(`start ${rect.x} ${rect.y} ${rect.width} ${rect.height}\n`);
   c.bar=new BrowserWindow({show:false,x:display.bounds.x+Math.max(0,display.bounds.width-500),y:display.bounds.y+20,width:480,height:104,resizable:false,alwaysOnTop:true,skipTaskbar:true,title:'Wibs mouse control',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'../renderer/mouse-control-preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});
   c.bar.webContents.setWindowOpenHandler(()=>({action:'deny'}));c.bar.webContents.on('will-navigate',e=>e.preventDefault());
   c.bar.on('closed',()=>{if(current===c)stop();});await c.bar.loadFile(path.join(__dirname,'../renderer/mouse-control.html'));c.bar.showInactive();
   c.timer=setInterval(()=>{if(current!==c)return;if(!identity()||identity()!==c.user||Date.now()>c.deadline){stop('Remote control lost its connection.');return;}child.stdin.write('alive\n');},400);
   c.deadline=Date.now()+30000;
   return {id:c.id};
  }catch(e){stop();throw e;}finally{pending=false;}
 }
 ipcMain.handle('launcher:mouse-start',start);
 ipcMain.on('launcher:mouse-input',(e,v)=>{
  const c=current;if(!c||!trusted(e)||v?.id!==c.id||Date.now()>c.deadline||!(validKeyboard(v)||validMouse(v)))return;
  const now=Date.now();if(!c.rate||now-c.rate.at>=1000)c.rate={at:now,n:0};if(++c.rate.n>120){stop('Remote control sent too many events.');return;}
  if(v.kind==='release'){c.child.stdin.write('release\n');return;}
  if(v.kind==='key'){c.child.stdin.write(`key ${v.key} ${v.down?1:0}\n`);return;}
  if(v.kind==='text'){c.child.stdin.write('text '+Array.from({length:v.text.length},(_,i)=>v.text.charCodeAt(i)).join(' ')+'\n');return;}
  if(Date.now()-c.last<15&&v.buttons===c.buttons&&!v.wheel)return;c.last=Date.now();c.buttons=v.buttons;c.child.stdin.write(`mouse ${v.x} ${v.y} ${v.buttons} ${v.wheel}\n`);
 });
 ipcMain.on('launcher:mouse-lease',(e,id)=>{if(current&&trusted(e)&&id===current.id)current.deadline=Date.now()+6000;});
 ipcMain.on('launcher:mouse-stop',(e)=>{if(trusted(e)||e.sender===current?.bar?.webContents)stop();});
 const reset=()=>{source=null;stop();};
 screen.on('display-removed',reset);screen.on('display-metrics-changed',reset);
 return {select,stop,reset,dispose:reset};
}
module.exports={createMouseControl,validMouse,validKeyboard,allowedKey,SHORTCUT};
