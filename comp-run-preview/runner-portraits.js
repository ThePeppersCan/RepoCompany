import * as THREE from './vendor/three.module.js?v=2.15.0';
import {RunnerRoom} from './runner-room.js?v=2.15.0';
import {RUNNERS} from './runner-catalog.js?v=2.15.0';
// Reuse one small render target; portraits show the actual models.
export class RunnerPortraits{
 constructor(){this.cache=new Map();this.queue=[...RUNNERS];this.room=null;this.target=null;this.failed=false;}
 get(id){return this.cache.get(id);}
 step(renderer,onReady){
  if(!this.queue.length||this.failed)return;
  const previousTarget=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
  try{
   const runner=this.queue.shift();
   if(!this.room){this.room=new RunnerRoom(runner.id,{quality:'performance'});this.target=new THREE.WebGLRenderTarget(180,200,{depthBuffer:true});this.target.texture.colorSpace=THREE.SRGBColorSpace;this.pixels=new Uint8Array(180*200*4);this.canvas=document.createElement('canvas');this.canvas.width=180;this.canvas.height=200;this.ctx=this.canvas.getContext('2d');this.image=this.ctx.createImageData(180,200);}
   else this.room.setRunner(runner.id);
   this.room.update(0);const camera=this.room.camera;camera.clearViewOffset();camera.aspect=.9;camera.fov=31;camera.position.set(.055,runner.height*.91,-.94);camera.lookAt(0,runner.height*.90,0);camera.updateProjectionMatrix();
   renderer.setScissorTest(false);renderer.setRenderTarget(this.target);renderer.clear();renderer.render(this.room.scene,camera);renderer.readRenderTargetPixels(this.target,0,0,180,200,this.pixels);
   for(let y=0;y<200;y++)this.image.data.set(this.pixels.subarray((199-y)*720,(200-y)*720),y*720);
   this.ctx.putImageData(this.image,0,0);const url=this.canvas.toDataURL('image/webp',.88);this.cache.set(runner.id,url);onReady(runner.id,url);
   if(!this.queue.length)this.release();
  }catch(error){this.failed=true;this.release();console.warn('Runner portraits could not be rendered.',error);}
  finally{renderer.setRenderTarget(previousTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);}
 }
 release(){this.room?.dispose();this.target?.dispose();this.room=null;this.target=null;this.pixels=null;this.canvas=null;this.ctx=null;this.image=null;}
 dispose(){this.release();this.cache.clear();this.queue.length=0;}
}
