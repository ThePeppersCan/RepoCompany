import * as THREE from './vendor/three.module.js?v=2.15.0';
import {finishRunnerBuild} from './runner-craft.js?v=2.15.0';
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
// A separate articulated ornament: porcelain mask, cut-metal ruff, asymmetric
// cap, hinged jaw and folding claw arms. Its timeline never alters the grip.
export function createJesterKnife(parent,environment,core){
 const resources=new Set(),root=new THREE.Group();root.name='Jester / possessed grip';root.userData.cosmeticEffect=true;root.position.set(0,.018,.064);root.rotation.x=-Math.PI/2;parent.add(root);root.visible=false;
 const material=(name,color,roughness,metalness,coat=0)=>{const m=new THREE.MeshPhysicalMaterial({name,color,roughness,metalness,clearcoat:coat,clearcoatRoughness:.28,envMap:environment,envMapIntensity:.7});resources.add(m);return m;};
 const ivory=material('Jester / aged porcelain','#d1c0a0',.34,.04,.32),red=material('Jester / oxblood lacquer','#49101c',.29,.15,.48),black=material('Jester / smoked iron','#12151a',.43,.8),gold=material('Jester / antique gold','#b39250',.29,.93),mouth=material('Jester / deep recess','#050608',.92,0),teeth=material('Jester / carved teeth','#c1ab83',.4,.15),eyes=material('Jester / ember eyes','#ba2d25',.27,.15);
 eyes.emissive.set('#e13723');eyes.emissiveIntensity=.4;
 function mesh(geometry,mat,group=root,pos=[0,0,0],scale=[1,1,1]){resources.add(geometry);const m=new THREE.Mesh(geometry,mat);m.position.set(...pos);m.scale.set(...scale);m.frustumCulled=false;group.add(m);return m;}
 const ell=(g,m,x,y,z,rx,ry,rz)=>mesh(new THREE.SphereGeometry(1,24,16),m,g,[x,y,z],[rx,ry,rz]);
 const joint=(name,g,pos=[0,0,0])=>{const o=new THREE.Group();o.name=name;o.position.set(...pos);g.add(o);return o;};
 function taper(g,m,points,radii){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=30,sides=12,positions=[],indices=[],uv=[],up=new THREE.Vector3(0,0,1),n=new THREE.Vector3(),b=new THREE.Vector3();
  for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPoint(t),d=curve.getTangent(t);n.crossVectors(d,up).normalize();if(n.lengthSq()<.1)n.set(1,0,0);b.crossVectors(d,n).normalize();const k=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(k)),r=THREE.MathUtils.lerp(radii[j],radii[j+1],k-j);
   for(let s=0;s<=sides;s++){const a=s/sides*Math.PI*2;positions.push(p.x+r*(n.x*Math.cos(a)+b.x*Math.sin(a)),p.y+r*(n.y*Math.cos(a)+b.y*Math.sin(a)),p.z+r*(n.z*Math.cos(a)+b.z*Math.sin(a)));uv.push(s/sides,t);if(i<segments&&s<sides){const at=i*(sides+1)+s;indices.push(at,at+sides+1,at+1,at+1,at+sides+1,at+sides+2);}}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();return mesh(geometry,m,g);
 }
 const body=joint('Jester / folding coat',root,[0,-.028,-.005]);
 ell(body,black,0,-.013,0,.016,.025,.009);ell(body,red,0,-.01,.006,.012,.021,.006);
 for(const side of [-1,1])taper(body,side<0?red:black,[[side*.008,-.021,0],[side*.018,-.048,-.005],[side*.028,-.057,.002]],[.008,.005,.0005]);
 for(let i=0;i<3;i++)ell(body,gold,0,-.006-i*.009,.013,.0018,.0018,.0012);
 const neck=joint('Jester / neck',root),head=joint('Jester / porcelain mask',neck);
 ell(head,ivory,0,.006,0,.019,.025,.012);
 // Carved cheek planes surround small recessed, slanted sockets.
 for(const side of [-1,1]){
  const socket=ell(head,mouth,side*.008,.010,.0105,.007,.004,.003);socket.rotation.z=side*.24;
  const eye=ell(head,eyes,side*.008,.010,.013,.0034,.0008,.001);eye.rotation.z=side*.2;
  taper(head,ivory,[[side*.003,.014,.012],[side*.009,.017,.013],[side*.016,.013,.008]],[.0015,.0025,.001]);
  taper(head,ivory,[[side*.016,.006,.007],[side*.013,-.006,.012],[side*.006,-.014,.010]],[.003,.004,.0012]);
  taper(head,red,[[side*.009,.006,.012],[side*.011,-.002,.013],[side*.008,-.009,.012]],[.0013,.0008,.00015]);
 }
 taper(head,ivory,[[0,.012,.013],[0,.004,.020],[0,-.001,.018]],[.003,.0035,.0007]);
 ell(head,red,0,.003,.019,.0025,.003,.0013);
 ell(head,mouth,0,-.009,.008,.012,.007,.005);
 const jaw=joint('Jester / hinged jaw',head,[0,-.006,.003]);
 taper(jaw,ivory,[[-.013,-.002,.005],[-.009,-.014,.011],[0,-.018,.012],[.009,-.014,.011],[.013,-.002,.005]],[.002,.003,.003,.003,.002]);
 for(let i=0;i<9;i++){
  const x=(i-4)*.00235,y=-.005-Math.abs(i-4)*.00045;
  taper(head,teeth,[[x,y,.013],[x,y-.005-(i%2)*.001,.014]],[.001,.0001]);
  taper(jaw,teeth,[[x,-.012,.012],[x,-.007+(i%2)*.001,.013]],[.0009,.0001]);
 }
 // The cap is asymmetric and hangs under its own weight, with small brass bells.
 const cap=joint('Jester / three-point cap',head,[0,.022,-.001]),bells=[];
 const capPaths=[[[0,0,0],[-.013,.020,-.004],[-.028,.022,-.002],[-.035,.012,.003]],[[0,0,-.002],[.012,.026,-.006],[.024,.033,-.004],[.031,.020,.003]],[[0,.004,-.006],[0,.028,-.014],[.005,.040,-.009],[.011,.036,0]]];
 capPaths.forEach((points,i)=>{taper(cap,i===1?black:red,points,[.010,.008,.004,.0008]);const tip=points.at(-1),bell=joint('Jester / bell '+i,cap,tip);ell(bell,gold,0,-.001,0,.0032,.0038,.0032);taper(bell,black,[[-.002,-.003,.002],[.002,-.003,.002]],[.00035,.00035]);bells.push(bell);});
 for(let i=0;i<11;i++){const a=i/11*Math.PI*2,ruff=mesh(new THREE.ConeGeometry(.005,.019,3),i%2?ivory:red,root,[Math.cos(a)*.019,-.023,Math.sin(a)*.009-.002]);ruff.rotation.z=-Math.cos(a)*.7;ruff.rotation.x=Math.sin(a)*.5;}
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=joint('Jester / shoulder '+side,body,[side*.013,0,0]),elbow=joint('Jester / elbow '+side,shoulder,[side*.018,-.014,0]),hand=joint('Jester / claw '+side,elbow,[side*.017,-.013,.001]);
  taper(shoulder,side<0?red:black,[[0,0,0],[side*.011,-.006,.001],[side*.018,-.014,0]],[.0055,.004,.003]);ell(shoulder,gold,0,0,0,.005,.005,.004);
  taper(elbow,ivory,[[0,0,0],[side*.010,-.006,.002],[side*.017,-.013,.001]],[.0028,.002,.0015]);ell(hand,ivory,0,-.003,0,.004,.006,.002);
  for(let finger=0;finger<3;finger++)taper(hand,ivory,[[side*(finger-1)*.003,-.005,0],[side*(finger-1)*.004,-.013,.003],[side*(finger-1)*.003,-.017,.009]],[.0011,.0008,.00015]);
  arms.push({side,shoulder,elbow,hand});
 }
 finishRunnerBuild(root,resources);
 let enabled=false,disposed=false;
 const restore=()=>{for(const part of core)part.scale.setScalar(1);};
 return{
  setFinish(finish){enabled=finish?.id==='jester';root.visible=enabled;restore();},
  update(time,{progress=0,active=false,reducedMotion=false}={}){
   if(disposed||!enabled)return;
   const p=active&&!reducedMotion?progress:0,unfold=ease((p-.08)/.2)*(1-ease((p-.75)/.2)),reveal=ease((p-.22)/.12)*(1-ease((p-.70)/.12));
   root.scale.setScalar(1+unfold*1.35);root.rotation.z=unfold*Math.PI/2;root.position.y=.018+unfold*.055;root.position.z=.064-unfold*.12;
   for(const part of core)part.scale.setScalar(1-unfold*.985);
   body.scale.set(1,.15+.85*unfold,1);body.visible=unfold>.01;
   neck.rotation.y=unfold*(.32*Math.sin(p*Math.PI*2)-.15);neck.rotation.z=unfold*(-.18+.12*Math.sin(p*Math.PI*3));
   head.rotation.x=unfold*-.22;head.position.y=unfold*.012;
   jaw.rotation.x=reveal*(.48+.10*Math.sin(p*Math.PI*8));eyes.emissiveIntensity=.35+reveal*2.4;
   for(const arm of arms){arm.shoulder.rotation.z=arm.side*(1.5*(1-unfold)-.9*unfold);arm.elbow.rotation.z=-arm.side*reveal*(.6+.35*Math.sin(p*Math.PI*3));arm.hand.rotation.x=-reveal*.75;arm.hand.rotation.y=arm.side*reveal*.4;}
   bells.forEach((bell,i)=>{bell.rotation.z=unfold*Math.sin(p*15+i)*.22;});
   root.userData.transformation=unfold;
  },
  get transformation(){return root.userData.transformation||0;},
  displayBounds(){root.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(root);},
  dispose(){if(disposed)return;disposed=true;restore();root.removeFromParent();for(const r of resources)r.dispose();root.clear();}
 };
}
