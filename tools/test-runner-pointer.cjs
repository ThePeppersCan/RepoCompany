'use strict';
const assert=require('node:assert/strict');
const {install}=require('../repo-runners/pointer-controls.js');
(async()=>{
 for(const behavior of ['promise failure','sync failure','legacy','success','unsupported']){
  const doc=new EventTarget();let failed=0,ready=0,calls=0;
  const canvas={ownerDocument:doc};
  if(behavior!=='unsupported')canvas.requestPointerLock=function(){
   assert.equal(this,canvas);calls++;
   if(behavior==='promise failure')return Promise.reject(new DOMException('Capture denied','UnknownError'));
   if(behavior==='sync failure')throw new DOMException('Inactive document','WrongDocumentError');
   if(behavior==='success'){doc.pointerLockElement=canvas;doc.dispatchEvent(new Event('pointerlockchange'));return Promise.resolve();}
  };
  const original=canvas.requestPointerLock;
  const dispose=install(canvas,{onUnavailable:()=>failed++,onReady:()=>ready++});
  await canvas.requestPointerLock();
  if(behavior==='legacy')doc.dispatchEvent(new Event('pointerlockerror'));
  assert.equal(ready,behavior==='success'?1:0);
  assert.equal(failed,behavior==='success'?0:1);
  if(behavior!=='unsupported')assert.equal(calls,1);
  dispose();assert.equal(canvas.requestPointerLock,original);
  doc.dispatchEvent(new Event('pointerlockerror'));assert.equal(failed,behavior==='success'?0:1);
 }
 const doc=new EventTarget();let reject,notices=0;
 const canvas={ownerDocument:doc,requestPointerLock:()=>new Promise((_resolve,r)=>{reject=r;})};
 const dispose=install(canvas,{onUnavailable:()=>notices++,onReady:()=>{}});
 const request=canvas.requestPointerLock();dispose();reject(Error('Late result'));await request;assert.equal(notices,0);
 console.log('PASS: mouse-capture success, promise/synchronous/legacy failures, unsupported browsers, and cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
