/* Records visible play on the separate game sites. Account tokens stay on RepoCompany. */
(() => {
 'use strict';
 if(window.repoGamePlaytime)return;
 const script=document.currentScript,game=script?.dataset.game;
 if(!['moratales','manager','morogue','dragonbound'].includes(game))return;
 const dashboard=new URL(script.src).origin;
 const frame=document.createElement('iframe');
 frame.title='RepoCompany play-time connection';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 frame.style.cssText='position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;pointer-events:none;opacity:0';
 frame.src=dashboard+'/game-playtime-bridge.html?game='+encodeURIComponent(game)+'&parent='+encodeURIComponent(location.origin);
 let ready=false,timer;
 function pulse(active=!document.hidden){if(ready)frame.contentWindow.postMessage({type:'repo-game-activity',game,active},dashboard);}
 function run(){clearInterval(timer);pulse();timer=setInterval(()=>pulse(),10000);}
 addEventListener('message',event=>{
  if(event.origin!==dashboard||event.source!==frame.contentWindow||event.data?.type!=='repo-game-tracker-ready')return;
  ready=true;run();
 });
 document.addEventListener('visibilitychange',()=>pulse());
 addEventListener('pagehide',()=>{pulse(false);clearInterval(timer);});
 addEventListener('pageshow',()=>{if(ready)run();});
 window.repoGamePlaytime=Object.freeze({game});
 document.body.append(frame);
})();
