import * as THREE from './vendor/three.module.js?v=2.15.0';
import {createRunnerWorkshop,finishRunnerBuild} from './runner-craft.js?v=2.15.0';

import {createRunnerAnatomy} from './runner-anatomy.js?v=2.15.0';
import {applyComicFinish} from './comic-runner.js?v=2.15.0';

// Authored silhouettes share a grounded anatomical rig, while heads,
// torso construction, outer garments, equipment and armour are built separately.
export function createLegendaryRunner(def,{detail='hero'}={}){
  const hero=detail==='hero',w=createRunnerWorkshop({hero});
  const {material,group:part,ell,box,tube,ring,rod,loft,plate}=w;
  const group=new THREE.Group();group.name='runner-'+def.id;group.userData.runnerId=def.id;group.userData.rarity='legendary';
  const fabric=material('woven shell',def.cloth,{roughness:.85,texture:'cloth'});
  const lining=material('joint fabric',def.secondary,{roughness:.92,texture:'cloth'});
  const leather=material('worn leather',def.glove,{roughness:.7,texture:'grain'});
  const trim=material('brushed fittings',def.accent,{roughness:.43,metalness:.65});
  const darkMetal=material('blackened metal','#30363a',{roughness:.48,metalness:.72});
  const ceramic=material('glazed ceramic',def.style==='automaton'?'#cbbd9f':def.style==='cinder'?'#a8a297':'#d7d5c9',{roughness:.34,metalness:.05,clearcoat:.22});
  const lens=material('smoked optical glass','#182a30',{roughness:.19,metalness:.55,clearcoat:.6});
  const light=material('inset luminous enamel',def.accent,{roughness:.38,metalness:.25,emissive:def.accent,intensity:.32});
  const sole=material('rubber tread','#191d20',{roughness:.97});
  const wood=material('aged carved timber','#8c6948',{roughness:.78,texture:'grain'});
  const stitch=material('waxed seams','#a49b88',{roughness:.9});
  const anatomy=createRunnerAnatomy(def,{group,workshop:w,cloth:fabric,pants:lining,glove:leather,sole});
  const {hips,chest,head,arms,legs}=anatomy;
  const chestWidth=(def.gender==='female'?.202:.23)*def.build,secondary=[];
  const panel=(parent,mat,x,y,z,shape,depth=.009)=>{const o=plate(parent,mat,shape,depth);o.position.set(x,y,z);return o;};
  const seam=(parent,points,r=.0018)=>tube(parent,stitch,points,r);
  const studs=(parent,points,mat=trim,r=.005)=>{for(const [x,y,z]of points)ell(parent,mat,x,y,z,r,r,r*.55);};
  const strap=(parent,points,r=.012)=>tube(parent,leather,points,r);
  const articulatedTail=(name,x,y,z,shape,mat=fabric)=>{
    const tail=part(hips,name,x,y,z);panel(tail,mat,0,0,0,shape,.012);
    secondary.push({object:tail,x:.04,z:x*.15,idle:.012,run:.09,phase:x<0?1.8:0});return tail;
  };
  const shapeAssembly=(assembly,warp)=>{
    // Bend the fitted plates and their attached seams together. Merging still
    // happens per bone/material after shaping, so relief adds no draw calls.
    const v=new THREE.Vector3(),inverse=new THREE.Matrix4();
    for(const mesh of assembly.children){
      if(!mesh.isMesh)continue;mesh.updateMatrix();inverse.copy(mesh.matrix).invert();
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrix);v.z+=warp(v.x,v.y);v.applyMatrix4(inverse);p.setXYZ(i,v.x,v.y,v.z);}
      p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();
    }
  };
  loft(hips,leather,[[.02,.145*def.build,.105],[.06,.145*def.build,.105]],{power:.9});
  box(hips,trim,0,.04,-.117,.039,.026,.012);
  for(const {ankle} of legs){
    loft(ankle,sole,[[.025,.047,.056],[-.035,.055,.116,0,-.04],[-.071,.054,.122,0,-.045]],{power:.75,segments:24});
    loft(ankle,leather,[[.04,.043,.047],[.005,.052,.084,0,-.025],[-.03,.055,.116,0,-.043],[-.045,.054,.119,0,-.043]],{power:.85,segments:24});
    for(let i=0;i<4;i++)tube(ankle,stitch,[[-.025,.015-i*.008,-.035-i*.016],[.025,.012-i*.008,-.035-i*.016]],.0018);
  }

  if(def.style==='alpine'){
    const orange=material('expedition orange canvas','#d58b4e',{roughness:.88,texture:'cloth'});
    const braid=material('cream climbing rope','#d9cba9',{roughness:.94,texture:'grain'});
    const glacier=material('glacier goggle glass','#72a9ba',{roughness:.17,metalness:.42,clearcoat:.7});
    // A close storm hood, raised collar and double lens goggles frame a
    // believable climber; every item stays attached to the existing rig.
    loft(head,fabric,[[.005,.08,.075],[.08,.102,.094],[.21,.101,.096],[.29,.066,.07],[.316,.013,.02]],{segments:16,power:.9});
    panel(head,leather,0,.031,-.101,[[-.045,0],[-.071,.044],[-.07,.115],[.07,.115],[.071,.044],[.045,0]],.018);
    for(let i=0;i<3;i++)tube(head,lining,[[-.043,.059+i*.017,-.123],[0,.049+i*.017,-.131],[.043,.059+i*.017,-.123]],.0034);
    for(const side of[-1,1]){
      ell(head,darkMetal,side*.045,.183,-.094,.052,.035,.028);
      ell(head,glacier,side*.045,.186,-.118,.043,.027,.012);
      tube(head,ceramic,[[side*.015,.207,-.126],[side*.045,.214,-.124],[side*.076,.204,-.116]],.0022);
      tube(head,leather,[[side*.083,.185,-.094],[side*.106,.185,-.02],[side*.096,.181,.061]],.011);
      tube(head,braid,[[side*.072,.083,-.097],[side*.088,.165,-.086],[side*.073,.253,-.071]],.0031);
    }
    box(head,darkMetal,0,.184,-.113,.018,.012,.015);
    const lamp=part(head,'expedition headlamp',0,.279,-.073);
    box(lamp,darkMetal,0,0,0,.055,.031,.03);box(lamp,ceramic,0,0,-.018,.035,.018,.007);
    loft(chest,fabric,[[.4,.19,.128],[.46,.136,.117],[.525,.095,.09]],{segments:18,power:.85});
    tube(chest,braid,[[0,.055,-.129],[0,.25,-.136],[0,.43,-.128],[0,.49,-.106]],.003);
    box(chest,trim,.007,.408,-.137,.012,.024,.005);
    for(const side of[-1,1]){
      const flap=panel(chest,lining,side*.093,.166,-.136,[[-.058,-.055],[.058,-.055],[.059,.065],[-.057,.065]],.008);flap.rotation.z=side*-.14;
      tube(chest,trim,[[side*.047,.23,-.15],[side*.143,.216,-.148]],.0021);
      strap(chest,[[side*.118,.44,.093],[side*.164,.405,-.07],[side*.129,.24,-.157],[side*.118,.07,-.13]],.014);
      box(chest,darkMetal,side*.133,.272,-.164,.033,.05,.012);
      box(chest,orange,side*.133,.273,-.173,.016,.027,.004);
    }
    strap(chest,[[-.13,.28,-.166],[0,.273,-.169],[.13,.28,-.166]],.008);
    box(chest,trim,0,.273,-.176,.033,.019,.008);
    // Sculpted rounded pack, lid, compression straps and a rolled sleeping mat.
    const pack=part(chest,'orange expedition pack',0,.235,.159);
    loft(pack,orange,[[-.2,.125,.055],[-.16,.153,.087],[.1,.16,.091],[.21,.13,.069],[.235,.065,.04]],{segments:16,power:.72});
    ell(pack,orange,0,.177,.028,.157,.075,.091);
    for(const side of[-1,1]){
      ell(pack,orange,side*.143,-.085,.012,.037,.091,.065);
      tube(pack,leather,[[side*.096,-.18,.08],[side*.102,.014,.099],[side*.093,.175,.088]],.009);
      box(pack,darkMetal,side*.1,-.002,.106,.027,.039,.009);
      box(pack,braid,side*.1,-.002,.112,.013,.019,.004);
    }
    loft(pack,lining,[[.229,.151,.057],[.278,.153,.058],[.293,.133,.045]],{segments:12,power:.73});
    for(const side of[-1,1])tube(pack,leather,[[side*.105,.222,-.018],[side*.108,.296,.025],[side*.105,.23,.076]],.007);
    // Real coiled rope sits against the pack rather than floating behind it.
    for(let i=0;i<(hero?5:3);i++){
      const coil=ring(pack,braid,0,-.029,.113+i*.006,.092-i*.002,.0045);coil.scale.y=1.24;
    }
    tube(pack,leather,[[-.022,.106,.123],[0,.079,.143],[.022,.106,.123]],.008);
    tube(hips,braid,[[.133,.041,.103],[.183,-.025,.057],[.164,-.088,-.016]],.005);
    const hardware=part(hips,'Wayfarer climbing hardware',.177,-.052,-.025);
    for(let i=0;i<2;i++){
      const clip=ring(hardware,trim,i*.018,-i*.03,0,.026,.0042,Math.PI*1.78);clip.scale.y=1.46;clip.rotation.z=-.2+i*.4;
      rod(hardware,darkMetal,[i*.018+.018,-i*.03+.023,0],[i*.018+.025,-i*.03-.012,0],.0035);
    }
    secondary.push({object:hardware,x:.02,z:-.06,idle:.01,run:.045,phase:.8});
    for(const {side,shoulder,elbow,hand}of arms){
      panel(shoulder,orange,side*.025,-.1,-.074,[[-.031,.035],[.031,.035],[.033,-.029],[-.033,-.029]],.006);
      rod(shoulder,braid,[-.018+side*.025,-.086,-.083],[.018+side*.025,-.086,-.083],.0017);
      panel(elbow,lining,0,-.072,.062,[[-.044,.06],[.044,.06],[.038,-.067],[-.038,-.067]],.008);
      loft(elbow,lining,[[-.19,.05,.046],[-.235,.044,.04]],{segments:14});
      tube(elbow,braid,[[-.038,-.212,-.025],[0,-.218,-.05],[.038,-.212,-.025]],.0031);
      panel(hand,leather,0,-.033,-.032,[[-.028,-.022],[.028,-.022],[.032,.02],[-.032,.02]],.007);
      if(side<0){
        ell(elbow,darkMetal,0,-.164,-.058,.028,.029,.012);
        ell(elbow,glacier,0,-.164,-.069,.022,.023,.004);
        rod(elbow,braid,[0,-.164,-.076],[.011,-.153,-.076],.0018);
      }
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,lining,side*.025,-.18,-.101,[[-.052,.071],[.052,.071],[.047,-.076],[-.047,-.076]],.009);
      panel(knee,leather,0,-.016,-.073,[[-.049,.041],[.049,.041],[.051,-.037],[.027,-.064],[-.027,-.064],[-.051,-.037]],.011);
      loft(knee,fabric,[[-.195,.068,.06],[-.29,.055,.052],[-.372,.043,.042]],{segments:14});
      tube(knee,orange,[[side*.052,-.212,-.025],[side*.046,-.327,-.029]],.004);
      ell(ankle,leather,0,-.007,-.055,.057,.039,.078);
      box(ankle,darkMetal,0,-.025,-.117,.094,.021,.013);
      for(const xx of[-.04,.04])box(ankle,trim,xx,-.027,-.097,.012,.015,.025);
      tube(ankle,braid,[[-.032,.021,-.042],[.031,.014,-.06],[-.03,.008,-.079],[.025,.001,-.094]],.0021);
    }
    group.userData.silhouette='storm-hood-goggles / orange-expedition-pack / cream-rope-coil';
  }else if(def.style==='scullion'){
    const apron=material('oilcloth apron','#27494a',{roughness:.68,texture:'cloth'}),ivory=material('chef linen','#c9bea6',{roughness:.9,texture:'cloth'});
    loft(head,darkMetal,[[.01,.064,.061],[.11,.081,.076],[.23,.073,.063],[.28,.036,.033]],{segments:20});
    ell(head,ceramic,0,.115,-.082,.074,.096,.044);
    ell(head,ceramic,0,.058,-.125,.046,.035,.06);
    ell(head,trim,0,.057,-.182,.017,.012,.009);
    for(const side of[-1,1]){
      ell(head,ceramic,side*.078,.236,.001,.046,.055,.019);
      ell(head,leather,side*.078,.239,-.018,.032,.041,.005);
      ell(head,lens,side*.033,.151,-.12,.023,.012,.006);
      for(let j=0;j<3;j++)tube(head,trim,[[side*.036,.07-j*.009,-.144],[side*.085,.076-j*.013,-.144],[side*.13,.09-j*.023,-.125]],.0013);
      strap(chest,[[side*.1,.43,-.11],[side*.13,.19,-.145],[side*.12,.01,-.13]],.013);
      loft(arms.find(a=>a.side===side).elbow,ivory,[[-.17,.052,.047],[-.225,.048,.042],[-.25,.04,.037]]);
    }
    panel(chest,apron,0,.015,-.145,[[-.135,-.08],[.135,-.08],[.145,.27],[.09,.4],[-.09,.4],[-.145,.27]],.015);
    for(const side of[-1,1])articulatedTail('split kitchen apron '+side,side*.07,-.04,-.1,[[-.067,.03],[.067,.03],[.065,-.32],[-.065,-.3]],apron);
    panel(chest,ivory,0,.14,-.164,[[-.076,-.055],[.076,-.055],[.076,.035],[-.076,.035]],.007);
    for(const side of[-1,1])studs(chest,[[side*.072,.2,-.164],[side*.072,.29,-.164]],trim,.005);
    const cap=part(head,'folded kitchen cap',0,.263,.005);loft(cap,ivory,[[0,.078,.067],[.035,.085,.07],[.08,.079,.065],[.102,.025,.03]],{segments:16,power:.8});
    const tools=part(hips,'copper utensil belt',.18,-.02,.06);ring(tools,trim,0,0,0,.027,.004);
    rod(tools,trim,[0,-.025,0],[0,-.16,0],.005);ell(tools,trim,0,-.19,0,.022,.032,.008);
    rod(tools,darkMetal,[.035,-.025,0],[.035,-.14,0],.006);box(tools,trim,.035,-.17,0,.034,.05,.007);
    secondary.push({object:tools,x:0,z:0,idle:.015,run:.13,phase:.7});
    group.userData.silhouette='porcelain-rat-mask / folded-chef-cap / split-apron';
  }else if(def.style==='cinder'){
    const char=material('scorched mantle','#3e3b36',{roughness:.98,texture:'cloth'});
    const ash=material('ceramic armour','#a7a197',{roughness:.45,metalness:.03});
    // A narrow mortuary face framed by a large asymmetrical shoulder mantle.
    loft(head,darkMetal,[[.012,.081,.076],[.07,.098,.084],[.19,.093,.08],[.275,.052,.054],[.295,.006,.01]],{segments:12,power:.85});
    panel(head,ash,0,.02,-.102,[[-.039,0],[-.079,.065],[-.075,.183],[-.038,.239],[.037,.239],[.078,.176],[.071,.065],[.032,0]],.015);
    for(const side of [-1,1]){const eye=box(head,lens,side*.036,.174,-.118,.049,.014,.009);eye.rotation.z=side*-.11;box(head,light,side*.035,.173,-.124,.03,.003,.004);}
    tube(head,darkMetal,[[-.024,.259,-.123],[.009,.221,-.125],[-.005,.182,-.125],[.022,.145,-.124],[.012,.111,-.125],[.031,.069,-.121]],.0028);
    tube(head,light,[[.01,.215,-.128],[.004,.18,-.128],[.024,.145,-.128]],.0016);
    panel(chest,ash,0,.055,-.13,[[-.122,0],[-.172,.13],[-.19,.285],[-.123,.34],[.123,.34],[.19,.285],[.172,.13],[.122,0]],.014);
    panel(chest,darkMetal,0,.073,-.15,[[-.085,0],[-.11,.13],[-.07,.25],[0,.285],[.07,.25],[.11,.13],[.085,0]],.012);
    for(let i=0;i<4;i++)tube(chest,trim,[[-.055,.125+i*.037,-.167],[0,.142+i*.037,-.167],[.055,.125+i*.037,-.167]],.0025);
    const mantle=part(chest,'asymmetric pilgrim mantle',-.09,.4,.025);
    panel(mantle,char,0,0,.045,[[-.23,.02],[-.19,-.12],[-.16,-.33],[-.07,-.43],[.01,-.29],[.08,-.33],[.15,-.1],[.09,.05]],.021);
    panel(mantle,trim,0,0,.071,[[-.23,.02],[-.21,-.025],[.1,.015],[.09,.05]],.004);
    secondary.push({object:mantle,x:.03,z:-.04,idle:.01,run:.04,phase:.6});
    for(const {side,shoulder,elbow,hand}of arms){
      ell(shoulder,side<0?ash:darkMetal,side*.017,-.035,-.009,.095,.076,.091,true);
      for(let i=0;i<3;i++)panel(elbow,ash,0,-.05-i*.047,-.061,[[-.05,-.025],[.05,-.025],[.045,.019],[-.045,.019]],.011);
      panel(hand,ash,0,-.035,-.03,[[-.029,-.026],[.029,-.026],[.034,.016],[0,.034],[-.034,.016]],.009);
    }
    for(const {side,hip,knee}of legs){
      panel(hip,darkMetal,0,-.11,-.103,[[-.068,.06],[.068,.06],[.058,-.14],[-.058,-.14]],.01);
      panel(knee,ash,0,0,-.077,[[-.061,.033],[.061,.033],[.071,-.045],[0,-.097],[-.071,-.045]],.014);
      panel(knee,darkMetal,0,-.16,-.067,[[-.05,.045],[.05,.045],[.035,-.16],[-.035,-.16]],.012);
      articulatedTail('scorched tabard '+side,side*.067,-.015,.09,[[-.062,0],[.062,0],[.066,-.28],[.024,-.325],[-.042,-.302]],char);
    }
    group.userData.silhouette='ceramic-mask / single-mantle / segmented-armour';
  }else if(def.style==='diver'){
    const brass=material('weathered brass','#a78e59',{roughness:.42,metalness:.78});
    const canvas=material('reinforced pressure suit','#78817a',{roughness:.9,texture:'cloth'});
    // The shoulders carry the helmet yoke; the round face is actual recessed glass.
    loft(chest,brass,[[.38,.24,.14],[.435,.251,.15],[.48,.158,.119],[.51,.121,.104]],{power:.8});
    ell(head,brass,0,.125,.012,.16,.18,.145);
    const bezel=ring(head,darkMetal,0,.135,-.127,.105,.016);bezel.scale.y=1.07;
    const port=ell(head,lens,0,.135,-.141,.096,.103,.025);
    for(const x of [-.055,0,.055])rod(head,brass,[x,.062,-.166],[x,.207,-.165],.0045);
    rod(head,brass,[-.086,.135,-.167],[.086,.135,-.167],.0045);
    ring(head,brass,0,.135,-.163,.098,.008).scale.y=1.06;
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ell(head,trim,Math.cos(a)*.12,.135+Math.sin(a)*.126,-.13,.006,.006,.004);}
    for(const side of [-1,1]){
      const vent=ring(head,brass,side*.147,.13,.01,.042,.008);vent.rotation.y=Math.PI/2;
      ell(head,darkMetal,side*.15,.13,.01,.012,.037,.037);
      tube(chest,darkMetal,[[side*.12,.49,-.07],[side*.22,.39,-.11],[side*.24,.21,-.13],[side*.17,.1,-.13]],.025);
      for(let i=0;i<8;i++){const r=ring(chest,brass,side*(.2+Math.sin(i/7*Math.PI)*.04),.35-i*.028,-.132,.027,.003);r.rotation.x=Math.PI/2;}
      loft(chest,canvas,[[.035,.195,.126],[.15,.218,.139],[.3,.239,.14],[.37,.228,.132]],{power:.8});
      strap(chest,[[side*.15,.05,-.14],[side*.16,.31,-.147],[side*.17,.4,.09],[side*.12,.05,.13]],.018);
      const cylinder=part(chest,'air cylinder '+side,side*.105,.16,.2);
      ell(cylinder,darkMetal,0,.015,0,.069,.175,.068);loft(cylinder,brass,[[-.095,.072,.07],[-.075,.072,.07],[.115,.072,.07],[.135,.072,.07]]);
      rod(cylinder,brass,[0,.15,0],[0,.21,0],.014);ring(cylinder,brass,0,.2,-.018,.026,.004);
    }
    const gauge=ring(chest,brass,.08,.3,-.163,.037,.006);ell(chest,ceramic,.08,.3,-.166,.03,.03,.004);rod(chest,darkMetal,[.08,.3,-.173],[.092,.316,-.173],.0019);
    for(const {side,shoulder,elbow}of arms){
      for(let i=0;i<3;i++)loft(shoulder,canvas,[[-.04-i*.052,.09,.084],[-.073-i*.052,.087,.081]]);
      loft(elbow,brass,[[-.12,.064,.059],[-.175,.057,.053]]);
      panel(elbow,darkMetal,0,-.065,-.068,[[-.045,-.04],[.045,-.04],[.052,.035],[-.052,.035]],.012);
    }
    for(const {hip,knee,ankle}of legs){
      loft(knee,canvas,[[-.075,.079,.074],[-.12,.078,.072],[-.26,.061,.057],[-.32,.054,.05]]);
      panel(knee,brass,0,-.015,-.078,[[-.059,.055],[.059,.055],[.057,-.06],[-.057,-.06]],.011);
      ell(ankle,brass,0,-.013,-.09,.054,.032,.054);box(ankle,darkMetal,0,-.041,-.04,.118,.014,.2);
    }
    group.userData.silhouette='round-pressure-helmet / cylinder-backpack / padded-suit';
  }else if(def.style==='seraph'){
    const silver=material('brushed dark chrome','#737e89',{roughness:.29,metalness:.82});
    // The halo is broken into physical arcs and held behind the shoulders.
    const halo=part(chest,'supported broken halo',0,.58,.16);
    for(const side of [-1,1])rod(chest,darkMetal,[side*.12,.26,.13],[side*.16,.69,.16],.012);
    for(const [angle,arc]of [[.12,1.19],[1.61,1.31],[3.32,1.04],[4.7,1.2]]){const r=ring(halo,silver,0,0,0,.258,.014,arc);r.rotation.z=angle;const e=ring(halo,light,0,0,-.008,.258,.003,arc-.08);e.rotation.z=angle+.04;}
    loft(head,silver,[[.012,.062,.067],[.095,.103,.082],[.21,.077,.069],[.29,.022,.039],[.325,.006,.011]],{segments:8,power:.85});
    panel(head,ceramic,0,.025,-.1,[[-.032,0],[-.073,.09],[-.056,.21],[0,.27],[.056,.21],[.073,.09],[.032,0]],.012);
    for(const side of [-1,1]){
      panel(head,lens,side*.027,.134,-.118,[[-.022,-.01],[.022,-.01],[.017,.035],[-.017,.035]],.005).rotation.z=side*-.26;
      tube(head,light,[[side*.012,.177,-.128],[side*.043,.164,-.128],[side*.054,.141,-.125]],.0028);
      panel(chest,ceramic,side*.075,.12,-.132,[[-.064,0],[.064,.018],[.085,.19],[.02,.29],[-.065,.24]],.015).rotation.z=side*-.08;
      tube(chest,light,[[side*.02,.17,-.154],[side*.062,.27,-.16],[side*.04,.38,-.149]],.0028);
      for(let i=0;i<3;i++){
        const blade=part(chest,'folded mantle blade '+side+' '+i,side*(.135+i*.047),.4-i*.018,.14+i*.019);
        panel(blade,i===1?silver:ceramic,0,0,0,[[-.018,.028],[.018,.052],[side*.105,-.19],[side*.088,-.34],[-.018,-.12]],.012);
        blade.rotation.z=side*(.12+i*.09);secondary.push({object:blade,x:.03+i*.04,z:blade.rotation.z,idle:.005,run:.017,phase:i});
      }
    }
    for(const {side,shoulder,elbow,hand}of arms){
      ell(shoulder,ceramic,side*.025,-.016,-.014,.092,.057,.082,true);
      panel(shoulder,silver,0,-.125,-.075,[[-.054,.065],[.054,.065],[.04,-.09],[-.04,-.09]],.011);
      panel(elbow,ceramic,0,-.095,-.061,[[-.048,.09],[.048,.09],[.035,-.105],[-.035,-.105]],.014);
      tube(elbow,light,[[0,-.045,-.08],[0,-.15,-.075]],.0025);
      panel(hand,silver,0,-.035,-.028,[[-.031,-.025],[.031,-.025],[.029,.024],[-.029,.024]],.01);
    }
    for(const {hip,knee,ankle}of legs){
      panel(hip,ceramic,0,-.15,-.102,[[-.062,.09],[.062,.09],[.048,-.14],[-.048,-.14]],.015);
      ell(knee,silver,0,0,-.07,.065,.058,.027,true);
      panel(knee,ceramic,0,-.195,-.065,[[-.045,.105],[.045,.105],[.032,-.145],[-.032,-.145]],.012);
      rod(knee,light,[0,-.11,-.083],[0,-.27,-.075],.0025);ell(ankle,ceramic,0,-.012,-.088,.053,.032,.052,true);
    }
    group.userData.silhouette='split-crown / bracketed-halo / folded-six-blade-mantle';
  }else if(def.style==='automaton'){
    const patch=material('faded canvas patches','#596b68',{roughness:.94,texture:'cloth'});
    loft(head,wood,[[.005,.075,.07],[.05,.116,.09],[.2,.119,.093],[.27,.086,.075],[.292,.036,.038]],{segments:12,power:.6});
    panel(head,ceramic,-.028,.04,-.107,[[-.061,.01],[.024,0],[.025,.204],[-.055,.21],[-.082,.163]],.011);
    panel(head,wood,.043,.043,-.108,[[-.036,0],[.049,.018],[.068,.115],[.045,.206],[-.036,.201]],.012);
    for(const side of [-1,1]){ell(head,darkMetal,side*.045,.178,-.127,.029,.031,.007);ring(head,trim,side*.045,.178,-.134,.025,.003);box(head,trim,side*.045,.178,-.14,.004,.035,.003);}
    box(head,darkMetal,0,.091,-.126,.115,.016,.006);
    for(let i=0;i<7;i++)rod(head,trim,[-.048+i*.016,.077,-.134],[-.044+i*.016,.102,-.134],.002);
    for(let i=0;i<5;i++)rod(head,darkMetal,[-.006,.052+i*.041,-.131],[.012,.057+i*.041,-.131],.002);
    ell(head,wood,-.125,.15,.007,.025,.043,.04);ell(head,darkMetal,.125,.15,.007,.026,.036,.033);
    for(const side of [-1,1]){
      panel(chest,side<0?patch:leather,side*.077,.065,-.135,[[-.072,0],[.072,0],[.079,.28],[-.067,.30]],.014);
      seam(chest,[[side*.015,.074,-.155],[side*.017,.337,-.155]],.0026);
      for(let i=0;i<6;i++)rod(chest,stitch,[side*.01,.088+i*.041,-.156],[side*.024,.1+i*.041,-.156],.0017);
      strap(chest,[[side*.13,.05,-.14],[side*.15,.4,-.09],[side*.11,.38,.15],[side*.1,.05,.145]],.016);
    }
    for(const y of [.14,.23,.32]){ell(chest,wood,.027,y,-.157,.015,.015,.005);studs(chest,[[.023,y,-.164],[.031,y,-.164]],darkMetal,.0018);}
    const key=part(chest,'winding key',0,.24,.2);rod(key,darkMetal,[0,0,0],[0,0,.115],.023);
    const wing=ring(key,trim,.048,0,.127,.042,.01);wing.scale.y=.69;const wing2=ring(key,trim,-.048,0,.127,.042,.01);wing2.scale.y=.69;box(key,trim,0,0,.127,.08,.022,.015);
    secondary.push({object:key,x:0,z:0,idle:0,run:.015,phase:1.4});
    for(const {side,shoulder,elbow,hand}of arms){
      if(side<0){
        ell(shoulder,wood,0,-.04,-.008,.095,.086,.087);
        loft(elbow,ceramic,[[.012,.084,.075],[-.08,.089,.08],[-.17,.067,.062],[-.24,.047,.042]],{segments:12,power:.82});
        panel(hand,ceramic,0,-.039,-.032,[[-.043,-.03],[.043,-.03],[.045,.033],[-.045,.033]],.018);
      }else{
        panel(shoulder,patch,0,-.14,-.08,[[-.055,.05],[.055,.05],[.05,-.07],[-.05,-.07]],.008);
        for(let i=0;i<4;i++)rod(elbow,stitch,[-.033,-.04-i*.036,-.066],[.033,-.032-i*.036,-.066],.0018);
      }
      ring(elbow,darkMetal,side*.059,0,0,.036,.008).rotation.y=Math.PI/2;
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,side<0?patch:leather,0,-.18,-.098,[[-.063,.07],[.063,.07],[.056,-.08],[-.056,-.08]],.009);
      ell(knee,side<0?wood:ceramic,0,0,-.063,.067,.061,.033,true);
      for(let i=0;i<3;i++)loft(knee,side<0?wood:leather,[[-.09-i*.065,.075-i*.006,.066-i*.006],[-.13-i*.065,.072-i*.006,.063-i*.006]]);
      ell(ankle,wood,0,-.01,-.09,.055,.032,.053);
    }
    group.userData.silhouette='carved-mask / porcelain-gauntlet / winding-key';
  }else if(def.style==='porter'){
    const feather=material('blued feather steel','#404b57',{roughness:.47,metalness:.55});
    loft(head,darkMetal,[[.015,.066,.065],[.11,.088,.078],[.225,.086,.073],[.287,.044,.042]],{segments:12});
    for(const side of [-1,1]){
      const e=ell(head,lens,side*.044,.172,-.082,.033,.026,.02);e.rotation.z=side*-.19;
      ring(head,trim,side*.044,.172,-.101,.029,.003).scale.y=.79;
      panel(head,feather,side*.067,.035,-.077,[[-.025,.01],[.026,.012],[.04,.08],[.022,.129],[-.025,.1]],.01).rotation.y=side*.22;
    }
    const beak=part(head,'raven respirator',0,.13,-.075);
    loft(beak,darkMetal,[[-.098,.009,.013,0,-.12],[-.063,.025,.054,0,-.085],[-.013,.043,.085,0,-.04],[.035,.04,.041,0,-.014]],{segments:8,power:.8});
    tube(beak,trim,[[0,.018,-.072],[0,-.027,-.126],[0,-.08,-.145]],.0028);
    for(const side of [-1,1])for(let i=0;i<3;i++)rod(head,darkMetal,[side*.042,.067+i*.012,-.091],[side*.062,.074+i*.012,-.091],.0025);
    for(const side of [-1,1]){
      panel(chest,fabric,side*.063,.025,-.13,[[-.085,-.09],[.085,-.09],[.108,.31],[.02,.414],[-.088,.32]],.015);
      panel(chest,leather,side*.052,.28,-.152,[[-.03,-.12],[.045,.08],[-.019,.163],[-.053,.09]],.01).rotation.z=side*.21;
      articulatedTail('tailored coat tail '+side,side*.09,-.04,.067,[[-.087,.04],[.087,.04],[.105,-.33],[.077,-.47],[-.079,-.44]],fabric);
      tube(chest,trim,[[side*.13,.09,-.153],[side*.18,.11,-.15]],.0018);
    }
    for(const y of [.08,.16,.24])studs(chest,[[.035,y,-.157]],trim,.006);
    for(let i=0;i<6;i++){
      const blade=part(chest,'raven shoulder feather '+i,-.15-i*.023,.4-i*.013,.045+i*.013);
      panel(blade,feather,0,0,0,[[-.019,.035],[.02,.026],[-.045,-.1],[-.075,-.145],[-.05,-.06]],.006);
      blade.rotation.z=-.12;secondary.push({object:blade,x:.04,z:-.12,idle:.006,run:.018,phase:i*.4});
    }
    strap(chest,[[.14,.42,-.09],[.07,.25,-.151],[-.12,.01,-.14]],.013);
    const keys=part(hips,'keeper keys',.18,-.02,-.025);ring(keys,trim,0,0,0,.031,.004);
    for(let i=0;i<3;i++){const x=(i-1)*.018;ring(keys,trim,x,-.034,0,.012,.003);rod(keys,trim,[x,-.046,0],[x,-.11-i*.012,0],.003);box(keys,trim,x+.007,-.1-i*.012,0,.016,.005,.006);}
    secondary.push({object:keys,x:0,z:0,idle:.018,run:.15,phase:1.1});
    for(const {elbow,hand}of arms){panel(elbow,feather,0,-.115,-.057,[[-.047,.075],[.047,.075],[.037,-.084],[-.037,-.084]],.009);panel(hand,feather,0,-.035,-.029,[[-.028,-.024],[.028,-.024],[.031,.02],[-.031,.02]],.009);}
    for(const {knee,ankle}of legs){loft(knee,leather,[[-.08,.071,.065],[-.26,.057,.052],[-.365,.042,.041]]);tube(knee,trim,[[.035,-.105,-.063],[.027,-.3,-.047]],.002);ell(ankle,leather,0,-.01,-.09,.054,.032,.052);}
    group.userData.silhouette='raven-respirator / long-tailored-coat / feather-shoulder';
  }else if(def.style==='encore'){
    const velvet=material('oxblood velvet',def.cloth,{roughness:.83,texture:'cloth'});
    const white=material('aged porcelain','#d8d0b9',{roughness:.33,clearcoat:.24});
    const ruff=material('pleated collar','#b3aa96',{roughness:.8,texture:'cloth'});
    loft(head,darkMetal,[[.01,.065,.065],[.1,.083,.072],[.22,.078,.07],[.278,.035,.035]],{segments:16});
    panel(head,white,-.014,.02,-.094,[[-.027,0],[-.065,.06],[-.07,.177],[-.035,.238],[.015,.249],[.041,.21],[.017,.171],[.041,.128],[.014,.077],[.027,.028]],.013);
    panel(head,velvet,.052,.024,-.095,[[-.031,0],[.022,.034],[.039,.107],[.031,.182],[-.006,.243],[-.032,.204],[-.006,.166],[-.032,.122],[-.006,.076]],.012);
    for(const side of [-1,1]){const eye=ell(head,lens,side*.035,.17,-.113,.026,.012,.005);eye.rotation.z=side*.18;}
    tube(head,darkMetal,[[-.025,.078,-.112],[0,.067,-.116],[.025,.08,-.113]],.0024);
    tube(head,trim,[[.015,.259,-.114],[.033,.222,-.116],[.012,.177,-.119],[.035,.138,-.116],[.012,.094,-.116],[.026,.05,-.115]],.0028);
    // Folded ruff segments surround the neck, but leave the face readable.
    for(let i=0;i<14;i++){
      const a=i/14*Math.PI*2,x=Math.cos(a)*.113,z=Math.sin(a)*.09;
      const fold=part(chest,'ruff fold '+i,x,.465,z);panel(fold,ruff,0,0,0,[[-.017,-.016],[.017,-.016],[.026,.047],[0,.07],[-.026,.047]],.012);fold.rotation.y=-a+Math.PI/2;fold.rotation.x=.25;
    }
    for(const side of [-1,1]){
      panel(chest,velvet,side*.072,.018,-.127,[[-.078,-.061],[.077,-.048],[.089,.279],[.03,.39],[-.073,.28]],.014);
      const lapel=panel(chest,trim,side*.055,.29,-.15,[[-.025,-.1],[.035,.076],[-.01,.13],[-.043,.055]],.007);lapel.rotation.z=side*.25;
      articulatedTail('velvet coat tail '+side,side*.068,-.025,.089,[[-.065,.025],[.067,.025],[.087,-.28],[.026,-.39],[-.052,-.34]],velvet);
      const pauldron=part(chest,'stage epaulette '+side,side*(chestWidth+.01),.395,.005);ell(pauldron,velvet,side*.02,0,0,.105,.052,.087);
      for(let i=0;i<5;i++)rod(pauldron,trim,[side*(.03+i*.014),-.026,-.05],[side*(.03+i*.014),-.1-i*.006,-.05],.0026);
    }
    for(const y of [.08,.16,.24])studs(chest,[[-.025,y,-.153],[.025,y,-.153]],trim,.006);
    strap(chest,[[-.13,.41,-.105],[-.08,.29,-.154],[.11,.02,-.142]],.01);
    const brooch=ring(chest,trim,-.075,.29,-.165,.019,.004);ell(chest,lens,-.075,.29,-.168,.011,.011,.004);
    for(const {side,shoulder,elbow,hand}of arms){
      for(let i=0;i<3;i++)tube(shoulder,trim,[[side*.05,-.05-i*.038,-.05],[side*.055,-.071-i*.038,-.05]],.002);
      loft(elbow,ruff,[[-.19,.047,.043],[-.233,.045,.04],[-.251,.037,.034]]);seam(elbow,[[-.03,-.198,-.039],[.03,-.198,-.039]],.002);
      for(let i=0;i<3;i++)rod(hand,trim,[(i-1)*.012,-.016,-.027],[(i-1)*.012,-.056,-.03],.0014);
    }
    for(const {side,hip,knee,ankle}of legs){tube(hip,trim,[[side*.087,-.03,0],[side*.077,-.29,0]],.003);tube(knee,trim,[[side*.066,-.06,0],[side*.041,-.31,0]],.0025);panel(ankle,trim,0,.005,-.045,[[-.024,-.01],[.024,-.01],[.024,.012],[-.024,.012]],.005);}
    group.userData.silhouette='split-opera-mask / pleated-ruff / velvet-tails';
  }else if(def.style==='botanist'){
    const glass=material('faceted mire glass','#4b7770',{roughness:.23,metalness:.28,clearcoat:.7});
    const silver=material('oxidised fern silver','#a2b4a2',{roughness:.49,metalness:.65});
    const wax=material('waxed specimen coat','#3d5149',{roughness:.68,texture:'cloth'});
    const seed=material('sealed living specimen','#a1b978',{roughness:.4,emissive:'#93a65f',intensity:.16});
    // A ridged, fully enclosed glass head is framed like the conservatory.
    loft(head,darkMetal,[[.005,.057,.057],[.085,.084,.075],[.2,.077,.069],[.278,.018,.026]],{segments:10,power:.8});
    panel(head,glass,0,.025,-.095,[[-.033,-.007],[-.077,.066],[-.068,.172],[0,.249],[.068,.172],[.077,.066],[.033,-.007]],.023);
    for(const side of [-1,1]){
      tube(head,silver,[[0,.271,-.113],[side*.066,.199,-.119],[side*.076,.091,-.122],[side*.032,.016,-.115]],.004);
      tube(head,silver,[[side*.062,.2,-.124],[0,.119,-.129],[side*.067,.067,-.125]],.0025);
      box(head,lens,side*.033,.166,-.123,.039,.012,.006).rotation.z=side*-.16;
      const filter=part(head,'seed filter '+side,side*.074,.05,-.055);
      ell(filter,darkMetal,0,0,0,.025,.034,.033);ring(filter,trim,0,0,-.031,.022,.004);
      for(let j=0;j<3;j++)box(filter,lining,0,(j-1)*.01,-.036,.029,.003,.002);
      strap(chest,[[side*.14,.43,-.075],[side*.12,.2,-.136],[side*.08,.015,-.119]],.012);
      panel(chest,wax,side*.08,.015,-.126,[[-.08,-.05],[.079,-.05],[.106,.28],[.027,.4],[-.078,.31]],.013);
      articulatedTail('divided conservator skirt '+side,side*.091,-.04,.061,[[-.081,.035],[.087,.035],[.087,-.24],[.041,-.35],[-.075,-.29]],wax);
    }
    // Each leaf is a solid ribbed plate with a small independent shoulder sway.
    for(let i=0;i<7;i++){
      const fern=part(chest,'silver fern mantle '+i,-.15-i*.024,.419-i*.012,.018+i*.012);
      panel(fern,silver,0,0,0,[[-.014,.026],[.018,.031],[.046,-.02],[.017,-.035],[.042,-.065],[.01,-.083],[.02,-.115],[-.011,-.148],[-.026,-.075]],.005);
      rod(fern,darkMetal,[0,.022,-.004],[-.009,-.139,-.004],.002);
      secondary.push({object:fern,x:.06,z:-.14,idle:.009,run:.035,phase:i*.36});
    }
    const samples=part(chest,'sealed specimen rack',.115,.06,-.16);
    box(samples,darkMetal,0,.05,.025,.13,.16,.044);
    for(let i=0;i<3;i++){
      const x=(i-1)*.039;loft(samples,glass,[[0,.012,.012,x,0],[.105,.012,.012,x,0]],{segments:10});
      ell(samples,seed,x,.049,-.011,.008,.029,.006);
      box(samples,trim,x,.113,0,.029,.019,.029);box(samples,trim,x,-.008,0,.027,.011,.027);
    }
    const caseBack=part(chest,'pressed plant archive',.025,.245,.135);
    box(caseBack,darkMetal,0,0,.02,.20,.26,.065);box(caseBack,wax,0,0,.061,.177,.232,.019);
    for(const y of [-.082,.082])box(caseBack,trim,0,y,.073,.185,.012,.01);
    for(const {side,elbow,hand}of arms){
      for(let i=0;i<4;i++)panel(elbow,side<0?silver:glass,0,-.055-i*.042,-.064,[[-.042,.019],[.042,.019],[.035,-.026],[0,-.038],[-.035,-.026]],.007);
      tube(hand,silver,[[-.025,-.012,-.032],[0,-.057,-.039],[.025,-.012,-.032]],.0025);
      for(let i=0;i<3;i++)rod(elbow,trim,[side*.042,-.055-i*.05,-.032],[side*.049,-.09-i*.05,-.032],.002);
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,wax,side*.038,-.18,-.095,[[-.046,.06],[.046,.06],[.04,-.083],[-.04,-.083]],.015);
      panel(knee,silver,0,-.005,-.071,[[-.054,.045],[.054,.045],[.057,-.025],[0,-.07],[-.057,-.025]],.012);
      for(let i=0;i<3;i++)tube(knee,trim,[[side*.051,-.12-i*.06,-.033],[side*.051,-.14-i*.06,-.034]],.003);
      box(ankle,trim,0,-.005,-.116,.075,.014,.018);
    }
    group.userData.silhouette='faceted-conservator-mask / silver-fern-mantle / specimen-rack';
  }else if(def.style==='warden'){
    const ivory=material('worn ivory impact shell','#d5cfb9',{roughness:.5,metalness:.14,texture:'grain'});
    const safety=material('rescue stripe enamel','#efbd70',{roughness:.55,metalness:.18});
    const seal=material('sealed pressure joints','#1b2c33',{roughness:.72});
    // A low rectangular rescue helmet differs from the old round diving helm.
    loft(head,seal,[[.005,.067,.068],[.1,.092,.08],[.235,.09,.078],[.274,.055,.053]],{segments:8,power:.7});
    panel(head,ivory,0,.011,-.079,[[-.055,0],[-.094,.053],[-.098,.208],[-.067,.269],[.066,.269],[.098,.208],[.094,.053],[.055,0]],.014);
    panel(head,lens,0,.121,-.102,[[-.077,-.03],[.077,-.03],[.083,.051],[.055,.087],[-.055,.087],[-.083,.051]],.022);
    box(head,darkMetal,0,.166,-.132,.008,.081,.008);
    for(const side of [-1,1]){
      box(head,safety,side*.067,.248,-.097,.028,.012,.012);
      box(head,darkMetal,side*.105,.121,0,.027,.093,.069);
      for(let j=0;j<3;j++)box(head,seal,side*.045,.046+j*.011,-.098,.044,.004,.012);
      tube(head,trim,[[side*.082,.104,-.076],[side*.11,.064,-.024],[side*.10,-.014,.027]],.008);
      panel(chest,ivory,side*.089,.112,-.132,[[-.075,-.02],[.075,-.02],[.087,.17],[.035,.293],[-.058,.25]],.022);
      box(chest,safety,side*.094,.295,-.16,.096,.013,.007).rotation.z=side*.11;
      strap(chest,[[side*.145,.432,-.075],[side*.165,.26,-.135],[side*.12,.016,-.129]],.013);
      box(chest,darkMetal,side*.135,.149,-.16,.037,.046,.018);
      for(const y of [.045,.085])box(hips,trim,side*.135,y,-.111,.029,.009,.019);
    }
    const shoulderShield=part(chest,'asymmetric spill shield',-.24,.40,.015);
    panel(shoulderShield,ivory,0,0,0,[[-.092,-.11],[.065,-.105],[.095,.017],[.04,.085],[-.07,.068]],.045);
    shoulderShield.rotation.y=-.22;secondary.push({object:shoulderShield,x:.045,z:.13,idle:.005,run:.018,phase:.4});
    for(let i=0;i<3;i++)box(shoulderShield,safety,-.032+i*.034,-.055,-.026,.014,.057,.009).rotation.z=.25;
    const harness=part(chest,'counterweight rescue harness',0,.233,.152);
    box(harness,darkMetal,0,0,0,.23,.28,.083);
    for(const side of [-1,1]){
      box(harness,ivory,side*.083,0,.055,.065,.24,.044);
      rod(harness,trim,[side*.104,-.085,.087],[side*.104,.085,.087],.01);
      ring(harness,trim,side*.084,.118,.082,.023,.004);
      tube(chest,seal,[[side*.105,.08,.199],[side*.17,.0,.132],[side*.18,.04,-.028]],.012);
    }
    const hook=part(hips,'tether hook',.19,-.017,.014);ring(hook,trim,0,0,0,.034,.007).scale.y=1.4;box(hook,seal,0,.045,0,.025,.039,.02);
    secondary.push({object:hook,x:0,z:.08,idle:.012,run:.1,phase:2});
    for(const {side,shoulder,elbow,hand}of arms){
      panel(elbow,ivory,0,-.106,-.062,[[-.047,.076],[.047,.076],[.049,-.064],[.029,-.107],[-.029,-.107],[-.049,-.064]],.02);
      for(const x of [-.033,.033])rod(elbow,trim,[x,-.039,-.082],[x,-.172,-.082],.006);
      for(let j=0;j<3;j++)box(elbow,seal,0,-.078-j*.031,-.089,.047,.012,.008);
      box(elbow,safety,0,-.034,-.087,.06,.012,.007);
      panel(hand,ivory,0,-.027,-.03,[[-.031,-.024],[.031,-.024],[.035,.023],[-.035,.023]],.014);
      for(let j=0;j<4;j++)ell(hand,seal,(j-1.5)*.014,-.061,-.025,.009,.008,.009);
      box(shoulder,safety,side*.062,-.11,-.038,.012,.073,.028);
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,ivory,0,-.22,-.099,[[-.066,.094],[.064,.094],[.065,-.06],[.044,-.098],[-.044,-.098],[-.065,-.06]],.019);
      ell(knee,darkMetal,0,0,-.066,.068,.062,.028);panel(knee,ivory,0,-.005,-.085,[[-.048,.04],[.048,.04],[.055,-.024],[0,-.058],[-.055,-.024]],.014);
      for(const x of [-.045,.045])rod(knee,trim,[x,-.085,-.049],[x,-.29,-.04],.006);
      for(let j=0;j<4;j++)box(knee,seal,0,-.11-j*.043,-.062,.075-j*.006,.017,.013);
      box(ankle,ivory,0,-.001,-.108,.087,.029,.05);box(ankle,safety,0,.015,-.133,.068,.008,.008);
    }
    group.userData.silhouette='rectangular-rescue-visor / asymmetric-impact-shell / counterweight-harness';
  }else if(def.style==='revenant'){
    const steel=material('tempered royal steel','#444951',{roughness:.39,metalness:.79});
    const gold=material('fractured old gold','#a08a59',{roughness:.49,metalness:.77});
    const velvet=material('torn royal crimson','#652b34',{roughness:.91,texture:'cloth'});
    const ember=material('banked court ember','#b75b44',{roughness:.51,emissive:'#b43c27',intensity:.16});
    // The coronet is part of a narrow jousting helm, not a floating halo.
    loft(head,steel,[[.007,.053,.064],[.085,.081,.085],[.205,.079,.075],[.268,.042,.044],[.286,.005,.01]],{segments:12,power:.78});
    panel(head,darkMetal,0,.018,-.105,[[-.032,0],[-.064,.068],[-.061,.182],[0,.244],[.061,.182],[.064,.068],[.032,0]],.015);
    panel(head,steel,0,.022,-.125,[[-.023,0],[-.05,.084],[0,.17],[.05,.084],[.023,0]],.011);
    for(const side of [-1,1]){
      tube(head,gold,[[side*.073,.225,-.087],[side*.056,.184,-.117],[side*.014,.158,-.14]],.004);
      box(head,lens,side*.034,.16,-.126,.052,.009,.008).rotation.z=-side*.1;
      box(head,ember,side*.035,.16,-.132,.034,.0025,.003).rotation.z=-side*.1;
      for(let i=0;i<3;i++)rod(head,lining,[side*.014,.07+i*.016,-.139],[side*.033,.077+i*.016,-.132],.0019);
    }
    const crown=part(head,'fractured coronet',0,.226,.004);crown.rotation.z=-.075;
    for(let i=0;i<7;i++){
      const angle=i/7*Math.PI*2,x=Math.sin(angle)*.087,z=Math.cos(angle)*.079;
      const tooth=part(crown,'coronet point '+i,x,0,z);tooth.rotation.y=angle;
      const height=[.075,.113,.049,.096,.064,.105,.04][i];
      panel(tooth,gold,0,0,0,[[-.034,-.012],[.034,-.012],[.023,.028],[.011,height],[-.007,height*.76],[-.019,.032]],.009);
      if(i!==2&&i!==6)panel(tooth,steel,0,.012,-.004,[[-.013,0],[.013,0],[.006,height*.54],[-.004,height*.68]],.003);
    }
    const breastplate=part(chest,'curved royal breastplate');
    panel(breastplate,steel,0,.057,-.135,[[-.114,-.015],[-.184,.131],[-.192,.261],[-.113,.354],[0,.381],[.113,.354],[.192,.261],[.184,.131],[.114,-.015]],.021);
    panel(breastplate,darkMetal,0,.069,-.162,[[-.075,0],[-.113,.145],[0,.306],[.113,.145],[.075,0]],.014);
    for(let i=0;i<5;i++){
      const y=.124+i*.043,width=.066+i*.011;
      tube(breastplate,gold,[[-width,y+.014,-.18],[0,y-.007,-.188],[width,y+.014,-.18]],.0038);
    }
    tube(breastplate,ember,[[-.011,.127,-.19],[.013,.203,-.19],[-.004,.249,-.19],[.012,.291,-.18]],.002);
    shapeAssembly(breastplate,(x,y)=>x*x*1.15-Math.sin((y-.05)/.4*Math.PI)*.012);
    const cloak=part(chest,'torn court half-cloak',-.105,.421,.157);
    panel(cloak,velvet,0,0,0,[[-.159,.016],[-.212,-.13],[-.23,-.47],[-.177,-.594],[-.137,-.538],[-.103,-.662],[-.055,-.566],[.013,-.62],[.062,-.422],[.103,-.108],[.084,.041]],.014);
    panel(cloak,gold,0,0,.016,[[-.156,.014],[-.172,-.03],[.086,-.014],[.084,.041]],.004);
    for(let i=0;i<3;i++)tube(cloak,darkMetal,[[-.11+i*.059,-.052,.018],[-.125+i*.068,-.29,.018],[-.14+i*.064,-.49,.018]],.0025);
    shapeAssembly(cloak,(x,y)=>Math.sin((x+.14)*43)*.01*Math.min(1,Math.abs(y)*8)+Math.abs(y)*.045);
    secondary.push({object:cloak,x:.07,z:-.035,idle:.008,run:.035,phase:.6});
    for(const {side,shoulder,elbow,hand}of arms){
      for(let i=0;i<3;i++){
        panel(shoulder,steel,side*.018,-.025-i*.05,-.067,[[-.082,.042],[.079,.041],[.073,-.023],[.019,-.052],[-.071,-.03]],.018);
        tube(shoulder,gold,[[-.055,-.052-i*.05,-.071],[.01,-.073-i*.05,-.072],[.061,-.052-i*.05,-.071]],.0025);
      }
      panel(elbow,steel,0,-.1,-.067,[[-.048,.095],[.048,.095],[.042,-.112],[0,-.141],[-.042,-.112]],.019);
      rod(elbow,gold,[0,-.015,-.091],[0,-.212,-.091],.0028);
      panel(hand,steel,0,-.034,-.032,[[-.03,-.029],[.03,-.029],[.036,.022],[0,.044],[-.036,.022]],.013);
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,steel,0,-.178,-.103,[[-.061,.107],[.061,.107],[.054,-.11],[.015,-.15],[-.048,-.105]],.014);
      panel(knee,steel,0,-.018,-.08,[[-.064,.042],[0,.065],[.064,.042],[.055,-.052],[0,-.095],[-.055,-.052]],.016);
      panel(knee,steel,0,-.194,-.067,[[-.05,.092],[0,.121],[.05,.092],[.037,-.151],[-.037,-.151]],.015);
      rod(knee,gold,[0,-.1,-.086],[0,-.33,-.086],.0025);
      panel(ankle,steel,0,.007,-.107,[[-.045,-.026],[.045,-.026],[.047,.018],[0,.043],[-.047,.018]],.013);
      articulatedTail('royal split tabard '+side,side*.07,-.03,-.117,[[-.066,.03],[.066,.03],[.067,-.21],[.023,-.285],[-.011,-.246],[-.058,-.275]],velvet);
    }
    group.userData.silhouette='fractured-coronet / tournament-helm / torn-royal-half-cloak';
  }else if(def.style==='illustrator'){
    const paper=material('folded archival ivory','#d5d1bc',{roughness:.75,texture:'grain'});
    const ink=material('dried black ink','#11191c',{roughness:.41,metalness:.12});
    const red=material('vermilion pencil lacquer','#b33e36',{roughness:.49,metalness:.12});
    const apron=material('charcoal drafting canvas','#474d4d',{roughness:.92,texture:'cloth'});
    // Two overlapping folded paper cheeks make a deliberate faceted face.
    loft(head,ink,[[.006,.055,.057],[.087,.083,.077],[.213,.073,.071],[.269,.04,.041]],{segments:10,power:.8});
    panel(head,paper,-.018,.027,-.101,[[-.025,0],[-.061,.074],[-.044,.184],[.01,.245],[.037,.18],[.024,.074]],.014).rotation.y=-.17;
    panel(head,paper,.032,.027,-.105,[[-.028,0],[-.023,.076],[-.033,.178],[.006,.223],[.045,.166],[.047,.066],[.018,.011]],.014).rotation.y=.15;
    tube(head,ink,[[-.051,.216,-.119],[-.018,.159,-.128],[.015,.132,-.134],[.037,.081,-.127]],.004);
    for(const side of [-1,1]){
      panel(head,ink,side*.035,.158,-.125,[[-.025,-.008],[.023,-.006],[.027,.012],[-.018,.018]],.004).rotation.z=side*-.13;
      rod(head,paper,[side*.031,.163,-.135],[side*.047,.165,-.135],.0016);
    }
    tube(head,red,[[.059,.159,-.128],[.047,.113,-.134],[.055,.094,-.127]],.0025);
    const cap=part(head,'folded illustrator cap',0,.224,.02);
    loft(cap,apron,[[.0,.093,.085],[.054,.118,.098,-.024,0],[.091,.07,.063,-.039,0],[.098,.01,.01,-.039,0]],{segments:12,power:.8});
    panel(cap,ink,.0,.007,-.109,[[-.092,0],[.073,0],[.099,-.015],[.077,-.029],[-.083,-.031],[-.113,-.013]],.025).rotation.x=-.1;
    box(cap,red,.075,.031,-.072,.013,.043,.012).rotation.z=-.35;
    for(const side of [-1,1]){
      panel(chest,apron,side*.078,.022,-.129,[[-.073,-.04],[.073,-.04],[.099,.28],[.014,.392],[-.078,.275]],.014);
      panel(chest,paper,side*.065,.312,-.151,[[-.026,-.147],[.039,.014],[.019,.126],[-.04,.052]],.01).rotation.z=side*.22;
      tube(chest,ink,[[side*.053,.281,-.172],[side*.069,.353,-.169],[side*.033,.404,-.163]],.002);
      const coat=articulatedTail('folded drafting coat '+side,side*.084,-.042,.145,[[-.082,.027],[.085,.027],[.109,-.25],[.051,-.395],[-.066,-.347]],apron);
      shapeAssembly(coat,(x,y)=>Math.abs(y)*.12+Math.sin(x*35)*.005);
      const ribbon=part(chest,'paper collar ribbon '+side,side*.105,.435,.119);
      panel(ribbon,paper,0,0,0,[[-.018,.009],[.018,.018],[.028,-.141],[.005,-.225],[-.032,-.152]],.004);
      rod(ribbon,ink,[0,-.027,-.003],[.006,-.141,-.003],.0017);
      secondary.push({object:ribbon,x:.16,z:side*.08,idle:.015,run:.05,phase:side<0?.8:2.1});
    }
    const bib=part(chest,'split print apron',0,.158,-.153);
    panel(bib,apron,0,0,0,[[-.11,-.213],[.003,-.237],[.009,-.14],[.029,-.235],[.113,-.193],[.107,.061],[-.098,.061]],.013);
    tube(bib,stitch,[[-.09,.041,-.005],[-.086,-.178,-.005],[-.019,-.192,-.005]],.0019);
    panel(bib,paper,-.046,-.002,-.012,[[-.031,-.033],[.025,-.041],[.033,.032],[-.027,.04]],.003).rotation.z=.17;
    for(let i=0;i<4;i++)rod(bib,ink,[-.066,-.019+i*.011,-.02],[-.031,-.013+i*.009,-.02],.0013);
    strap(chest,[[-.135,.413,-.094],[-.095,.288,-.169],[.13,.038,-.154]],.011);
    const tools=part(chest,'drafting nib harness',.133,.12,-.156);tools.rotation.z=-.29;
    box(tools,leather,0,.01,0,.068,.113,.033);
    for(let i=0;i<3;i++){
      const x=(i-1)*.022;rod(tools,i===1?red:paper,[x,-.07,-.021],[x,.095+i*.009,-.021],.006);
      panel(tools,darkMetal,x,.098+i*.009,-.024,[[-.006,0],[.006,0],[0,.031]],.005);
    }
    const folio=part(chest,'folded folio',.024,.22,.145);folio.rotation.z=.1;
    box(folio,ink,0,0,0,.203,.268,.059);
    for(let i=0;i<(hero?4:2);i++)box(folio,paper,0,-.001,.036+i*.004,.174,.245,.003);
    box(folio,apron,0,0,.057,.193,.262,.011);box(folio,red,0,0,.067,.021,.268,.009);
    for(const {side,elbow,hand}of arms){
      loft(elbow,paper,[[-.19,.048,.044],[-.239,.044,.039]],{segments:10,power:.8});
      tube(elbow,ink,[[-.039,-.207,-.03],[0,-.22,-.047],[.039,-.207,-.03]],.002);
      panel(hand,ink,0,-.033,-.031,[[-.029,-.023],[.029,-.023],[.032,.021],[-.032,.021]],.008);
      rod(hand,paper,[side*.014,-.017,-.042],[side*.014,-.047,-.042],.0018);
    }
    for(const {side,hip,knee,ankle}of legs){
      tube(hip,stitch,[[side*.077,-.075,-.031],[side*.072,-.284,-.034]],.002);
      panel(knee,ink,0,-.015,-.073,[[-.048,.039],[.048,.039],[.053,-.021],[.031,-.06],[-.031,-.06],[-.053,-.021]],.012);
      box(ankle,paper,0,.007,-.105,.081,.017,.041);box(ankle,red,side*.043,-.001,-.028,.007,.018,.071);
    }
    group.userData.silhouette='folded-ink-mask / slanted-drafting-cap / paper-ribbon-collar';
  }else if(def.style==='salvager'){
    const nacre=material('iridescent salvage nacre','#c8d9cb',{roughness:.26,metalness:.18,clearcoat:.68});
    nacre.iridescence=.32;nacre.iridescenceIOR=1.32;nacre.iridescenceThicknessRange=[180,360];
    const seamMetal=material('oxidised silver seams','#789a9c',{roughness:.49,metalness:.7});
    const tideGlass=material('deep tideglass','#40777b',{roughness:.2,metalness:.38,clearcoat:.66});
    const glow=material('bioluminescent tide core','#abcfc1',{roughness:.37,emissive:'#6fbdba',intensity:.17});
    const rope=material('salt braid','#a9b5a3',{roughness:.88,texture:'grain'});
    // A swept manta-shaped cowl and shell mask keep this far from a brass diver.
    loft(head,lining,[[.005,.059,.058],[.105,.092,.084],[.229,.087,.079],[.29,.047,.049]],{segments:12,power:.83});
    panel(head,nacre,0,.02,-.1,[[-.031,0],[-.078,.069],[-.098,.179],[-.059,.251],[0,.281],[.059,.251],[.098,.179],[.078,.069],[.031,0]],.021);
    panel(head,tideGlass,0,.122,-.131,[[-.066,-.027],[0,-.046],[.066,-.027],[.079,.045],[.041,.08],[0,.071],[-.041,.08],[-.079,.045]],.012);
    tube(head,seamMetal,[[-.076,.173,-.149],[0,.143,-.151],[.076,.173,-.149]],.0038);
    for(const side of [-1,1]){
      tube(head,seamMetal,[[side*.026,.03,-.124],[side*.057,.088,-.134],[side*.09,.197,-.12],[side*.052,.263,-.111]],.0032);
      panel(head,nacre,side*.085,.077,-.005,[[-.014,0],[side*.036,.081],[side*.046,.176],[side*.012,.158],[-side*.018,.073]],.013).rotation.y=side*.65;
      for(let i=0;i<3;i++)rod(head,darkMetal,[side*.019,.059+i*.012,-.13],[side*.037,.069+i*.012,-.129],.0018);
    }
    const plastron=part(chest,'curved ribbed shell plastron');
    for(const side of [-1,1]){
      panel(plastron,nacre,side*.077,.078,-.137,[[-.062,-.012],[.064,.009],[.09,.19],[.028,.294],[-.061,.23]],.018).rotation.z=-side*.07;
      for(let i=0;i<4;i++)tube(plastron,seamMetal,[[side*.013,.12+i*.046,-.166],[side*.057,.132+i*.046,-.166],[side*.115,.164+i*.041,-.16]],.0026);
      tube(plastron,glow,[[side*.021,.167,-.173],[side*.049,.213,-.176],[side*.035,.292,-.172]],.0018);
      strap(chest,[[side*.137,.428,-.081],[side*.161,.222,-.133],[side*.116,.011,-.128]],.011);
      tube(chest,rope,[[side*.132,.411,-.096],[side*.154,.23,-.151],[side*.107,.018,-.146]],.0042);
      const skirt=articulatedTail('tidal expedition skirt '+side,side*.087,-.033,.145,[[-.083,.026],[.086,.025],[.099,-.187],[.036,-.312],[-.056,-.278]],fabric);
      shapeAssembly(skirt,(x,y)=>Math.abs(y)*.12+Math.sin(x*31)*.006);
    }
    shapeAssembly(plastron,(x,y)=>x*x*1.15-Math.sin((y-.05)/.4*Math.PI)*.01);
    tube(hips,rope,[[-.153,.049,-.075],[-.097,.035,-.121],[.003,.041,-.134],[.12,.029,-.116],[.161,.043,-.065]],.005);
    tube(hips,rope,[[-.153,.041,-.076],[-.097,.027,-.121],[.003,.033,-.134],[.12,.021,-.116],[.161,.035,-.065]],.004);
    // Five ribbed shell vanes overlap on one shoulder, like salvaged baleen.
    for(let i=0;i<5;i++){
      const shell=part(chest,'nacre shoulder vane '+i,-.145-i*.032,.431-i*.013,.016+i*.025);
      panel(shell,nacre,0,0,0,[[-.019,.036],[.025,.052],[.051,-.038],[.008,-.202],[-.042,-.151],[-.056,-.059]],.012);
      tube(shell,seamMetal,[[.007,.024,-.004],[.017,-.063,-.004],[.004,-.173,-.004]],.0022);
      shapeAssembly(shell,(x,y)=>Math.sin((y+.2)/.25*Math.PI)*.025+x*x*3);
      secondary.push({object:shell,x:.08+i*.018,z:-.17,idle:.004,run:.014,phase:i*.5});
    }
    const reel=part(chest,'flat salvage reel',.044,.235,.161);
    ell(reel,lining,0,0,0,.105,.128,.027);ring(reel,seamMetal,0,0,.027,.084,.009);
    for(let i=0;i<(hero?4:2);i++)ring(reel,rope,0,0,.039+i*.006,.061+i*.003,.004);
    box(reel,darkMetal,0,0,.074,.034,.154,.012);
    tube(chest,rope,[[.117,.184,.183],[.187,.086,.116],[.162,.011,-.021]],.007);
    const lantern=part(hips,'caged tide lantern',.183,-.083,-.041);
    ring(lantern,seamMetal,0,.029,0,.026,.004);
    ell(lantern,tideGlass,0,-.047,0,.037,.061,.034);ell(lantern,glow,0,-.049,-.02,.013,.034,.011);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,x=Math.sin(a)*.039,z=Math.cos(a)*.037;
      tube(lantern,seamMetal,[[x*.45,.005,z*.45],[x,-.043,z],[x*.55,-.102,z*.55]],.0035);
    }
    ring(lantern,nacre,0,-.101,0,.025,.005).rotation.x=Math.PI/2;
    secondary.push({object:lantern,x:.02,z:.03,idle:.013,run:.065,phase:1.6});
    for(const {side,elbow,hand}of arms){
      for(let i=0;i<3;i++)panel(elbow,nacre,0,-.057-i*.053,-.064,[[-.045,.024],[0,.044],[.045,.024],[.039,-.025],[0,-.04],[-.039,-.025]],.011);
      tube(elbow,seamMetal,[[0,-.032,-.083],[0,-.19,-.083]],.0022);
      panel(hand,nacre,0,-.035,-.032,[[-.028,-.023],[.028,-.023],[.035,.015],[0,.036],[-.035,.015]],.009);
    }
    for(const {side,hip,knee,ankle}of legs){
      panel(hip,fabric,side*.026,-.19,-.101,[[-.055,.08],[.055,.08],[.049,-.09],[-.049,-.09]],.016);
      ell(knee,nacre,0,-.002,-.071,.06,.055,.023,true);
      for(let i=0;i<3;i++)panel(knee,nacre,0,-.11-i*.068,-.061,[[-.045,.028],[.045,.028],[.038,-.027],[0,-.041],[-.038,-.027]],.01);
      box(ankle,seamMetal,0,-.001,-.114,.084,.015,.023);
    }
    group.userData.silhouette='swept-nacre-mask / ribbed-shell-mantle / caged-tide-lantern';
  }

  anatomy.fitFront(chest);group.scale.setScalar(def.height/1.80);
  const update=(time,state={})=>{const gait=anatomy.update(time,state),motion=state.motion!==false,blend=group.userData.animation.blend,phase=group.userData.animation.phase;
    for(const p of secondary){p.object.rotation.x=p.x+(motion?Math.sin(time*(p.rate||1.3)+(p.phase||0))*(p.idle||.012)*(1-blend)+Math.sin(phase+(p.phase||0))*(p.run||.055)*blend:0);p.object.rotation.z=p.z||0;}
    return gait;
  };
  const stats=finishRunnerBuild(group,w.resources);applyComicFinish(group,w.resources,{outlines:hero});
  return{group,definition:def,update,stats,anatomy,dispose(){anatomy.dispose();w.dispose();group.removeFromParent();}};
}
