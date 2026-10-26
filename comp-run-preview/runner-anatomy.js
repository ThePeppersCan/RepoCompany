import * as THREE from './vendor/three.module.js?v=2.16.0';
import {RUN_STANCE,runStride,runPelvis,runArm} from './runner-stride.js?v=2.16.0';
import {RUNNER_ANATOMY} from './runner-anatomy-data.js?v=2.16.0';

const clamp=THREE.MathUtils.clamp, smooth=THREE.MathUtils.smoothstep;


/** Connected, weighted human garment mesh, with original COMP-RUN tailoring. */
export function createRunnerAnatomy(def,{group,workshop,cloth,pants,glove,sole}){
 const resources=workshop.resources,data=RUNNER_ANATOMY[def.gender==='female'?'female':'male'];
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.position,3));
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(data.skinIndex,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(data.skinWeight,4));
 geometry.setIndex(data.index);geometry.computeVertexNormals();
 const positions=geometry.attributes.position,normals=geometry.attributes.normal,skinIndices=geometry.attributes.skinIndex,skinWeights=geometry.attributes.skinWeight,uv=[];
 const build=clamp(def.build||1,.9,1.13),hipY=data.bones[0].position[1];
 for(let i=0;i<positions.count;i++){
  let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  let hands=0;for(let j=0;j<4;j++){const bone=data.bones[data.skinIndex[i*4+j]].name;if(bone.startsWith('hand.')||bone.startsWith('finger'))hands+=data.skinWeight[i*4+j];}
  const cuff=1-hands,upper=smooth(y,hipY+.02,hipY+.1),foot=1-smooth(y,.07,.14);
  // Garment ease follows the anatomical surface; the body itself supplies
  // the clavicle/deltoid transition and the armhole deforms with the torso.
  let ease=(.012+upper*.006)*(1-foot)*cuff+.0035*hands+.007*foot;
  if(def.style==='puffer'&&upper>.5)ease+=.014;
  if(def.style==='shell'&&upper>.5)ease+=.008;
  const crease=(Math.exp(-(((y-.52)/.065)**2))+Math.exp(-(((y-1.16)/.045)**2)))*.004;
  ease+=Math.sin(y*72+x*20+z*36)*crease;
  x+=normals.getX(i)*ease;y+=normals.getY(i)*ease;z+=normals.getZ(i)*ease;
  // Tailor the rear hip into the lower back and upper thigh. This is a
  // local silhouette correction, not a pelvis translation or whole-body scale.
  const rearHip=Math.exp(-(((y-hipY+.005)/.17)**2))*smooth(z,.012,.095)*(1-smooth(Math.abs(x),.15,.24))*cuff;
  z-=.043*rearHip;
  if(def.gender==='female'){
   // Tailor one continuous jacket front instead of retaining the underlayer's
   // paired chest contours. Its weights follow height, so the fabric does not
   // recover those contours when the chest and spine turn during a run.
   const jacketFront=smooth(y,hipY-.02,hipY+.15)*(1-smooth(y,1.41,1.51))*(1-smooth(Math.abs(x),.12,.21))*smooth(-z,.04,.11)*cuff;
   const drape=-.125-.009*smooth(y,1.15,1.35)+.040*(x/.19)**2;
   z=THREE.MathUtils.lerp(z,drape,jacketFront);
   if(jacketFront>.001){
    const upperWeight=smooth(y,1.15,1.36),lowerWeight=smooth(y,hipY+.08,1.19),tailored=[1-lowerWeight,lowerWeight*(1-upperWeight),lowerWeight*upperWeight],weights=new Map();
    for(let j=0;j<4;j++){const index=data.skinIndex[i*4+j];weights.set(index,(weights.get(index)||0)+data.skinWeight[i*4+j]*(1-jacketFront));}
    for(let j=0;j<3;j++)weights.set(j,(weights.get(j)||0)+tailored[j]*jacketFront);
    const ordered=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=ordered.reduce((n,v)=>n+v[1],0);
    while(ordered.length<4)ordered.push([0,0]);skinIndices.setXYZW(i,...ordered.map(v=>v[0]));skinWeights.setXYZW(i,...ordered.map(v=>v[1]/sum));
   }
  }
  // A woven jacket bridges the sternum instead of following bare-skin detail.
  const bridge=smooth(y,1.16,1.27)*(1-smooth(y,1.42,1.49))*(1-smooth(Math.abs(x),.11,.17));
  if(z<-.025)z-=Math.max(0,z+.105)*bridge*.8;
  positions.setXYZ(i,x*build,y,z);uv.push(x*3+(z>0?.5:0),y*3);
 }
 positions.needsUpdate=true;geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 // Group triangles by fabric. Geometry remains indexed across panel borders
 // so the normals stay continuous at the waist, shoulder and elbow.
 const ordered=[],counts=[];
 for(let material=0;material<4;material++){
  const start=ordered.length;for(let f=0;f<data.section.length;f++){
   const ids=data.index.slice(f*3,f*3+3),y=ids.reduce((n,i)=>n+positions.getY(i),0)/3;
   const section=y>1.505?2:data.section[f];
   if(section===material&&section!==3)ordered.push(...ids);
  }
  counts.push([start,ordered.length-start,material]);
 }
 geometry.setIndex(ordered);geometry.clearGroups();for(const g of counts)geometry.addGroup(...g);
 compact(geometry);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();resources.add(geometry);
 const bones={},world={};
 for(const info of data.bones){const b=new THREE.Bone();b.name=info.name;bones[info.name]=b;world[info.name]=new THREE.Vector3(...info.position);world[info.name].x*=build;}
 for(const info of data.bones){const bone=bones[info.name];bone.position.copy(world[info.name]);if(info.parent){bone.position.sub(world[info.parent]);bones[info.parent].add(bone);}else group.add(bone);bone.userData.rest=bone.position.clone();}
 group.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(data.bones.map(b=>bones[b.name]));
 const mesh=new THREE.SkinnedMesh(geometry,[cloth,pants,glove,sole]);mesh.name='Connected anatomical clothing and gloves';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 group.add(mesh);mesh.bind(skeleton);mesh.userData.anatomical=true;
 const anchor=(name,bone,point)=>{const a=new THREE.Group();a.name=name;a.position.copy(point).sub(world[bone]);bones[bone].add(a);return a;};
 const hips=anchor('hips accessories','hips',new THREE.Vector3(0,hipY,0));
 const chest=anchor('tailored chest','chest',new THREE.Vector3(0,hipY+.04,0));
 const head=anchor('mask and hood','head',new THREE.Vector3(0,1.53,0));head.scale.setScalar(.91);
 const arms=[],legs=[];
 for(const [side,id] of [[-1,'L'],[1,'R']]){
  const attach=(part,label)=>anchor(label,`${part}.${id}`,world[`${part}.${id}`]);
  arms.push({side,id,shoulder:attach('arm','sleeve details'),elbow:attach('forearm','cuff details'),hand:attach('hand','hand details')});
  const ankle=attach('foot','shoe details');ankle.position.y-=world[`foot.${id}`].y-.071;
  legs.push({side,id,hip:attach('thigh','cargo details'),knee:attach('shin','knee details'),ankle});
 }
 const restHeight=hipY,legLength=world['thigh.L'].distanceTo(world['shin.L'])+world['shin.L'].distanceTo(world['foot.L']);
 let blend=0,previousTime=null,phase=0;
 function update(time,{gait='idle',speed=0,look=0,travel,motion=true,knife=false}={}){
  const dt=previousTime===null?0:clamp(time-previousTime,0,.1);previousTime=time;
  const run=gait==='run',moving=run||gait==='walk',target=moving?1:0;
  blend+=(target-blend)*(1-Math.exp(-dt*10));
  const velocity=clamp(speed||(run?5.2:1.25),.2,run?12:2.4),rate=run?Math.max(1.65,velocity*RUN_STANCE/.70):Math.max(.98,velocity*.62/.70);
  phase=Number.isFinite(travel)?travel/(velocity/rate)*Math.PI*2:time*rate*Math.PI*2;
  const breath=motion?Math.sin(time*1.7):0;
  for(const b of Object.values(bones)){b.rotation.set(0,0,0);b.position.copy(b.userData.rest);}
  const pelvis=bones.hips;
  const cycle=((phase/(Math.PI*2))%1+1)%1;
  pelvis.position.y=restHeight+(run?runPelvis(cycle):-.045-Math.cos(phase*2)*.025)*blend;
  const twist=Math.cos(phase-.15),headLag=Math.sin(phase*2-.55),compression=Math.sin(phase*2-.15);
  pelvis.position.x=Math.sin(phase)*.011*blend;
  pelvis.position.z=pelvis.userData.rest.z-(run?.075+compression*.008:0)*blend;
  pelvis.rotation.set((run?-.085+compression*.018:0)*blend,twist*.075*blend,-Math.sin(phase)*.020*blend);
  bones.spine.rotation.set((-(run?.115:.018)+(run?Math.sin(phase*2-.35)*.022:0))*blend+breath*.003,-Math.cos(phase-.28)*.045*blend,Math.sin(phase-.10)*.030*blend);
  bones.chest.rotation.set((-(run?.105:.01)+headLag*.027)*blend,-Math.cos(phase-.4)*(run?.205:.065)*blend,Math.sin(phase-.3)*.033*blend);
  bones.neck.rotation.set(((run?.13:.015)+Math.sin(phase*2-.8)*.028)*blend,Math.cos(phase-.6)*.055*blend,-Math.sin(phase-.55)*.022*blend);
  bones.head.rotation.set(((run?.075:.035)+Math.sin(phase*2-1.1)*.022)*blend+breath*.004,clamp(look,-.65,.65)+Math.cos(phase-.8)*.035*blend,-Math.sin(phase-.8)*.018*blend);
  const pelvisInverse=pelvis.quaternion.clone().invert(),inverseParent=new THREE.Quaternion(),goal=new THREE.Vector3(),kneeGoal=new THREE.Vector3(),direction=new THREE.Vector3(),pole=new THREE.Vector3(),q2=new THREE.Quaternion(),footRotation=new THREE.Quaternion();
  for(const {side,id} of legs){
   const hip=bones[`thigh.${id}`],knee=bones[`shin.${id}`],foot=bones[`foot.${id}`],upper=knee.userData.rest,lower=foot.userData.rest,a=upper.length(),b=lower.length();
   const u=((phase/(Math.PI*2)+(side<0?.5:0))%1+1)%1,stance=run?RUN_STANCE:.62,swing=clamp((u-stance)/(1-stance),0,1);
   const stride=velocity/Math.max(.1,group.scale.x)/rate*stance;
   const authored=run?runStride(u,stride):null;
   const z=(authored?authored.z:u<stance?-stride*.5+stride*u/stance:stride*.5-stride*(swing*swing*(3-2*swing)))*blend;
   const lift=(authored?authored.lift:u<stance?0:Math.sin(swing*Math.PI)*.095)*blend;
   const pitch=(authored?authored.pitch:-(u<stance?smooth(u,stance*.65,stance)*.40:Math.sin(swing*Math.PI)*.12))*blend;
   const footHeight=world[`foot.${id}`].y;
   const heelLift=pitch<0?footHeight*(Math.cos(pitch)-1)-.17*Math.sin(pitch):0;
   const toeAnchor=pitch<0?footHeight*Math.sin(pitch)+.17*(Math.cos(pitch)-1):0;
   goal.copy(world[`foot.${id}`]);goal.y+=lift+heelLift;goal.z+=z+toeAnchor;
   goal.sub(pelvis.position).applyQuaternion(pelvisInverse).sub(hip.position);
   const reach=clamp(goal.length(),Math.abs(a-b)+.01,a+b-.0001);direction.copy(goal).normalize();
   // Knee pole is the runner's forward direction. Solve both limbs in the
   // rotated pelvis frame, keeping the contact foot fixed in the world.
   pole.set(0,0,-1).applyQuaternion(pelvisInverse);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
   const along=(a*a-b*b+reach*reach)/(2*reach),height=Math.sqrt(Math.max(0,a*a-along*along));
   kneeGoal.copy(direction).multiplyScalar(along).addScaledVector(pole,height);
   if(blend>.00001){
    hip.quaternion.setFromUnitVectors(upper.clone().normalize(),kneeGoal.clone().normalize());
    q2.setFromUnitVectors(lower.clone().normalize(),goal.clone().sub(kneeGoal).normalize());
    knee.quaternion.copy(hip.quaternion).invert().multiply(q2);
    inverseParent.copy(pelvis.quaternion).multiply(q2).invert();footRotation.setFromAxisAngle(new THREE.Vector3(1,0,0),pitch);foot.quaternion.copy(inverseParent).multiply(footRotation);
   }
  }
  for(const {side,id} of arms){
   const u=((phase/(Math.PI*2)+(side<0?.5:0))%1+1)%1,holding=knife&&id==='R',authored=runArm(u,holding),swing=Math.sin(u*Math.PI*2);
   const arm=bones[`arm.${id}`],fore=bones[`forearm.${id}`],hand=bones[`hand.${id}`];
   arm.rotation.set(-.045+(run?authored.swing:.3*swing)*blend,side*.015,side*(.035+.035*blend));
   fore.rotation.x=.08+(run?authored.elbow:.17+Math.max(0,-swing)*.15)*blend;
   bones[`clavicle.${id}`].rotation.set(-(run?authored.swing:swing)*.10*blend,side*Math.sin(u*Math.PI*2-.35)*.025*blend,side*Math.sin(u*Math.PI*2-.3)*.048*blend);
   hand.rotation.x=-.04+(-.04+(run?Math.sin(u*Math.PI*2-.5)*.05:0))*blend;
   if(holding){
    arm.rotation.x+=.20*(1-blend);fore.rotation.x+=.82*(1-blend);
    // Pronation is shared across the forearm and wrist. The closed hand holds
    // the blade across the body, matching the existing first-person grip.
    fore.rotation.y=.85;hand.rotation.y=.55;hand.rotation.z=-.08;
   }
   for(let finger=1;finger<=5;finger++)for(let segment=1;segment<=3;segment++){
    const b=bones[`finger${finger}-${segment}.${id}`];
    b.rotation.z=-side*(finger===1?(holding?.55:.1):(holding?[.78,1.0,.62][segment-1]:[.12,.22,.13][segment-1]+[.4,.48,.3][segment-1]*blend));
   }
  }
  if(['brace','air','jump','fall'].includes(gait)){
   bones.spine.rotation.x=-.12;for(const {id,side} of arms){bones[`arm.${id}`].rotation.set(.5,0,side*.3);bones[`forearm.${id}`].rotation.x=.6;}
   for(const {id,side} of legs){bones[`thigh.${id}`].rotation.x=.3+side*.12;bones[`shin.${id}`].rotation.x=-.65;bones[`foot.${id}`].rotation.x=.2;}
  }
  if(gait==='look-back'){bones.head.rotation.y=-.65;bones.chest.rotation.y=-.14;}
  group.userData.animation={gait,blend,phase,cadence:rate,stance:run?RUN_STANCE:.62,rig:'anatomical',knife:!!knife};return gait;
 }
 function fitFront(assembly,{filter=()=>true}={}){
  // Rasterise the garment's front once in body space. Fitting many stitches
  // then costs a lookup per vertex, rather than a ray cast per triangle.
  const size=80,minX=-.32,maxX=.32,minY=hipY-.03,maxY=1.50,depth=new Float32Array(size*size).fill(Infinity);
  const px=x=>(x-minX)/(maxX-minX)*(size-1),py=y=>(y-minY)/(maxY-minY)*(size-1),p=geometry.attributes.position,ix=geometry.index;
  for(let t=0;t<ix.count;t+=3){
   const ids=[ix.getX(t),ix.getX(t+1),ix.getX(t+2)],v=ids.map(i=>[px(p.getX(i)),py(p.getY(i)),p.getZ(i)]);
   const [[ax,ay,az],[bx,by,bz],[cx,cy,cz]]=v,den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
   if(Math.abs(den)<1e-7)continue;
   const left=Math.max(0,Math.floor(Math.min(ax,bx,cx))),right=Math.min(size-1,Math.ceil(Math.max(ax,bx,cx))),bottom=Math.max(0,Math.floor(Math.min(ay,by,cy))),top=Math.min(size-1,Math.ceil(Math.max(ay,by,cy)));
   for(let y=bottom;y<=top;y++)for(let x=left;x<=right;x++){
    const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,w=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,q=1-u-w;
    if(Math.min(u,w,q)<-.01)continue;const z=u*az+w*bz+q*cz;depth[y*size+x]=Math.min(depth[y*size+x],z);
   }
  }
  const point=new THREE.Vector3(),inverse=new THREE.Matrix4();group.updateMatrixWorld(true);
  assembly.traverse(object=>{
   if(!object.isMesh||!filter(object))return;
   const worldScale=new THREE.Vector3();object.getWorldScale(worldScale);
   const source=object.geometry,src=source.attributes.position,sourceUV=source.attributes.uv,sourceNormals=source.attributes.normal,triangles=source.index?.array||Array.from({length:src.count},(_,i)=>i),vertices=[],texcoords=[],originalNormals=[];
   const vertex=i=>[src.getX(i),src.getY(i),src.getZ(i),sourceUV?.getX(i)||0,sourceUV?.getY(i)||0,sourceNormals?.getX(i)||0,sourceNormals?.getY(i)||0,sourceNormals?.getZ(i)||0];
   const split=(a,b,c,level=0)=>{
    const edge=(u,v)=>((u[0]-v[0])*worldScale.x)**2+((u[1]-v[1])*worldScale.y)**2+((u[2]-v[2])*worldScale.z)**2,lengths=[edge(a,b),edge(b,c),edge(c,a)],longest=Math.max(...lengths);
    if(longest>.025**2&&level<8){
     const k=lengths.indexOf(longest),v=[a,b,c],u=v[k],w=v[(k+1)%3],opposite=v[(k+2)%3],mid=u.map((x,i)=>(x+w[i])*.5);
     split(u,mid,opposite,level+1);split(mid,w,opposite,level+1);return;
    }
    for(const v of [a,b,c]){vertices.push(...v.slice(0,3));texcoords.push(...v.slice(3,5));originalNormals.push(...v.slice(5));}
   };
   for(let t=0;t<triangles.length;t+=3)split(vertex(triangles[t]),vertex(triangles[t+1]),vertex(triangles[t+2]));
   const fitted=new THREE.BufferGeometry();fitted.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));fitted.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));resources.add(fitted);object.geometry=fitted;
   inverse.copy(object.matrixWorld).invert();const p=fitted.attributes.position;
   for(let i=0;i<p.count;i++){
    point.fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld);
    if(point.z>-.035||point.y<minY||point.y>maxY)continue;
    const x=px(point.x),y=py(point.y),ix=Math.floor(x),iy=Math.floor(y);if(ix<0||ix>=size-1||iy<0||iy>=size-1)continue;
    const values=[depth[iy*size+ix],depth[iy*size+ix+1],depth[(iy+1)*size+ix],depth[(iy+1)*size+ix+1]],tx=x-ix,ty=y-iy;
    const z=values.every(Number.isFinite)?THREE.MathUtils.lerp(THREE.MathUtils.lerp(values[0],values[1],tx),THREE.MathUtils.lerp(values[2],values[3],tx),ty):values.find(Number.isFinite);
    if(!Number.isFinite(z))continue;
    // Preserve the authored depth between armour, lapels, badges and seams.
    // Projecting every layer onto one surface creates flickering intersections.
    point.z=z-.022+(point.z+.13)*.85;point.applyMatrix4(inverse);p.setXYZ(i,point.x,point.y,point.z);
   }
   p.needsUpdate=true;dropCollapsedTriangles(object.geometry);object.geometry.computeVertexNormals();
  });
 }
 update(0);
 return {mesh,bones,hips,chest,head,arms,legs,world,update,restHeight,legLength,fitFront,dispose(){skeleton.dispose();}};
}

function compact(geometry){
 const used=[...new Set(geometry.index.array)],map=new Map(used.map((id,index)=>[id,index]));
 for(const [name,attribute] of Object.entries(geometry.attributes)){
  const values=new attribute.array.constructor(used.length*attribute.itemSize);
  used.forEach((id,index)=>{for(let c=0;c<attribute.itemSize;c++)values[index*attribute.itemSize+c]=attribute.array[id*attribute.itemSize+c];});
  geometry.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
 }
 geometry.setIndex(Array.from(geometry.index.array,id=>map.get(id)));
}
function dropCollapsedTriangles(geometry){
 const p=geometry.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),kept=[];
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1).sub(a);c.fromBufferAttribute(p,i+2).sub(a);if(b.cross(c).lengthSq()>1e-18)kept.push(i,i+1,i+2);}
 geometry.setIndex(kept);compact(geometry);
}
