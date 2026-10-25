'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('achievement-client-comp-run.js','utf8'),base='https://repocompany.uk';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture(native){
 const listeners=new Map(),calls=[],control={addEventListener(){},textContent:'',disabled:false};
 const state={now:Date.now(),starts:0,status:200,result:{owned:[],balance:10000},deferred:null};
 const on=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};
 const dispatch=e=>{for(const fn of listeners.get(e.type)||[])fn(e);};
 const result=()=>({session:'test-session',achievements:[],cosmeticsAccess:{ticket:'test-scoped-ticket-'+(++state.starts),expires:state.now+900000}});
 const frame={style:{},setAttribute(){},contentWindow:{postMessage(message,origin){
  assert.equal(origin,base);assert.equal(message.kind,'start');const reply=result();
  queueMicrotask(()=>dispatch({type:'message',origin:base,source:frame.contentWindow,data:{type:'repo-achievements',game:'comp-run',kind:'result',request:message.request,result:reply}}));
 }}};
 let nativeUpdate;
 const window={REPO_LAUNCHER_CONTEXT:native?{gameId:'comp-run',accountId:'account-a'}:null};
 if(native)window.REPO_LAUNCHER={onConnectionChanged:fn=>nativeUpdate=fn,checkConnection:async()=>({status:'online'}),requestAccount:async kind=>{assert.equal(kind,'start');return result();}};
 const context={window,document:{currentScript:{src:base+'/game-integrations/comp-run/achievement-runtime.js',dataset:{game:'comp-run',portal:base,bundled:'true'}},createElement:()=>frame,body:{append(){}},getElementById:()=>control,addEventListener:on},location:{origin:native?'null':'https://comp-run.fluffy-star-4855.chatgpt.site'},URL,Date:class extends Date{static now(){return state.now;}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,queueMicrotask,addEventListener:on,dispatchEvent:dispatch,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},localStorage:{getItem:()=>null,setItem(){}},AbortSignal,fetch:async(url,options)=>{
  assert.equal(url,base+'/api/comp-run/cosmetics');const body=JSON.parse(options.body);calls.push(body);
  assert.equal(options.method,'POST');assert(!('Authorization' in options.headers));assert(!('user' in body)&&!('price' in body));
  if(state.deferred)await state.deferred;
  return Response.json(state.result,{status:state.status});
 }};
 vm.runInNewContext(source,context,{filename:'achievement-client-comp-run.js'});await tick();
 const login=(id,origin=base)=>{if(native){window.REPO_LAUNCHER_CONTEXT.accountId=id;nativeUpdate({status:id?'online':'offline'});}else dispatch({type:'message',origin,source:frame.contentWindow,data:{type:'repo-achievements',game:'comp-run',kind:'account',user:id}});};
 if(!native)login('account-a');return{api:window.repoGameAchievements,state,calls,login,control};
}
(async()=>{
 for(const native of [false,true]){
  const f=await fixture(native);
  assert.equal(f.api.identity,'account-a');
  await f.api.cosmetics('state');assert.equal(f.state.starts,1);
  f.state.result={owned:['jester'],balance:6400};await f.api.cosmetics('buy','jester');
  assert.equal(f.state.starts,1,'An unexpired capability is reused');assert.equal(f.calls.at(-1).finishId,'jester');
  f.state.result={owned:['jester'],runners:['archfiend'],balance:4000};await f.api.cosmetics('buy-runner','archfiend');assert.equal(f.calls.at(-1).runnerId,'archfiend');assert.equal(f.calls.at(-1).action,'buy-runner');
  f.state.now+=900001;await f.api.cosmetics('state');assert.equal(f.state.starts,2,'Expired capability is renewed');
  f.state.status=401;f.state.result={error:'Reconnect',reconnect:true};const before=f.calls.length;
  await assert.rejects(f.api.cosmetics('buy','sovereign'),/Reconnect/);assert.equal(f.calls.length,before+1,'No automatic purchase retry');
  f.state.status=200;f.state.result={owned:['jester'],balance:6400};await f.api.cosmetics('state');assert.equal(f.state.starts,3);
  let release;f.state.deferred=new Promise(resolve=>release=resolve);
  const pending=f.api.cosmetics('buy','sovereign');await tick();
  await assert.rejects(f.api.cosmetics('buy','sovereign'),/still processing/);
  f.login(null);release();await assert.rejects(pending,/account changed/);
  f.state.deferred=null;f.login('account-a');await f.api.cosmetics('state');
  f.login('account-b');assert.equal(f.control.textContent,'REOPEN GAME TO CONNECT');assert.equal(f.control.disabled,true);
  const count=f.calls.length;await assert.rejects(f.api.cosmetics('buy','jester'),/Connect your Repo/);assert.equal(f.calls.length,count);
 }
 const web=await fixture(false);web.login('intruder','https://untrusted.invalid');assert.equal(web.api.identity,'account-a');
 console.log('PASS: browser and existing native purchase bridge; ticket renewal, no purchase retry, concurrent guard, sign-out and account-switch isolation, rejected foreign messages. No real purchases.');
})().catch(error=>{console.error(error);process.exitCode=1;});
