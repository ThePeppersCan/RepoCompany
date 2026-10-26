import * as THREE from './vendor/three.module.js?v=2.17.0';
import {createRunnerWorkshop,finishRunnerBuild} from './runner-craft.js?v=2.17.0';

import {createRunnerAnatomy} from './runner-anatomy.js?v=2.17.0';

const DESIGNS={
 rowan:{mask:'#29292e',ink:'#100e15',cloth:'#303139',pants:'#22232c',mark:'#ad302c',width:1.05,hood:true,maskShape:[[-.72,1],[-1,.65],[-.87,-.48],[-.31,-1],[.35,-.93],[.92,-.41],[1,.66],[.39,1.08]],cuts:'wrap'},
 elias:{mask:'#c5bfaa',ink:'#1e1923',cloth:'#747c7b',pants:'#333e42',mark:'#8c2d29',width:.94,hood:true,maskShape:[[-.65,1.04],[-1,.67],[-.87,-.42],[-.4,-.97],[.36,-1],[.88,-.49],[1,.6],[.63,.96]],cuts:'vent'},
 dax:{mask:'#67252e',ink:'#171017',cloth:'#542d36',pants:'#24232c',mark:'#d9b8a4',width:1.13,hood:true,maskShape:[[-.82,1.07],[-1,.46],[-.77,-.52],[-.23,-.94],[.27,-1.08],[.83,-.45],[1,.8],[.38,.91]],cuts:'signal'},
 mara:{mask:'#dbd4c1',ink:'#1e1923',cloth:'#bdb9aa',pants:'#3c4c43',mark:'#a53032',width:.94,hood:true,maskShape:[[-.56,1.13],[-.95,.65],[-.91,-.32],[-.23,-1.06],[.22,-.96],[.77,-.39],[1,.69],[.32,.96]],cuts:'porcelain'},
 nadia:{mask:'#939986',ink:'#1b2223',cloth:'#56634f',pants:'#292d32',mark:'#b33b31',width:.92,hood:true,maskShape:[[-.63,1],[-1,.62],[-.79,-.42],[-.42,-.98],[.39,-1],[.88,-.37],[.94,.67],[.57,1.01]],cuts:'stitch'},
 sera:{mask:'#b68a4c',ink:'#20212b',cloth:'#987443',pants:'#252e36',mark:'#b7382e',width:.88,hood:true,maskShape:[[-.73,1.04],[-1,.54],[-.8,-.36],[-.38,-.92],[.31,-1],[.88,-.43],[1,.64],[.49,1.01]],cuts:'split'}
};

