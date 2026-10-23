/* Records visible play on the separate game sites. Account tokens stay on RepoCompany. */
(() => {
 'use strict';
 if(window.repoGamePlaytime)return;
 const script=document.currentScript,game=script?.dataset.game;
 if(!['moratales','manager','morogue','comp-run','dragonbound'].includes(game))return;
 const dashboard=new URL(script.src).origin;
 const frame=document.createElement('iframe');
 frame.title='RepoCompany play-time connection';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
 frame.style.cssText='position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;pointer-events:none;opacity:0';
 frame.src=dashboard+'/game-playtime-bridge.html?game='+encodeURIComponent(game)+'&parent='+encodeURIComponent(location.origin);
 let ready=false,timer,lastInput=performance.now(),previousClock=null,rewardState=null;
 const held=new Set();
 for(const type of ['keydown','pointerdown','pointermove','wheel','touchstart'])addEventListener(type,event=>{if(event.isTrusted){lastInput=performance.now();if(type==='keydown')held.add(event.code);}}, {passive:true});
 addEventListener('keyup',event=>held.delete(event.code));addEventListener('blur',()=>held.clear());
 function earning(active){
  let state;
  if(game==='comp-run')state=window.REPO_GAME_REWARD_STATE?.();
  else if(game==='morogue'){const s=window.__moratalesSurvivor?.game?.state;state=s&&{active:s.status==='playing',time:s.actualTime};}
  if(!state){previousClock=null;return false;}
  const time=Number(state.time),advancing=Number.isFinite(time)&&previousClock!==null&&time>previousClock;
  previousClock=Number.isFinite(time)?time:null;
  try{for(const pad of navigator.getGamepads?.()||[])if(pad&&(pad.buttons.some(b=>b.pressed)||pad.axes.some(a=>Math.abs(a)>.18)))lastInput=performance.now();}catch{}
  return active&&state.active===true&&advancing&&(held.size>0||performance.now()-lastInput<60000);
 }
 function pulse(active=!document.hidden){if(game==='comp-run'&&window.REPO_LAUNCHER_CONTEXT)active=active&&window.REPO_LAUNCHER_GAME?.active===true;if(ready)frame.contentWindow.postMessage({type:'repo-game-activity',game,active,rewardActive:earning(active)},dashboard);}
 function run(){clearInterval(timer);pulse();timer=setInterval(()=>pulse(),10000);}
 addEventListener('message',event=>{
  if(event.origin!==dashboard||event.source!==frame.contentWindow)return;
  if(event.data?.type==='repo-play-rewards'&&event.data.game===game){rewardState=event.data.reward;dispatchEvent(new CustomEvent('repo-game-rewards',{detail:rewardState}));return;}
  if(event.data?.type!=='repo-game-tracker-ready')return;
  ready=true;run();
 });
 document.addEventListener('visibilitychange',()=>pulse());
 addEventListener('repo-game-playtime-visibility',()=>pulse());
 addEventListener('pagehide',()=>{pulse(false);clearInterval(timer);});
 addEventListener('pageshow',()=>{if(ready)run();});
 window.repoGamePlaytime=Object.freeze({game,get rewards(){return rewardState;}});
 document.body.append(frame);
})();
