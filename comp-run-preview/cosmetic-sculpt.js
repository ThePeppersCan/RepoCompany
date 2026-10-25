import * as THREE from './vendor/three.module.js?v=2.15.0';

// Small authored surfaces shared by creature ornaments and runner equipment.
// Each workshop owns its geometry/materials; animation joints remain separate.
export function cosmeticSculpt(resources,environment=null,{detail=20}={}){
 const mat=(name,color,{rough=.42,metal=.35,coat=.15,emission=null}={})=>{
  const m=new THREE.MeshPhysicalMaterial({name,color,roughness:rough,metalness:metal,clearcoat:coat,clearcoatRoughness:.3,envMap:environment,envMapIntensity:.65});
  if(emission){m.emissive.set(emission);m.emissiveIntensity=.35;}resources.add(m);return m;
 };
 const joint=(parent,name,p=[0,0,0])=>{const g=new THREE.Group();g.name=name;g.position.set(...p);parent.add(g);return g;};
 const mesh=(parent,geo,material,p=[0,0,0],scale=[1,1,1])=>{resources.add(geo);const m=new THREE.Mesh(geo,material);m.position.set(...p);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const ell=(parent,material,p,scale)=>mesh(parent,new THREE.SphereGeometry(1,detail,Math.max(8,Math.floor(detail*.65))),material,p,scale);
 const box=(parent,material,p,size)=>mesh(parent,new THREE.BoxGeometry(...size),material,p);
 const ring=(parent,material,p,r,t=.0015)=>mesh(parent,new THREE.TorusGeometry(r,t,6,detail*2),material,p);
 function taper(parent,material,points,radii,{sides=10,steps=24}={}){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),frames=curve.computeFrenetFrames(steps,false),pos=[],uv=[],idx=[];
  for(let i=0;i<=steps;i++){
   const t=i/steps,p=curve.getPointAt(t),k=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(k)),r=THREE.MathUtils.lerp(radii[j],radii[j+1],k-j),n=frames.normals[i],b=frames.binormals[i];
   for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2;pos.push(p.x+r*(Math.cos(a)*n.x+Math.sin(a)*b.x),p.y+r*(Math.cos(a)*n.y+Math.sin(a)*b.y),p.z+r*(Math.cos(a)*n.z+Math.sin(a)*b.z));uv.push(s/sides,t);if(i<steps&&s<sides){const q=i*(sides+1)+s;idx.push(q,q+1,q+sides+1,q+1,q+sides+2,q+sides+1);}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,material);
 }
 function plate(parent,material,points,depth=.003){
  const shape=new THREE.Shape(points.map(p=>new THREE.Vector2(...p)));
  const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:Math.min(depth*.4,.002),bevelThickness:Math.min(depth*.4,.002),bevelSegments:2,curveSegments:8});return mesh(parent,g,material);
 }
 const tooth=(parent,material,p,length=.009,r=.0025,angle=0)=>{const m=mesh(parent,new THREE.ConeGeometry(r,length,7),material,p);m.rotation.z=Math.PI+angle;return m;};
 return{mat,joint,mesh,ell,box,ring,taper,plate,tooth};
}

export const cosmeticEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const cosmeticEnvelope=(p,start=.12,end=.76)=>cosmeticEase((p-start)/.18)*(1-cosmeticEase((p-end)/.18));
