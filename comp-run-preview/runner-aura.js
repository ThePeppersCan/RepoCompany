import * as THREE from './vendor/three.module.js?v=2.17.0';
// Sparse, local, lit flecks. No giant aura or screen overlay follows a runner.
export function createRunnerAura(parent,def,resources,{hero=true}={}){
 const count=hero?24:10,geo=new THREE.OctahedronGeometry(1,0),material=new THREE.MeshStandardMaterial({name:def.name+' / suspended fragments',color:def.accent,roughness:.58,metalness:.4,transparent:true,opacity:.38,depthWrite:false});
 resources.add(geo);resources.add(material);const cloud=new THREE.InstancedMesh(geo,material,count);cloud.name=def.name+' / local animated finish';cloud.frustumCulled=false;cloud.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(cloud);
 resources.add({dispose(){cloud.dispose();}});const dummy=new THREE.Object3D();
 let seed=0;for(const c of def.id)seed=(seed*31+c.charCodeAt(0))>>>0;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const points=Array.from({length:count},()=>({angle:rand()*Math.PI*2,phase:rand(),height:.9+rand()*.7,radius:.15+rand()*.07,size:.0015+rand()*.002}));
 return {update(time,{motion=true,effects=true,energy=0,moving=false,strength=1}={}){
  cloud.visible=effects&&motion;if(!cloud.visible)return;cloud.count=Math.max(1,Math.round((energy>.05?count:Math.min(count,def.premiumAnimated?8:4))*strength));material.opacity=(.28+energy*.35)*strength;
  for(let i=0;i<cloud.count;i++){const p=points[i],life=(time*(def.premiumAnimated?.22:.15)+p.phase)%1,a=p.angle+time*.13,r=p.radius+energy*.15;
   dummy.position.set(Math.cos(a)*r,p.height+life*.12+energy*Math.sin(a)*.1,Math.sin(a)*r+(moving?.06:0));dummy.rotation.set(a,time*.8+p.phase,a*.6);dummy.scale.setScalar(p.size*Math.sin(life*Math.PI)*(1+energy));dummy.updateMatrix();cloud.setMatrixAt(i,dummy.matrix);
  }cloud.instanceMatrix.needsUpdate=true;
 }};
}
