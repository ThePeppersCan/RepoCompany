import * as THREE from './vendor/three.module.js?v=2.16.0';
import {normalizeKnifeSelection,getKnifeSpec,getKnifeFinish} from './knife-catalog.js?v=2.16.0';
import {createFinishTextures,FINISH_SURFACES} from './knife-materials.js?v=2.16.0';

import {createKnifeTransformation,hasKnifeTransformation} from './knife-transformations.js?v=2.16.0';
import {createKnifeEffects} from './knife-effects.js?v=2.16.0';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/** Compact, owned studio reflection source shared by a visible equipment set. */
export function createWeaponEnvironment(){
 const width=256,height=128,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,upper=Math.max(0,1-v*1.5);
  const panel=Math.exp(-(((u-.16)/.032)**2)-((v-.38)/.22)**8),rim=Math.exp(-(((u-.69)/.014)**2)-((v-.40)/.30)**8),fill=Math.exp(-(((u-.9)/.1)**2)-((v-.18)/.09)**2);
  const at=(y*width+x)*4,base=15+upper*31;
  data[at]=clamp(base+panel*210+rim*155+fill*48,0,255);data[at+1]=clamp(base+panel*203+rim*177+fill*53,0,255);data[at+2]=clamp(base+panel*190+rim*207+fill*61,0,255);data[at+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height);texture.name='Equipment studio reflections';texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}

/** Geometry is merged by material and parent, retaining the actual mechanical
 * pivots. Source meshes are discarded immediately after their data is copied. */
export function createGeometryBatch(parent,resources){
 const batches=new Map(),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),p=new THREE.Vector3(),s=new THREE.Vector3();
 function add(geometry,material,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
  p.set(...position);s.set(...scale);q.setFromEuler(new THREE.Euler(...rotation));matrix.compose(p,q,s);geometry.applyMatrix4(matrix);
  let g=geometry;if(g.index){g=geometry.toNonIndexed();geometry.dispose();}
  const groups=Array.isArray(material)?g.groups:[{start:0,count:g.attributes.position.count,materialIndex:0}],mats=Array.isArray(material)?material:[material];
  for(const range of groups){
   const mat=mats[range.materialIndex]||mats[0];if(!batches.has(mat))batches.set(mat,{position:[],normal:[],uv:[]});const out=batches.get(mat);
   const end=Math.min(g.attributes.position.count,range.start+range.count);
   for(let i=range.start;i<end;i++){
    out.position.push(g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i));out.normal.push(g.attributes.normal.getX(i),g.attributes.normal.getY(i),g.attributes.normal.getZ(i));
    out.uv.push(g.attributes.uv?.getX(i)||0,g.attributes.uv?.getY(i)||0);
   }
  }
  g.dispose();
 }
 function box(material,x,y,z,width,height,depth,bevel=.001,rx=0,ry=0,rz=0){
  const shape=new THREE.Shape();shape.moveTo(-width/2,-height/2);shape.lineTo(width/2,-height/2);shape.lineTo(width/2,height/2);shape.lineTo(-width/2,height/2);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel,steps:1});geo.translate(0,0,-depth/2);add(geo,material,[x,y,z],[rx,ry,rz]);
 }
 function profile(material,points,thickness,bevel=.001,position=[0,0,0],holes=[]){
  const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,-z)));
  for(const points of holes)shape.holes.push(new THREE.Path(points.map(([x,z])=>new THREE.Vector2(x,-z))));
  const geo=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,steps:1});
  geo.translate(0,0,-thickness/2);geo.rotateX(-Math.PI/2);
  const uv=geo.attributes.uv,pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++)uv.setXY(i,(-pos.getZ(i)+.035)/.31,(pos.getX(i)+.06)/.12);
  add(geo,material,position);
 }
 function cylinder(material,x,y,z,radius,length,axis='y',sides=20){add(new THREE.CylinderGeometry(radius,radius,length,sides),material,[x,y,z],[axis==='z'?Math.PI/2:0,0,axis==='x'?Math.PI/2:0]);}
 function tube(material,points,radius=.0016){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));add(new THREE.TubeGeometry(curve,Math.max(8,points.length*4),radius,6,false),material);}
 function ring(material,x,y,z,radius,tubeRadius=.003){add(new THREE.TorusGeometry(radius,tubeRadius,10,32),material,[x,y,z],[Math.PI/2,0,0]);}
 function finish(){
  const meshes=[];
  for(const [material,data]of batches){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.position,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(data.normal,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));geometry.computeBoundingBox();geometry.computeBoundingSphere();resources.geometries.add(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.castShadow=false;mesh.receiveShadow=false;mesh.frustumCulled=false;parent.add(mesh);meshes.push(mesh);}
  batches.clear();return meshes;
 }
 return{add,box,profile,cylinder,tube,ring,finish};
}

