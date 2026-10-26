import * as THREE from './vendor/three.module.js?v=2.16.0';
import {createKnifeFlourish} from './knife-flourish.js?v=2.16.0';
const TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
// All particles are seeded once on the actual blade outline. Neither effects
// nor inspection changes collision, movement, or gameplay lighting.
export function createKnifeEffects(blade,accent,parent,outline){
 const uniforms={premiumTime:{value:0},premiumStrength:{value:0},premiumPattern:{value:0},premiumInspect:{value:0}};
 for(const material of [blade,accent]){
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.fragmentShader='uniform float premiumTime; uniform float premiumStrength; uniform float premiumPattern; uniform float premiumInspect;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    #ifdef USE_EMISSIVEMAP
     float sweep=pow(max(0.0,sin(vEmissiveMapUv.x*8.0-premiumTime*(1.6+mod(premiumPattern,4.0)*.3))),6.0);
     float ripple=.5+.5*sin(vEmissiveMapUv.x*(17.0+premiumPattern)+vEmissiveMapUv.y*8.0-premiumTime*2.2);
     totalEmissiveRadiance *= premiumStrength*(.18+sweep*(1.6+premiumInspect*5.0)+ripple*.22);
    #endif`);
  };
  material.customProgramCacheKey=()=> 'comp-run-premium-finish-v1';
 }
 const flourish=createKnifeFlourish(parent,outline,blade.envMap);
 const count=36,positions=new Float32Array(count*3),seeds=[];
 const minX=Math.min(...outline.map(p=>p[0])),maxX=Math.max(...outline.map(p=>p[0])),minZ=Math.min(...outline.map(p=>p[1])),maxZ=Math.max(...outline.map(p=>p[1]));
 const inside=(x,z)=>{let hit=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 let random=9217;const rand=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
 for(let i=0;i<count;i++){let x,z;do{x=minX+rand()*(maxX-minX);z=minZ+rand()*(maxZ-minZ);}while(!inside(x,z));seeds.push({x,z,a:rand()*TAU,s:rand(),side:i%2?1:-1});}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,uniforms:{tint:{value:new THREE.Color()},opacity:{value:0},shape:{value:0},size:{value:1}},vertexShader:'uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;float scale=length(modelMatrix[0].xyz);gl_PointSize=clamp(size*5.0*scale/max(.2,-p.z),3.0,24.);}',fragmentShader:'uniform vec3 tint;uniform float opacity;uniform float shape;void main(){vec2 q=gl_PointCoord-.5;float r=length(q);float round=pow(max(0.,1.-r*2.),2.);float star=max(0.,1.-min(abs(q.x),abs(q.y))*18.)*max(0.,1.-r*2.);float core=pow(max(0.,1.-r*5.),3.);float a=(mix(round,star,shape)+core)*opacity;if(a<.005)discard;gl_FragColor=vec4(mix(tint,vec3(1.),core*.65),a);}' });
 const points=new THREE.Points(geometry,material);points.userData.cosmeticEffect=true;points.name='Knife finish particles';points.frustumCulled=false;points.visible=false;parent.add(points);
 const trailCount=16,trailPositions=new Float32Array(trailCount*6),trailColors=new Float32Array(trailCount*6),trailGeometry=new THREE.BufferGeometry(),trailIndex=[];
 for(let i=0;i<trailCount-1;i++)trailIndex.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
 trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));trailGeometry.setAttribute('color',new THREE.BufferAttribute(trailColors,3));trailGeometry.setIndex(trailIndex);
 const trailMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const trail=new THREE.Mesh(trailGeometry,trailMaterial);trail.userData.cosmeticEffect=true;trail.name='Knife flourish light trail';trail.frustumCulled=false;trail.visible=false;parent.add(trail);
 const tip=outline.reduce((a,b)=>b[1]<a[1]?b:a),history=[],inverse=new THREE.Matrix4(),aWorld=new THREE.Vector3(),bWorld=new THREE.Vector3(),local=new THREE.Vector3();
 let finish=null,lastTime=-1;
 return{
  setFinish(value){flourish.setFinish(value);finish=value?.premium?value:null;uniforms.premiumPattern.value=finish?.pattern||0;material.uniforms.tint.value.set(finish?.colors[2]||'#ffffff');material.uniforms.shape.value=['gilt','silver','pearl','ceramic','bronze','lacquer','arc','star','snow','shard'].includes(finish?.style)?1:0;points.visible=false;trail.visible=false;history.length=0;},
  update(time,options={}){
   const {reducedMotion=false,effects='full',inspect=0,visible=true}=options;flourish.update(time,options);
   const active=finish&&effects!=='off',boost=clamp(inspect),t=reducedMotion?0:time;
   uniforms.premiumTime.value=t;uniforms.premiumInspect.value=reducedMotion?0:boost;
   uniforms.premiumStrength.value=active?(finish.family==='Luxury'?.95:1.3)*(effects==='subtle'?.35:1):0;
   points.visible=!!active&&visible&&!reducedMotion;trail.visible=points.visible&&boost>.08&&['nocturne','inferno','tempest','solstice'].includes(finish.id);
   if(!points.visible){history.length=0;return;}
   const strength=effects==='subtle'?.4:1,orbit=['void','rune','star'].includes(finish.style),fall=['petal','snow','ash','dust'].includes(finish.style),water=finish.style==='water',arc=finish.style==='arc';
   const luxury=finish.family==='Luxury';geometry.setDrawRange(0,boost>.1?18:luxury?5:12);material.uniforms.opacity.value=(luxury?.8:.65)+boost*.7;material.uniforms.opacity.value*=strength;material.uniforms.size.value=1+boost*.65;
   for(let i=0;i<count;i++){
    const s=seeds[i],age=(t*(.14+s.s*.13)+s.s)%1,flare=boost*.018,spin=s.a+t*(orbit?1.6:.4);
    positions[i*3]=s.x+(orbit?Math.cos(spin)*flare:Math.sin(spin)*.002*(1+boost*4));
    positions[i*3+1]=s.side*(.008+age*(luxury?.001:.006)+flare)+(fall?-1:1)*age*.006;
    positions[i*3+2]=s.z+(water?age*age:fall?age:-age)*(.005+flare)+(arc?Math.sin(t*9+s.a)*boost*.005:0);
   }
   geometry.attributes.position.needsUpdate=true;
   if(trail.visible&&time!==lastTime){
    parent.updateWorldMatrix(true,false);inverse.copy(parent.matrixWorld).invert();
    aWorld.set(tip[0],.005,tip[1]).applyMatrix4(parent.matrixWorld);bWorld.set(tip[0],.005,tip[1]+(maxZ-minZ)*.35).applyMatrix4(parent.matrixWorld);
    history.unshift([aWorld.clone(),bWorld.clone()]);if(history.length>trailCount)history.pop();
    for(let i=0;i<trailCount;i++)for(let j=0;j<2;j++){local.copy((history[i]||history.at(-1))[j]).applyMatrix4(inverse);const at=i*6+j*3;trailPositions.set([local.x,local.y,local.z],at);const fade=(1-i/trailCount)**2*(j?.3:1);trailColors.set([material.uniforms.tint.value.r*fade,material.uniforms.tint.value.g*fade,material.uniforms.tint.value.b*fade],at);}
    trailGeometry.attributes.position.needsUpdate=true;trailGeometry.attributes.color.needsUpdate=true;trailMaterial.opacity=boost*.55*strength;
   }else if(!trail.visible)history.length=0;
   lastTime=time;
  },
  dispose(){flourish.dispose();points.removeFromParent();geometry.dispose();material.dispose();trail.removeFromParent();trailGeometry.dispose();trailMaterial.dispose();history.length=0;}
 };
}
