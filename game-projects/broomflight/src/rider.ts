import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {addOutline} from './npr';
import type {MaterialFactory,RiderVisual} from './types';
const up=new THREE.Vector3(0,1,0),v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const sphere=new THREE.SphereGeometry(1,10,8),bone=new THREE.CylinderGeometry(1,1,1,7);
function tube(a:THREE.Vector3,b:THREE.Vector3,r:number,end=r){const g=new THREE.CylinderGeometry(end,r,a.distanceTo(b),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,b.clone().sub(a).normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());return g;}
export function createRider(material:MaterialFactory,color:number):RiderVisual{
 const group=new THREE.Group();group.name='Velmora broom rider';
 const wood=material(0x644433,'wood'),gold=material(0xc8aa68,'metal'),straw=material(0x9b7445,'wood'),cloth=material(color,'cloth'),dark=material(0x263935,'cloth'),cream=material(0xe8dcc0,'cloth'),skin=material(0xc48e6b,'skin');
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,p=group){const o=new THREE.Mesh(g,m);p.add(o);return o;}
 function shape(m:THREE.Material,position:THREE.Vector3,scale:THREE.Vector3,g:THREE.BufferGeometry=sphere,p=group){const o=mesh(g,m,p);o.position.copy(position);o.scale.copy(scale);return o;}
 function limb(m:THREE.Material,r:number){const o=mesh(bone,m);o.userData.radius=r;return o;}
 function place(o:THREE.Mesh,a:THREE.Vector3,b:THREE.Vector3){o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());o.scale.set(o.userData.radius,a.distanceTo(b),o.userData.radius);}
 const broom=new THREE.Group();broom.name='Ashwood broom';group.add(broom);
 const curve=new THREE.CatmullRomCurve3([v(0,.48,1),v(0,.5,.1),v(0,.55,-.65),v(0,.69,-1.35),v(0,.77,-1.6)]);
 addOutline(mesh(new THREE.TubeGeometry(curve,18,.048,7,false),wood,broom),.7);
 const bristles:THREE.BufferGeometry[]=[];
 for(let i=0;i<36;i++){const a=i*2.3999,r=.11+(i%6)/6*.28;bristles.push(tube(v(Math.cos(a)*.07,.49+Math.sin(a)*.07,.68),v(Math.cos(a)*r,.4+Math.sin(a)*r,1.75+(i%5)*.05),.018,.006));}
 mesh(mergeGeometries(bristles)!,straw,broom);
 for(const z of [.68,.82]){const band=mesh(new THREE.TorusGeometry(z===.68?.09:.15,.025,5,12),gold,broom);band.position.set(0,.49,z);}
 const charm=shape(gold,v(0,.69,-1.27),v(.07,.07,.07),new THREE.OctahedronGeometry(1),broom);
 const torso=shape(cloth,v(0,1,0),v(.22,.35,.16));addOutline(torso,.85);const belt=shape(gold,v(0,.71,.06),v(.23,.045,.18));
 const head=new THREE.Group();group.add(head);shape(skin,v(),v(.16,.2,.155),sphere,head);shape(skin,v(0,-.025,-.155),v(.04,.045,.055),sphere,head);shape(dark,v(0,.08,.045),v(.169,.15,.14),sphere,head);
 for(const x of [-.066,.066])shape(dark,v(x,.005,-.14),v(.019,.025,.014),sphere,head);
 const brim=mesh(new THREE.CylinderGeometry(.29,.30,.035,12),cloth,head);brim.position.y=.15;const crown=mesh(new THREE.ConeGeometry(.18,.5,9),cloth,head);crown.position.set(.025,.38,.025);crown.rotation.z=-.12;const band=mesh(new THREE.CylinderGeometry(.172,.184,.055,10),gold,head);band.position.y=.20;
 const cape=new THREE.Group();group.add(cape);const capeShape=new THREE.BufferGeometry();capeShape.setAttribute('position',new THREE.Float32BufferAttribute([-.21,0,0,.21,0,0,-.38,-.32,.95,.21,0,0,.38,-.32,.95,-.38,-.32,.95],3));capeShape.computeVertexNormals();const capeMat=cloth.clone();capeMat.side=THREE.DoubleSide;mesh(capeShape,capeMat,cape);
 const collar=shape(cream,v(0,1.3,-.12),v(.17,.05,.06));
 const legs=[-1,1].map(side=>({side,thigh:limb(dark,.092),shin:limb(dark,.065),boot:shape(wood,v(),v(.085,.11,.18))}));
 const arms=[-1,1].map(side=>({side,upper:limb(cloth,.072),lower:limb(cloth,.057),hand:shape(skin,v(),v(.047,.057,.065))}));
 return {group,update(state,sample,dt,time){
  void sample;void dt;group.position.copy(state.position);group.position.y+=Math.sin(time*2.8+state.id)*.055;group.rotation.set(state.pitch,state.yaw,state.roll,'YXZ');
  const tuck=state.compression,hip=v(-state.lean*.06,.72,.15),shoulder=v(-state.lean*.12,1.28-tuck*.18,-.13-tuck*.13);
  torso.position.copy(hip).lerp(shoulder,.5);torso.quaternion.setFromUnitVectors(up,shoulder.clone().sub(hip).normalize());torso.scale.y=hip.distanceTo(shoulder)*.65;belt.position.copy(hip);head.position.copy(shoulder).add(v(0,.24,-.04));head.rotation.x=-state.pitch*.25;collar.position.copy(shoulder).add(v(0,-.015,-.06));cape.position.copy(shoulder).add(v(0,0,.12));cape.rotation.set(Math.sin(time*9)*.07+state.speed*.005,Math.sin(time*6+state.id)*.12,state.lean*.25);
  for(const leg of legs){const s=leg.side,knee=v(s*.30,.32,-.16),foot=v(s*.34,-.22,.23+Math.sin(time*3+state.id)*.04);place(leg.thigh,hip.clone().add(v(s*.12,0,0)),knee);place(leg.shin,knee,foot);leg.boot.position.copy(foot);leg.boot.rotation.x=-.2;}
  for(const arm of arms){const s=arm.side,hand=v(s*.06,.58,-.70),elbow=v(s*.28,.86-tuck*.1,-.38);place(arm.upper,shoulder.clone().add(v(s*.19,0,0)),elbow);place(arm.lower,elbow,hand);arm.hand.position.copy(hand);}
  charm.rotation.y=time*1.5;broom.rotation.y=state.trick==='BROOM SWEEP'?Math.sin(state.trickRotation*.5)*.35:0;
 }};
}