// Deliberately designed cloth volumes: broad tension folds and angular hems,
// sampled into a continuous surface, rather than separate knee/elbow balls.
export function sculptRunnerCloth(rings,{sides=28,steps=3,fold=.008,power=.88}={}){
 const controls=rings.map(r=>[...r]),positions=[],uv=[],indices=[];
 // Local Catmull-Rom avoids relying on an optional math export.
 const cubic=(t,a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
 const rows=(rings.length-1)*steps;
 for(let row=0;row<=rows;row++){
  const q=row/steps,k=Math.min(rings.length-2,Math.floor(q)),t=q-k,values=[];
  for(let j=0;j<5;j++)values.push(cubic(t,controls[Math.max(0,k-1)][j]||0,controls[k][j]||0,controls[k+1][j]||0,controls[Math.min(rings.length-1,k+2)][j]||0));
  const[y,rx,rz,cx,cz]=values;
  for(let s=0;s<=sides;s++){
   const a=s/sides*Math.PI*2,c=Math.cos(a),z=Math.sin(a),f=fold*(Math.sin(a*5+y*19)*.65+Math.sin(a*9-y*27)*.35)*Math.sin(row/rows*Math.PI);
   positions.push(cx+Math.sign(c)*Math.abs(c)**power*(rx+f),y,cz+Math.sign(z)*Math.abs(z)**power*(rz+f*.7));uv.push(s/sides,row/rows);
   if(row<rows&&s<sides){const at=row*(sides+1)+s,next=at+sides+1;indices.push(at,at+1,next,next,at+1,next+1);}
  }
 }
 for(const row of [0,rows]){const at=row*(sides+1),index=positions.length/3;let x=0,z=0;for(let i=0;i<sides;i++){x+=positions[(at+i)*3];z+=positions[(at+i)*3+2];}positions.push(x/sides,positions[at*3+1],z/sides);uv.push(.5,.5);for(let s=0;s<sides;s++)indices.push(index,...(row===0?[at+s+1,at+s]:[at+s,at+s+1]));}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
export function applyComicFinish(group,resources,{outlines=true,softShading=false}={}){
 const gradient=new THREE.DataTexture(new Uint8Array([54,54,54,255,88,88,88,255,126,126,126,255,164,164,164,255,198,198,198,255,226,226,226,255,246,246,246,255,255,255,255,255]),8,1);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;resources.add(gradient);
 const converted=new Map(),meshes=[];group.traverse(o=>{if(o.isMesh&&!o.userData.comicOutline)meshes.push(o);});
 // Expand in bind space before skinning. Basic materials omit objectNormal on
 // rigid parts; using it on skinned parts would also rotate the offset twice.
 const ink=new THREE.MeshBasicMaterial({color:'#15111b',side:THREE.BackSide});ink.name='Horror comic silhouette ink';ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed += normal * .0018;');};ink.customProgramCacheKey=()=> 'comp-run-ink-2';resources.add(ink);
 const convert=old=>{
  if(converted.has(old))return converted.get(old);
  const hardSurface=old.metalness>=.4||old.clearcoat>=.5;
  const mat=hardSurface||softShading?old.clone():new THREE.MeshToonMaterial({name:old.name+' / comic',color:old.color,gradientMap:gradient,map:old.map,bumpMap:old.bumpMap,bumpScale:old.bumpScale,side:old.side,emissive:old.emissive,emissiveIntensity:Math.min(old.emissiveIntensity||0,.35)});
  mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float inkLight = dot(outgoingLight, vec3(.2126,.7152,.0722));
   float hatch=step(.86,fract((gl_FragCoord.x+gl_FragCoord.y*.65)*.18));
   outgoingLight*=1.0-(1.0-smoothstep(.08,.24,inkLight))*hatch*.09;
   #include <opaque_fragment>`);};mat.customProgramCacheKey=()=> 'comp-run-horror-comic-2';resources.add(mat);converted.set(old,mat);return mat;
 };
 for(const mesh of meshes){
  mesh.material=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material);
  mesh.geometry.computeBoundingBox();const size=mesh.geometry.boundingBox.getSize(new THREE.Vector3());
  if(outlines&&Math.max(size.x,size.y,size.z)>.16){
   const outline=mesh.isSkinnedMesh?new THREE.SkinnedMesh(mesh.geometry,ink):new THREE.Mesh(mesh.geometry,ink);
   outline.name='Silhouette ink';outline.userData.comicOutline=true;outline.position.copy(mesh.position);outline.quaternion.copy(mesh.quaternion);outline.scale.copy(mesh.scale);outline.frustumCulled=false;
   mesh.parent.add(outline);if(mesh.isSkinnedMesh){outline.bind(mesh.skeleton,mesh.bindMatrix);outline.bindMode=mesh.bindMode;}
  }
 }
 group.userData.artStyle='COMP-RUN horror comic';return converted;
}

export function createComicRunner(def,{detail='hero'}={}){
 const d=DESIGNS[def.id]||DESIGNS.elias,w=createRunnerWorkshop({hero:detail==='hero'}),{resources,material,group:part,ell,box,tube,ring,plate,add,loft}=w;
 const group=new THREE.Group();group.name='runner-'+def.id;group.userData.runnerId=def.id;group.userData.rarity=def.rarity;
 const cloth=material('sculpted storm cloth',d.cloth,{texture:'cloth'}),lining=material('shadow fabric',d.pants,{texture:'cloth'}),ink=material('cut ink seams',d.ink),mask=material('signature '+d.cuts+' mask',d.mask),bone=material('worn chalk trim','#b9b19a'),red=material('COMP-RUN signal',d.mark),metal=material('scratched hardware','#7e7e7c',{metalness:.65,roughness:.4}),skin=material('skin',def.skin),eye=material('eyes beneath mask','#9b9280');
 const anatomy=createRunnerAnatomy(def,{group,workshop:w,cloth,pants:lining,glove:ink,sole:ink});
 const {hips,chest,head,arms,legs}=anatomy,secondary=[];
 const width=.235*d.width;
 // Deliberately asymmetric placket, pocket flap and worn storm collar.
 tube(chest,bone,[[.012,.45,-.087],[.018,.31,-.151],[.009,.16,-.133],[.016,-.03,-.117]],.0023);
 if(def.style==='anorak'||def.style==='hoodie'){const pocket=plate(chest,cloth,[[-.115,.18],[.10,.19],[.108,.12],[.105,.087],[-.10,.08]],.008);pocket.position.z=-.133;tube(chest,ink,[[-.105,.17,-.155],[.004,.175,-.161],[.10,.18,-.149]],.0018);}
 for(const side of [-1,1]){tube(chest,ink,[[side*.16,-.04,-.097],[side*.19,.16,-.124],[side*width,.36,-.084]],.003);tube(chest,bone,[[side*.145,.39,-.11],[side*.174,.35,-.133],[side*.185,.30,-.14]],.0015);}
 const badge=plate(chest,red,[[-.016,-.04],[.007,-.008],[-.007,-.002],[.023,.042],[.014,.004],[.026,.011]],.002);badge.position.set(-.13,.31,-.147);badge.rotation.z=-.15;
 loft(hips,ink,[[.005,.166,.111],[.052,.165,.109]],{power:.8});box(hips,metal,-.025,.03,-.127,.046,.029,.012);box(hips,ink,-.025,.03,-.135,.027,.016,.003);
 const scarf=add(head,sculptRunnerCloth([[.03,.058,.06],[-.018,.092,.088],[-.072,.112,.085],[-.1,.097,.07]],{fold:.006}),def.id==='elias'?bone:lining);scarf.name='Fitted folded collar';
 for(let i=0;i<3;i++)tube(head,ink,[[-.068,-.035-i*.016,-.07],[0,-.046-i*.016,-.092],[.079,-.033-i*.016,-.073]],.002);
 // Skull and individual masks have dimensional curved shells, real eye cuts,
 // sculpted brow / cheek planes and six separate, authored graphic languages.
 add(head,sculptRunnerCloth([[.265,.028,.035,0,.008],[.238,.075,.07],[.18,.091,.082],[.08,.082,.075],[.015,.043,.049]],{fold:0,power:.9}),ink);
 const shape=new THREE.Shape(d.maskShape.map(([x,y])=>new THREE.Vector2(x*.094,y*.123+.135)));
 for(const side of [-1,1]){const hole=new THREE.Path();const points=[[.014,.172],[.061,.183],[.070,.166],[.025,.158]].map(([x,y])=>[x*side,y]);points.forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();shape.holes.push(hole);}
 const maskGeometry=new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2,curveSegments:10});
 const mp=maskGeometry.attributes.position;for(let i=0;i<mp.count;i++){const x=mp.getX(i),y=mp.getY(i);mp.setZ(i,mp.getZ(i)-.102+Math.pow(Math.abs(x)/.1,2)*.053+Math.max(0,.10-y)*.12);}maskGeometry.computeVertexNormals();const face=add(head,maskGeometry,mask);face.name=def.name+' / '+d.cuts+' signature horror mask';
 for(const side of [-1,1]){const recess=ell(head,ink,side*.042,.172,-.087,.024,.011,.009);recess.rotation.z=side*.12;}
 const stroke=(mat,points,r=.0025)=>tube(head,mat,points.map(([x,y])=>[x,y,-.114+(Math.abs(x)/.1)**2*.053]),r);
 // Cheek bevels and a single ridge make the face read as a designed object.
 for(const side of [-1,1]){stroke(ink,[[side*.079,.142],[side*.058,.105],[side*.022,.046]],.002);stroke(bone,[[side*.063,.135],[side*.047,.108]],.0013);}
 if(d.cuts==='wrap'){for(let i=0;i<4;i++)stroke(ink,[[-.058,.092-i*.013],[-.01,.105-i*.017],[.055,.084-i*.01]],.004);stroke(red,[[.057,.247],[.028,.209],[.043,.194]],.004);}
 if(d.cuts==='vent'){for(let i=0;i<5;i++)stroke(ink,[[(i-2)*.012,.118-Math.abs(i-2)*.007],[(i-2)*.010,.053+Math.abs(i-2)*.004]],.003);stroke(red,[[-.073,.233],[-.044,.211],[-.058,.193]],.004);}
 if(d.cuts==='signal'){stroke(ink,[[.032,.139],[.016,.106],[.024,.083],[-.008,.047]],.0025);stroke(red,[[.022,.244],[.038,.218],[.019,.199]],.003);}
 if(d.cuts==='porcelain'){stroke(red,[[.012,.257],[-.009,.214],[.005,.192],[-.007,.151],[.013,.123],[.003,.063]],.003);stroke(ink,[[.053,.24],[.073,.207],[.062,.192]],.002);}
 if(d.cuts==='stitch'){stroke(ink,[[-.060,.102],[-.019,.088],[.024,.086],[.059,.105]],.005);for(let i=0;i<6;i++){const x=-.049+i*.019;stroke(bone,[[x,.111],[x+.007,.078]],.0025);}stroke(red,[[-.061,.245],[-.039,.222],[-.012,.219]],.004);}
 if(d.cuts==='split'){stroke(ink,[[0,.26],[.013,.193],[-.008,.156],[.012,.113],[0,.021]],.004);for(const side of [-1,1])stroke(ink,[[side*.028,.12],[side*.055,.102],[side*.031,.076]],.004);stroke(red,[[.044,.245],[.067,.214],[.052,.194]],.0035);}
 if(d.hood){
  const hoodGeo=sculptRunnerCloth([[.305,.005,.012,0,.022],[.287,.071,.074,0,.023],[.232,.119,.115,0,.022],[.13,.129,.122,0,.021],[.01,.143,.11,0,.016],[-.084,.17,.09,0,.015]],{sides:32,fold:.005,power:.85});
  const pos=hoodGeo.attributes.position,index=hoodGeo.index,kept=[];for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)],z=ids.reduce((n,j)=>n+pos.getZ(j),0)/3,y=ids.reduce((n,j)=>n+pos.getY(j),0)/3;if(z>-.045||y>.288||y<-.065)kept.push(...ids);}hoodGeo.setIndex(kept);add(head,hoodGeo,cloth);
  const inner=add(head,hoodGeo.clone(),ink);inner.scale.set(.97,.99,.97);inner.material.side=THREE.DoubleSide;
  for(const side of [-1,1])tube(head,ink,[[side*.152,-.073,-.052],[side*.125,.03,-.078],[side*.113,.17,-.077],[side*.081,.254,-.057],[0,.3,-.019]],.005);
 }else{
  const hood=add(chest,sculptRunnerCloth([[.46,.10,.06,0,.085],[.40,.14,.065,0,.115],[.32,.11,.05,0,.14],[.29,.04,.015,0,.14]],{fold:.005}),cloth);hood.name='Collapsed hood';
  for(let i=0;i<6;i++){const a=(i-2.5)*.025;const strip=plate(head,ink,[[a-.014,.22],[a-.012,.278],[a+.012,.29],[a+.018,.23]],.025);strip.position.z=-.007+Math.abs(a)*.5;strip.rotation.z=(i-2)*.04;}
 }
 for(const {side,shoulder,elbow} of arms){
  loft(elbow,ink,[[-.235,.033,.032],[-.267,.032,.031]],{power:1});
  for(let i=0;i<2;i++)tube(shoulder,ink,[[-.038,-.16-i*.017,-.043],[.012,-.15-i*.019,-.056],[.043,-.18-i*.014,-.036]],.0014);
  if(side===-1)loft(shoulder,red,[[-.09,.059,.063],[-.12,.057,.06]],{power:1});
 }
 for(const {side,hip,knee,ankle} of legs){
  const cargo=plate(hip,cloth,[[side*.065,-.13],[side*.098,-.14],[side*.102,-.24],[side*.071,-.25]],.018);cargo.position.z=-.045;
  for(let i=0;i<2;i++)tube(knee,ink,[[-.038,-.19-i*.025,-.047],[.006,-.18-i*.028,-.062],[.04,-.21-i*.025,-.041]],.0015);
  loft(ankle,ink,[[.027,.047,.056],[-.034,.055,.115,0,-.042],[-.071,.055,.123,0,-.048]],{power:.75,segments:24});
  const upper=add(ankle,sculptRunnerCloth([[.035,.041,.047],[.005,.052,.077,0,-.025],[-.029,.055,.117,0,-.045],[-.044,.054,.118,0,-.045]],{fold:.002,power:.85}),def.id==='mara'?red:cloth);upper.name='Fitted trail shoe';
  for(let i=0;i<4;i++)tube(ankle,bone,[[-.025,.012-i*.008,-.035-i*.016],[.025,.009-i*.008,-.035-i*.016]],.0018);
  tube(ankle,bone,[[-.051,-.044,.025],[-.056,-.045,-.08],[-.044,-.047,-.153],[.044,-.047,-.153],[.056,-.045,-.08],[.051,-.044,.025]],.0023);
 }
 if(def.style==='vest'){
  for(const side of [-1,1]){
   const panel=plate(chest,ink,[[side*.022,.36],[side*.11,.37],[side*.158,.30],[side*.145,.12],[side*.033,.09]],.012);
   const p=panel.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)-.135+Math.pow(Math.abs(x)/.18,2)*.055+Math.max(0,.15-y)*.12);}panel.geometry.computeVertexNormals();
   tube(chest,cloth,[[side*.035,.11,-.139],[side*.137,.13,-.11],[side*.15,.29,-.10],[side*.108,.355,-.12]],.002);
  }
  box(chest,metal,0,.27,-.145,.022,.018,.009);
 }else if(def.style==='puffer'){
  for(const y of [.09,.19,.29])tube(chest,lining,[[-.14,y,-.092],[-.08,y-.009,-.134],[0,y-.012,-.143],[.08,y-.009,-.134],[.14,y,-.092]],.0018);
 }else if(def.style==='shell'){
  for(const side of [-1,1]){const tail=part(hips,'Split storm tail',side*.08,0,.07);const panel=plate(tail,cloth,[[-.085,.07],[.087,.075],[.12,-.35],[.03,-.46],[-.095,-.38]],.014);panel.rotation.y=side*.2;secondary.push({object:tail,x:.05,z:side*.03,idle:.012,run:.1,phase:side});tube(tail,ink,[[-.075,.02,.022],[-.082,-.33,.022],[.02,-.425,.022]],.003);}
 }else if(def.style==='night'){
  const pack=add(chest,sculptRunnerCloth([[.39,.06,.03,0,.16],[.31,.11,.07,0,.17],[.10,.105,.06,0,.17],[.04,.06,.03,0,.15]],{fold:.004}),ink);pack.name='Low-profile climbing pack';
 }
 for(const side of [-1,1]){
  const curve=new THREE.CatmullRomCurve3([[side*.10,.02,-.128],[side*.145,.25,-.15],[side*.128,.43,-.091],[side*.12,.45,.085],[side*.09,.08,.17]].map(p=>new THREE.Vector3(...p)));
  const p=[],uv=[],index=[];
  for(let i=0;i<=40;i++){const point=curve.getPoint(i/40),tangent=curve.getTangent(i/40),across=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,0,point.z<0?-1:1)).normalize().multiplyScalar(.009);for(const edge of [-1,1]){const v=point.clone().addScaledVector(across,edge);p.push(...v.toArray());uv.push(edge<0?0:1,i/40);}if(i<40){const a=i*2;index.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();const strap=add(chest,g,lining);strap.material.side=THREE.DoubleSide;
 }

 const tag=part(hips,'Red fabric pull',.145,.025,-.11);const strip=plate(tag,red,[[0,0],[.016,.003],[.025,-.17],[.003,-.21],[-.005,-.125]],.002);secondary.push({object:tag,x:.04,z:.04,idle:.015,run:.12,phase:1});
 anatomy.fitFront(chest);group.scale.setScalar(def.height/1.80);group.userData.silhouette=def.style+' / '+d.cuts+' mask / continuous cloth / horror comic';
 const update=(time,state={})=>{const gait=anatomy.update(time,state),motion=state.motion!==false,blend=group.userData.animation.blend,phase=group.userData.animation.phase;
  for(const p of secondary){p.object.rotation.x=p.x+(motion?Math.sin(time*1.3+(p.phase||0))*(p.idle||.012)*(1-blend)+Math.sin(phase+(p.phase||0))*(p.run||.055)*blend:0);p.object.rotation.z=p.z||0;}
  return gait;};
 // Static tailoring is merged; the continuous skinned sleeves/trousers stay intact.
 const stats=finishRunnerBuild(group,resources);applyComicFinish(group,resources,{outlines:detail==='hero'});update(0);
 return{group,definition:def,update,stats,anatomy,dispose(){anatomy.dispose();w.dispose();group.removeFromParent();}};
}
