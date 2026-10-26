import * as THREE from './vendor/three.module.js?v=2.17.0';
import {createRunnerWorkshop,finishRunnerBuild} from './runner-craft.js?v=2.17.0';
import {createRunnerAnatomy} from './runner-anatomy.js?v=2.17.0';
import {applyComicFinish,sculptRunnerCloth} from './comic-runner.js?v=2.17.0';
import {cosmeticSculpt,cosmeticEnvelope as envelope} from './cosmetic-sculpt.js?v=2.17.0';
import {buildRunnerRegalia} from './runner-regalia.js?v=2.17.0';
import {createRunnerAura} from './runner-aura.js?v=2.17.0';

const MASKS={
 blackstitch:[.92,.84,.40,.24],redactor:[.88,.69,.27,.16],ferryman:[1,.78,.58,.31],deadchannel:[.92,.96,.59,.25],
 lamplighter:[.86,.72,.53,.34],oathbreaker:[.83,.84,.43,.09],bonepicker:[.90,.78,.48,.03],mothkeeper:[.76,.99,.32,.15],
 glasswake:[1.02,.79,.31,.22],bellwether:[.87,.96,.67,.36],nightwatch:[.93,.82,.55,.25],hush:[.83,.96,.52,.27],
 archfiend:[.96,.96,.45,.10],'hollow-king':[.95,.83,.61,.22],'red-widow':[.89,1,.31,.13],dreadhound:[.79,.93,.43,.19],
 'drowned-oracle':[1,.90,.47,.24],'chain-saint':[.74,.88,.43,.12],'grave-moth':[.78,1.04,.36,.16],'ash-revenant':[.96,.95,.51,.24]
};

/** The same weighted, approved human body under twenty individually authored
 * costumes. No character changes the movement collision or first-person rig. */
