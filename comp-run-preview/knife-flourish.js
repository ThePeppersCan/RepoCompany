import * as THREE from './vendor/three.module.js?v=2.15.0';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
// Authored release / catch cues. Solid droplets, fragments and petals are lit
// geometry; electrical and spectral filaments have separate paths and timing.
export const FLOURISHES=Object.freeze({
 mawbound:{shape:'drop',path:'flick',beams:'blood',count:34,speed:.12,gravity:.24,life:.8,size:.0027,beats:[.39,.73],metal:0},
 gallows:{shape:'sliver',path:'helix',beams:'wraith',count:21,speed:.045,gravity:-.03,life:1.25,size:.0017,beats:[.29,.74],metal:.7},
 hellhound:{shape:'coal',path:'eject',beams:'heat',count:31,speed:.14,gravity:.16,life:.7,size:.0025,beats:[.38,.68],metal:.3},
 widow:{shape:'shard',path:'return',beams:'silk',count:16,speed:.065,gravity:0,life:1.3,size:.0023,beats:[.27,.71],metal:.8},
 leviathan:{shape:'drop',path:'splash',beams:'fluid',count:26,speed:.08,gravity:.12,life:1.1,size:.0026,beats:[.35,.76],metal:.1},
 sovereign:{shape:'foil',path:'fan',beams:'sweep',count:16,speed:.055,gravity:.025,life:.72,size:.0015,beats:[.31,.71],metal:1},
 argent:{shape:'facet',path:'radial',beams:'rings',count:9,speed:.035,gravity:0,life:.48,size:.001,beats:[.26,.52,.73],metal:1},
 opaline:{shape:'facet',path:'helix',beams:'silk',count:18,speed:.035,gravity:0,life:.9,size:.0016,beats:[.28,.68],metal:.5},
 imperial:{shape:'star',path:'constellation',beams:'stars',count:12,speed:.03,gravity:0,life:.65,size:.0022,beats:[.32,.63],metal:1},
 kintsugi:{shape:'chip',path:'fracture',beams:'crack',count:17,speed:.05,gravity:.09,life:.65,size:.002,beats:[.35,.72],metal:.8},
 verdigris:{shape:'foil',path:'shed',beams:'scroll',count:22,speed:.035,gravity:.045,life:.85,size:.0019,beats:[.27,.63],metal:.9},
 sanguine:{shape:'drop',path:'flick',beams:'caustic',count:12,speed:.07,gravity:.13,life:.6,size:.002,beats:[.34,.70],metal:.25},
 nocturne:{shape:'sliver',path:'fan',beams:'parallel',count:12,speed:.07,gravity:0,life:.35,size:.0013,beats:[.28,.70],metal:1},
 wraith:{shape:'mote',path:'helix',beams:'wraith',count:22,speed:.04,gravity:-.025,life:1.1,size:.0016,beats:[.25,.55],metal:0},
 bloodmoon:{shape:'drop',path:'flick',beams:'blood',count:42,speed:.135,gravity:.22,life:.9,size:.003,beats:[.33,.69],metal:0},
 gravebloom:{shape:'petal',path:'bloom',beams:'roots',count:22,speed:.065,gravity:.045,life:1.25,size:.0038,beats:[.29,.66],metal:.12},
 hexbound:{shape:'rune',path:'orbit',beams:'sigils',count:15,speed:.04,gravity:0,life:1.05,size:.003,beats:[.24,.64],metal:.45},
 ectoplasm:{shape:'drop',path:'return',beams:'fluid',count:25,speed:.06,gravity:-.015,life:1.0,size:.0028,beats:[.30,.69],metal:.05},
 spectral:{shape:'shard',path:'return',beams:'fracture',count:24,speed:.095,gravity:0,life:1.05,size:.005,beats:[.29,.70],metal:1},
 fallen:{shape:'feather',path:'shed',beams:'halo',count:20,speed:.045,gravity:.028,life:1.2,size:.0037,beats:[.25,.65],metal:.3},
 void:{shape:'sliver',path:'implode',beams:'vortex',count:32,speed:.04,gravity:0,life:.95,size:.0022,beats:[.24,.68],metal:.85},
 solstice:{shape:'ray',path:'radial',beams:'corona',count:24,speed:.08,gravity:0,life:.65,size:.002,beats:[.32,.70],metal:.85},
 permafrost:{shape:'ice',path:'fracture',beams:'frost',count:30,speed:.085,gravity:.07,life:.9,size:.0032,beats:[.31,.67],metal:.1},
 stormcall:{shape:'spark',path:'fan',beams:'lightning',count:22,speed:.13,gravity:.04,life:.36,size:.0013,beats:[.27,.46,.71],metal:.9},
 inferno:{shape:'coal',path:'eject',beams:'heat',count:35,speed:.10,gravity:.12,life:.95,size:.003,beats:[.30,.69],metal:.35},
 tideglass:{shape:'drop',path:'splash',beams:'ripples',count:27,speed:.095,gravity:.16,life:.8,size:.0025,beats:[.33,.70],metal:.05},
 tempest:{shape:'sliver',path:'helix',beams:'wind',count:16,speed:.06,gravity:-.01,life:.8,size:.0014,beats:[.24,.60],metal:.6},
 fulgurite:{shape:'chip',path:'eject',beams:'fulgurite',count:32,speed:.065,gravity:.11,life:.75,size:.0018,beats:[.35,.72],metal:.25},
 nebula:{shape:'star',path:'constellation',beams:'nebula',count:30,speed:.05,gravity:0,life:1.2,size:.0018,beats:[.27,.64],metal:.7},
 jester:{shape:'foil',path:'implode',beams:'puppet',count:28,speed:.055,gravity:-.015,life:1.4,size:.0024,beats:[.25,.76],metal:.9}
});
function particleGeometry(kind){
 let g;
 if(['drop','mote','coal'].includes(kind)){
  g=new THREE.IcosahedronGeometry(1,kind==='drop'?2:1);
  if(kind==='drop'){
   const p=g.attributes.position;
   for(let i=0;i<p.count;i++){const y=p.getY(i),taper=.76-y*.20;p.setXYZ(i,p.getX(i)*taper,y,p.getZ(i)*taper);}
   g.computeVertexNormals();
  }
 }
 else if(['shard','ice','ray','spark','sliver'].includes(kind)){g=new THREE.OctahedronGeometry(1,0);g.scale(kind==='shard'?.7:.32,kind==='ice'?2:2.8,.25);}
 else if(kind==='rune'){g=new THREE.TorusGeometry(.75,.1,4,6);}
 else if(kind==='star'){const s=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*TAU,r=i%2?.32:1;if(i)s.lineTo(Math.cos(a)*r,Math.sin(a)*r);else s.moveTo(Math.cos(a)*r,Math.sin(a)*r);}s.closePath();g=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false});}
 else if(['petal','feather','foil'].includes(kind)){g=new THREE.SphereGeometry(1,10,6);g.scale(kind==='feather'?.32:.75,kind==='petal'?1.2:1.8,.12);const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,a.getZ(i)+a.getY(i)**2*.22);g.computeVertexNormals();}
 else {g=new THREE.TetrahedronGeometry(1,0);g.scale(1,.8,.4);}
 return g;
}
export function createKnifeFlourish(parent,outline,environment){
 const root=new THREE.Group();root.name='Authored knife flourish';root.userData.cosmeticEffect=true;parent.add(root);
 const max=72,dummy=new THREE.Object3D(),color=new THREE.Color(),inverse=new THREE.Matrix4(),worldScale=new THREE.Vector3(),rotation=new THREE.Quaternion(),point=new THREE.Vector3(),velocity=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
 const particles=Array.from({length:max},()=>({life:0,age:0,scale:0,phase:0,spin:0,position:new THREE.Vector3(),origin:new THREE.Vector3(),velocity:new THREE.Vector3()}));
 const material=new THREE.MeshPhysicalMaterial({name:'Knife flourish fragments',color:'#ffffff',roughness:.27,metalness:.6,clearcoat:.8,clearcoatRoughness:.19,envMap:environment,envMapIntensity:.9,side:THREE.DoubleSide});
 const cloud=new THREE.InstancedMesh(particleGeometry('facet'),material,max);cloud.name='Released fragments';cloud.instanceMatrix.setUsage(THREE.DynamicDrawUsage);cloud.frustumCulled=false;cloud.count=0;root.add(cloud);
 const strips=6,segments=28,vertices=new Float32Array(strips*(segments+1)*6),colors=new Float32Array(vertices.length),indices=[];
 for(let b=0;b<strips;b++)for(let i=0;i<segments;i++){const k=(b*(segments+1)+i)*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setIndex(indices);
 const beamMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
 const beams=new THREE.Mesh(geo,beamMaterial);beams.name='Skin-specific filaments';beams.frustumCulled=false;root.add(beams);
 const minZ=Math.min(...outline.map(p=>p[1])),maxZ=Math.max(...outline.map(p=>p[1])),length=maxZ-minZ,mid=(maxZ+minZ)/2;
 let finish=null,preset=null,lastTime=null,lastProgress=0,activeBefore=false,seed=48191,cursor=0,beat=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function burst(amount,catchBeat=false){
  parent.updateWorldMatrix(true,false);parent.matrixWorld.decompose(point,rotation,worldScale);const scale=(Math.abs(worldScale.x)+Math.abs(worldScale.y)+Math.abs(worldScale.z))/3;
  for(let i=0;i<amount;i++){
   const p=particles[cursor++%max],a=i/amount*TAU+random()*.3,r=random();p.age=0;p.life=preset.life*(.72+r*.55);p.scale=preset.size*(preset.shape==='drop'?.24+random()**2*1.25:.55+random()*.9)*scale;p.phase=a;p.spin=(random()-.5)*9;
   const path=preset.path;
   point.set((random()-.5)*.025,.007,mid+(random()-.5)*length*.7);
   if(path==='flick'||path==='splash')point.z=minZ+length*(.05+r*.35);
   if(path==='implode')point.set(Math.cos(a)*.09,.02+Math.sin(a)*.05,mid+Math.sin(a)*.09);
   p.position.copy(point).applyMatrix4(parent.matrixWorld);p.origin.copy(p.position);
   const speed=preset.speed*(.55+random()*.7)*(catchBeat?.55:1);
   if(path==='flick')velocity.set((r-.3)*speed*.8,speed*(.45+random()*.3),-speed*(1.0+r*.5));
   else if(['fan','fracture','eject','splash'].includes(path))velocity.set(Math.cos(a)*speed,speed*(.15+random()*.6),-speed*(.4+Math.sin(a)*.55));
   else if(path==='shed')velocity.set(Math.cos(a)*speed,.2*speed,Math.sin(a)*speed*.4);
   else velocity.set(Math.cos(a)*speed,Math.sin(a)*speed*.6,Math.sin(a)*speed);
   p.velocity.copy(velocity).applyQuaternion(rotation).multiplyScalar(scale);
   p.gravity=preset.gravity*scale;
   color.set(finish.id==='bloodmoon'?'#a80d21':finish.id==='fallen'?(i%4?'#282124':'#ce8247'):finish.colors[i%3===0?1:2]);color.multiplyScalar(.7+random()*.3);
   p.color=color.clone();
  }
 }
 function curve(t,b,time,energy,out){
  const type=preset.beams,a=t*TAU,bias=b/strips,phase=time*.8+b*1.7,spread=(.018+energy*.033),along=maxZ-t*length;
  let x=0,y=.007+b*.001,z=along;
  if(['lightning','fulgurite','crack','frost'].includes(type)){
   const frequency=type==='lightning'?21:type==='frost'?13:9,noise=Math.sin(Math.floor(t*frequency)*17+b*13+Math.floor(time*(type==='lightning'?18:6))*2.7);
   x=noise*Math.sin(t*Math.PI)*spread*(b? .4:1);y+=Math.sin(t*11+b)*.008;z=along+(b>2?Math.sin(t*3)*.03:0);
  }else if(['rings','ripples','halo','vortex','corona','sigils'].includes(type)){
   const radius=type==='vortex'?(.022+b*.009)*(1-energy*.45):type==='corona'?.022+energy*.06: .025+b*.009;
   const angular=a+(type==='sigils'?Math.floor(time*3)*.07:time*(b%2?-.7:.8));
   x=Math.cos(angular)*radius;y=.014+Math.sin(angular)*radius*.35;z=mid+Math.sin(angular)*radius*1.3+(b-2.5)*.009;
  }else if(['wraith','silk','wind','fluid','nebula','puppet','scroll'].includes(type)){
   const twist=type==='wind'?TAU*1.5:type==='wraith'?TAU*2:TAU*.6;
   x=Math.sin(t*twist-phase)*spread*Math.sin(Math.PI*t);y=.009+Math.cos(t*twist-phase)*spread*.7;z=along;
   if(type==='puppet'){x=(bias-.5)*.10*Math.sin(Math.PI*t);z=mid+Math.sin(a+phase)*.06;y=.018+t*.10;}
  }else if(['stars','fracture'].includes(type)){
   const q=t*7,j=Math.floor(q),f=q-j;const node=n=>Math.sin(n*7.3+b*3.7)*spread;x=THREE.MathUtils.lerp(node(j),node(j+1),f);y=.011+b*.001;z=along;
  }else if(type==='roots'){x=Math.sin(t*12+b)*.015*t;y=.007;z=along;}
  else if(type==='blood'){x=Math.sin(t*Math.PI)*.015;y=.008;z=along;}
  else if(type==='heat'){x=Math.sin(t*9-phase)*spread*.4;y=.01+t*.02;z=along;}
  else if(type==='parallel'){x=(b-2.5)*.003;y=.007;z=along;}
  else {x=Math.sin(t*7+phase)*.008;y=.007;z=along;}
  out.set(x,y,z);return out;
 }
 const current=new THREE.Vector3();
 return{
  setFinish(value){finish=value?.premium?value:null;preset=FLOURISHES[finish?.id]||null;for(const p of particles)p.life=0;cloud.count=0;lastTime=null;lastProgress=0;activeBefore=false;beat=0;root.visible=false;if(!preset)return;cloud.geometry.dispose();cloud.geometry=particleGeometry(preset.shape);material.metalness=preset.metal;material.roughness=['drop','ice','shard'].includes(preset.shape)?.16:.34;material.emissive.set(['inferno','stormcall','hexbound','ectoplasm','nebula','void'].includes(finish.id)?finish.colors[1]:'#000000');material.emissiveIntensity=finish.id==='inferno'?1.8:.35;},
  update(time,{active=false,progress=0,inspect=0,effects='full',reducedMotion=false,visible=true}={}){
   const enabled=!!preset&&effects!=='off'&&!reducedMotion&&visible;
   root.visible=enabled;if(!enabled){for(const p of particles)p.life=0;lastTime=time;activeBefore=false;return;}
   const dt=lastTime===null?0:Math.max(0,Math.min(.06,time-lastTime));lastTime=time;const strength=effects==='subtle'?.4:1;
   if(active&&(!activeBefore||progress<lastProgress)){beat=0;}
   if(active)while(beat<preset.beats.length&&progress>=preset.beats[beat]){burst(Math.max(4,Math.round(preset.count*strength*(beat?.55:1))),beat>0);beat++;}
   activeBefore=active;lastProgress=progress;
   parent.updateWorldMatrix(true,false);inverse.copy(parent.matrixWorld).invert();parent.getWorldScale(worldScale);const parentScale=Math.max(.0001,Math.abs(worldScale.x));let n=0;
   for(const p of particles){
    if(!p.life)continue;p.age+=dt;if(p.age>=p.life){p.life=0;continue;}const u=p.age/p.life;
    p.velocity.y-=p.gravity*dt;p.position.addScaledVector(p.velocity,dt);
    if(['return','implode'].includes(preset.path)){point.set(0,.008,mid).applyMatrix4(parent.matrixWorld);p.position.lerp(point,preset.path==='implode'?Math.min(1,dt*(3+u*8)):u>.48?Math.min(1,dt*(u-.48)*16):0);}
    else if(['orbit','constellation','helix','bloom'].includes(preset.path)){p.position.x+=Math.cos(p.phase+u*5)*dt*p.scale*3;p.position.y+=Math.sin(p.phase+u*5)*dt*p.scale*2;}
    dummy.position.copy(p.position).applyMatrix4(inverse);dummy.rotation.set(p.phase+p.age*p.spin,p.phase*.7+p.age*p.spin*.3,p.age*p.spin);
    const fade=clamp((1-u)*5),size=p.scale/parentScale*fade;dummy.scale.setScalar(size);
    if(preset.shape==='drop'){
     // Liquid follows its travel direction; random tumbling made the spray
     // read as solid confetti. Small droplets stay round as the jet breaks up.
     direction.copy(p.velocity).transformDirection(inverse);dummy.quaternion.setFromUnitVectors(up,direction);
     dummy.scale.y*=1+Math.min(1.25,p.velocity.length()/parentScale*5)*(1-u*.6);
    }
    dummy.updateMatrix();cloud.setMatrixAt(n,dummy.matrix);cloud.setColorAt(n,p.color);n++;
   }
   cloud.count=n;cloud.instanceMatrix.needsUpdate=true;if(cloud.instanceColor)cloud.instanceColor.needsUpdate=true;
   const energy=active?Math.sin(progress*Math.PI)**1.3:0;beams.visible=energy>.02;
   if(beams.visible){
    const width=(['wraith','wind','silk','fluid','heat'].includes(preset.beams)?.0022:.00075)*(.7+energy*.6);
    color.set(finish.id==='bloodmoon'?'#ad1529':finish.colors[2]);
    for(let b=0;b<strips;b++)for(let i=0;i<=segments;i++){
     const t=i/segments,fade=Math.sin(Math.PI*t)**.6*(1-b*.12);curve(t,b,time,energy,current);
     for(let side=0;side<2;side++){const at=(b*(segments+1)+i)*6+side*3;vertices[at]=current.x+(side?1:-1)*width;vertices[at+1]=current.y;vertices[at+2]=current.z;colors[at]=color.r*fade;colors[at+1]=color.g*fade;colors[at+2]=color.b*fade;}
    }
    beamMaterial.opacity=energy*strength*(finish.family==='Luxury'?.42:finish.id==='bloodmoon'?.35:.78);geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;
   }
   root.userData.liveParticles=n;root.userData.finish=finish.id;root.userData.active=active;
  },
  dispose(){cloud.geometry.dispose();material.dispose();geo.dispose();beamMaterial.dispose();root.removeFromParent();root.clear();}
 };
}
