const {app,BrowserWindow,session,ipcMain,dialog,globalShortcut}=require('electron'),path=require('node:path');
const {configureMediaPermissions}=require('../lib/media-permissions.cjs'),{createScreenPicker}=require('../lib/screen-picker.cjs');
app.setPath('userData',process.env.SCREEN_TEST_PROFILE);
app.commandLine.appendSwitch('use-fake-device-for-media-stream');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
app.whenReady().then(async()=>{
 const login=JSON.parse(process.env.SCREEN_TEST_LOGIN),base=process.env.SCREEN_TEST_BASE,s=session.fromPartition('screen-test'),origin='https://repocompany.uk';
 let identity=login.user.id;const real=process.env.WIBS_REAL_INPUT_TEST==='1';
 const events=[];for(const name of ['setDisplayMediaRequestHandler','setPermissionCheckHandler','setPermissionRequestHandler']){const original=s[name].bind(s);s[name]=handler=>original((...args)=>{if(name==='setDisplayMediaRequestHandler'){const r=args[0];events.push({kind:'display',gesture:r.userGesture,video:r.videoRequested,audio:r.audioRequested,main:r.frame===portal.webContents.mainFrame,origin:r.securityOrigin});}else events.push({kind:name,permission:args[1],details:args[3]});return handler(...args);});}
 await s.protocol.handle('https',async request=>{
  const url=new URL(request.url);
  if(url.hostname.endsWith('.supabase.co')){const p=url.pathname;return Response.json(p.endsWith('/auth/v1/user')?login.user:p.endsWith('/auth/v1/token')?login:p.endsWith('/get_my_character')?[{username:'alice',id:login.user.id}]:[]);}
  if(url.origin!==origin)return new Response('Blocked fixture origin',{status:403});
  if(url.pathname==='/test-pattern'&&real)return new Response('<!doctype html><title>Wibs input test</title><style>body{margin:0;background:#234a45;color:white}textarea{box-sizing:border-box;width:100vw;height:100vh;font-size:40px;padding:30px}</style><textarea aria-label="Remote input test">Wibs input verification</textarea><script>window.inputEvents=[];for(const k of ["pointerdown","wheel","keydown","input"])addEventListener(k,e=>inputEvents.push({type:k,key:e.key,text:document.querySelector("textarea").value}));</script>',{headers:{'Content-Type':'text/html'}});
  if(url.pathname==='/test-pattern')return new Response('<!doctype html><title>Wibs screen test pattern</title><canvas width="1280" height="720"></canvas><script>const c=document.querySelector("canvas"),x=c.getContext("2d");let n=0;setInterval(()=>{x.fillStyle="#234a45";x.fillRect(0,0,1280,720);x.fillStyle="#e09172";x.fillRect((n++*8)%1000,250,200,200);x.fillStyle="white";x.font="50px sans-serif";x.fillText("Wibs screen sharing · 720p",80,130);},66)</script>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
  const headers=new Headers(request.headers);headers.set('Origin',base);headers.delete('Sec-Fetch-Site');
  const response=await fetch(base+url.pathname+url.search,{method:request.method,headers,...(['GET','HEAD'].includes(request.method)?{}:{body:await request.arrayBuffer()})});
  if(url.pathname==='/'){const html=await response.text(),script='<script>localStorage.setItem("sb-hvdrwmjieguurxvrgzfu-auth-token",'+JSON.stringify(JSON.stringify(login))+');</script>';return new Response(html.replace('<head>','<head>'+script),{headers:{'Content-Type':'text/html; charset=utf-8'}});}
  return response;
 });
 const source=new BrowserWindow({show:false,width:900,height:600,webPreferences:{session:s,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}});await source.loadURL(origin+'/test-pattern');
 const portal=new BrowserWindow({show:false,width:1440,height:900,webPreferences:{session:s,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true,preload:path.resolve(__dirname,'../portal-preload.cjs')}});
 // Real source picker and permission handlers; the only selectable source is
 // an application-owned synthetic WebContents, never the user's desktop.
 const picker=createScreenPicker({BrowserWindow,ipcMain,getWindow:()=>portal,hidden:true,desktopCapturer:{getSources:async()=>[{id:'fixture-pattern',name:'Wibs test pattern',thumbnail:await source.webContents.capturePage()}]}});
 const writes=[];let emergency;if(real){source.show();source.setAlwaysOnTop(true);source.focus();}
 const {EventEmitter}=require('node:events');const fakeScreen=new EventEmitter();fakeScreen.getAllDisplays=()=>[{id:1,bounds:real?source.getContentBounds():{x:0,y:0,width:1280,height:720}}];fakeScreen.dipToScreenRect=(_w,b)=>real?require('electron').screen.dipToScreenRect(null,b):b;
 class HiddenBar extends BrowserWindow{constructor(options){super({...options,show:false});}showInactive(){}}
 const mouse=require('../lib/mouse-control.cjs').createMouseControl({BrowserWindow:HiddenBar,ipcMain,globalShortcut:{register:(key,fn)=>{emergency=fn;return globalShortcut.register(key,fn);},unregister:key=>globalShortcut.unregister(key)},screen:fakeScreen,dialog:{showMessageBox:async()=>({response:1})},getWindow:()=>portal,getPortal:()=>portal.webContents,getAccount:()=>({identity,state:{status:'online'}}),isPortalUrl:u=>new URL(u).origin===origin,spawnHelper:(...args)=>{if(real){const child=require('node:child_process').spawn(...args),write=child.stdin.write.bind(child.stdin);child.stdout.on('data',b=>events.push({helper:String(b)}));child.stderr.on('data',b=>events.push({helperError:String(b)}));child.on('exit',code=>events.push({helperExit:code}));child.stdin.write=s=>{writes.push(s);return write(s);};return child;}const child=new EventEmitter();child.stdout=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=s=>writes.push(s);child.stdin.end=s=>{writes.push(s);child.exitCode=0;};child.kill=()=>{};child.exitCode=null;process.nextTick(()=>child.stdout.emit('data','ready'));return child;}});
 const permissions=configureMediaPermissions(s,{getPortal:()=>portal.webContents,getAccount:()=>({identity,state:{status:identity?'online':'signed-out'}}),getWindow:()=>portal,isPortalUrl:u=>new URL(u).origin===origin,dialog:{showMessageBox:async()=>({response:1})},chooseScreen:async valid=>{if(!await picker.choose(valid))return null;mouse.select({id:'screen:0',display_id:'1'});return source.webContents.mainFrame;},cancelScreen:()=>{picker.cancel();mouse.reset();}});
 global.screenTest={portal,source,permissions,events,mouse,writes,emergency:()=>emergency?.(),signOut(){identity=null;permissions.reset();}};
 await portal.loadURL(origin);
 portal.webContents.send('launcher:portal-visibility',true);
});
app.on('window-all-closed',()=>app.quit());
