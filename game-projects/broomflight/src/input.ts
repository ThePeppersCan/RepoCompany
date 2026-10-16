import type {InputState} from './types';
export class Controls{
 keys=new Set<string>();enabled=true;private touch=new Map<number,string>();
 constructor(onAction:(action:string)=>void){
  window.addEventListener('keydown',e=>{if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){e.preventDefault();onAction('pause');return;}if((e.target as HTMLElement).closest('button,a,input'))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(!e.repeat){const a:Record<string,string>={Enter:'start',KeyR:'restart',KeyM:'mute',KeyF:'effects',KeyV:'weather'};if(a[e.code])onAction(a[e.code]);}});
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  window.addEventListener('blur',()=>{this.keys.clear();this.touch.clear();onAction('blur');});
  document.addEventListener('pointerdown',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-key]');if(!b)return;e.preventDefault();b.setPointerCapture(e.pointerId);this.touch.set(e.pointerId,b.dataset.key!);b.classList.add('held');});
  const release=(e:PointerEvent)=>{this.touch.delete(e.pointerId);(e.target as HTMLElement).closest('[data-key]')?.classList.remove('held');};document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);document.addEventListener('lostpointercapture',release);
 }
 read():InputState{const k=new Set([...this.keys,...this.touch.values()]);return {steer:Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft')),pedal:k.has('KeyW')||k.has('ArrowUp')||matchMedia('(pointer:coarse)').matches,brake:k.has('KeyS')||k.has('ArrowDown'),crouch:k.has('Space'),hop:false,boost:k.has('ShiftLeft')||k.has('ShiftRight'),manual:k.has('KeyC'),trick:[1,2,3,4,5,6,7].find(n=>k.has(`Digit${n}`))||0};}
}