export function createPaidRunner(def,{detail='hero'}={}){
 const hero=detail==='hero',w=createRunnerWorkshop({hero}),{resources,material,group:part,ell,box,tube,ring,plate,add,loft}=w;
 const root=new THREE.Group();root.name='runner-'+def.id;root.userData={runnerId:def.id,rarity:def.rarity,paid:true};
 const cloth=material('tailored '+def.id+' cloth',def.cloth,{texture:'cloth'}),lining=material('woven lining',def.secondary,{texture:'cloth'}),ink=material('leather bindings',def.glove,{texture:'grain'}),trim=material('worn metal fittings',def.accent,{metalness:.72,roughness:.42}),ivory=material('carved aged ivory','#c0b6a0',{roughness:.51}),signal=material('COMP-RUN red','#9a3435'),black=material('deep mask recess','#110f16');
 const anatomy=createRunnerAnatomy(def,{group:root,workshop:w,cloth,pants:lining,glove:ink,sole:ink}),{hips,chest,head,arms,legs}=anatomy;
 const sculpt=cosmeticSculpt(resources,null,{detail:hero?18:12}),animated=[],secondary=[];
 const maskColours={blackstitch:'#555052','red-widow':'#40262e',dreadhound:'#9e9687','grave-moth':'#aa9f91','ash-revenant':'#6b655d'};
 const shell=material(def.id+' mask shell',maskColours[def.id]||(['hush','ferryman','bonepicker','hollow-king','redactor'].includes(def.id)?'#c0b6a0':def.id==='archfiend'?'#45403c':def.accent),{metalness:['glasswake','nightwatch','lamplighter','oathbreaker','deadchannel'].includes(def.id)?.75:.15,roughness:.42,clearcoat:def.id==='glasswake'?.7:0});
 const lit=material('buried '+def.id+' light',def.premiumAnimated?'#c77d67':def.accent,{metalness:.25,roughness:.35,emissive:def.accent,intensity:.15});
 const materials={cloth,lining,ink,trim,ivory,signal,black,shell,lit};
 const motion=(object,axis,rest,amount,phase=0,rate=1.4)=>{animated.push({object,axis,rest,amount,phase,rate});object.rotation[axis]=rest;return object;};
 // A cut, lined hood with a curved opening and rear seam. Actual holes in the
 // front stop the mask reading as a decal on a solid sphere.
 const hood=sculptRunnerCloth([[.315,.008,.013,0,.025],[.292,.068,.076,0,.026],[.235,.116,.116,0,.024],[.13,.131,.125,0,.020],[.005,.143,.109,0,.015],[-.075,.157,.086,0,.012]],{sides:hero?32:20,fold:.0045,power:.90});
 const hp=hood.attributes.position,hi=hood.index,kept=[];
 for(let i=0;i<hi.count;i+=3){const a=[hi.getX(i),hi.getX(i+1),hi.getX(i+2)],z=a.reduce((s,j)=>s+hp.getZ(j),0)/3,y=a.reduce((s,j)=>s+hp.getY(j),0)/3;if(z>-.046||y>.289||y<-.06)kept.push(...a);}hood.setIndex(kept);
 add(head,hood,cloth).name='Fitted hood';const hoodInside=add(head,hood.clone(),black);hoodInside.scale.setScalar(.977);black.side=THREE.DoubleSide;
 for(const side of [-1,1])tube(head,ink,[[side*.151,-.070,-.052],[side*.126,.03,-.079],[side*.112,.17,-.079],[side*.078,.255,-.059],[0,.307,-.015]],.004);
 tube(head,lining,[[0,.306,.025],[0,.25,.133],[0,.12,.151],[0,-.02,.123]],.0025);
 add(head,sculptRunnerCloth([[.005,.065,.064],[-.027,.093,.084],[-.079,.106,.079],[-.103,.087,.066]],{fold:.004}),lining);
 // One curved shell per identity, with sculpted cheek planes and real eye cuts.
 const proportions=MASKS[def.id],shape=new THREE.Shape(),outline=[[-.062*proportions[0],.27],[-.098*proportions[1],.217],[-.088,.13],[-.072*proportions[2],.055],[0,.025+proportions[3]*.03],[.075*proportions[2],.058],[.092,.137],[.099*proportions[1],.218],[.061*proportions[0],.268]];
 outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const blind=['hush','drowned-oracle','lamplighter','nightwatch'].includes(def.id);
 if(!blind)for(const side of [-1,1]){const hole=new THREE.Path(),x=side*.043;hole.moveTo(x-.024,.179);hole.lineTo(x+.024,.183+side*.003);hole.lineTo(x+.019,.170);hole.lineTo(x-.021,.167);hole.closePath();shape.holes.push(hole);}
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.010,bevelEnabled:true,bevelSegments:2,bevelSize:.003,bevelThickness:.003,curveSegments:8}),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,p.getZ(i)-.112+(x/.1)**2*.048+Math.max(0,.105-y)*.17);}geometry.computeVertexNormals();
 const mask=part(head,def.id+' / face assembly');add(mask,geometry,shell).name=def.name+' / sculpted mask';
 if(!blind)for(const side of [-1,1])ell(head,black,side*.043,.176,-.082,.029,.016,.013);
 for(const side of [-1,1])tube(mask,ink,[[side*.080,.145,-.079],[side*.058,.108,-.094],[side*.018,.05,-.100]],.0022);
 // Tailored placket, fitted belt and grounded footwear; secondary fabric follows
 // the skeleton. Shoulder volume comes from the continuous weighted mesh.
 tube(chest,ink,[[.018,.445,-.085],[.012,.32,-.142],[.016,.16,-.137],[.015,-.02,-.120]],.003);
 for(const side of [-1,1]){
  tube(chest,lining,[[side*.16,-.025,-.093],[side*.185,.20,-.115],[side*.19,.37,-.09]],.003);
  for(let i=0;i<3;i++)box(chest,trim,side*.031,.30-i*.072,-.145,.009,.013,.005);
 }
 loft(hips,ink,[[.009,.164,.111],[.048,.163,.109]],{power:.88});box(hips,trim,0,.028,-.124,.042,.024,.009);box(hips,ink,0,.028,-.130,.027,.011,.004);
 for(const arm of arms){loft(arm.elbow,ink,[[-.235,.034,.034],[-.264,.032,.032]]);tube(arm.shoulder,lining,[[0,-.08,-.07],[.02,-.18,-.06],[.02,-.25,-.046]],.0022);}
 for(const leg of legs){
  loft(leg.ankle,ink,[[.027,.045,.054],[-.034,.054,.111,0,-.042],[-.071,.055,.119,0,-.046]],{power:.78,segments:hero?24:16});
  add(leg.ankle,sculptRunnerCloth([[.035,.041,.047],[.006,.05,.075,0,-.025],[-.029,.052,.114,0,-.042],[-.043,.054,.115,0,-.043]],{fold:.002,sides:hero?24:16}),cloth);
  for(let i=0;i<4;i++)tube(leg.ankle,lining,[[-.025,.011-i*.008,-.035-i*.016],[.025,.008-i*.008,-.035-i*.016]],.0018);
  tube(leg.ankle,trim,[[-.048,-.044,.025],[-.053,-.045,-.08],[-.041,-.047,-.148],[.041,-.047,-.148],[.053,-.045,-.08],[.048,-.044,.025]],.0017);
 }
 const context={def,w,s:sculpt,root,anatomy,mask,materials,motion,secondary,animated};
 const regalia=buildRunnerRegalia(context);
 // Only fit stationary chest tailoring. Transforming wings and mechanisms
 // must retain their authored shape instead of being projected onto the torso.
 const joints=new Set(animated.map(a=>a.object));
 anatomy.fitFront(chest,{filter:o=>{for(let p=o.parent;p&&p!==chest;p=p.parent)if(joints.has(p)||p.position.z>.06)return false;return o.position.z<.04;}});
 root.scale.setScalar(def.height/1.8);root.userData.silhouette=def.id+' / '+def.signature;
 finishRunnerBuild(root,resources);const converted=applyComicFinish(root,resources,{outlines:hero,softShading:true});
 const glow=converted.get(lit)||lit,aura=createRunnerAura(root,def,resources,{hero});
 let transformation=0,disposed=false;
 const update=(time,state={})=>{
  if(disposed)return 'idle';const moving=state.gait==='run'||state.gait==='walk',motionOn=state.motion!==false,effectsOn=state.effects!=='off';
  const p=motionOn&&!moving?state.previewProgress||0:0,energy=envelope(p,.06,.84);transformation=def.premiumAnimated?energy:0;
  const gait=anatomy.update(time,state);
  for(const a of animated)a.object.rotation[a.axis]=a.rest+(motionOn?Math.sin(time*a.rate+a.phase)*.012:0)+energy*a.amount;
  for(const a of secondary){a.object.rotation.x=a.x+(motionOn?Math.sin(time*1.4+a.phase)*(moving?.075:.014):0);a.object.rotation.z=a.z||0;}
  regalia.update?.(time,energy,p,motionOn);
  const effectStrength=state.effects==='subtle'?.4:1;
  glow.emissiveIntensity=effectsOn?(.12+(motionOn?(Math.sin(time*1.4)+1)*.035:0)+energy*.35)*effectStrength:0;
  aura.update(time,{motion:motionOn,effects:effectsOn,energy,moving,strength:effectStrength});
  root.userData.previewTransformation=transformation;return gait;
 };
 update(0);const stats={drawCalls:0,triangles:0};root.traverse(o=>{if(o.isMesh&&!o.userData.comicOutline){stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});root.userData.renderStats=stats;
 return {group:root,definition:def,anatomy,stats,update,get transformation(){return transformation;},previewDuration:def.premiumAnimated?4.8:3.0,dispose(){if(disposed)return;disposed=true;anatomy.dispose();w.dispose();root.removeFromParent();root.clear();}};
}
