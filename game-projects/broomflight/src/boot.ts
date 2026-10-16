import('./main').catch(error=>{
 console.error('Broomflight could not start',error);
 const message=document.createElement('section');message.className='error-panel';
 message.innerHTML='<h2>Broomflight could not start</h2><p>Try reloading. If it happens again, check that graphics acceleration is enabled in your browser.</p><button>Try again</button><a href="/Demos" target="_top">Back to demos</a>';
 message.querySelector('button')!.onclick=()=>location.reload();document.body.append(message);
 if(parent!==window)parent.postMessage({type:'repo-dashboard-runtime',state:'error'},location.origin);
});