const BLADES={
 wake:[[-.017,-.025],[.017,-.025],[.022,-.142],[.008,-.219],[-.021,-.169],[-.023,-.07]],
 needle:[[-.012,-.023],[.012,-.023],[.013,-.184],[0,-.256],[-.013,-.184]],
 crescent:[[-.018,-.019],[.012,-.023],[.032,-.050],[.050,-.087],[.057,-.126],[.049,-.170],[.027,-.199],[.033,-.165],[.025,-.132],[.009,-.105],[-.008,-.088],[-.024,-.070]],
 sentry:[[-.019,-.028],[.018,-.028],[.020,-.207],[.007,-.278],[-.020,-.227],[-.023,-.058]],
 rift:[[-.021,-.024],[.025,-.024],[.025,-.224],[-.019,-.183]],
 drift:[[-.019,-.025],[.019,-.025],[.024,-.165],[.006,-.218],[-.021,-.190],[-.032,-.166],[-.037,-.125],[-.033,-.072]],
 latch:[[-.014,-.017],[.014,-.017],[.018,-.078],[.010,-.116],[-.008,-.130],[-.021,-.106],[-.023,-.057]],
 vesper:[[-.011,-.019],[.011,-.019],[.014,-.102],[.002,-.141],[-.014,-.116],[-.014,-.057]],
};

/** Grip at the origin, blade toward -Z, handle toward +Z. Mechanical motion is
 * restricted to real hinge axes; the animation system owns the wrist itself. */
