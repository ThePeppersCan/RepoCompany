import * as THREE from './vendor/three.module.js?v=2.16.0';
import {createRunnerWorkshop,finishRunnerBuild} from './runner-craft.js?v=2.16.0';
import {createRunnerAnatomy} from './runner-anatomy.js?v=2.16.0';
import {applyComicFinish} from './comic-runner.js?v=2.16.0';

const APRICOT='#eda27e',IVORY='#e7dec7',INDIGO='#302a50',INK='#171629';

function crescentGeometry({radius=.1,height=1.25,depth=.008,detail=12}={}){
  const s=new THREE.Shape();
  s.moveTo(radius*.47,radius*height*.88);
  s.bezierCurveTo(-radius*.38,radius*height*1.12,-radius*1.14,radius*height*.46,-radius*1.06,-radius*height*.14);
  s.bezierCurveTo(-radius*.98,-radius*height*.83,-radius*.29,-radius*height*1.07,radius*.34,-radius*height*.88);
  s.bezierCurveTo(-radius*.45,-radius*height*.57,-radius*.38,radius*height*.56,radius*.47,radius*height*.88);
  s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:2,curveSegments:detail});
}

/** A completion costume on the established anatomical runner/knife rig. */
export function createCastawayRunner(def,{detail='hero'}={}){
  const hero=detail==='hero',w=createRunnerWorkshop({hero});
  const {material,group:part,plate,tube,loft,ell,box,add}=w;
  const group=new THREE.Group();group.name='runner-'+def.id;
  group.userData={runnerId:def.id,rarity:'legendary',style:'shadow-runner',completionReward:'castaway'};
  const cloth=material('Umbra / indigo cut-paper cloth',def.cloth||INDIGO,{roughness:.94});
  const lining=material('Umbra / deep silhouette lining',def.secondary||INK,{roughness:.97});
  const glove=material('Umbra / soft indigo gloves',def.glove||'#25213c',{roughness:.89,texture:'cloth'});
  const ivory=material('Umbra / ivory contour',def.accent||IVORY,{roughness:.82});
  const apricot=material('Umbra / dawn scarf lining',APRICOT,{roughness:.91});
  const violet=material('Umbra / penumbra folds','#51456c',{roughness:.94});
  const sole=material('Umbra / quiet rubber sole','#11121c',{roughness:.98});
  const anatomy=createRunnerAnatomy(def,{group,workshop:w,cloth,pants:lining,glove,sole});
  const {head,chest,hips,arms,legs}=anatomy,secondary=[];
  const panel=(parent,mat,x,y,z,shape,depth=.006)=>{
    const mesh=plate(parent,mat,shape,depth);mesh.position.set(x,y,z);return mesh;
  };
  const contour=(parent,points,width=.0021)=>tube(parent,ivory,points,width);

  // A pointed fitted hood frames the asymmetric moon rather than hiding a
  // generic face behind a spherical accessory. Front is the runner's -Z.
  loft(head,lining,[[.003,.061,.059],[.085,.094,.083],[.205,.096,.084],[.285,.063,.064],[.327,.014,.022]],{segments:hero?20:12,power:.86});
  loft(head,cloth,[[.196,.098,.083],[.253,.085,.077],[.304,.046,.049],[.339,.004,.014]],{segments:hero?20:12,power:.84});
  const moon=add(head,crescentGeometry({radius:.104,height:1.27,depth:.012,detail:hero?18:10}),ivory,.015,.156,-.111);
  moon.rotation.z=-.08;
  ell(head,lining,-.045,.182,-.123,.026,.009,.004);
  tube(head,apricot,[[-.063,.181,-.128],[-.044,.184,-.13],[-.028,.18,-.128]],.0019);
  ell(head,ivory,.043,.18,-.086,.021,.0045,.004);
  for(const side of[-1,1])contour(head,[[side*.064,.045,-.067],[side*.09,.119,-.067],[side*.085,.233,-.061],[side*.039,.302,-.041]],.0017);

  // Warm lining is visible inside the raised collar and under the mantle.
  loft(chest,apricot,[[.39,.136,.109],[.445,.107,.092],[.485,.083,.073]],{segments:14,power:.84});
  for(const side of[-1,1]){
    const collar=panel(chest,cloth,side*.054,.405,-.088,
      [[-side*.033,-.055],[side*.051,-.083],[side*.089,.042],[side*.018,.097],[-side*.027,.041]],.013);
    collar.rotation.y=side*-.12;
    contour(chest,[[side*.031,.363,-.109],[side*.098,.433,-.103],[side*.07,.491,-.076]],.0022);
    panel(chest,violet,side*.077,.13,-.133,[[-.058,-.09],[.065,-.076],[.075,.16],[.009,.258],[-.055,.177]],.007).rotation.z=-side*.035;
    contour(chest,[[side*.036,.05,-.143],[side*.12,.182,-.145],[side*.13,.314,-.129]],.002);
  }
  contour(chest,[[.006,.012,-.119],[.009,.18,-.148],[.005,.34,-.126]],.0023);
  const clasp=add(chest,crescentGeometry({radius:.027,height:1.05,depth:.004,detail:10}),ivory,.007,.346,-.143);
  clasp.rotation.z=-.35;

  // Two pointed shoulder leaves make a readable cut-paper silhouette. They
  // are structural costume pieces attached to the chest, not billboards.
  for(const side of[-1,1]){
    const mantle=part(chest,'Umbra / cut-paper shoulder '+side,side*.117,.415,.045);
    panel(mantle,cloth,0,0,0,[[side*-.04,.037],[side*.102,.036],[side*.201,-.065],[side*.113,-.16],[side*.052,-.238],[side*-.029,-.116]],.015);
    panel(mantle,apricot,0,-.012,.018,[[side*-.014,.021],[side*.085,.016],[side*.145,-.064],[side*.072,-.16],[side*.021,-.168],[side*-.016,-.087]],.004);
    contour(mantle,[[side*-.025,.026,-.004],[side*.093,.026,-.004],[side*.18,-.064,-.004],[side*.106,-.139,-.004]],.0021);
    secondary.push({object:mantle,x:.055,z:-side*.075,idle:.008,run:.035,phase:side<0?.6:2.2});
  }

  // The split trailing panels are independently hinged so running reveals
  // small flashes of warm lining. Their tips remain above the knees.
  for(let i=0;i<4;i++){
    const x=(i-1.5)*.071,length=[.37,.49,.46,.34][i];
    const tail=part(hips,'Umbra / trailing shadow panel '+i,x,.013,.119+Math.abs(x)*.11);
    const shape=[[-.045,.031],[.047,.033],[.054,-length*.67],[.019,-length],[-.026,-length*.87],[-.051,-length*.47]];
    panel(tail,i%2?cloth:violet,0,0,0,shape,.009);
    panel(tail,i===1||i===2?apricot:lining,0,0,-.005,shape.map(([a,b])=>[a*.82,b*.96]),.003);
    contour(tail,[[-.038,.015,.012],[-.042,-length*.47,.012],[-.021,-length*.81,.012]],.0017);
    contour(tail,[[.039,.016,.012],[.045,-length*.64,.012],[.016,-length*.94,.012]],.0017);
    secondary.push({object:tail,x:.07+Math.abs(x)*.2,z:x*.26,idle:.013,run:.105,phase:i*.8,rate:1.1+i*.09});
  }
  const scarf=part(chest,'Umbra / dawn scarf streamer',-.081,.418,.117);
  panel(scarf,apricot,0,0,0,[[-.027,.012],[.024,.01],[.033,-.17],[.011,-.318],[-.026,-.267],[-.035,-.124]],.006);
  panel(scarf,cloth,0,0,.008,[[-.025,.011],[-.013,.011],[-.018,-.255],[-.026,-.267],[-.035,-.124]],.003);
  secondary.push({object:scarf,x:.2,z:-.09,idle:.019,run:.14,phase:1.7,rate:1.5});

  loft(hips,cloth,[[.022,.147*def.build,.106],[.063,.149*def.build,.108]],{segments:14,power:.82});
  contour(hips,[[-.14,.044,-.061],[-.089,.042,-.105],[0,.04,-.119],[.092,.042,-.104],[.141,.045,-.061]],.0022);
  for(const {side,shoulder,elbow,hand}of arms){
    contour(shoulder,[[side*.052,-.035,-.055],[side*.061,-.127,-.049],[side*.047,-.231,-.037]],.0018);
    loft(elbow,cloth,[[-.172,.052,.045],[-.21,.049,.041],[-.246,.042,.037]],{segments:10,power:.81});
    contour(elbow,[[-.037,-.209,-.029],[0,-.219,-.047],[.037,-.209,-.029]],.0025);
    for(const xx of[-.025,.025])contour(elbow,[[xx,-.039,-.061],[xx*.9,-.132,-.053],[xx*.75,-.195,-.045]],.0017);
    panel(hand,cloth,0,-.033,-.033,[[-.03,.024],[.032,.024],[.028,-.024],[-.027,-.025]],.005);
    for(const xx of[-.013,.013])contour(hand,[[xx,-.013,-.041],[xx,-.045,-.041]],.0015);
    const token=add(elbow,crescentGeometry({radius:.016,height:1.13,depth:.003,detail:8}),ivory,side*.003,-.126,-.063);
    token.rotation.z=side*.18;
  }
  for(const {side,hip,knee,ankle}of legs){
    contour(hip,[[side*.067,-.045,-.055],[side*.066,-.18,-.068],[side*.05,-.285,-.048]],.0019);
    panel(knee,cloth,0,-.008,-.068,[[-.047,.037],[.047,.037],[.047,-.035],[.014,-.075],[-.033,-.059]],.009);
    contour(knee,[[-.035,.021,-.082],[.033,.021,-.082],[.035,-.026,-.082],[.015,-.06,-.081]],.0017);
    contour(knee,[[side*.041,-.107,-.045],[side*.035,-.274,-.036]],.0017);
    loft(ankle,sole,[[.018,.047,.058],[-.027,.054,.112,0,-.035],[-.066,.054,.12,0,-.04]],{segments:hero?20:12,power:.78});
    loft(ankle,cloth,[[.043,.041,.045],[.008,.05,.085,0,-.028],[-.028,.052,.114,0,-.04]],{segments:hero?20:12,power:.82});
    contour(ankle,[[-.041,-.02,-.1],[0,-.023,-.145],[.041,-.02,-.1]],.0021);
    box(ankle,apricot,side*.047,-.006,.025,.007,.02,.024);
  }

  anatomy.fitFront(chest);group.scale.setScalar(def.height/1.8);
  const stats=finishRunnerBuild(group,w.resources);
  applyComicFinish(group,w.resources,{outlines:hero});
  group.userData.silhouette='ivory-crescent-half-mask / indigo-cut-paper-mantle / divided-shadow-tails';
  group.userData.artStyle='Castaway / etched cosmic dream';
  let disposed=false;
  const update=(time,state={})=>{
    if(disposed)return state.gait||'idle';
    const gait=anatomy.update(time,state),{blend,phase}=group.userData.animation,motion=state.motion!==false;
    for(const p of secondary){
      p.object.rotation.x=p.x+(motion?Math.sin(time*(p.rate||1.3)+p.phase)*p.idle*(1-blend)+Math.sin(phase+p.phase)*p.run*blend:0);
      p.object.rotation.z=p.z+(motion?Math.sin(time*.9+p.phase)*.006*(1-blend)+Math.cos(phase+p.phase)*.012*blend:0);
    }
    return gait;
  };
  update(0);
  return{group,definition:def,anatomy,stats,update,dispose(){if(disposed)return;disposed=true;anatomy.dispose();w.dispose();group.removeFromParent();}};
}

