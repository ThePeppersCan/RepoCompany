import * as THREE from './vendor/three.module.js?v=2.17.0';
import {createRunnerWorkshop,finishRunnerBuild} from './runner-craft.js?v=2.17.0';
import {createRunnerAnatomy} from './runner-anatomy.js?v=2.17.0';
import {applyComicFinish} from './comic-runner.js?v=2.17.0';

export const UNRAVEL_RUNNER_DEFINITION=Object.freeze({
  id:'seamkeeper',name:'Seamkeeper',gender:'female',role:'The last unbroken thread',
  description:'An ivory folded half-mask, fitted indigo expedition coat and peacock-woven panels. Fine gold seams, a short asymmetric mantle and a mended field spool remember the way out of UNRAVEL.',
  skin:'#947967',cloth:'#273947',secondary:'#16262d',accent:'#d4b478',glove:'#2b4448',hair:'#252b30',
  style:'woven-runner',height:1.82,build:.96,rarity:'legendary',unlockJourney:'unravel',
  signature:'folded ivory / peacock weave / raised gold seams',
});
const IVORY='#dfd7bd',PEACOCK='#35676a',DEEP_TEAL='#234b54',GOLD='#d4b478';

function maskGeometry(hero){
  // A face-sized folded brow shell. The eye apertures are actual openings;
  // the moth reference is carried by its folds, not a pair of costume wings.
  const points=[[-.098,.178],[-.085,.225],[-.046,.244],[-.016,.216],[0,.231],
    [.021,.214],[.070,.238],[.096,.201],[.085,.143],[.045,.120],[.014,.143],
    [0,.108],[-.019,.145],[-.059,.127],[-.089,.147]];
  const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
  for(const side of[-1,1]){
    const h=new THREE.Path(),cx=side*.044,y=.176;
    h.moveTo(cx-.023,y);h.bezierCurveTo(cx-.012,y+.012,cx+.012,y+.011,cx+.024,y+.001);
    h.bezierCurveTo(cx+.012,y-.008,cx-.013,y-.009,cx-.023,y);s.holes.push(h);
  }
  const g=new THREE.ExtrudeGeometry(s,{depth:.0055,steps:1,bevelEnabled:true,
    bevelSize:.0012,bevelThickness:.0012,bevelSegments:1,curveSegments:hero?12:7});
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),nose=Math.max(0,1-Math.abs(x)/.022)*Math.max(0,1-Math.abs(y-.145)/.064);
    const fold=Math.abs(Math.abs(x)-.043)*.12;
    p.setZ(i,p.getZ(i)-.107+(x/.1)**2*.031-nose*.025+fold);
  }
  g.computeVertexNormals();return g;
}

function bindFittedDetails(front,root,anatomy){
  // A fitted lapel must deform with the jacket, rather than tilt as one rigid
  // chest accessory when the hips and spine separate during a slide.
  root.updateMatrixWorld(true);
  const body=anatomy.mesh.geometry.attributes,points=[];
  for(let i=0;i<body.position.count;i++){
    const x=body.position.getX(i),y=body.position.getY(i),z=body.position.getZ(i),weights=[0,0,0];
    if(Math.abs(x)>.22||y<.9||y>1.51||z>-.035)continue;
    for(let j=0;j<4;j++){const bone=body.skinIndex.array[i*4+j];if(bone<3)weights[bone]+=body.skinWeight.array[i*4+j];}
    if(weights.reduce((a,b)=>a+b,0)>.95)points.push({x,y,z,weights});
  }
  const meshes=[];front.traverse(o=>{if(o.isMesh)meshes.push(o);});
  for(const old of meshes){
    const geometry=old.geometry;geometry.applyMatrix4(old.matrixWorld);
    const p=geometry.attributes.position,indices=[],weights=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nearest=[];
      for(const point of points){
        const distance=(x-point.x)**2+(y-point.y)**2+(z-point.z)**2;
        if(nearest.length<3||distance<nearest.at(-1).distance){nearest.push({point,distance});nearest.sort((a,b)=>a.distance-b.distance);if(nearest.length>3)nearest.pop();}
      }
      const blend=[0,0,0];for(const n of nearest)for(let j=0;j<3;j++)blend[j]+=n.point.weights[j]/Math.max(1e-6,n.distance);
      const total=blend.reduce((a,b)=>a+b,0)||1;indices.push(0,1,2,0);weights.push(...blend.map(w=>w/total),0);
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
    geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    const fitted=new THREE.SkinnedMesh(geometry,old.material);fitted.name=old.name+' / fitted to jacket';
    fitted.castShadow=fitted.receiveShadow=true;fitted.frustumCulled=false;
    old.removeFromParent();root.add(fitted);fitted.bind(anatomy.mesh.skeleton,anatomy.mesh.bindMatrix);
  }
}

