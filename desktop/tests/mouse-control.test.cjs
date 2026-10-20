const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createMouseControl,validMouse,validKeyboard,SHORTCUT}=require('../lib/mouse-control.cjs');
function fixture(){
 const handlers={},listeners={},shortcuts=new Map(),writes=[],events=[];
 const portal={mainFrame:{},getURL:()=> 'https://repocompany.uk/',isDestroyed:()=>false,send:(name,data)=>events.push(data)};
 const event={sender:portal,senderFrame:portal.mainFrame},account={identity:'alice',state:{status:'online'}};
 let allow=true,register=true,spawned=0;
 class Window extends EventEmitter{constructor(){super();this.webContents={setWindowOpenHandler(){},on(){}};}isDestroyed(){return false;}destroy(){}loadFile(){return Promise.resolve();}showInactive(){}}
 const screen=new EventEmitter();screen.getAllDisplays=()=>[{id:1,bounds:{x:0,y:0,width:100,height:100}}];screen.dipToScreenRect=(_w,b)=>b;
 const control=createMouseControl({BrowserWindow:Window,ipcMain:{handle:(k,f)=>handlers[k]=f,on:(k,f)=>listeners[k]=f},globalShortcut:{register:(k,f)=>{if(register)shortcuts.set(k,f);return register;},unregister:k=>shortcuts.delete(k)},screen,dialog:{showMessageBox:async()=>({response:allow?1:0})},getWindow:()=>({}),getPortal:()=>portal,getAccount:()=>account,isPortalUrl:u=>u==='https://repocompany.uk/',spawnHelper:()=>{
  spawned++;const child=new EventEmitter();child.stdout=new EventEmitter();child.stdin=new EventEmitter();child.stdin.write=s=>writes.push(s);child.stdin.end=s=>{writes.push(s);child.exitCode=0;};child.kill=()=>{};child.exitCode=null;process.nextTick(()=>child.stdout.emit('data','ready'));return child;
 }});
 return {control,event,account,writes,events,shortcuts,handlers,listeners,get spawned(){return spawned;},set allow(v){allow=v;},set register(v){register=v;}};
}
test('mouse payload bounds',()=>{assert(validMouse({x:0,y:65535,buttons:7,wheel:-1200}));for(const v of [{x:NaN},{x:-1},{buttons:8},{wheel:1201},{x:'1'}])assert(!validMouse({x:1,y:1,buttons:0,wheel:0,...v}));});
test('keyboard accepts bounded text and known keys only',()=>{
 assert(validKeyboard({kind:'key',key:162,down:true}));assert(validKeyboard({kind:'text',text:'Wibs £ 🐱'}));assert(validKeyboard({kind:'release'}));
 for(const v of [{kind:'key',key:255,down:true},{kind:'key',key:65,down:1},{kind:'text',text:'x'.repeat(33)},{kind:'text',text:'hello\n'},{kind:'command',text:'run'}])assert(!validKeyboard(v));
});
test('native consent, frame isolation, emergency stop, display selection and release',async()=>{
 const f=fixture(),start=()=>f.handlers['launcher:mouse-start'](f.event,{name:'Bob'});
 try{
  await assert.rejects(start,/entire screen/);f.control.select({id:'window:10',display_id:'1'});await assert.rejects(start,/entire screen/);
  f.control.select({id:'screen:0',display_id:'1'});f.allow=false;await assert.rejects(start,/cancelled/);assert.equal(f.spawned,0);
  f.allow=true;f.register=false;await assert.rejects(start,/shortcut/);assert.equal(f.spawned,0);f.register=true;
  await assert.rejects(()=>f.handlers['launcher:mouse-start']({...f.event,senderFrame:{}},{name:'Bob'}),/unavailable/);
  const {id}=await start();assert.equal(f.spawned,1);assert(f.shortcuts.has(SHORTCUT));
  const input={id,x:200,y:400,buttons:1,wheel:0};f.listeners['launcher:mouse-input']({...f.event,senderFrame:{}},input);assert.equal(f.writes.filter(s=>s.startsWith('mouse')).length,0);
  f.listeners['launcher:mouse-input'](f.event,input);assert(f.writes.includes('mouse 200 400 1 0\n'));
  f.listeners['launcher:mouse-input'](f.event,{id,kind:'key',key:162,down:true});assert(f.writes.includes('key 162 1\n'));
  f.listeners['launcher:mouse-input'](f.event,{id,kind:'text',text:'Hi'});assert(f.writes.includes('text 72 105\n'));
  f.listeners['launcher:mouse-input'](f.event,{id,kind:'release'});assert(f.writes.includes('release\n'));
  f.shortcuts.get(SHORTCUT)();assert(f.writes.includes('stop\n'));assert(!f.shortcuts.has(SHORTCUT));
  const count=f.writes.length;f.listeners['launcher:mouse-input'](f.event,input);assert.equal(f.writes.length,count);
  f.control.select({id:'screen:0',display_id:'1'});f.account.identity='bob';await assert.rejects(start,/entire screen/);
 }finally{f.control.dispose();}
});
