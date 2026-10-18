// Local layout preferences only; resizing never remounts chat or call media.
(() => {
 'use strict';
 const drawer=document.getElementById('repo-messages'),layout=drawer?.querySelector('.rc-layout'),below=drawer?.querySelector('.rc-below'),center=drawer?.querySelector('.rc-center'),stage=drawer?.querySelector('.repo-call-stage');
 if(!layout||!below||!center||!stage)return;
 const key='wibs-panel-sizes-v1',clamp=(n,min,max)=>Math.max(min,Math.min(max,n));let saved={},drag=null,frame=0;
 try{const value=JSON.parse(localStorage.getItem(key)||'{}');for(const name of ['left','right','voice','screen'])if(Number.isFinite(value?.[name]))saved[name]=value[name];}catch{}
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(saved));}catch{}};
 const mode=()=>stage.querySelector('.repo-screen-viewer,.repo-camera-tile')?'screen':'voice';
 function separator(name,orientation,parent){const node=document.createElement('div');node.className='repo-panel-divider';node.dataset.resize=name;node.tabIndex=0;node.setAttribute('role','separator');node.setAttribute('aria-label',name==='left'?'Resize channels sidebar':name==='right'?'Resize activity and members':'Resize call area');node.setAttribute('aria-orientation',orientation);parent.append(node);return node;}
 const left=separator('left','vertical',layout),right=separator('right','vertical',below),call=separator('call','horizontal',stage);
 function metrics(){
  const width=layout.clientWidth,hasRight=innerWidth>960,leftDefault=innerWidth<=1100?226:innerWidth>=1600?300:260,rightDefault=innerWidth<=1100?226:innerWidth>=1600?310:274;
  const rightWidth=hasRight?clamp(saved.right??rightDefault,220,Math.min(480,width-540)):0;
  const leftMax=Math.max(220,Math.min(480,width-320-rightWidth)),leftWidth=clamp(saved.left??leftDefault,220,leftMax);
  const rightMax=Math.max(220,Math.min(480,width-leftWidth-320));
  const cssMax=parseFloat(getComputedStyle(stage).maxHeight);
  const callMax=Math.max(130,Math.min(center.clientHeight-180,Number.isFinite(cssMax)?cssMax:Infinity)),callMin=Math.min(mode()==='screen'?240:190,callMax);
  return {width,hasRight,leftWidth,rightWidth,leftMax,rightMax,callMin,callMax};
 }
 function aria(node,value,min,max){node.setAttribute('aria-valuenow',Math.round(value));node.setAttribute('aria-valuemin',Math.round(min));node.setAttribute('aria-valuemax',Math.round(max));node.setAttribute('aria-valuetext',Math.round(value)+' pixels');}
 function apply(){
  frame=0;if(!drawer.open||!layout.clientWidth)return;
  const m=metrics();left.hidden=innerWidth<=640;right.hidden=!m.hasRight;
  if(innerWidth>640){layout.style.setProperty('--wibs-sidebar-width',m.leftWidth+'px');left.style.left=(m.leftWidth-4)+'px';}
  if(m.hasRight){below.style.setProperty('--wibs-members-width',m.rightWidth+'px');right.style.right=(m.rightWidth-4)+'px';}
  aria(left,m.leftWidth,220,m.leftMax);aria(right,m.rightWidth,220,m.rightMax);
  const preference=saved[mode()];stage.dataset.resized=String(Number.isFinite(preference));
  if(Number.isFinite(preference))stage.style.setProperty('--wibs-call-height',clamp(preference,m.callMin,m.callMax)+'px');
  else stage.style.removeProperty('--wibs-call-height');
  call.hidden=stage.hidden||stage.classList.contains('is-collapsed');
  aria(call,stage.getBoundingClientRect().height,m.callMin,m.callMax);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(apply);};
 function value(name){return name==='left'?layout.querySelector('.rc-sidebar').getBoundingClientRect().width:name==='right'?below.querySelector('.rc-members').getBoundingClientRect().width:stage.getBoundingClientRect().height;}
 function set(name,size){const m=metrics(),property=name==='call'?mode():name;const min=name==='call'?m.callMin:220,max=name==='left'?m.leftMax:name==='right'?m.rightMax:m.callMax;saved[property]=clamp(size,min,max);apply();}
 function finish(){if(!drag)return;const old=drag;drag=null;old.node.classList.remove('is-dragging');delete drawer.dataset.resizing;if(old.node.hasPointerCapture(old.id))old.node.releasePointerCapture(old.id);persist();}
 for(const node of [left,right,call]){
  const name=node.dataset.resize;
  node.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();finish();drag={node,id:event.pointerId,start:name==='call'?event.clientY:event.clientX,size:value(name)};node.setPointerCapture(event.pointerId);node.classList.add('is-dragging');drawer.dataset.resizing=name==='call'?'row':'column';node.focus({preventScroll:true});});
  node.addEventListener('pointermove',event=>{if(!drag||drag.node!==node||drag.id!==event.pointerId)return;const delta=(name==='call'?event.clientY:event.clientX)-drag.start;set(name,drag.size+(name==='right'?-delta:delta));});
  node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);node.addEventListener('lostpointercapture',finish);
  node.addEventListener('dblclick',()=>{delete saved[name==='call'?mode():name];persist();apply();});
  node.addEventListener('keydown',event=>{
   const arrows=name==='call'?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight'];
   if(event.key==='Enter'){delete saved[name==='call'?mode():name];persist();apply();event.preventDefault();return;}
   if(!arrows.includes(event.key))return;event.preventDefault();
   const direction=(event.key===arrows[1]?1:-1)*(name==='right'?-1:1);set(name,value(name)+direction*(event.shiftKey?40:10));persist();
  });
 }
 addEventListener('blur',finish);addEventListener('resize',()=>{finish();schedule();});drawer.addEventListener('close',finish);
 new ResizeObserver(schedule).observe(center);new ResizeObserver(schedule).observe(layout);
 new MutationObserver(schedule).observe(drawer,{attributes:true,attributeFilter:['open']});
 new MutationObserver(schedule).observe(stage,{attributes:true,attributeFilter:['hidden','class']});
 const media=stage.querySelector('.repo-call-stage-media');if(media)new MutationObserver(schedule).observe(media,{attributes:true,attributeFilter:['hidden']});
 const content=stage.querySelector('.repo-call-stage-content');if(content)new MutationObserver(schedule).observe(content,{childList:true,subtree:true});
 schedule();
})();