/** Completion runner; movement and equipment remain owned by the shared rig. */
export function createUnravelRunner(def=UNRAVEL_RUNNER_DEFINITION,{detail='hero'}={}){
  const hero=detail==='hero',w=createRunnerWorkshop({hero});
  const {material,group:part,loft,ell,box,tube,ring,add}=w;
  const group=new THREE.Group();group.name='runner-'+def.id;
  group.userData={runnerId:def.id,rarity:'legendary',style:'woven-runner',completionReward:'unravel'};
  const cloth=material('Seamkeeper / indigo expedition weave',def.cloth,{texture:'cloth',roughness:.88});
  const lining=material('Seamkeeper / deep woven lining',def.secondary,{texture:'cloth',roughness:.92});
  const glove=material('Seamkeeper / close-woven gloves',def.glove,{texture:'cloth',roughness:.9});
  const ivory=material('Seamkeeper / warm ivory canvas',IVORY,{texture:'cloth',roughness:.87});
  const mask=material('Seamkeeper / folded ivory half-mask',IVORY,{roughness:.53});
  const peacock=material('Seamkeeper / peacock jacquard',PEACOCK,{texture:'cloth',roughness:.79});
  const teal=material('Seamkeeper / recessed peacock folds',DEEP_TEAL,{texture:'cloth',roughness:.89});
  const gold=material('Seamkeeper / fine antique gold seam',def.accent||GOLD,{roughness:.57,metalness:.4});
  const sole=material('Seamkeeper / quiet tread','#111c20',{roughness:.97});
  const skin=material('Seamkeeper / face',def.skin,{roughness:.75});
  const hair=material('Seamkeeper / bound dark hair',def.hair||'#252b30',{roughness:.92});
  const recess=material('Seamkeeper / eye and fastening recess','#0f1e23',{roughness:.87});
  const anatomy=createRunnerAnatomy(def,{group,workshop:w,cloth,pants:lining,glove,sole});
  const {head,chest,hips,arms,legs}=anatomy,secondary=[];
  const seam=(parent,points,r=.0015)=>tube(parent,gold,points,r);
  const panel=(parent,mat,name,x,y,z,points,depth=.004)=>{
    const s=new THREE.Shape();points.forEach(([px,py],i)=>i?s.lineTo(px,py):s.moveTo(px,py));s.closePath();
    const o=add(parent,new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,
      bevelSize:.0012,bevelThickness:.0012,bevelSegments:1,curveSegments:6}),mat,x,y,z);o.name=name;return o;
  };
  const stitch=(parent,a,b,count=5)=>{
    const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);
    for(let i=0;i<count;i++){
      const p=va.clone().lerp(vb,(i+.5)/count);
      tube(parent,ivory,[[p.x-.0025,p.y-.002,p.z],[p.x+.0025,p.y+.002,p.z]],.00075);
    }
  };

  // A long jaw, small lower lip and restrained cheek planes read as an adult
  // beneath the half-mask. The tied hair stays close to the neck silhouette.
  loft(head,skin,[[.018,.030,.034,0,-.014],[.045,.051,.052,0,-.005],
    [.097,.074,.069,0,.001],[.166,.084,.078],[.223,.071,.065],[.253,.035,.037]],
    {segments:hero?24:14,power:.92});
  loft(head,hair,[[.178,.086,.078,0,.008],[.234,.078,.073,0,.009],
    [.274,.049,.047,0,.013],[.286,.018,.019,0,.016]],{segments:hero?22:14,power:.9});
  ell(head,hair,.008,.086,.074,.048,.049,.026);
  for(const side of[-1,1]){
    tube(head,hair,[[side*.078,.205,.012],[side*.081,.16,.015],[side*.070,.106,.041]],.008);
    ell(head,skin,side*.081,.133,.005,.011,.025,.012);
    ell(head,recess,side*.044,.176,-.079,.025,.011,.012);
    ell(head,skin,side*.024,.063,-.062,.025,.014,.009);
  }
  tube(head,lining,[[-.017,.059,-.075],[0,.057,-.08],[.017,.060,-.075]],.0011);
  add(head,maskGeometry(hero),mask).name='Seamkeeper / folded moth half-mask with eye cuts';
  for(const side of[-1,1]){
    seam(head,[[side*.087,.194,-.079],[side*.068,.224,-.091],[side*.043,.207,-.101],[side*.018,.208,-.108]],.0013);
    seam(head,[[side*.078,.148,-.084],[side*.046,.128,-.106],[side*.027,.148,-.115]],.0011);
  }
  seam(head,[[0,.219,-.108],[0,.179,-.121],[0,.12,-.134]],.00125);
  tube(head,gold,[[-.033,.081,.094],[0,.078,.102],[.033,.083,.091]],.0014);

  // Fitted canvas facings and narrow peacock inserts follow the established
  // jacket surface; none enlarges the chest or creates a separate breastplate.
  const front=part(chest,'Seamkeeper / fitted front seamwork');
  for(const side of[-1,1]){
    panel(front,peacock,'Peacock side panel '+side,side*.112,.20,-.13,
      [[-side*.047,-.165],[side*.022,-.147],[side*.062,.041],[side*.045,.21],[-side*.022,.19]],.003);
    panel(front,ivory,'Ivory expedition facing '+side,side*.053,.20,-.143,
      [[-side*.026,-.17],[side*.020,-.16],[side*.05,.105],[side*.065,.22],[-side*.012,.308],[-side*.041,.245],[side*.009,.13]],.004);
    seam(front,[[side*.031,.036,-.139],[side*.047,.17,-.158],[side*.071,.30,-.144],[side*.112,.42,-.107],[side*.041,.508,-.082]],.0017);
    seam(front,[[side*.146,.045,-.10],[side*.166,.173,-.125],[side*.183,.30,-.10]],.0015);
    // Small herringbone stitches, visible close up without thick graphic bars.
    stitch(front,[side*.113,.125,-.151],[side*.139,.282,-.142],hero?9:5);
    const pocket=panel(front,cloth,'Bound field pocket '+side,side*.106,.08,-.139,
      [[-.034,-.029],[.034,-.023],[.038,.026],[-.031,.025]],.003);
    pocket.rotation.z=side*.08;
    seam(front,[[side*.075,.108,-.15],[side*.132,.111,-.143]],.0014);
  }
  seam(front,[[.006,.015,-.119],[.008,.20,-.148],[.01,.35,-.121]],.0013);
  for(let i=0;i<4;i++)box(front,gold,.011,.09+i*.07,-.15,.007,.011,.004);
  anatomy.fitFront(front);
  const collar=part(chest,'Seamkeeper / soft stand collar',0,.495,0);
  loft(collar,ivory,[[.005,.113,.092],[.05,.089,.075],[.073,.083,.068]],{segments:16,power:.87});
  for(const side of[-1,1]){
    const fold=panel(collar,cloth,'Indigo collar fold '+side,side*.058,.011,-.079,
      [[-side*.028,-.013],[side*.041,-.022],[side*.025,.063],[-side*.014,.062]],.006);
    fold.rotation.y=-side*.18;
    seam(collar,[[side*.035,-.001,-.092],[side*.081,.001,-.082],[side*.078,.058,-.069]],.0015);
  }
  box(collar,gold,-.015,.021,-.099,.032,.012,.004);

  // Short, inward-cut mantle over the left scapula only. Its outside edge
  // stays inboard of the upper arm; there are no lateral wing extensions.
  const mantle=part(chest,'Seamkeeper / short left shoulder mantle',-.073,.505,.102);
  panel(mantle,lining,'Mantle shadow edge',0,0,.005,
    [[-.101,.032],[.056,.026],[.096,-.085],[.047,-.182],[-.053,-.154],[-.103,-.067]],.008);
  panel(mantle,peacock,'Mantle woven face',0,0,.017,
    [[-.096,.027],[.047,.021],[.083,-.084],[.041,-.168],[-.047,-.142],[-.095,-.059]],.004);
  panel(mantle,ivory,'Mantle narrow ivory fold',-.003,0,.023,
    [[-.082,.027],[-.043,.025],[.014,-.124],[-.009,-.147],[-.033,-.075]],.003);
  seam(mantle,[[-.09,.02,.026],[-.085,-.057,.026],[-.044,-.135,.026],[.039,-.16,.026],[.078,-.082,.026]],.0017);
  seam(mantle,[[-.033,.022,.03],[.002,-.057,.029],[.033,-.127,.027]],.0013);
  for(let i=0;i<3;i++)seam(mantle,[[.002+i*.015,-.014,.027],[.022+i*.013,-.057,.027],[.042+i*.008,-.084,.027]],.0009);
  secondary.push({object:mantle,kind:'mantle',x:-.035,z:-.04,idle:.004,run:.022,phase:.7});

  loft(hips,cloth,[[.011,.153,.112],[.053,.153,.111]],{segments:16,power:.85});
  seam(hips,[[-.14,.045,-.064],[-.085,.044,-.108],[0,.044,-.123],[.09,.044,-.106],[.14,.045,-.065]],.0015);
  box(hips,gold,.021,.034,-.127,.034,.024,.007);box(hips,lining,.021,.034,-.132,.022,.013,.003);
  // Divided coat skirts end at the upper thigh and lift gently on a slide.
  for(const side of[-1,1]){
    const tail=part(hips,'Seamkeeper / divided coat skirt '+side,side*.077,.025,.108);
    const length=side<0?.296:.263,shape=[[-.067,.017],[.065,.017],[.067,-length*.64],[.038,-length],[-.057,-length+.021]];
    panel(tail,cloth,'Indigo coat skirt '+side,0,0,0,shape,.006);
    panel(tail,peacock,'Peacock inset skirt '+side,0,0,.008,
      [[-.046,.004],[.047,.003],[.048,-length*.61],[.025,-length+.026],[-.039,-length+.043]],.003);
    seam(tail,[[-.054,.006,.013],[-.053,-length+.033,.013],[.033,-length+.013,.013],[.056,-length*.62,.013]],.0015);
    seam(tail,[[.009,-.006,.014],[.014,-length*.51,.014],[.004,-length+.044,.014]],.0011);
    secondary.push({object:tail,kind:'tail',x:-.07,z:side*.025,idle:.006,run:.055,phase:side<0?.5:2.4});
  }
  const spool=part(hips,'Seamkeeper / mended field spool',-.126,-.017,.085);
  loft(spool,ivory,[[-.032,.013,.013],[.032,.013,.013]],{segments:12});
  for(const y of[-.035,.035])ell(spool,gold,0,y,0,.022,.004,.022);
  for(let i=0;i<5;i++)ring(spool,teal,0,-.023+i*.011,0,.014,.0014).rotation.x=Math.PI/2;
  tube(hips,glove,[[-.126,.043,.075],[-.143,.014,.097],[-.126,-.054,.085]],.003);

  for(const {side,shoulder,elbow,hand}of arms){
    seam(shoulder,[[side*.054,-.032,-.047],[side*.063,-.12,-.048],[side*.046,-.225,-.037]],.00135);
    loft(elbow,peacock,[[-.172,.047,.041],[-.218,.045,.038],[-.241,.04,.034]],{segments:12,power:.9});
    tube(elbow,ivory,[[-.034,-.222,-.025],[0,-.23,-.041],[.034,-.222,-.025]],.0024);
    for(let i=0;i<4;i++){
      const y=-.181-i*.012;
      seam(elbow,[[-.027,y,-.033],[0,y-.01,-.046],[.027,y,-.033]],.001);
    }
    const back=panel(hand,glove,'Woven glove back '+side,0,-.033,-.033,
      [[-.027,.021],[.028,.021],[.026,-.024],[-.024,-.025]],.003);
    for(let i=0;i<3;i++){
      const y=-.02-i*.011;
      tube(hand,teal,[[-.019,y,-.038],[0,y-.007,-.041],[.019,y,-.038]],.00115);
    }
    seam(hand,[[-.023,-.012,-.039],[-.02,-.051,-.038]],.001);
    seam(hand,[[.023,-.012,-.039],[.02,-.051,-.038]],.001);
  }
  for(const {side,hip,knee,ankle}of legs){
    seam(hip,[[side*.06,-.05,-.05],[side*.065,-.16,-.064],[side*.049,-.275,-.047]],.0012);
    panel(knee,cloth,'Flexible knee facing '+side,0,0,-.066,
      [[-.038,.025],[.039,.025],[.039,-.024],[.012,-.052],[-.032,-.039]],.004);
    tube(knee,peacock,[[-.03,.014,-.077],[0,.007,-.08],[.029,.014,-.077]],.0024);
    seam(knee,[[side*.032,-.095,-.044],[side*.03,-.257,-.033]],.0011);
    loft(ankle,sole,[[.018,.047,.058],[-.027,.054,.112,0,-.035],[-.066,.054,.12,0,-.04]],{segments:hero?20:12,power:.78});
    loft(ankle,cloth,[[.042,.041,.045],[.008,.05,.085,0,-.028],[-.028,.052,.114,0,-.04]],{segments:hero?20:12,power:.82});
    tube(ankle,ivory,[[-.039,-.018,-.105],[0,-.022,-.143],[.039,-.018,-.105]],.0015);
    for(let i=0;i<3;i++)tube(ankle,glove,[[-.022,.005-i*.008,-.067-i*.013],[.022,.005-i*.008,-.067-i*.013]],.0018);
    box(ankle,peacock,0,.031,.042,.022,.029,.007);
  }

  finishRunnerBuild(group,w.resources);bindFittedDetails(front,group,anatomy);
  group.scale.setScalar(def.height/1.8);
  applyComicFinish(group,w.resources,{outlines:hero,softShading:true});
  const stats={drawCalls:0,triangles:0};group.traverse(o=>{if(o.isMesh&&!o.userData.comicOutline){stats.drawCalls++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  group.userData.renderStats=stats;group.userData.silhouette='folded-ivory-half-mask / fitted-peacock-coat / short-left-mantle';
  group.userData.artStyle='UNRAVEL / woven expedition tailoring';
  let disposed=false;
  const update=(time,state={})=>{
    if(disposed)return state.gait||'idle';
    const gait=anatomy.update(time,state),a=group.userData.animation,motion=state.motion!==false;
    const blend=a.blend||0,slide=a.slideWeight||0,crouch=a.crouchWeight||0;
    for(const p of secondary){
      const drift=motion?Math.sin(time*1.2+p.phase)*p.idle*(1-blend)+Math.sin(a.phase+p.phase)*p.run*blend:0;
      p.object.rotation.x=p.x+drift-(p.kind==='tail'?.53:.12)*slide-(p.kind==='tail'?.20:.05)*crouch;
      p.object.rotation.z=p.z+(motion?Math.sin(time*.7+p.phase)*.003:0);
    }
    return gait;
  };
  update(0);
  return {group,definition:def,anatomy,stats,update,dispose(){if(disposed)return;disposed=true;anatomy.dispose();w.dispose();group.removeFromParent();group.clear();}};
}

/** Optional first-person additions; register once under runnerDetails woven-runner. */
export function createUnravelHandDetails({forearm,wrist,side=1,label='Seamkeeper',ownGeometry,ownMaterial}){
  const groups=[],m=(name,color,metalness=0)=>ownMaterial(new THREE.MeshStandardMaterial({name,color,metalness,roughness:metalness?.58:.89}));
  const teal=m('Seamkeeper / first-person peacock weave',PEACOCK),ivory=m('Seamkeeper / first-person canvas binding',IVORY),gold=m('Seamkeeper / first-person raised gold seams',GOLD,.3);
  const part=(parent,name)=>{const g=new THREE.Group();g.name=label+' '+name;g.visible=false;parent.add(g);groups.push(g);return g;};
  const cuff=part(forearm,'woven-runner cuff'),back=part(wrist,'woven-runner glove seamwork');
  const mesh=(parent,geo,mat)=>{const o=new THREE.Mesh(geo,mat);parent.add(o);return o;};
  const line=(parent,mat,points,r=.0012)=>mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),Math.max(8,points.length*4),r,5,false),mat);
  const inset=(parent,mat,points,y,depth=.003)=>{
    const s=new THREE.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.0008,bevelThickness:.0008,bevelSegments:1});g.rotateX(Math.PI/2);g.translate(0,y,0);return mesh(parent,g,mat);
  };
  inset(cuff,teal,[[-.034,.055],[.036,.055],[.038,.137],[.026,.16],[-.03,.158]],.05,.005);
  line(cuff,ivory,[[-.032,.054,.06],[0,.059,.055],[.032,.054,.06]],.002);
  for(let i=0;i<4;i++){
    const z=.078+i*.018;
    line(cuff,gold,[[-.027,.056,z],[0,.059,z+.012],[.028,.056,z]],.0012);
  }
  line(cuff,gold,[[side*.028,.055,.17],[side*.023,.056,.23],[side*.018,.057,.285]],.0012);
  inset(back,teal,[[-.023,-.014],[.025,-.014],[.026,-.049],[.015,-.066],[-.022,-.059]],.031,.002);
  for(let i=0;i<3;i++){
    const z=-.022-i*.013;
    line(back,ivory,[[-.017,.034,z],[0,.036,z-.006],[.018,.034,z]],.0009);
  }
  for(const side of[-1,1])line(back,gold,[[side*.022,.034,-.018],[side*.022,.035,-.048],[side*.015,.033,-.06]],.001);
  for(const g of groups){
    const resources=new Set();g.traverse(o=>{if(o.isMesh)resources.add(o.geometry);});finishRunnerBuild(g,resources);
    for(const geometry of resources)if(geometry.isBufferGeometry)ownGeometry(geometry);
    g.traverse(o=>{if(o.isMesh){o.layers.set(1);o.renderOrder=100;o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});
  }
  return groups;
}
