(() => {
 'use strict';
 function mount(log){
  let following=true,frame=0,lastTop=0;
  function bottom(){frame=0;if(following&&log.isConnected){log.scrollTop=log.scrollHeight;lastTop=log.scrollTop;}}
  function schedule(){if(following&&!frame)frame=requestAnimationFrame(bottom);}
  const resize=new ResizeObserver(schedule);
  function observe(){resize.disconnect();resize.observe(log);for(const child of log.children)resize.observe(child);schedule();}
  const mutations=new MutationObserver(observe);mutations.observe(log,{childList:true});observe();
  // Delayed image decoding, resizing and font/layout changes keep the newest row visible.
  log.addEventListener('load',schedule,true);
  log.addEventListener('wheel',event=>{if(event.deltaY<0)following=false;},{passive:true});
  log.addEventListener('touchstart',()=>{following=false;},{passive:true});
  log.addEventListener('keydown',event=>{if(['ArrowUp','PageUp','Home'].includes(event.key))following=false;});
  log.addEventListener('scroll',()=>{const top=log.scrollTop;if(log.scrollHeight-top-log.clientHeight<8)following=true;else if(top<lastTop-1)following=false;lastTop=top;},{passive:true});
  return Object.freeze({follow(){following=true;bottom();schedule();},pause(){following=false;cancelAnimationFrame(frame);frame=0;}});
 }
 window.repoChatScroll=Object.freeze({mount});
})();
