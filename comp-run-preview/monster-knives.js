import * as THREE from './vendor/three.module.js?v=2.17.0';
import {cosmeticSculpt,cosmeticEase as ease,cosmeticEnvelope as envelope} from './cosmetic-sculpt.js?v=2.17.0';
import {finishRunnerBuild} from './runner-craft.js?v=2.17.0';

export const MONSTER_KNIVES=Object.freeze(['mawbound','gallows','hellhound','widow','leviathan']);
const PALETTES={
 mawbound:['#b4a58b','#281216','#100d10','#b54232'],
 gallows:['#8e9694','#172125','#0a1014','#85b1b0'],
 hellhound:['#292c2b','#671e13','#100e0d','#d57737'],
 widow:['#30242e','#6b3544','#0d0e13','#b8859b'],
 leviathan:['#294b46','#775e3e','#090f11','#87bca8']
};

export function createMonsterKnife(id,parent,environment,core){
 if(!MONSTER_KNIVES.includes(id))return null;
 const resources=new Set(),root=new THREE.Group();root.name=id+' / articulated monster grip';root.userData.cosmeticEffect=true;parent.add(root);
 root.position.set(0,.018,.064);root.rotation.x=-Math.PI/2;
 const s=cosmeticSculpt(resources,environment),c=PALETTES[id];
 const shell=s.mat(id+' / carved shell',c[0],{rough:.54,metal:id==='gallows'?.7:id==='mawbound'?.08:.32,coat:.07});
 const flesh=s.mat(id+' / recessed lining',c[1],{rough:.68,metal:.05,coat:.04});
 const dark=s.mat(id+' / deep cavities',c[2],{rough:.82,metal:.1});
 const trim=s.mat(id+' / worn edges','#9a896a',{rough:.36,metal:.9});
 const fang=s.mat(id+' / teeth','#a99e89',{rough:.53,metal:.06});
 const ember=s.mat(id+' / buried light',c[3],{rough:.35,metal:.2,emission:c[3]});
 const head=s.joint(root,id+' / head'),body=s.joint(root,id+' / unfolding body',[0,-.028,-.004]),parts={};
 // Fine carved grain catches the studio light without a vinyl clearcoat.
 const texSize=128,texels=new Uint8Array(texSize*texSize*4);let seed=23179;
 for(let y=0;y<texSize;y++)for(let x=0;x<texSize;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=196+(seed/4294967295)*35+Math.sin(x*.23+y*.57)*8,i=(y*texSize+x)*4;texels[i]=texels[i+1]=texels[i+2]=v;texels[i+3]=255;}
 const grain=new THREE.DataTexture(texels,texSize,texSize);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,2);grain.needsUpdate=true;resources.add(grain);
 for(const mat of [shell,flesh,fang]){mat.bumpMap=grain;mat.bumpScale=.00015;mat.roughnessMap=grain;}
 const brow=(g,width=.019,y=.021,z=.014)=>{for(const side of [-1,1])s.taper(g,shell,[[side*.002,y-.005,z+.002],[side*width*.62,y+.001,z+.001],[side*width,y+.004,z-.007]],[.0024,.004,.0014]);};
 const eyes=(g,x=.010,y=.012,z=.015,width=.006)=>{for(const side of [-1,1]){const socket=s.ell(g,dark,[side*x,y,z],[width*1.5,.004,.003]);socket.rotation.z=side*.2;const eye=s.ell(g,ember,[side*x,y,z+.002],[width,.0008,.001]);eye.rotation.z=side*.2;}};
 const horns=(g,shape)=>{for(const side of [-1,1])s.taper(g,shell,shape.map(([x,y,z])=>[x*side,y,z]),[.0055,.004,.002,.0001]);};
 const ribs=(g,length=.055)=>{for(let i=0;i<5;i++)for(const side of [-1,1])s.taper(g,shell,[[0,-i*.010,0],[side*.015,-i*.010-.003,.006],[side*.018,-i*.010-.008,.014]],[.002,.0022,.0007]);s.taper(g,trim,[[0,.003,-.003],[0,-length,-.004]],[.0035,.002]);};
 if(id==='mawbound'){
  s.ell(head,shell,[0,.010,-.002],[.019,.030,.013]);eyes(head,.010,.012,.015,.004);brow(head);
  s.taper(head,shell,[[0,.037,-.002],[0,.022,.014],[0,.004,.020]],[.003,.0035,.001]);
  for(const side of [-1,1]){s.ell(head,dark,[side*.004,.001,.018],[.002,.004,.0015]);s.taper(head,shell,[[side*.020,.009,.002],[side*.018,.002,.015],[side*.012,-.008,.019]],[.004,.003,.001]);for(let i=0;i<3;i++)s.taper(head,dark,[[side*.014,.030-i*.005,.007],[side*.009,.027-i*.005,.012]],[.0006,.0002]);}
  horns(head,[[.016,.026,-.003],[.030,.045,-.009],[.026,.063,-.004],[.016,.070,.008]]);
  s.taper(head,shell,[[-.021,.008,.004],[-.018,-.008,.017],[0,-.017,.023],[.018,-.008,.017],[.021,.008,.004]],[.004,.005,.0035,.005,.004]);
  s.ell(head,dark,[0,-.008,.018],[.015,.013,.008]);
  parts.jaw=s.joint(head,'Mawbound / lower jaw',[0,-.004,.002]);
  s.taper(parts.jaw,shell,[[-.018,-.002,.012],[-.013,-.020,.020],[0,-.025,.024],[.013,-.020,.020],[.018,-.002,.012]],[.003,.004,.004,.004,.003]);
  for(let i=0;i<9;i++){const x=(i-4)*.0032;s.tooth(head,fang,[x,-.007,.024],.007+(i%2)*.003,.0014);s.tooth(parts.jaw,fang,[x,-.018,.024],.007,.0013,Math.PI);}
  ribs(body);parts.tongue=s.joint(parts.jaw,'Mawbound / barbed tongue',[0,-.016,.016]);s.taper(parts.tongue,flesh,[[0,0,0],[.006,-.013,.024],[-.004,-.025,.041],[.003,-.031,.046]],[.004,.003,.002,.0002]);
  parts.claws=[];for(const side of [-1,1]){const claw=s.joint(body,'Mawbound / grasp '+side,[side*.014,-.005,0]);s.taper(claw,shell,[[0,0,0],[side*.023,-.019,.005],[side*.027,-.038,.021]],[.005,.003,.002]);for(let i=0;i<3;i++)s.taper(claw,fang,[[side*.026,-.034,.02],[side*(.034+i*.004),-.043,.028],[side*(.03+i*.004),-.048,.041]],[.0017,.001,.0001]);parts.claws.push({claw,side});}
 }else if(id==='gallows'){
  // A folded, hollow cowl, rather than a flat coffin-shaped backing plate.
  const pos=[],uv=[],idx=[],rings=[[-.032,.031,.019],[-.015,.027,.022],[.012,.027,.022],[.035,.022,.019],[.048,.013,.014],[.052,.001,.003]],sides=32;
  for(let j=0;j<rings.length;j++)for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,[y,rx,rz]=rings[j],fold=Math.sin(a*7+j*.7)*.0012;pos.push(Math.sin(a)*(rx+fold),y+(j===0?Math.sin(a*5)*.004:0),Math.cos(a)*(rz+fold)-.005);uv.push(i/sides,j/(rings.length-1));if(j<rings.length-1&&i<sides){const k=j*(sides+1)+i,opening=Math.cos(a)>.60&&j<4;if(!opening)idx.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
  const hoodGeo=new THREE.BufferGeometry();hoodGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));hoodGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));hoodGeo.setIndex(idx);hoodGeo.computeVertexNormals();dark.side=THREE.DoubleSide;s.mesh(head,hoodGeo,dark);
  s.ell(head,shell,[0,.010,.009],[.015,.023,.009]);eyes(head,.007,.014,.017,.004);
  for(let i=0;i<5;i++)s.box(head,dark,[(i-2)*.0035,-.004,.018],[.0014,.011,.004]);
  brow(head,.013,.023,.017);for(const side of [-1,1])s.taper(head,trim,[[side*.012,.032,.010],[side*.017,.020,.010],[side*.014,-.009,.012]],[.0008,.001,.0007]);
  ribs(body,.052);parts.chains=[];
  for(const side of [-1,1]){const chain=s.joint(body,'Gallows / living chain '+side,[side*.018,-.005,0]);for(let i=0;i<10;i++){const r=s.ring(chain,trim,[side*.002*i,-.007*i,0],.0042,.0012);r.rotation.y=i%2*Math.PI/2;}const hook=s.joint(chain,'Gallows / hook',[side*.02,-.071,0]);s.taper(hook,shell,[[0,0,0],[side*.015,-.01,0],[side*.019,-.024,.007],[side*.006,-.026,.012],[side*.001,-.017,.009]],[.003,.003,.0025,.0015,.0001]);parts.chains.push({chain,side});}
  parts.shroud=s.joint(body,'Gallows / torn shroud');for(let i=0;i<5;i++){const x=(i-2)*.011;const cloth=s.plate(parts.shroud,flesh,[[x-.010,0],[x+.009,0],[x+.006,-.070-(i%2)*.014],[x-.004,-.056]],.001);cloth.position.z=-.007;}
 }else if(id==='hellhound'){
  s.ell(head,shell,[0,.013,0],[.022,.025,.017]);s.ell(head,shell,[0,.001,.019],[.014,.012,.022]);s.ell(head,dark,[0,.003,.039],[.011,.006,.005]);eyes(head,.013,.018,.014,.005);
  brow(head,.021,.025,.016);for(const side of [-1,1]){s.taper(head,shell,[[side*.019,.015,.007],[side*.016,.008,.025],[side*.010,.004,.039]],[.0045,.004,.001]);for(let i=0;i<3;i++)s.taper(head,dark,[[side*.018,.017-i*.004,.010],[side*.014,.013-i*.004,.021]],[.0007,.00025]);}
  horns(head,[[.015,.027,-.003],[.023,.044,-.012],[.018,.058,-.018],[.010,.063,-.019]]);
  parts.jaw=s.joint(head,'Hellhound / snapping jaw',[0,-.005,.002]);s.ell(parts.jaw,flesh,[0,-.004,.021],[.012,.005,.018]);
  for(const side of [-1,1])for(let i=0;i<4;i++){s.tooth(head,fang,[side*.010,-.006,.014+i*.006],i===2?.013:.007,.0018);s.tooth(parts.jaw,fang,[side*.009,-.006,.014+i*.006],.006,.0014,Math.PI);}
  s.ell(body,shell,[0,-.022,-.008],[.019,.036,.016]);ribs(body);parts.legs=[];
  for(const side of [-1,1])for(const back of [0,1]){const leg=s.joint(body,'Hellhound / limb '+side+'/'+back,[side*.015,-.008-back*.036,0]);s.taper(leg,shell,[[0,0,0],[side*.012,-.015,.010],[side*.015,-.029,.004]],[.005,.004,.002]);s.ell(leg,shell,[side*.015,-.031,.009],[.006,.004,.008]);for(let i=0;i<3;i++)s.taper(leg,fang,[[side*.015+(i-1)*.003,-.031,.015],[side*.015+(i-1)*.003,-.034,.022]],[.0013,.0001]);parts.legs.push({leg,side,back});}
  parts.tail=s.joint(body,'Hellhound / hooked tail',[0,-.052,-.006]);s.taper(parts.tail,shell,[[0,0,0],[.011,-.021,-.016],[.028,-.026,-.012],[.031,-.016,0]],[.005,.003,.002,.0001]);
 }else if(id==='widow'){
  s.ell(head,shell,[0,.004,0],[.022,.018,.014]);s.ell(head,shell,[0,.020,-.006],[.019,.013,.014]);
  for(const side of [-1,1])for(let i=0;i<3;i++)s.taper(head,trim,[[side*.003,.028-i*.006,.005],[side*.011,.023-i*.005,.011],[side*.020,.018-i*.005,.006]],[.0006,.0008,.0002]);
  for(const side of [-1,1]){for(let i=0;i<3;i++){const eye=s.ell(head,ember,[side*(.006+i*.005),.015-i*.005,.013-i*.002],[.0025,.0013,.0015]);eye.rotation.z=-side*.3;}s.taper(head,trim,[[side*.019,.004,.005],[side*.020,-.013,.018],[side*.009,-.021,.024]],[.004,.003,.0001]);}
  parts.abdomen=s.joint(body,'Widow / plated abdomen',[0,-.020,-.006]);s.ell(parts.abdomen,shell,[0,-.006,0],[.025,.032,.021]);for(let i=0;i<5;i++){s.taper(parts.abdomen,flesh,[[-.021,-i*.008,.009],[0,-i*.008-.004,.021],[.021,-i*.008,.009]],[.001,.0014,.001]);s.taper(parts.abdomen,shell,[[-.021,-i*.008+.002,.010],[0,-i*.008-.002,.023],[.021,-i*.008+.002,.010]],[.001,.0018,.001]);}
  parts.legs=[];for(const side of [-1,1])for(let i=0;i<4;i++){const leg=s.joint(body,'Widow / leg '+side+'/'+i,[side*.014,-i*.012,.004]),knee=s.joint(leg,'Widow / hinged leg',[side*.024,.008-i*.003,0]);s.taper(leg,shell,[[0,0,0],[side*.014,.007,0],[side*.024,.008-i*.003,0]],[.0035,.0028,.002]);s.taper(knee,shell,[[0,0,0],[side*.018,-.027,.006],[side*.027,-.049,.020]],[.0023,.0015,.0001]);parts.legs.push({leg,knee,side,i});}
 }else{
  s.ell(head,shell,[0,.014,0],[.025,.032,.018]);s.ell(head,dark,[0,.014,.016],[.015,.008,.006]);parts.lid=s.joint(head,'Leviathan / eye lid',[0,.021,.018]);s.ell(parts.lid,shell,[0,-.004,0],[.016,.008,.006]);s.ell(head,ember,[0,.014,.022],[.011,.004,.002]);s.ell(head,dark,[0,.014,.024],[.0018,.005,.001]);
  horns(head,[[.019,.026,0],[.036,.035,-.007],[.042,.048,-.015],[.035,.058,-.019]]);
  s.ell(body,flesh,[0,-.017,0],[.019,.032,.014]);parts.tentacles=[];
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,g=s.joint(head,'Leviathan / tendril '+i,[Math.cos(a)*.019,-.008,Math.sin(a)*.011]);s.taper(g,shell,[[0,0,0],[Math.cos(a)*.014,-.027,.008],[Math.cos(a)*.028,-.050,.022],[Math.cos(a)*.016,-.069,.035],[0,-.068,.041]],[.005,.004,.003,.0018,.0001]);for(let j=0;j<4;j++)s.ell(g,trim,[Math.cos(a)*(.010+j*.004),-.019-j*.009,.010+j*.005],[.0023,.0016,.0011]);parts.tentacles.push({g,a,i});}
 }
 finishRunnerBuild(root,resources);
 let amount=0,disposed=false;
 const restore=()=>core.forEach(p=>p.scale.setScalar(1));
 return{
  kind:id,setFinish(){restore();},
  update(time,{progress=0,active=false,reducedMotion=false,effects='full'}={}){
   if(disposed)return;
   const p=active&&!reducedMotion?progress:0,u=envelope(p,.08,.76),reveal=envelope(p,.24,.66),pulse=Math.sin(p*Math.PI*8);amount=u;
   root.scale.setScalar(1+u*(id==='widow'?1.45:1.65));root.rotation.z=u*Math.PI/2;root.rotation.y=u*(id==='hellhound'?-.20:id==='widow'?.12:0);root.position.set(0,.018+u*.052,.064-u*.11);
   core.forEach(part=>part.scale.setScalar(1-u*.985));body.visible=u>.005;body.scale.set(1,.12+u*.88,1);ember.emissiveIntensity=effects==='off'?0:(.12+reveal*.8)*(effects==='subtle'?.4:1);
   head.rotation.set(-u*.18,u*Math.sin(p*9)*.11,u*Math.sin(p*7)*.09);
   if(id==='mawbound'){parts.jaw.rotation.x=reveal*(.8+.08*pulse);parts.tongue.scale.y=.1+reveal*.9;parts.tongue.rotation.y=reveal*Math.sin(p*17)*.25;for(const {claw,side} of parts.claws){claw.rotation.z=side*(1.25*(1-u)-reveal*.5);claw.rotation.x=-reveal*.4;}}
   else if(id==='gallows'){for(const {chain,side} of parts.chains){chain.rotation.z=side*(1.1*(1-u)-reveal*(.65+.22*Math.sin(p*12)));chain.rotation.x=Math.sin(p*10+side)*reveal*.5;}parts.shroud.rotation.x=-reveal*.18;head.rotation.z=u*(-.24+.16*Math.sin(p*8));}
   else if(id==='hellhound'){const lunge=envelope(p,.40,.54);root.position.y+=lunge*.022;root.position.x-=lunge*.022;head.rotation.x-=lunge*.4;body.rotation.x=u*1.05;parts.jaw.rotation.x=reveal*(.6+lunge*.35);parts.tail.rotation.z=u*Math.sin(p*14)*.3;for(const {leg,side,back}of parts.legs){leg.rotation.x=-body.rotation.x+u*(back?.35:-.4)+Math.sin(p*15+back*Math.PI+side)*reveal*.25;leg.rotation.z=side*(.8*(1-u)+.15*u);}}
   else if(id==='widow'){parts.abdomen.rotation.x=reveal*.2;for(const {leg,knee,side,i}of parts.legs){leg.rotation.z=side*(1.45*(1-u)-u*(.2+i*.08));leg.rotation.x=reveal*Math.sin(p*18+i*.8+side)*.24;knee.rotation.y=side*(.7*(1-u)+reveal*.24);}}
   else{parts.lid.rotation.x=-reveal*1.1;for(const {g,a,i} of parts.tentacles){g.rotation.z=Math.cos(a)*(1.1*(1-u)-reveal*.5);g.rotation.x=Math.sin(a)*reveal*.6+Math.sin(p*15+i)*reveal*.25;g.rotation.y=reveal*Math.sin(p*12+i)*.3;}}
   root.userData.transformation=amount;
  },
  get transformation(){return amount;},
  displayBounds(){root.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(root);},
  dispose(){if(disposed)return;disposed=true;restore();root.removeFromParent();resources.forEach(r=>r.dispose());root.clear();}
 };
}
