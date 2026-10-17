(() => {
 'use strict';
 const canvas=document.getElementById('unity-canvas'),loading=document.getElementById('loading'),status=document.getElementById('status'),progress=document.getElementById('progress'),retry=document.getElementById('retry');
 const embedded=parent!==window;document.body.dataset.embedded=String(embedded);
 const notify=state=>{if(embedded)parent.postMessage({type:'repo-dashboard-runtime',state},location.origin);};
 const nativeFetch=window.fetch.bind(window),lifetime=new AbortController();let unity=null,failed=false;
 const mouseNotice=document.getElementById('mouse-notice');
 const releasePointer=window.repoRunnerPointer.install(canvas,{onUnavailable:()=>{mouseNotice.hidden=false;},onReady:()=>{mouseNotice.hidden=true;}});
 document.getElementById('mouse-retry').onclick=()=>{canvas.focus();canvas.requestPointerLock();};
 document.getElementById('mouse-dismiss').onclick=()=>{mouseNotice.hidden=true;};
 const dataUrl=new URL('game.data',location.href).href;
 function fail(message){if(failed)return;failed=true;loading.hidden=false;status.textContent=message;progress.hidden=true;retry.hidden=false;}
 retry.onclick=()=>location.reload();
 document.getElementById('back').onclick=event=>{if(embedded){event.preventDefault();notify('close');}};
 document.getElementById('fullscreen').onclick=()=>{const task=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();task?.catch(()=>{});};
 addEventListener('pagehide',()=>{lifetime.abort();releasePointer();window.fetch=nativeFetch;unity?.Quit().catch(()=>{});},{once:true});
 // Hide the parent opening cover; this page owns byte-level loading progress and retry.
 notify('loading');
 (async()=>{
  const response=await nativeFetch('build.json',{cache:'no-store',signal:lifetime.signal});
  if(!response.ok)throw Error('The game could not be loaded. Please try again.');
  const build=await response.json();
  window.fetch=(input,options)=>{
   const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href).href;
   if(url===dataUrl)return Promise.resolve(window.repoRunnerData.dataResponse(build.data,nativeFetch,lifetime.signal));
   return nativeFetch(input,options);
  };
  await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=build.loader;script.onload=resolve;script.onerror=()=>reject(Error('The game could not be loaded. Please try again.'));document.head.append(script);});
  unity=await createUnityInstance(canvas,{arguments:[],autoSyncPersistentDataPath:true,dataUrl,frameworkUrl:build.framework,codeUrl:build.code,streamingAssetsUrl:'StreamingAssets',companyName:'Repo Company',productName:build.name,productVersion:build.version,cacheControl:()=> 'no-store',devicePixelRatio:Math.min(devicePixelRatio,2),showBanner:(message,type)=>{if(type==='error')fail('The game could not start in this browser. Please try again.');else console.warn(message);}},value=>{progress.value=value;status.textContent=value<.9?'Loading game · '+Math.round(value*100)+'%':'Starting Repo Runners…';});
  if(failed)return;
  loading.hidden=true;canvas.focus();notify('ready');
 })().catch(error=>{if(!lifetime.signal.aborted){console.error(error);fail('The game could not finish loading. Please check your connection and try again.');}});
})();
