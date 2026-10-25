import {hasKnifeTransformation} from './knife-transformations.js?v=2.15.0';
import * as THREE from './vendor/three.module.js?v=2.15.0';
import {createKnife} from './knife-models.js?v=2.15.0';
import {normalizeKnifeSelection} from './knife-catalog.js?v=2.15.0';

import {createKnifeMotion} from './knife-motion.js?v=2.15.0';

const TAU=Math.PI*2;

/** A single, disposable display model. It shares the game's renderer, but has
 * its own camera so inspecting a cosmetic cannot alter the player's view. */
export class KnifeRoom{
 constructor(selection,options={}){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0b090b');
  this.camera=new THREE.PerspectiveCamera(35,1,.05,30);
  this.camera.position.set(0,.18,4);this.camera.lookAt(0,0,0);
  this.pivot=new THREE.Group();this.mount=new THREE.Group();this.pivot.add(this.mount);this.scene.add(this.pivot);
  this.mount.rotation.set(Math.PI/2,0,-Math.PI/2,'ZYX');
  this.angle=-.32;this.tilt=.08;this.entrance=1;this.autoRotate=false;this.disposed=false;
  this.resources={geometries:new Set(),materials:new Set()};
  this.scene.add(new THREE.HemisphereLight('#bed7eb','#292124',.85));
  const key=new THREE.DirectionalLight('#fff0d8',3.25);key.position.set(-2.1,3,4);
  key.castShadow=options.quality!=='performance';key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-2,near:.1,far:12});key.shadow.bias=-.00015;key.shadow.normalBias=.012;
  this.scene.add(key);
  const rim=new THREE.DirectionalLight('#c7a6a1',2.8);rim.position.set(2,1,-3);this.scene.add(rim);
  const fill=new THREE.DirectionalLight('#c3cbd6',.8);fill.position.set(3,-.1,3);this.scene.add(fill);
  const mesh=(geometry,material,y)=>{
   this.resources.geometries.add(geometry);this.resources.materials.add(material);
   const m=new THREE.Mesh(geometry,material);m.position.y=y;m.receiveShadow=true;this.scene.add(m);return m;
  };
  mesh(new THREE.CylinderGeometry(.95,1.02,.09,72),new THREE.MeshStandardMaterial({color:'#1d191c',roughness:.43,metalness:.5}),-.72);
  mesh(new THREE.CylinderGeometry(.91,.91,.012,72),new THREE.MeshStandardMaterial({color:'#292326',roughness:.66,metalness:.15}),-.666);
  const ring=mesh(new THREE.TorusGeometry(.93,.0035,6,96),new THREE.MeshBasicMaterial({color:'#9c3832'}),-.653);ring.rotation.x=Math.PI/2;
  mesh(new THREE.CylinderGeometry(8,8,.05,72),new THREE.MeshStandardMaterial({color:'#0b090b',roughness:.9}),-.80);
  this.motion=createKnifeMotion();this.spin=new THREE.Quaternion();this.spinAxis=new THREE.Vector3();this.basePosition=new THREE.Vector3();
  this.setKnife(selection);
 }
 setKnife(value){
  if(this.disposed)return;
  const selection=normalizeKnifeSelection(value);
  if(this.model?.selection.knifeId===selection.knifeId){
   if(this.model.selection.finishId!==selection.finishId)this.model.setFinish(selection.finishId);
   this.selection={...selection};this.motion.reset(this.model.spec.animationProfile);this.mount.scale.setScalar((hasKnifeTransformation(selection.finishId)?1.80:2.10)/this.coreSize);return;
  }
  this.model?.dispose();this.model=createKnife(selection);this.selection={...selection};
  this.model.group.updateMatrixWorld(true);
  const bounds=this.model.coreBounds.clone(),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
  this.model.group.position.copy(centre).negate();this.basePosition.copy(this.model.group.position);this.motion.reset(this.model.spec.animationProfile);
  this.coreSize=Math.max(size.x,size.y,size.z);this.mount.add(this.model.group);this.mount.scale.setScalar((hasKnifeTransformation(selection.finishId)?1.80:2.10)/Math.max(size.x,size.y,size.z));
  this.model.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  this.angle=-.32;this.tilt=.08;this.entrance=0;
 }
 setViewport(width,height,rect){
  if(this.disposed||!width||!height||!rect?.width||!rect?.height)return;
  this.viewport={width,height,rect};
  this.camera.aspect=width/height;
  const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  this.camera.setViewOffset(width,height,width/2-cx,height/2-cy,width,height);
  const focal=.5*height/Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
  // Leave space around a complete revolution, including the pedestal.
  const distance=Math.max(2.4,2.1*focal/rect.width+1.05,1.32*focal/rect.height+1.05);
  this.baseDistance=distance;
  this.camera.position.set(0,distance*.045,distance);this.camera.lookAt(0,-.07,0);
  this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld(true);
 }
 turn(amount,tilt=0){
  if(this.disposed)return;
  this.angle=(this.angle+amount)%TAU;this.tilt=THREE.MathUtils.clamp(this.tilt+tilt,-.5,.5);
 }
 inspect(){if(this.disposed)return false;this.motion.update(.1,{enabled:true,grounded:true,motion:true,profile:this.model.spec.animationProfile,finishId:this.model.selection.finishId});return this.motion.request(true);}
 update(dt,{motion=true,dragging=false,effects='full'}={}){
  if(this.disposed)return;
  const step=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  this.finishTime=(this.finishTime||0)+step;const frame=this.motion.update(step,{enabled:true,grounded:true,motion,profile:this.model.spec.animationProfile,finishId:this.model.selection.finishId});this.model.pose(frame);
  this.model.group.rotation.set(frame.rx,frame.ry,frame.rz);
  if(frame.spinAxis){this.spinAxis.set(frame.spinAxis===1?1:0,frame.spinAxis===2?1:0,frame.spinAxis===3?1:0);this.spin.setFromAxisAngle(this.spinAxis,frame.spin);this.model.group.quaternion.multiply(this.spin);}
  this.model.group.position.copy(this.basePosition).applyQuaternion(this.model.group.quaternion);
  this.model.group.position.x+=frame.x*.5;this.model.group.position.y+=frame.y*.5;
  this.model.updateFinish(this.finishTime,{reducedMotion:!motion,effects,inspect:frame.active?Math.sin(frame.progress*Math.PI):0,active:frame.active,progress:frame.progress,gesture:frame.name});
  this.animation=frame;
  if(step>0){
   this.entrance=motion?Math.min(1,this.entrance+step*3.8):1;
   if(motion&&this.autoRotate&&!dragging)this.angle=(this.angle+step*.17)%TAU;
  }
  const ease=1-(1-this.entrance)**3;
  this.pivot.rotation.set(this.tilt,this.angle,.10);
  this.pivot.position.y=(1-ease)*-.06+(this.model.transformation||0)*.48;
  if(this.viewport){
   const unfold=this.model.transformation||0,{width,height,rect}=this.viewport;
   if(unfold>.001){
    this.scene.updateMatrixWorld(true);
    const bounds=this.model.transformationBounds(),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3()),focal=.5*height/Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const distance=Math.max(this.baseDistance,size.y*focal/(rect.height*.83)+size.z*.5, size.x*focal/(rect.width*.83)+size.z*.5);
    const blend=Math.min(1,unfold*2),target=new THREE.Vector3(0,-.07,0).lerp(centre,blend);
    this.camera.position.set(target.x,target.y+.045*distance,target.z+distance);this.camera.lookAt(target);
   }else{this.camera.position.set(0,this.baseDistance*.045,this.baseDistance);this.camera.lookAt(0,-.07,0);}
   this.camera.updateMatrixWorld(true);
  }

  this.pivot.scale.setScalar(.96+.04*ease);
  this.scene.updateMatrixWorld(true);
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.model.dispose();
  this.resources.geometries.forEach(g=>g.dispose());this.resources.materials.forEach(m=>m.dispose());
  this.scene.traverse(o=>{if(o.isLight)o.dispose?.();});this.scene.clear();
 }
}
