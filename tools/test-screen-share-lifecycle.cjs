const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};},selection=deferred(),constraints=deferred();let stopped=0,peers=0;
 const track={stop(){stopped++;},applyConstraints:()=>constraints.promise,getSettings:()=>({width:1280,height:720,frameRate:15})},stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const element=()=>({children:[],classList:{toggle(){}},append(...children){this.children.push(...children);},setAttribute(){}}),sandbox={document:{documentElement:{dataset:{}},createElement:element},navigator:{mediaDevices:{getDisplayMedia:()=>selection.promise}},RTCPeerConnection:function(){peers++;throw Error('Cancelled capture must not create a connection');},addEventListener(){}};sandbox.window=sandbox;
 vm.runInNewContext(fs.readFileSync(require.resolve('../repo-screen-share.js'),'utf8'),sandbox);
 const room={id:'room',screen:{enabled:true}},context={user:'alice',connected:true,room},control=sandbox.createRepoScreenShare({api:()=>{throw Error('Cancelled capture must not reach the server');},context:()=>context,changed(){},refresh(){}}),container=element();control.render(container,room,true);
 return {selection,constraints,stream,control,start:()=>container.children[0].children[0].onclick(),stopped:()=>stopped,peers:()=>peers};
}
(async()=>{
 let f=fixture(),pending=f.start();f.control.reset();f.selection.resolve(f.stream);await pending;assert.equal(f.stopped(),1);assert.equal(f.peers(),0);
 f=fixture();pending=f.start();f.selection.resolve(f.stream);await Promise.resolve();f.control.reset();f.constraints.resolve();await pending;assert.equal(f.stopped(),1);assert.equal(f.peers(),0);
 console.log('PASS: late screen selection and pending capture constraints cannot restart media after cancellation/sign-out.');
})().catch(error=>{console.error(error);process.exitCode=1;});
