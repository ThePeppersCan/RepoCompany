import * as THREE from './vendor/three.module.js?v=2.15.0';
// Every identity has its own mask mechanism and costume construction. Moving
// parts stay on their owning bone; the shared anatomy supplies all locomotion.
export function buildRunnerRegalia({def,w,s,root,anatomy,mask,materials:m,motion,secondary}){
 const {hips,chest,head,arms,legs}=anatomy,{group:part,ell,box,tube,ring,plate,loft}=w,id=def.id;
 const updates=[];
 const panel=(parent,mat,points,z,depth=.006)=>{const o=plate(parent,mat,points,depth);o.position.z=z;return o;};
 const horn=(parent,points,r=.021)=>s.taper(parent,m.ivory,points,[r,r*.75,r*.38,.0005],{sides:9,steps:18});
 const curve=(parent,mat,points,r=.008)=>s.taper(parent,mat,points,[r,r*.85,r*.45,.0007],{sides:8,steps:16});
 const maskline=(mat,points,r=.0025)=>tube(mask,mat,points.map(([x,y])=>[x,y,-.119+(x/.1)**2*.048]),r);
 function tail(side,length=.34,mat=m.cloth,width=.105){
  const joint=part(hips,'split coat '+side,side*.10,.015,.06);panel(joint,mat,[[-width,.06],[width,.04],[width+.015,-length*.8],[width*.2,-length],[-width*.8,-length*.84]],.015,.009);
  tube(joint,m.ink,[[-width+.012,.03,.029],[-width*.7,-length*.8,.029],[width*.1,-length+.02,.029]],.002);secondary.push({object:joint,x:.04,z:side*.045,phase:side});return joint;
 }
 function harness(side=1){tube(chest,m.ink,[[side*.12,.43,-.09],[-side*.13,.10,-.139],[-side*.15,-.02,-.09]],.013);box(chest,m.trim,side*.02,.29,-.151,.027,.035,.008);}
 function chestPlate(side,mat=m.trim){return panel(chest,mat,[[side*.024,.38],[side*.12,.39],[side*.166,.29],[side*.14,.14],[side*.035,.10]],-.131,.010);}
 function quills(parent,n=6,span=.22,mat=m.ivory){for(let i=0;i<n;i++){const x=(i/(n-1)-.5)*span;curve(parent,mat,[[x,0,0],[x*1.2,.05,.01],[x*1.4,.12+Math.abs(x)*.3,.03]],.009);}}
 function lantern(parent,x,y,z){const g=part(parent,'caged lantern',x,y,z);ell(g,m.lit,0,-.055,0,.032,.047,.027);for(const side of [-1,1])for(const axis of [-1,1])tube(g,m.trim,[[side*.027,-.012,axis*.020],[side*.034,-.05,axis*.026],[side*.025,-.098,axis*.018]],.003);for(const at of [-.015,-.095]){const r=ring(g,m.trim,0,at,0,.033,.004);r.rotation.x=Math.PI/2;}motion(g,'z',0,.20,.5);return g;}
 function jaw(parent=mask,length=.067){const g=part(parent,id+' / hinged jaw',0,.125,-.06);curve(g,m.shell,[[-.065,0,-.02],[-.049,-length*.8,-.04],[0,-length,-.06],[.049,-length*.8,-.04],[.065,0,-.02]],.009);for(let i=0;i<7;i++)s.tooth(g,m.ivory,[(i-3)*.014,-length*.58,-.032],.012,.0035,0);motion(g,'x',0,.65);return g;}
 function eye(parent,x,y,z,scale=1){ell(parent,m.black,x,y,z,.031*scale,.022*scale,.013*scale);ell(parent,m.lit,x,y,z-.012,.019*scale,.010*scale,.008*scale);ell(parent,m.black,x,y,z-.019,.003*scale,.009*scale,.003*scale);}
 function horns(parent,high=.25){const list=[];for(const side of [-1,1]){const g=part(parent,'folded horn '+side,side*.081,.244,.008);horn(g,[[0,0,0],[side*.055,.06,.008],[side*.068,high*.7,.03],[side*.034,high,.014]],.017);motion(g,'z',-side*.23,side*.28,side);list.push(g);}return list;}
 function shardCuff(arm){for(let i=0;i<3;i++)panel(arm.elbow,m.trim,[[-.027,-.13-i*.028],[.029,-.125-i*.028],[.035,-.15-i*.028],[-.026,-.16-i*.028]],-.042,.006);}
 function beltTools(kind){for(let i=0;i<3;i++){const g=part(hips,kind+' '+i,-.13+i*.030,-.02,-.12);const r=ring(g,m.trim,0,-.035,0,.016,.003);if(kind==='keys'){tube(g,m.trim,[[0,-.048,0],[0,-.12,0],[.018,-.12,0],[.018,-.105,0]],.004);}else{ell(g,m.trim,0,-.048,0,.018,.025,.006);tube(g,m.ink,[[-.008,-.04,-.007],[.008,-.057,-.007]],.0015);}motion(g,'x',0,.30,i);}}
 // Regular animated characters: the signature mechanism moves during inspect,
 // while a small attached part and surface light remain alive during a run.
 if(id==='blackstitch'){
  tail(-1,.28,m.ink);tail(1,.20,m.cloth);harness(-1);chestPlate(1,m.ink);
  for(let row=0;row<3;row++)for(let i=0;i<7;i++){const x=(i-3)*.018,y=.095+row*.047;maskline(m.ink,[[x-.005,y-.009],[x+.004,y+.009]],.003);}
  for(const side of [-1,1]){const binding=part(mask,'tension binding '+side,side*.062,.16,-.092);tube(binding,m.signal,[[0,-.09,0],[side*.009,-.03,-.008],[0,.06,0]],.003);motion(binding,'z',0,-side*.18);}
  for(const arm of arms){panel(arm.shoulder,m.ink,[[-.055,-.07],[.055,-.07],[.045,-.18],[-.04,-.19]],-.055,.007);tube(arm.elbow,m.signal,[[-.027,-.15,-.04],[0,-.19,-.05],[.026,-.21,-.04]],.002);}
 }else if(id==='redactor'){
  tail(-1,.36,m.lining,.08);harness(1);panel(chest,m.lining,[[-.17,.36],[-.03,.43],[.04,.31],[-.14,.21]],-.13);
  for(const side of [-1,1])maskline(m.ink,[[side*.022,.25],[side*.068,.21],[side*.015,.07]],.003);
  const shutter=part(mask,'censor shutter',-.069,.177,-.115);panel(shutter,m.ink,[[0,.015],[.14,.005],[.139,-.009],[.003,-.014]],0,.004);motion(shutter,'y',0,-1.05);
  const caseG=part(chest,'blade document case',.12,.13,.14);panel(caseG,m.ink,[[-.05,.24],[.07,.19],[.06,-.16],[-.034,-.28]],0,.045);tube(caseG,m.trim,[[-.028,.21,.05],[.04,.18,.05],[.035,-.13,.05]],.003);
 }else if(id==='ferryman'){
  tail(-1,.45);tail(1,.39);harness(-1);lantern(hips,.17,-.06,-.04);beltTools('coins');
  for(const side of [-1,1]){ell(mask,m.trim,side*.046,.185,-.095,.026,.026,.006);ring(mask,m.ink,side*.046,.185,-.102,.019,.0025);maskline(m.ink,[[side*.025,.13],[side*.048,.11],[side*.023,.052]],.004);}
  const mouth=part(mask,'ferryman mouth',0,.098,-.113);for(let i=0;i<6;i++)box(mouth,m.black,(i-2.5)*.012,0,0,.005,.024,.004);motion(mouth,'x',0,.3);
 }else if(id==='deadchannel'){
  harness(1);chestPlate(-1,m.lining);const receiver=part(chest,'radio pack',0,.20,.15);box(receiver,m.ink,0,0,0,.17,.24,.066);for(let i=0;i<5;i++)box(receiver,m.trim,0,.06-i*.025,.037,.12,.004,.004);
  tube(receiver,m.ink,[[.065,.10,.01],[.075,.30,.025],[.085,.38,.03]],.004);tube(receiver,m.trim,[[-.06,.08,.02],[-.09,.22,.03]],.003);
  for(let i=0;i<5;i++)maskline(i===2?m.lit:m.ink,[[-.063,.21-i*.023],[.060,.218-i*.023]],.004);
  for(const side of [-1,1]){const fin=part(head,'receiver fin '+side,side*.116,.13,.02);panel(fin,m.trim,[[0,0],[side*.03,.08],[side*.02,.16],[-side*.01,.13]],0,.008);motion(fin,'y',0,side*.8);}
 }else if(id==='lamplighter'){
  tail(-1,.33);tail(1,.30);harness(-1);lantern(hips,-.18,-.04,.04);
  ell(mask,m.black,0,.155,-.095,.065,.082,.02);ell(mask,m.lit,0,.155,-.110,.051,.068,.006);
  for(let i=0;i<5;i++){const shutter=part(mask,'brass face shutter '+i,0,.22-i*.028,-.126);panel(shutter,m.trim,[[-.057,.012],[.057,.012],[.05,-.012],[-.05,-.012]],0,.004);motion(shutter,'x',0,.88,i*.5);}
  for(const side of [-1,1])panel(chest,m.cloth,[[side*.08,.43],[side*.24,.35],[side*.27,.25],[side*.12,.30]],-.025,.018);
 }else if(id==='oathbreaker'){
  tail(-1,.38,m.signal,.065);tail(1,.25,m.lining,.09);chestPlate(-1);chestPlate(1);for(const arm of arms)shardCuff(arm);
  maskline(m.black,[[0,.274],[-.013,.213],[.008,.168],[-.009,.08],[0,.035]],.004);
  for(const side of [-1,1]){const vow=part(mask,'broken vow '+side,side*.060,.17,-.085);panel(vow,m.shell,[[0,.073],[side*.035,.025],[side*.025,-.04],[-side*.034,-.10],[-side*.014,.003]],0,.008);motion(vow,'y',0,side*.6);}
 }else if(id==='bonepicker'){
  harness(1);tail(-1,.20,m.lining);const beak=part(mask,'scavenger beak',0,.15,-.091);curve(beak,m.ivory,[[0,0,0],[0,-.032,-.035],[0,-.085,-.080],[0,-.125,-.085]],.033);motion(beak,'x',0,.24);
  for(const side of [-1,1]){const mantle=part(chest,'bone mantle '+side,side*.19,.40,.01);mantle.rotation.z=-side*.3;quills(mantle,5,.14);motion(mantle,'x',.15,.45,side);}
  for(const leg of legs)panel(leg.hip,m.cloth,[[leg.side*.06,-.14],[leg.side*.09,-.15],[leg.side*.09,-.27],[leg.side*.065,-.25]],-.04,.015);
 }else if(id==='mothkeeper'){
  tail(-1,.34,m.lining,.075);tail(1,.29,m.cloth,.08);harness(-1);
  for(const side of [-1,1]){horn(mask,[[side*.055,.23,-.04],[side*.08,.28,-.02],[side*.055,.33,0],[side*.026,.345,-.015]],.009);
   const cape=part(chest,'moth shoulder '+side,side*.10,.42,.10);panel(cape,m.lining,[[0,0],[side*.18,-.03],[side*.23,-.17],[side*.13,-.13],[side*.18,-.25],[side*.06,-.22]],0,.010);motion(cape,'y',side*.2,side*.65,side);
   for(let i=0;i<3;i++)tube(cape,m.trim,[[0,0,-.006],[side*(.10+i*.035),-.08-i*.05,-.006]],.0025);}
 }else if(id==='glasswake'){
  tail(1,.35,m.cloth,.10);harness(1);chestPlate(-1,m.lining);
  for(let i=0;i<5;i++){const leaf=part(mask,'mirror leaf '+i,(i-2)*.025,.19,-.111);panel(leaf,m.shell,[[-.015,.058],[.014,.042],[.019,-.062],[-.013,-.094]],0,.005);motion(leaf,'y',0,(i%2?1:-1)*.75,i);}
  const shoulder=part(arms[0].shoulder,'mirror shoulder');for(let i=0;i<3;i++)panel(shoulder,m.shell,[[-.048,-.07-i*.03],[.045,-.06-i*.03],[.06,-.09-i*.035],[-.035,-.12-i*.03]],-.056,.008);
 }else if(id==='bellwether'){
  tail(-1,.37);tail(1,.40);harness(-1);for(const side of [-1,1]){const h=part(head,'ram horn '+side,side*.082,.22,.015);horn(h,[[0,0,0],[side*.08,.045,.02],[side*.09,-.04,.06],[side*.03,-.07,-.01]],.023);motion(h,'y',0,side*.18,side);
   for(let i=0;i<2;i++){const bell=part(chest,'bronze bell '+side+' '+i,side*(.1+i*.03),.23-i*.11,-.13);ell(bell,m.trim,0,0,0,.018,.025,.018);ring(bell,m.black,0,-.019,0,.014,.002).rotation.x=Math.PI/2;motion(bell,'x',0,.5,side+i);}}
  maskline(m.ink,[[-.04,.145],[0,.12],[.04,.145]],.006);
 }else if(id==='nightwatch'){
  tail(-1,.25);tail(1,.25);chestPlate(1,m.lining);beltTools('keys');harness(1);
  ell(mask,m.black,0,.16,-.101,.068,.077,.012);box(mask,m.lit,0,.183,-.117,.087,.007,.003);
  for(const side of [-1,1]){const lock=part(mask,'faceplate lock '+side,side*.045,.16,-.124);for(let i=0;i<3;i++)box(lock,m.trim,(i-1)*.018,0,0,.007,.13,.005);motion(lock,'y',0,side*.9);}
  box(chest,m.trim,-.11,.32,-.145,.034,.045,.008);
 }else if(id==='hush'){
  tail(-1,.36,m.cloth,.10);tail(1,.22,m.lining,.07);harness(-1);maskline(m.ink,[[-.055,.151],[-.02,.145],[.015,.150],[.057,.145]],.002);
  for(const side of [-1,1]){const seam=part(mask,'wax seam '+side,side*.053,.147,-.104);panel(seam,m.shell,[[0,.018],[-side*.055,.016],[-side*.051,-.018],[0,-.02]],0,.003);motion(seam,'y',0,side*.5);
   const tie=part(arms[side<0?0:1].elbow,'linen cuff tie',.027,-.23,.01);panel(tie,m.cloth,[[0,0],[.014,.004],[.022,-.14],[.004,-.12]],0,.002);motion(tie,'x',.1,.3,side);}
 }
 // Premium transformations. Each has a distinct articulated silhouette.
 if(id==='archfiend'||id==='grave-moth'){
  tail(-1,.35,m.lining);tail(1,.38,m.cloth);harness(-1);if(id==='archfiend'){horns(head,.19);jaw();}else{for(const side of [-1,1])horn(mask,[[side*.04,.24,-.04],[side*.06,.29,-.015],[side*.035,.34,.01],[side*.02,.36,-.005]],.008);}
  for(const side of [-1,1])for(let tier=0;tier<(id==='grave-moth'?2:1);tier++){
   const wing=part(chest,id+' / wing '+side+' '+tier,side*.115,.35-tier*.14,.12),span=id==='archfiend'?.65:tier?.45:.61;
   const edge=[[0,0],[side*.18,.19],[side*span,.34-tier*.14],[side*(span-.07),.02],[side*(span*.70),-.02],[side*(span*.69),-.25],[side*(span*.43),-.17],[side*.12,-.34],[0,-.17]];
   const membrane=panel(wing,id==='archfiend'?m.cloth:m.lining,edge,.016,.005);membrane.material.side=THREE.DoubleSide;const verts=membrane.geometry.attributes.position;for(let v=0;v<verts.count;v++){const x=verts.getX(v),y=verts.getY(v);verts.setZ(v,verts.getZ(v)+Math.sin(Math.abs(x)/span*Math.PI)*Math.sin((y+.34)*4)*.055);}membrane.geometry.computeVertexNormals();
   for(let finger=0;finger<3;finger++){const tip=edge[[2,5,7][finger]];curve(wing,m.ink,[[0,-.03,.006],[side*.18,.09,.006],[tip[0],tip[1],.006]],.011);}
   if(id==='grave-moth'){eye(wing,side*span*.57,.04-tier*.06,.005,1.35);ring(wing,m.ivory,side*span*.57,.04-tier*.06,-.007,.055,.004);}
   motion(wing,'y',side*1.37,-side*1.13,side+tier);motion(wing,'z',-side*.24,side*.21,tier);
   updates.push((t,e)=>{wing.rotation.x=e*Math.sin(t*2.2+tier)*.09;wing.scale.x=.46+e*.54;});
  }
 }else if(id==='hollow-king'){
  tail(-1,.36,m.lining);tail(1,.37,m.lining);jaw();harness(1);
  for(let i=0;i<7;i++){const a=(i-3)*.40,g=part(head,'crown petal '+i,Math.sin(a)*.10,.23,Math.cos(a)*.04);horn(g,[[0,0,0],[Math.sin(a)*.025,.06,0],[Math.sin(a)*.02,.12,0],[0,.16,0]],.012);motion(g,'x',0,-.55,i);}
  ell(chest,m.black,0,.24,-.150,.068,.10,.017);ell(chest,m.lit,0,.24,-.163,.029,.059,.010);
  for(const side of [-1,1]){const rib=part(chest,'ossuary rib cage '+side,side*.14,.34,-.157);for(let i=0;i<5;i++)curve(rib,m.ivory,[[0,-i*.043,0],[-side*.06,-i*.043+.01,-.025],[-side*.13,-i*.043-.01,-.028]],.008);motion(rib,'y',0,-side*.95,side);}
 }else if(id==='red-widow'){
  tail(-1,.30,m.lining,.065);tail(1,.30,m.lining,.065);chestPlate(-1,m.shell);chestPlate(1,m.shell);
  for(const side of [-1,1])for(let i=0;i<3;i++)eye(mask,side*(.027+i*.018),.235-i*.029,-.098+Math.abs(i)*.008,.35);
  for(const side of [-1,1])for(let i=0;i<4;i++){
   const leg=part(chest,'widow limb '+side+' '+i,side*.12,.36-i*.075,.13);
   curve(leg,m.shell,[[0,0,0],[side*.18,.10-i*.025,.04],[side*.31,.14-i*.04,.03]],.017);
   const joint=part(leg,'widow tibia '+side+' '+i,side*.31,.14-i*.04,.03);curve(joint,m.shell,[[0,0,0],[side*.13,-.19,.01],[side*.16,-.39,-.04]],.013);
   motion(leg,'y',side*1.42,-side*1.18,side+i);motion(leg,'z',-side*.18,side*(.20-i*.06),i);motion(joint,'z',side*.65,-side*.6,i);
   updates.push((t,e)=>{joint.rotation.x=Math.sin(t*2.6+i*.7)*e*.13;});
  }
 }else if(id==='dreadhound'){
  tail(-1,.24,m.ink);harness(-1);jaw(mask,.082);
  curve(mask,m.shell,[[0,.17,-.08],[0,.14,-.14],[0,.12,-.18]],.035);
  for(const side of [-1,1])horn(head,[[side*.068,.24,.01],[side*.085,.29,.025],[side*.08,.35,.01],[side*.06,.36,0]],.015);
  for(let i=0;i<8;i++){const side=i%2?1:-1,lane=Math.floor(i/2),g=part(chest,'hound mane '+i,side*(.13+lane*.022),.44-lane*.045,.10);horn(g,[[0,0,0],[side*.06,.06,.05],[side*.08,.15,.07],[side*.07,.22,.03]],.019);motion(g,'x',.8,-1.08,i);motion(g,'z',side*.35,-side*1.05,i);}
  for(const arm of arms)shardCuff(arm);
 }else if(id==='drowned-oracle'){
  tail(-1,.42,m.cloth);tail(1,.37,m.lining);harness(1);eye(mask,0,.178,-.118,1.65);
  for(const side of [-1,1]){const lid=part(mask,'oracle eye seal '+side,side*.06,.176,-.125);panel(lid,m.shell,[[0,.047],[-side*.065,.035],[-side*.065,-.033],[0,-.047]],0,.007);motion(lid,'y',0,side*1.05);}
  for(let i=0;i<6;i++){
   const a=i/6*Math.PI*2,g=part(chest,'oracle tendril '+i,Math.cos(a)*.10,.34+Math.sin(a)*.10,.13),side=Math.cos(a)>=0?1:-1;
   curve(g,m.cloth,[[0,0,0],[side*.13,.10,.04],[side*.22,.15,.02]],.022);
   const tip=part(g,'oracle tendril tip '+i,side*.22,.15,.02);curve(tip,m.cloth,[[0,0,0],[side*.12,-.05,-.04],[side*.11,-.21,-.12],[side*.05,-.23,-.15]],.016);
   for(let j=0;j<4;j++)ell(tip,m.ivory,side*(.04+j*.021),-.025-j*.04,-.04-j*.02,.009,.006,.004);
   motion(g,'y',side*1.4,-side*1.05,i);motion(g,'z',side*.1,Math.sin(a)*.8,i);motion(tip,'z',-side*.6,side*.65,i);
   updates.push((t,e)=>{tip.rotation.x=e*Math.sin(t*2+i)*.2;});
  }
 }else if(id==='chain-saint'){
  tail(-1,.40,m.cloth);tail(1,.35,m.lining);harness(1);harness(-1);
  for(let i=0;i<5;i++)maskline(m.black,[[(i-2)*.017,.225],[(i-2)*.012,.065]],.0035);
  for(const side of [-1,1])for(let lane=0;lane<2;lane++){
   let parent=part(chest,'chain mantle '+side+' '+lane,side*.15,.34-lane*.18,.13);motion(parent,'z',-side*.3,side*(1.6+lane*.35),lane);
   for(let i=0;i<8;i++){const link=part(parent,'chain link '+side+' '+lane+' '+i,0,-.041,0),r=ring(link,m.trim,0,-.014,0,.020,.0035);r.scale.y=1.4;r.rotation.y=i%2?Math.PI/2:0;updates.push((t,e)=>{link.rotation.z=e*Math.sin(t*2-i*.35+lane)*.10;});parent=link;}
   curve(parent,m.trim,[[0,0,0],[0,-.065,0],[side*.036,-.07,0],[side*.026,-.034,0]],.008);
  }
  const veil=part(mask,'iron veil',0,.24,-.112);panel(veil,m.trim,[[-.052,0],[.054,0],[.035,-.17],[-.034,-.18]],0,.005);motion(veil,'x',0,-.65);
 }else if(id==='ash-revenant'){
  tail(-1,.28,m.signal);tail(1,.25,m.lining);harness(-1);for(const arm of arms)shardCuff(arm);
  for(const side of [-1,1])for(let i=0;i<3;i++){const vent=part(chest,'kiln armour '+side+' '+i,side*.14,.36-i*.09,-.165);panel(vent,m.shell,[[0,.03],[-side*.13,.02],[-side*.11,-.045],[0,-.04]],0,.012);tube(vent,m.lit,[[0,-.038,-.004],[-side*.1,-.035,-.004]],.002);motion(vent,'y',0,-side*(.9+i*.1),i);}
  for(let i=0;i<3;i++){const heat=ell(chest,m.lit,0,.34-i*.085,-.158,.085,.009,.006);updates.push((t,e)=>{heat.scale.x=.085*(.25+e*.75);});}
  for(const side of [-1,1]){const face=part(mask,'kiln mask '+side,side*.064,.18,-.121);panel(face,m.shell,[[0,.072],[-side*.065,.085],[-side*.059,-.11],[0,-.06]],0,.009);maskline(m.lit,[[side*.045,.23],[side*.02,.19],[side*.038,.14],[side*.012,.08]],.002);motion(face,'y',0,-side*.85);}
 }
 // A small red cut mark ties every costume to the game without a billboard logo.
 const mark=panel(chest,m.signal,[[-.013,-.026],[.009,.003],[-.006,.004],[.018,.033],[.009,.005],[.02,.008]],-.145,.002);mark.position.x=-.11;mark.position.y=.32;
 return {update(time,energy,p,motionOn){for(const fn of updates)fn(motionOn?time:0,energy,p);}};
}
