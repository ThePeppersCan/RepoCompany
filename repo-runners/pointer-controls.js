(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.repoRunnerPointer=factory();
})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 function install(canvas,{onUnavailable,onReady}){
  const doc=canvas.ownerDocument,original=canvas.requestPointerLock;
  const own=Object.getOwnPropertyDescriptor(canvas,'requestPointerLock');
  let disposed=false,requested=false;
  const unavailable=error=>{if(!disposed)onUnavailable(error);};
  // Unity ignores this API's returned Promise. Handle just that rejection,
  // preserving the browser's pointer-lock events and all other game errors.
  canvas.requestPointerLock=function(...args){
   requested=true;
   try{
    if(!original){unavailable(new Error('Mouse capture is unavailable.'));return;}
    const result=original.apply(canvas,args);
    if(result&&typeof result.catch==='function')return result.catch(unavailable);
    return result;
   }catch(error){unavailable(error);}
  };
  const changed=()=>{if(doc.pointerLockElement===canvas&&!disposed){requested=false;onReady();}};
  const rejected=()=>{if(requested)unavailable(new Error('Mouse capture was declined.'));};
  doc.addEventListener('pointerlockchange',changed);
  doc.addEventListener('pointerlockerror',rejected);
  return()=>{
   disposed=true;
   doc.removeEventListener('pointerlockchange',changed);
   doc.removeEventListener('pointerlockerror',rejected);
   if(own)Object.defineProperty(canvas,'requestPointerLock',own);
   else delete canvas.requestPointerLock;
  };
 }
 return{install};
});
