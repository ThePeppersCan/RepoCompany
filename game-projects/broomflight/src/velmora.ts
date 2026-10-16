import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {MaterialFactory,TrackSample} from './types';

// Elvane landmarks: Valeron woodland, Solmere vines and Elvara's green spires.
// Static scenery is merged by material so villages do not add hundreds of draws.
export function addVelmoraScenery(parent:THREE.Group,material:MaterialFactory,sample:(s:number,l?:number)=>TrackSample,height:(x:number,z:number)=>number,length:number){
 const groups=new Map<string,THREE.BufferGeometry[]>();
 const palette:{[key:string]:[number,string]}={stone:[0xc2baa0,'rock'],roof:[0x345c51,'wood'],wood:[0x70553b,'wood'],gold:[0xc7ac6b,'metal'],window:[0xe6bf76,'metal'],vines:[0x566a43,'foliage'],grapes:[0x70617c,'foliage'],banner:[0x6d8990,'cloth']};
 const temp=new THREE.Object3D();
 function add(key:string,g:THREE.BufferGeometry,x:number,y:number,z:number,sx=1,sy=1,sz=1,ry=0){temp.position.set(x,y,z);temp.scale.set(sx,sy,sz);temp.rotation.set(0,ry,0);temp.updateMatrix();const baked=g.clone().applyMatrix4(temp.matrix);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(baked);}
 const box=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,10),cone=new THREE.ConeGeometry(1,1,8),round=new THREE.IcosahedronGeometry(1,0);
 function site(s:number,lateral:number){const p=sample(s,lateral).position;p.y=height(p.x,p.z);return p;}
 function house(s:number,lateral:number,size:number){const p=site(s,lateral),h=4*size;add('stone',box,p.x,p.y+h/2,p.z,5*size,h,5*size);add('roof',cone,p.x,p.y+h+1.8*size,p.z,4.2*size,3.6*size,4.2*size,Math.PI/4);add('wood',box,p.x,p.y+1.25*size,p.z+2.52*size,1.1*size,2.5*size,.12);for(const side of[-1,1])add('window',box,p.x+side*1.5*size,p.y+2.7*size,p.z+2.53*size,.7*size,1.1*size,.08);add('stone',box,p.x+1.5*size,p.y+h+2*size,p.z,1*size,3*size,1*size);}
 for(let i=0;i<14;i++){house(length*(.025+i*.0065),i%2?20+(i%4)*9:-22-(i%3)*10, .85+(i%3)*.12);}
 for(let i=0;i<12;i++)house(length*(.87+i*.008),i%2?22+i%3*10:-22-i%4*8,1.1);
 function tower(x:number,z:number,h:number,r:number){const y=height(x,z);add('stone',cylinder,x,y+h/2,z,r,h,r);add('gold',cylinder,x,y+h*.82,z,r*1.08,.7,r*1.08);add('roof',cone,x,y+h+5,z,r*1.4,10,r*1.4);add('gold',cone,x,y+h+10.6,z,.55,2,.55);for(const side of[-1,1])add('window',box,x+side*r*.48,y+h*.7,z+r*.89,.7,h*.16,.1);}
 const castle=site(length*.975,-48);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;tower(castle.x+Math.cos(a)*27,castle.z+Math.sin(a)*27,24+(i%3)*7,3.8);}
 tower(castle.x,castle.z,68,7);
 add('stone',box,castle.x,castle.y+12,castle.z,60,24,40);add('roof',cone,castle.x,castle.y+30,castle.z,42,20,32,Math.PI/4);
 // Ancient watchtowers and standing stones punctuate the wooded descent.
 for(const [s,l] of [[.14,-24],[.29,28],[.51,-26],[.78,30]]){const p=site(length*s,l);tower(p.x,p.z,12,2.4);}
 for(let row=0;row<9;row++)for(let j=0;j<19;j++){
  const p=site(length*(.55+j*.0036),(row<5?-1:1)*(15+(row%5)*5));
  add('wood',box,p.x,p.y+1,p.z,.12,2,.12);add('vines',round,p.x,p.y+1.4,p.z,1.4,.7,1.8);
  if(j%3===0)add('grapes',round,p.x+.6,p.y+1.1,p.z,.3,.45,.3);
 }
 // The old valley viaduct passes beneath the flight line at the ravine.
 const bridge=sample(length*.718+14),origin=bridge.position,angle=Math.atan2(-bridge.tangent.x,-bridge.tangent.z);
 const g=new THREE.BoxGeometry(10,.8,35);temp.position.copy(origin);temp.position.y-=.8;temp.rotation.set(0,angle,0);temp.scale.set(1,1,1);temp.updateMatrix();groups.get('stone')!.push(g.applyMatrix4(temp.matrix));
 for(const side of[-1,1])for(let i=-2;i<=2;i++){const p=sample(length*.718+14+i*7,side*4.6).position;add('stone',cylinder,p.x,p.y-9,p.z,.8,18,.8);}
 // Brass flight hoops and hanging pennants mark the route without an asphalt road.
 for(let i=0;i<22;i++){
  const s=length*(.04+i*.042),p=sample(s),a=Math.atan2(-p.tangent.x,-p.tangent.z);
  add('gold',new THREE.TorusGeometry(3.7,.085,5,28),p.position.x,p.position.y+4.2,p.position.z,1,1,1,a);
  for(const side of[-1,1]){const q=sample(s,side*5.5).position;add('wood',cylinder,q.x,q.y+3,q.z,.09,6,.09);add('banner',cone,q.x,q.y+4.8,q.z,.6,1.5,.12,a);}
 }
 for(const [key,list] of groups){const [color,kind]=palette[key];const mat=material(color,kind);const merged=mergeGeometries(list.map(g=>g.index?g.toNonIndexed():g),false)!;const mesh=new THREE.Mesh(merged,mat);mesh.name='Elvane '+key;parent.add(mesh);list.forEach(g=>g.dispose());}
}
