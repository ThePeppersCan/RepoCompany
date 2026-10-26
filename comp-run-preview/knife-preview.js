import * as THREE from './vendor/three.module.js?v=2.17.0';
import {KnifeRoom} from './knife-room.js?v=2.17.0';
import {KNIVES,KNIFE_FINISHES,getKnifeFinish,normalizeKnifeSelection} from './knife-catalog.js?v=2.17.0';
const $=id=>document.getElementById(id),query=new URLSearchParams(location.search),selection=normalizeKnifeSelection({knifeId:query.get('knife')||'wake',finishId:query.get('finish')||'sovereign'});
for(const [id,list,key]of [['knife',KNIVES,'knifeId'],['finish',KNIFE_FINISHES,'finishId']]){for(const item of list){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;$(id).append(option);}$(id).value=selection[key];}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,room=new KnifeRoom(selection),renderer=new THREE.WebGLRenderer({canvas:$('canvas'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
room.autoRotate=false;let last=0,drag=null,disposed=false;
function resize(){renderer.setSize(innerWidth,innerHeight,false);room.setViewport(innerWidth,innerHeight,$('stage').getBoundingClientRect());}
function renderSelection(){room.setKnife(selection);const f=getKnifeFinish(selection.finishId);$('name').textContent=f.name;$('description').textContent=f.description+' '+(f.effect||'');$('status').textContent='';resize();}
function inspect(){room.inspect();$('status').textContent='Playing '+room.motion.pose.label.toLowerCase();}
$('knife').onchange=()=>{selection.knifeId=$('knife').value;renderSelection();};$('finish').onchange=()=>{selection.finishId=$('finish').value;renderSelection();};$('inspect').onclick=inspect;
$('rotate').onclick=()=>{room.autoRotate=!room.autoRotate;$('rotate').setAttribute('aria-pressed',String(room.autoRotate));};
$('stage').onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY};$('stage').setPointerCapture(e.pointerId);room.autoRotate=false;$('rotate').setAttribute('aria-pressed','false');};
$('stage').onpointermove=e=>{if(!drag)return;room.turn((e.clientX-drag.x)*.008,(e.clientY-drag.y)*.005);drag={x:e.clientX,y:e.clientY};};
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('stage').addEventListener(name,()=>{drag=null;});
document.addEventListener('keydown',e=>{if(e.target.matches('select,input,textarea'))return;if(e.code==='KeyF'){e.preventDefault();inspect();}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();room.turn(e.key==='ArrowLeft'?-.2:.2);}});
if(query.get('locked')==='1')$('finish').hidden=true;
if(query.get('embedded')==='1')document.body.classList.add('embedded');
window.addEventListener('resize',resize);renderSelection();
function frame(now){if(disposed)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;room.update(document.hidden?0:dt,{motion:!reduced,dragging:!!drag,effects:$('effects').value});if(room.animation?.active)$('status').textContent=room.animation.label;else if($('status').textContent)$('status').textContent='Ready to inspect';renderer.render(room.scene,room.camera);requestAnimationFrame(frame);}requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{disposed=true;room.dispose();renderer.dispose();},{once:true});
