import * as THREE from './vendor/three.module.js?v=2.16.0';
import {RunnerRoom} from './runner-room.js?v=2.16.0';
import {RUNNERS} from './runner-catalog.js?v=2.16.0';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
for(const r of RUNNERS){const option=document.createElement('option');option.value=r.id;option.textContent=r.name;$('runner').append(option);}
$('runner').value=RUNNERS.some(r=>r.id===query.get('runner'))?query.get('runner'):'archfiend';
const room=new RunnerRoom($('runner').value,{knife:{knifeId:'wake',finishId:'brushed'}}),renderer=new THREE.WebGLRenderer({canvas:$('canvas'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
let last=0,time=0,drag=null,disposed=false;
function resize(){renderer.setSize(innerWidth,innerHeight,false);room.setViewport(innerWidth,innerHeight,$('stage').getBoundingClientRect());}
function pose(gait){room.setPose(gait);$('still').setAttribute('aria-pressed',String(gait==='idle'));$('run').setAttribute('aria-pressed',String(gait==='run'));}
function select(){room.setRunner($('runner').value);pose(query.get('pose')==='idle'?'idle':'run');const r=room.actor.definition;$('name').textContent=r.name;$('description').textContent=r.description+' '+(r.effect||'');$('inspect').hidden=!r.paid;$('inspect').textContent=r.premiumAnimated?'Transform · F':'Inspect · F';$('status').textContent=reduced?'Reduced motion enabled':'';resize();}
function inspect(){if(reduced){$('status').textContent='Turn off reduced motion in your device settings to play the reveal.';return;}pose('idle');room.inspect();}
$('runner').onchange=select;$('inspect').onclick=inspect;$('still').onclick=()=>pose('idle');$('run').onclick=()=>pose('run');
$('stage').onpointerdown=e=>{if(e.button!==0)return;drag=e.clientX;$('stage').setPointerCapture(e.pointerId);};
$('stage').onpointermove=e=>{if(drag===null)return;room.turn((e.clientX-drag)*.008);drag=e.clientX;};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('stage').addEventListener(event,()=>drag=null);
document.addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea'))return;if(e.code==='KeyF'){e.preventDefault();inspect();}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();room.turn(e.key==='ArrowLeft'?-.2:.2);}});
if(query.get('locked')==='1')$('runner').hidden=true;if(query.get('embedded')==='1')document.body.classList.add('embedded');
window.addEventListener('resize',resize);select();if(query.get('pose')==='run')pose('run');if(query.has('angle'))room.angle=Number(query.get('angle'))*Math.PI/180;if(query.get('inspect')==='1')inspect();
function frame(now){if(disposed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!document.hidden)time+=dt;room.update(time,{motion:!reduced,effects:$('effects').value});if(room.inspectionActive)$('status').textContent=room.actor.definition.premiumAnimated?'Transformation':'Inspecting';else if(!reduced)$('status').textContent=room.gait==='run'?'Running with equipped knife':'Ready';renderer.render(room.scene,room.camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{disposed=true;room.dispose();renderer.dispose();},{once:true});