export function createKnife(input={}){
 const selection=normalizeKnifeSelection(input),spec=getKnifeSpec(selection.knifeId),resources={geometries:new Set(),materials:new Set()},ownedEnvironment=!input?.environment;
 const environment=input?.environment||createWeaponEnvironment(),group=new THREE.Group();group.name=spec.name+' / '+spec.family.toLowerCase();
 group.userData={type:'knife',knifeId:spec.id,finishId:selection.finishId,animationProfile:spec.animationProfile,cosmetic:true};
 const ownMat=(name,colour,roughness=.35,metalness=.8,physical=false)=>{const Material=physical?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;const material=new Material({name,color:colour,roughness,metalness,envMap:environment,envMapIntensity:.85});resources.materials.add(material);return material;};
 const blade=ownMat('Knife blade / finished steel','#ffffff',1,1,true),edge=ownMat('Knife edge / honed steel','#d7e0e2',.21,.94),tang=ownMat('Knife hardware / brushed titanium','#8c9ca4',.36,.86),dark=ownMat('Knife handle / graphite scales','#1e252b',.68,.10),accent=ownMat('Knife handle / finish inlays','#62768a',.42,.55,true),recess=ownMat('Knife recess / dark metal','#0c151a',.65,.3);
 blade.bumpScale=.00011;blade.clearcoatRoughness=.29;blade.anisotropyRotation=Math.PI/2;
 accent.clearcoatRoughness=.36;accent.anisotropyRotation=Math.PI/2;
 let maps=null,disposed=false,finishEffects=null,transformationRig=null,coreReady=false;
 function setFinish(id){
  if(disposed)return selection.finishId;
  const finish=getKnifeFinish(id);if(maps&&selection.finishId===finish.id)return finish.id;selection.finishId=finish.id;group.userData.finishId=finish.id;
  const surface=FINISH_SURFACES[finish.id];maps?.textures.forEach(t=>t.dispose());maps=createFinishTextures(finish);
  blade.emissive.set(maps.emissive?0xffffff:0);blade.emissiveMap=maps.emissive||null;accent.emissive.set(maps.emissive?0xffffff:0);accent.emissiveMap=maps.emissive||null;if(coreReady){if(finish.premium){finishEffects||=createKnifeEffects(blade,accent,bladePivot,BLADES[spec.id]);finishEffects.setFinish(finish);}else if(finishEffects){finishEffects.dispose();finishEffects=null;}}if(coreReady){if(transformationRig&&transformationRig.kind!==finish.id){transformationRig.dispose();transformationRig=null;}if(hasKnifeTransformation(finish.id)){transformationRig||=createKnifeTransformation(finish.id,group,environment,[body,bladePivot,...parts.handles]);transformationRig.setFinish(finish);transformationRig.update(0);}else if(transformationRig){transformationRig.dispose();transformationRig=null;}}
  blade.map=maps.map;blade.bumpMap=maps.bump;blade.roughnessMap=blade.metalnessMap=maps.roughness;
  blade.clearcoat=surface.coat;blade.anisotropy=surface.aniso;blade.iridescence=surface.iridescence;blade.iridescenceIOR=1.3;blade.iridescenceThicknessRange[0]=180;blade.iridescenceThicknessRange[1]=310;blade.needsUpdate=true;
  // Carry the same engraving into fitted handle panels; their steel surround
  // and matte grip remain separate materials. Both faces share owned maps.
  accent.color.set('#ffffff');accent.map=maps.map;accent.bumpMap=maps.bump;accent.bumpScale=.000075;accent.roughnessMap=accent.metalnessMap=maps.roughness;accent.roughness=1;accent.metalness=1;accent.clearcoat=surface.coat*.7;accent.anisotropy=surface.aniso*.5;accent.needsUpdate=true;
  tang.color.set(surface.hardware);dark.color.set(surface.handle);dark.roughness=finish.id==='carbon'?.55:.65;
  return selection.finishId;
 }
 /** A very slow, bounded studio reflection drift, not a glowing blade. Moving
  * the reflection basis keeps micrograin, inlay and coat responding together.
  * Reduced motion restores the exact still pose; no maps are regenerated. */
 function updateFinish(time=0,options){
  if(disposed)return;
  const t=options?.reducedMotion||!Number.isFinite(time)?0:Math.max(0,time)%100000;
  finishEffects?.update(t,options);transformationRig?.update(t,options);
  const yaw=Math.sin(t*.23)*.032,pitch=Math.sin(t*.17)*.014;
  blade.envMapRotation.set(pitch,yaw,0);accent.envMapRotation.set(pitch,yaw,0);edge.envMapRotation.set(pitch,yaw,0);tang.envMapRotation.set(pitch,yaw,0);
 }
 setFinish(selection.finishId);
 const body=new THREE.Group();body.name='Knife fixed grip and guard';group.add(body);
 const bladePivot=new THREE.Group();bladePivot.name='Knife blade hinge';group.add(bladePivot);
 const fixed=createGeometryBatch(body,resources),bladeBatch=createGeometryBatch(bladePivot,resources);
 const parts={body,blade:bladePivot,handles:[],hinges:[],ring:null,latch:null};
 const baseProfile=[[-.014,-.004],[.014,-.004],[.018,.018],[.015,.088],[.010,.116],[-.012,.116],[-.019,.09],[-.018,.023]];
 const profiles={
  wake:baseProfile,
  needle:[[-.012,-.005],[.012,-.005],[.015,.014],[.015,.102],[.009,.120],[-.009,.120],[-.015,.103],[-.015,.014]],
  crescent:[[-.018,-.004],[.014,-.004],[.010,.031],[.004,.059],[.004,.087],[.012,.117],[-.012,.119],[-.021,.088],[-.023,.055],[-.022,.026]],
  sentry:[[-.017,-.003],[.017,-.003],[.019,.017],[.018,.103],[.010,.124],[-.010,.124],[-.018,.105],[-.019,.017]],
  rift:[[-.017,-.006],[.017,-.006],[.021,.015],[.017,.094],[.010,.119],[-.010,.119],[-.022,.092],[-.024,.035]],
  drift:[[-.015,-.005],[.014,-.005],[.011,.018],[.015,.070],[.025,.117],[-.006,.125],[-.019,.089],[-.024,.042]],
  latch:[[-.015,-.015],[.017,-.015],[.023,.014],[.019,.077],[.010,.115],[-.010,.119],[-.024,.095],[-.028,.041]],
 };
 const pin=(batch,x,z,r=.003,y=.018)=>{
  for(const side of[-1,1]){batch.cylinder(tang,x,side*y,z,r,.0012);batch.box(recess,x,side*(y+.0008),z,r*1.15,.0003,.0007,.0001,0,.35);}
 };
 if(spec.id!=='vesper'){
  const profile=profiles[spec.id];
  if(spec.id==='latch'){
   // Leave a real channel for the folded blade between the two steel liners.
   for(const side of[-1,1])fixed.profile(tang,profile,.002,.0007,[0,side*.0105,0]);
   fixed.box(tang,-.024,0,.058,.003,.019,.065,.0006,0,.045);
   fixed.box(tang,0,0,.111,.016,.019,.006,.0007);
  }else fixed.profile(tang,profile,.023,.0011);
  for(const side of[-1,1]){
   fixed.profile(dark,profile.map(([x,z])=>[x*.91,(z-.055)*.94+.055]),.005,.001,[0,side*.015,0]);
   const inset=profile.map(([x,z])=>[x*.63,(z-.055)*.65+.055]);fixed.profile(accent,inset,.0011,.0006,[0,side*.0187,0]);
  }
  for(const z of[.018,.092])pin(fixed,spec.id==='drift'?(z>.08?.008:-.003):spec.id==='crescent'?-.006:0,z,.0031,.0202);
  if(['wake','sentry'].includes(spec.id))for(let i=0;i<8;i++){
   const z=.025+i*.0085;for(const side of[-1,1])fixed.box(recess,0,side*.0201,z,.025,.0007,.0013,.0002,0,.12);
  }
  if(['rift','latch'].includes(spec.id))for(let i=0;i<4;i++)for(const side of[-1,1])fixed.box(recess,side*.012,side*.0201,.038+i*.012,.004,.0008,.005,.0006,0,-.25);
 }
 const bladePoints=BLADES[spec.id];bladeBatch.profile([blade,edge],bladePoints,spec.id==='needle'?.003:.004,.00125);
 // Inset fullers have volume and clear the blade flats, so their finish cannot
 // compete at an identical plane. Their ends follow each blade's silhouette.
 if(['wake','sentry','drift'].includes(spec.id))for(const side of[-1,1])bladeBatch.box(recess,spec.id==='drift'?.006:.004,side*.0034,spec.id==='sentry'?-.12:-.092,.0048,.0004,spec.id==='sentry'?.12:.073,.0008);
 if(spec.id==='needle')for(const side of[-1,1])bladeBatch.tube(edge,[[0,side*.004,-.028],[0,side*.0034,-.18],[0,side*.0015,-.245]],.0008);
 if(spec.id==='rift')for(const side of[-1,1])bladeBatch.box(tang,.018,side*.0035,-.083,.0026,.0005,.087,.0004);
 if(spec.id==='crescent')for(let i=0;i<5;i++){
  const z=-.038-i*.008,x=.015+i*.0032;bladeBatch.cylinder(recess,x,.0035,z,.002,.0005);bladeBatch.cylinder(recess,x,-.0035,z,.002,.0005);
 }
 if(['wake','needle','sentry','rift','drift'].includes(spec.id)){
  const guardWidth=spec.id==='needle'?.064:spec.id==='sentry'?.076:.061;
  fixed.box(tang,0,0,-.012,guardWidth,.017,.009,.002);
  for(const side of[-1,1])fixed.box(edge,side*(guardWidth/2-.007),0,-.015,.009,.021,.012,.0014);
 }
 if(spec.id==='needle')for(const z of[.003,.113])fixed.box(tang,0,0,z,.034,.031,.011,.002);
 if(spec.id==='sentry'){
  fixed.ring(tang,.047,0,-.012,.010,.003);fixed.box(recess,-.026,0,-.013,.006,.022,.012,.0008);
  for(let i=0;i<8;i++)bladeBatch.box(recess,-.020,.001,-.041-i*.006,.004,.006,.0018,.00015);
 }
 if(spec.id==='crescent'){
  fixed.profile(tang,[[-.019,.004],[.014,.004],[.016,-.026],[-.019,-.023]],.014,.0011);
  fixed.ring(tang,0,0,.133,.018,.005);fixed.ring(accent,0,.0001,.133,.018,.0029);parts.ring={center:{...spec.spinPivot},axis:{...spec.spinAxis},radius:.018};
  fixed.box(tang,-.002,0,.113,.018,.024,.017,.0018);
 }
 if(spec.id==='latch'){
  bladePivot.position.z=-.012;bladePivot.userData.hingeAxis='y';parts.hinges.push(bladePivot);
  // Blade is authored relative to the common grip; rebase under its real pivot.
  bladePivot.userData.rebase=.012;
  for(const side of[-1,1]){fixed.cylinder(tang,0,side*.022,-.012,.009,.003);fixed.cylinder(recess,0,side*.024,-.012,.003,.001);}
  bladeBatch.cylinder(tang,.010,.008,-.046,.0038,.008);bladeBatch.cylinder(tang,.010,-.008,-.046,.0038,.008);
  fixed.box(tang,-.013,.021,.061,.005,.003,.073,.001,0,-.07);
 }
 if(spec.id==='vesper'){
  for(const side of[-1,1]){
   const handle=new THREE.Group();handle.name=side<0?'Butterfly safe handle hinge':'Butterfly free handle hinge';handle.position.set(side*.012,0,-.009);group.add(handle);parts.handles.push(handle);parts.hinges.push(handle);
   const h=createGeometryBatch(handle,resources),points=[[-.008,0],[.008,0],[.009,.104],[.005,.135],[-.006,.135],[-.010,.111]];
   // Two pierced face plates and an outer rail form a real channel around
   // the blade when folded, rather than two solid intersecting handles.
   const slots=Array.from({length:5},(_,i)=>{const z=.025+i*.018;return[[-.0036,z-.0045],[.0036,z-.0045],[.0036,z+.0045],[-.0036,z+.0045]];});
   for(const face of[-1,1]){
    h.profile(tang,points,.002,.00055,[0,face*.0107,0],slots);
    h.profile(accent,points.map(([x,z])=>[x*.72,(z-.065)*.83+.065]),.0007,.00035,[0,face*.0128,0],slots);
   }
   h.box(tang,side*.006,0,.067,.003,.018,.115,.0006);h.box(tang,0,0,.127,.016,.020,.008,.0008);
   h.cylinder(edge,0,0,0,.0085,.030);h.cylinder(recess,0,.016,0,.0034,.001);h.finish();
  }
  const latch=new THREE.Group();latch.name='Butterfly latch';latch.position.set(0,0,.117);parts.handles[1].add(latch);parts.latch=latch;
  const l=createGeometryBatch(latch,resources);l.box(tang,-.006,0,.005,.029,.006,.005,.001);l.cylinder(edge,0,0,0,.0035,.025);l.finish();
  fixed.box(tang,0,0,-.014,.025,.014,.015,.0012);bladeBatch.cylinder(tang,0,0,-.025,.0045,.026);
 }
 fixed.finish();const bladeMeshes=bladeBatch.finish();
 if(spec.id==='latch')for(const mesh of bladeMeshes)mesh.geometry.translate(0,0,.012);
 const stats={drawCalls:0,triangles:0,geometryCount:resources.geometries.size,materialCount:resources.materials.size};
 group.traverse(o=>{if(o.isMesh){stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 function pose(value={}){
  const open=clamp(Number.isFinite(value.open)?value.open:1,0,1),swing=clamp(Number.isFinite(value.handleSwing)?value.handleSwing:0,-1,1),roll=Number.isFinite(value.bladeRoll)?value.bladeRoll:0;
  if(spec.id==='latch')bladePivot.rotation.y=-(1-open)*Math.PI;
  else if(spec.id==='vesper'){
   parts.handles[0].rotation.y=(1-open)*Math.PI*.95;
   parts.handles[1].rotation.y=-(1-open)*Math.PI*.95+swing*Math.PI*1.75;
   parts.latch.rotation.y=clamp(Number.isFinite(value.latch)?value.latch:0,-1,1)*1.4;
  }
  // Only narrow stiletto blades support a tiny axial glint adjustment. Normal
  // flips rotate the connected grip in hands.js, never a detached blade.
  bladePivot.rotation.z=spec.id==='needle'?clamp(roll,-.08,.08):0;
 }
 function resetPose(){pose({open:1,handleSwing:0,latch:0,bladeRoll:0});}
 resetPose();
 group.updateMatrixWorld(true);const coreBounds=new THREE.Box3().setFromObject(group);coreReady=true;
 if(hasKnifeTransformation(selection.finishId)){transformationRig=createKnifeTransformation(selection.finishId,group,environment,[body,bladePivot,...parts.handles]);transformationRig.setFinish(getKnifeFinish(selection.finishId));transformationRig.update(0);}
 if(getKnifeFinish(selection.finishId).premium){finishEffects=createKnifeEffects(blade,accent,bladePivot,BLADES[spec.id]);finishEffects.setFinish(getKnifeFinish(selection.finishId));}
 return{group,spec,selection,parts,stats,coreBounds,get transformation(){return transformationRig?.transformation||0;},transformationBounds:()=>transformationRig?.displayBounds(),setFinish,updateFinish,pose,resetPose,dispose(){if(disposed)return;disposed=true;finishEffects?.dispose();transformationRig?.dispose();resources.geometries.forEach(g=>g.dispose());resources.materials.forEach(m=>m.dispose());maps?.textures.forEach(t=>t.dispose());if(ownedEnvironment)environment.dispose();group.removeFromParent();group.clear();}};
}
