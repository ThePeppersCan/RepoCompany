import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addOutline} from './npr';
import {fallingRock,staticBox,type CourseHazard} from './hazards';
import type {MaterialFactory,TrackSample} from './types';

export function addHazardScenery(parent:THREE.Group,hazards:CourseHazard[],sample:(s:number,l?:number)=>TrackSample,material:MaterialFactory){
 const palette={wood:material(0x755039,'wood'),leaf:material(0x415b39,'foliage'),stone:material(0x9f9b86,'rock'),gold:material(0xf0b963,'metal'),dark:material(0x293c32,'wood'),dust:material(0xc0af8a,'rock')};
 type Paint=keyof typeof palette;
 const batches=new Map<Paint,THREE.BufferGeometry[]>(),local=new THREE.Object3D(),frame=new THREE.Object3D();
 const box=new THREE.BoxGeometry(1,1,1),cone=new THREE.ConeGeometry(1,1,6),rock=new THREE.IcosahedronGeometry(1,1),trunk=new THREE.CylinderGeometry(1,1,1,7);
 function add(h:CourseHazard,paint:Paint,g:THREE.BufferGeometry,x:number,y:number,z:number,sx:number,sy:number,sz:number,rz=0,rx=0){
  const point=sample(h.s);frame.position.copy(point.position);frame.rotation.set(0,Math.atan2(-point.tangent.x,-point.tangent.z),0);frame.updateMatrix();
  local.position.set(x,y,z);local.rotation.set(rx,0,rz);local.scale.set(sx,sy,sz);local.updateMatrix();
  const baked=g.clone().applyMatrix4(local.matrix).applyMatrix4(frame.matrix);
  const list=batches.get(paint)||[];list.push(baked);batches.set(paint,list);
 }
 function arrow(h:CourseHazard,x:number,y:number,z:number,angle:number,scale=1){
  const g=new THREE.Shape();g.moveTo(-.18,-.65);g.lineTo(.18,-.65);g.lineTo(.18,.15);g.lineTo(.58,.15);g.lineTo(0,.78);g.lineTo(-.58,.15);g.lineTo(-.18,.15);g.closePath();
  add(h,'gold',new THREE.ShapeGeometry(g),x,y,z,scale,scale,scale,angle);
 }
 const dynamic:Array<{hazard:CourseHazard;index:number;mesh:THREE.Mesh;ring:THREE.Mesh;chips:THREE.InstancedMesh}>=[];
 for(const h of hazards){
  const bound=staticBox(h);
  if(h.kind==='thorns'){
   add(h,'wood',trunk,0,1.4,0,1.4,h.width*2.1,1.15,Math.PI/2);
   for(let i=0;i<15;i++){
    const x=-h.width+i*h.width/7;
    add(h,'leaf',rock,x,1.9,0,1.1,1.4,1.2);
    add(h,'wood',cone,x,3.1,.1,.3,1.2,.3,(i%3-1)*.25);
   }
   for(const x of[-h.width*.66,0,h.width*.66])arrow(h,x,2.4,1.32,0,.9);
  }else if(h.kind==='branches'){
   // A dense, low canopy: the open passage is below the visible 5.2 m edge.
   add(h,'wood',trunk,0,5.8,0,.62,h.width*2.1,.62,Math.PI/2);
   for(let i=0;i<10;i++){
    const x=-h.width+i*h.width/4.5;
    add(h,'leaf',rock,x,8.2,-.2,1.9,2.7,1.7);
    add(h,'leaf',rock,x,11.8,-.2,1.9,1.6,1.7);
   }
   for(const side of[-1,1])add(h,'wood',trunk,side*(h.width+1),6,0,.7,12,.7);
   for(const x of[-h.width*.65,0,h.width*.65])arrow(h,x,6.3,1.6,Math.PI,1);
  }else if(h.kind==='pillars'&&bound){
   add(h,'stone',box,bound.x,6.4,0,bound.halfX*2,12.8,2.6);
   for(let i=0;i<4;i++){
    const x=bound.x-bound.halfX+(i+.5)*bound.halfX/2;
    add(h,'stone',trunk,x,7.1,0,.65,14.2,.65);
    add(h,'gold',box,x,5.2,1.38,.14,8,.1);
   }
   arrow(h,h.side*1.5,4.5,1.65,h.side>0?Math.PI/2:-Math.PI/2,1.4);
  }else{
   for(const side of[-1,1]){
    add(h,'stone',rock,side*(h.width+4),10,0,3,11,8);
    add(h,'stone',rock,side*(h.width+1),18,-1,4,2.4,8);
   }
   for(let i=0;i<3;i++){
    const mesh=new THREE.Mesh(rock.clone(),palette.stone);mesh.name=h.id+' falling boulder '+i;mesh.scale.setScalar(1.45);addOutline(mesh,.9);parent.add(mesh);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.95,.11,5,24),palette.gold);ring.rotation.x=-Math.PI/2;parent.add(ring);
    const chips=new THREE.InstancedMesh(rock,palette.dust,6);chips.frustumCulled=false;parent.add(chips);dynamic.push({hazard:h,index:i,mesh,ring,chips});
   }
  }
  // Advance warnings sit beside the flight lane, leaving the actual obstacle clear.
  const sign={...h,s:h.s-52};
  for(const side of[-1,1]){
   const x=side*(h.width+1.1);add(sign,'wood',trunk,x,2.8,0,.11,5.6,.11);
   add(sign,'dark',box,x,4.7,0,1.9,2.3,.15);
   if(h.kind==='rockfall'){add(sign,'gold',rock,x,4.95,.14,.4,.4,.16);arrow(sign,x,4,.17,Math.PI,.4);}
   else arrow(sign,x,4.7,.17,h.kind==='thorns'?0:h.kind==='branches'?Math.PI:h.side>0?Math.PI/2:-Math.PI/2,.85);
  }
 }
 // Same drawing path as the landscape, including its depth/normal attachments.
 for(const [paint,list] of batches){
  const flat=list.map(g=>g.index?g.toNonIndexed():g),merged=mergeGeometries(flat,false)!;
  const mesh=new THREE.Mesh(merged,palette[paint]);mesh.name='Flight obstacles '+paint;parent.add(mesh);
  new Set([...list,...flat]).forEach(g=>g.dispose());
 }
 const transform=new THREE.Object3D();
 return (time:number)=>{
  for(const {hazard:h,index,mesh,ring,chips} of dynamic){
   const b=fallingRock(h,index,time),base=sample(b.s,b.x).position;
   // Height is measured from the centre of the course, like collision tests.
   base.y=sample(h.s).position.y+b.y;mesh.position.copy(base);mesh.visible=b.visible;mesh.rotation.set(b.phase*1.8,index+b.phase*.7,b.phase*.9);
   const landing=sample(b.s,(index-1)*h.width*.51).position;landing.y=sample(b.s).position.y+.14;ring.position.copy(landing);
   ring.visible=b.warning||b.active;ring.scale.setScalar(b.warning?1+Math.sin(b.phase*9)*.07:1);
   chips.visible=b.warning||b.active;
   for(let i=0;i<6;i++){
    transform.position.copy(base).add(new THREE.Vector3(Math.sin(i*2.4+b.phase*2)*.9,-.6-(b.phase*4+i*.5)%3,Math.cos(i*2.4)*.9));
    transform.scale.setScalar(.05+(i%3)*.035);transform.updateMatrix();chips.setMatrixAt(i,transform.matrix);
   }chips.instanceMatrix.needsUpdate=true;
  }
 };
}
