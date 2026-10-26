import * as THREE from './vendor/three.module.js?v=2.16.0';
import {createRunner} from './characters.js?v=2.16.0';

function studioReflection(){
  const width=128,height=64,data=new Float32Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const u=x/width,v=y/height,k=(y*width+x)*4;
    const softbox=(cx,cy,sx,sy)=>Math.exp(-(((u-cx)/sx)**6)-((v-cy)/sy)**6);
    const key=softbox(.26,.34,.075,.15)*2.3,fill=softbox(.73,.42,.1,.17)*.8,top=softbox(.5,.1,.21,.08)*1.2;
    data[k]=.12+key+fill*.62+top;data[k+1]=.14+key*.9+fill*.83+top*.95;data[k+2]=.18+key*.78+fill+top*.9;data[k+3]=1;
  }
  const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;return texture;
}

export class RunnerRoom{
 constructor(id,{quality='balanced',knife=null}={}){
  this.camera=new THREE.PerspectiveCamera(34,1,.05,35);this.camera.position.set(0,1.08,-3.9);this.camera.lookAt(0,1.01,0);
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0b090b');this.scene.fog=new THREE.Fog('#0b090b',8,18);
  this.resources=new Set();this.environment=studioReflection();this.scene.environment=this.environment;this.scene.environmentIntensity=.52;
  this.scene.add(new THREE.HemisphereLight('#b3c4d2','#2e2928',.65));
  const key=new THREE.DirectionalLight('#f4eae0',1.9);key.position.set(-3,5,-4);key.target.position.set(0,.9,0);key.castShadow=quality!=='performance';
  key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-1.65,right:1.65,top:1.8,bottom:-1.45,near:.1,far:12});key.shadow.bias=-.00008;key.shadow.normalBias=.003;
  this.scene.add(key,key.target);this.key=key;
  this.rim=new THREE.DirectionalLight('#cb4b3d',1.25);this.rim.position.set(2.4,2.7,2.2);this.scene.add(this.rim);
  const fill=new THREE.DirectionalLight('#b3c1ce',.55);fill.position.set(3,2,-3);this.scene.add(fill);
  const mesh=(geometry,material,y=0)=>{this.resources.add(geometry);this.resources.add(material);const o=new THREE.Mesh(geometry,material);o.position.y=y;o.receiveShadow=true;this.scene.add(o);return o;};
  const metal=new THREE.MeshStandardMaterial({color:'#242123',roughness:.43,metalness:.6});
  mesh(new THREE.CylinderGeometry(.94,1,.09,80),metal,-.049);
  mesh(new THREE.CylinderGeometry(.9,.9,.012,80),new THREE.MeshStandardMaterial({color:'#312b2b',roughness:.77,metalness:.18}),-.006);
  this.bandMaterial=new THREE.MeshStandardMaterial({color:'#728899',roughness:.4,metalness:.65,emissive:'#435b6e',emissiveIntensity:.13});
  const band=mesh(new THREE.TorusGeometry(.947,.005,8,96),this.bandMaterial,-.022);band.rotation.x=Math.PI/2;
  const lineMaterial=new THREE.MeshStandardMaterial({color:'#52616c',roughness:.55,metalness:.45});
  for(const radius of [.79,.815]){const r=mesh(new THREE.TorusGeometry(radius,.0015,5,96),lineMaterial,.0015);r.rotation.x=Math.PI/2;}
  const tickGeometry=new THREE.BoxGeometry(.003,.0015,.021);this.resources.add(tickGeometry);
  const ticks=new THREE.InstancedMesh(tickGeometry,lineMaterial,32),dummy=new THREE.Object3D();this.scene.add(ticks);ticks.receiveShadow=true;
  for(let i=0;i<32;i++){
    const angle=i/32*Math.PI*2;dummy.position.set(Math.sin(angle)*.855,.0018,Math.cos(angle)*.855);dummy.rotation.y=angle;dummy.scale.z=i%4===0?2.1:1;dummy.updateMatrix();ticks.setMatrixAt(i,dummy.matrix);
  }ticks.instanceMatrix.needsUpdate=true;
  mesh(new THREE.CylinderGeometry(8,8,.05,80),new THREE.MeshStandardMaterial({color:'#0c0b0d',roughness:.94}),-.14);
  this.angle=-.13;this.locked=false;this.disposed=false;this.gait='idle';this.knifeSelection=knife;this.setRunner(id);
 }
 setRunner(id){
  if(this.disposed)return;
  this.inspectStarted=null;this.inspectPending=false;this.inspectionActive=false;
  this.actor?.dispose();this.actor=createRunner(id);if(this.knifeSelection)this.actor.setKnife(this.knifeSelection);this.scene.add(this.actor.group);this.angle=-.13;
  this.actor.group.updateMatrixWorld(true);this.bounds=new THREE.Box3().setFromObject(this.actor.group);
  this.setLocked(this.locked);
 }
 setPose(gait){if(!this.disposed){this.gait=gait==='run'?'run':'idle';this.inspectStarted=null;this.inspectPending=false;}}
 inspect(){if(this.disposed||!this.actor.definition.paid)return false;this.gait='idle';this.inspectPending=true;return true;}
 setKnife(selection){this.knifeSelection=selection;this.actor?.setKnife(selection);}
 setLocked(locked){
  this.locked=!!locked;const legendary=this.actor?.definition.rarity==='legendary';
  // Locked skins remain inspectable. The accessible DOM owns requirements.
  const color=legendary?'#c45b46':'#983a34';this.bandMaterial.color.set(color);this.bandMaterial.emissive.set(color);
  this.bandMaterial.emissiveIntensity=this.locked?.045:legendary?.16:.1;
  this.rim.color.set(legendary?'#d97559':'#c74a3e');this.scene.userData.previewLocked=this.locked;
 }
 turn(amount){if(!this.disposed)this.angle=(this.angle+amount)%(Math.PI*2);}
 setViewport(width,height,rect){
  if(this.disposed||!width||!height||!rect?.width||!rect?.height)return;
  this.viewport={width,height,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}};
  const camera=this.camera;camera.aspect=width/height;camera.setViewOffset(width,height,width/2-(rect.left+rect.width/2),height/2-(rect.top+rect.height/2-18),width,height);
  const focal=.5*height/Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),size=this.bounds.getSize(new THREE.Vector3()),radius=Math.hypot(size.x,size.z)*.5,target=(this.bounds.min.y+this.bounds.max.y)*.5+.02;
  const distance=Math.max(2.7,size.y*focal/Math.max(100,rect.height-70)+radius,2*radius*focal/Math.max(100,rect.width-30)+radius);
  camera.position.set(0,target+.09,-distance);camera.lookAt(0,target,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 }
 update(time,{motion=true,effects='full'}={}){
  if(this.disposed)return;
  if(this.inspectPending){this.inspectStarted=time;this.inspectPending=false;}
  const elapsed=this.inspectStarted===null?0:Math.max(0,time-this.inspectStarted),duration=this.actor.previewDuration||3;
  this.inspectionActive=this.inspectStarted!==null&&elapsed<duration&&motion;
  const previewProgress=this.inspectionActive?elapsed/duration:0;
  if(!this.inspectionActive)this.inspectStarted=null;
  this.actor.update(time,{gait:this.gait,speed:this.gait==='run'?5.2:0,motion,effects,previewProgress});this.actor.group.rotation.y=this.angle;
  if(this.actor.definition.paid&&this.viewport){this.actor.group.updateMatrixWorld(true);this.bounds.setFromObject(this.actor.group);this.setViewport(this.viewport.width,this.viewport.height,this.viewport.rect);}
  this.camera.updateMatrixWorld(true);this.scene.updateMatrixWorld(true);
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.actor?.dispose();
  for(const resource of this.resources)resource.dispose();this.environment.dispose();
  this.scene.traverse(o=>{if(o.isLight||o.isInstancedMesh)o.dispose?.();});this.scene.clear();
 }
}