/**
 * Call once for each solved first-person arm and register the returned groups
 * in hands.js runnerDetails under "shadow-runner". The parent owns resources
 * and normal setRunnerStyle visibility; no hand, finger or grip changes.
 */
export function createCastawayHandDetails({forearm,wrist,side=1,label='Umbra',ownGeometry,ownMaterial}){
  const groups=[];
  const makeMat=(name,color)=>ownMaterial(new THREE.MeshStandardMaterial({name,color,roughness:.91,metalness:0}));
  const indigo=makeMat('Umbra / first-person cut-paper cuff',INDIGO),ivory=makeMat('Umbra / first-person ivory contours',IVORY),apricot=makeMat('Umbra / first-person dawn lining',APRICOT);
  const createGroup=(parent,name)=>{const g=new THREE.Group();g.name=label+' / '+name;g.visible=false;parent.add(g);groups.push(g);return g;};
  const cuff=createGroup(forearm,'Umbra contour cuff'),back=createGroup(wrist,'Umbra glove contours');cuff.name=label+' shadow-runner cuff';
  const mesh=(g,geometry,material)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=false;m.receiveShadow=false;m.frustumCulled=false;m.layers.set(1);g.add(m);return m;};
  const line=(g,material,points,r=.0015)=>mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(8,points.length*4),r,5,false),material);
  const slab=(g,material,points,y,depth=.004)=>{
    const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1});
    // Shape's XY becomes the forearm's XZ, with its visible surface facing +Y.
    geo.rotateX(Math.PI/2);geo.translate(0,y,0);return mesh(g,geo,material);
  };
  slab(cuff,indigo,[[-.035,.052],[.037,.052],[.042,.137],[.018,.185],[-.032,.157]],.05,.007);
  slab(cuff,apricot,[[-.034,.047],[.035,.047],[.037,.061],[-.034,.066]],.052,.003);
  line(cuff,ivory,[[-.03,.054,.065],[-.033,.057,.132],[-.02,.057,.157]],.0017);
  line(cuff,ivory,[[.031,.054,.065],[.036,.057,.13],[.018,.058,.174]],.0017);
  for(const x of[-.026,.026])line(cuff,ivory,[[x,.052,.19],[x*.9,.056,.25],[x*.7,.057,.31]],.0014);
  const moon=mesh(cuff,crescentGeometry({radius:.016,height:1.12,depth:.002,detail:8}),ivory);
  moon.rotation.x=-Math.PI/2;moon.rotation.z=side*.18;moon.position.set(side*.002,.06,.117);
  slab(back,indigo,[[-.025,-.012],[.027,-.013],[.029,-.051],[.014,-.075],[-.023,-.062]],.031,.004);
  line(back,ivory,[[-.018,.035,-.019],[-.018,.036,-.052],[-.009,.034,-.065]],.00135);
  line(back,ivory,[[.019,.035,-.02],[.019,.036,-.049]],.00135);
  for(const g of groups){
    const resources=new Set();g.traverse(o=>{if(o.isMesh)resources.add(o.geometry);});
    finishRunnerBuild(g,resources);
    g.traverse(o=>{if(o.isMesh){o.layers.set(1);o.renderOrder=100;o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});
    for(const geometry of resources)if(geometry.isBufferGeometry)ownGeometry(geometry);
  }
  return groups;
}
