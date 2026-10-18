// Pointer capture and persisted pane widths, shared by the parent shell and player.
(() => {
 'use strict';
 function mount({host,edge,key,label,initial,min=210,max=520,available,apply}){
  let saved=null,drag=null;try{const v=Number(localStorage.getItem(key));if(v>=min&&v<=max)saved=v;}catch{}
  const bar=document.createElement('div');bar.className='ws-divider';bar.dataset.edge=edge;bar.tabIndex=0;bar.setAttribute('role','separator');bar.setAttribute('aria-orientation','vertical');bar.setAttribute('aria-label',label);host.append(bar);
  const limit=()=>Math.max(min,Math.min(max,available()));
  const width=()=>Math.max(min,Math.min(limit(),saved??initial()));
  function paint(){const n=width();apply(n);bar.style[edge]=n+'px';bar.setAttribute('aria-valuemin',min);bar.setAttribute('aria-valuemax',limit());bar.setAttribute('aria-valuenow',Math.round(n));}
  function store(){try{if(saved===null)localStorage.removeItem(key);else localStorage.setItem(key,String(saved));}catch{}}
  function finish(){if(!drag)return;drag=null;host.classList.remove('ws-resizing');document.documentElement.classList.remove('ws-dragging');store();}
  bar.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag={x:e.clientX,width:width()};bar.setPointerCapture(e.pointerId);host.classList.add('ws-resizing');document.documentElement.classList.add('ws-dragging');});
  bar.addEventListener('pointermove',e=>{if(!drag)return;saved=Math.max(min,Math.min(limit(),drag.width+(e.clientX-drag.x)*(edge==='left'?1:-1)));paint();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])bar.addEventListener(name,finish);addEventListener('blur',finish);
  function reset(){saved=null;store();paint();}bar.addEventListener('dblclick',reset);
  bar.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();reset();return;}if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();saved=e.key==='Home'?min:e.key==='End'?limit():width()+(e.key==='ArrowRight'?1:-1)*(edge==='left'?1:-1)*(e.shiftKey?40:10);saved=Math.max(min,Math.min(limit(),saved));store();paint();});
  new ResizeObserver(paint).observe(host);paint();return bar;
 }
 window.repoPaneResize=Object.freeze({mount});
})();
