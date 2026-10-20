const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const listeners=new Map(),calls=[],room={id:'room',mine:{owned:true,status:'active'},screen:{publishing:true,active:{id:'screen',watchers:[{id:'bob',display:'Bob'}]}}};
 const sandbox={console,setTimeout,clearTimeout,setInterval,clearInterval,crypto:require('node:crypto').webcrypto,
  document:{documentElement:{dataset:{repoMouseControl:'true'}}},addEventListener:(name,fn)=>listeners.set(name,fn),
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},dispatchEvent(){},
  RTCPeerConnection:class{createDataChannel(){return {close(){},readyState:'connecting'};}async createOffer(){return {type:'offer',sdp:'v=0'};}async setLocalDescription(d){this.localDescription=d;}close(){}},
  repoVoiceConnection:{gather:async()=>{}}};sandbox.window=sandbox;
 vm.runInNewContext(fs.readFileSync(require.resolve('../repo-mouse-control.js'),'utf8'),sandbox);
 const control=sandbox.createRepoMouseControl({api:async(op)=>{calls.push(op);return {control:'grant'};},context:()=>({connected:true,room}),refresh(){},screenState:()=>({mode:'publish'})});
 try{
  listeners.get('repo-mouse-granted')({detail:{viewer:'bob',id:'native'}});
  await new Promise(r=>setImmediate(r));assert.deepEqual(calls,['control-grant']);
  control.sync({...room,control:null});assert.deepEqual(calls,['control-grant'],'pre-grant heartbeat must not revoke a new grant');
  control.sync({...room,control:{id:'grant'}});
  control.sync({...room,control:null});assert.deepEqual(calls,['control-grant','control-stop'],'revocation after confirmation must stop immediately');
  console.log('PASS: stale heartbeat cannot cancel a new grant; confirmed revocation still stops control.');
 }finally{control.reset();}
})().catch(e=>{console.error(e);process.exitCode=1});
