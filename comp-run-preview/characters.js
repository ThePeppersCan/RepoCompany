import {createUnravelRunner} from './unravel-runner.js?v=2.17.0';
import {createCastawayRunner} from './castaway-runner.js?v=2.17.0';
import {createPaidRunner} from './paid-runners.js?v=2.17.0';
import * as THREE from './vendor/three.module.js?v=2.17.0';
import {withRunnerEquipment} from './runner-equipment.js?v=2.17.0';
import {createComicRunner} from './comic-runner.js?v=2.17.0';
import {RUNNERS} from './runner-catalog.js?v=2.17.0';
import {createLegendaryRunner} from './legendary-runners.js?v=2.17.0';
import {createRunnerAnimator,finishRunnerBuild} from './runner-craft.js?v=2.17.0';

export {RUNNERS} from './runner-catalog.js?v=2.17.0';

const clamp=THREE.MathUtils.clamp;
const smooth=(a,b,t)=>a+(b-a)*t;
function surfaceTexture(kind){
  const n=128,d=new Uint8Array(n*n*4); let seed=18561;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const random=seed/4294967295, weave=kind==='cloth'?((x%3===0?10:0)+(y%3===0?7:0)):0;
    const mottling=kind==='cloth'?(Math.sin(x*.16+y*.045)*Math.cos(y*.12)*9):0;const v=clamp(228+random*23-weave+mottling,0,255),k=(y*n+x)*4;d[k]=d[k+1]=d[k+2]=v;d[k+3]=255;
  }
  const t=new THREE.DataTexture(d,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;
}
// Elliptical, ring-built forms retain natural changes in limb and fabric volume.
function loft(rings,sides=20,power=1){
  const p=[],uv=[],idx=[];
  for(let r=0;r<rings.length;r++)for(let i=0;i<=sides;i++){
    const [y,rx,rz,cx=0,cz=0]=rings[r],a=i/sides*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    p.push(cx+Math.sign(c)*Math.pow(Math.abs(c),power)*rx,y,cz+Math.sign(s)*Math.pow(Math.abs(s),power)*rz);uv.push(i/sides,r/(rings.length-1));
  }
  const ascending=rings[rings.length-1][0]>=rings[0][0];
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){const a=r*(sides+1)+i,b=a+sides+1;if(ascending)idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1);}
  // Cap ends, so neither elbows nor clothing openings reveal holes.
  for(const r of [0,rings.length-1]){const [y,,,cx=0,cz=0]=rings[r],c=p.length/3;p.push(cx,y,cz);uv.push(.5,.5);for(let i=0;i<sides;i++){const a=r*(sides+1)+i;idx.push(c,...((r===0)===ascending?[a,a+1]:[a+1,a]));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

// A tailored surface, rather than a stack of smooth cylinders. The folds are
// strongest at a hem or flexion point and disappear over the tension panels.
function garment(rings,sides=20,power=.94,folds=.003){
  const g=loft(rings,sides,power),p=g.attributes.position;
  for(let row=0;row<rings.length;row++)for(let i=0;i<=sides;i++){
    const index=row*(sides+1)+i,angle=i/sides*Math.PI*2,[y,,,cx=0,cz=0]=rings[row];
    const tension=.35+.65*Math.sin(row/(rings.length-1)*Math.PI)**2;
    const ripple=(Math.sin(angle*5+y*32)*.6+Math.sin(angle*9-y*17)*.4)*folds*tension;
    const x=p.getX(index)-cx,z=p.getZ(index)-cz,r=Math.hypot(x,z);
    p.setXYZ(index,cx+x*(1+ripple/r),p.getY(index),cz+z*(1+ripple/r));
  }
  g.computeVertexNormals();return g;
}

// Anatomical mask shell. Cheek, brow and nose planes are part of the surface;
// the eye openings are cut through it, with lenses set behind the rim.
function faceShell({angular=false,hero=true}={}){
  const rows=[[.014,.034,-.036,.051],[.035,.055,-.026,.073],[.065,.076,-.018,.082],[.104,.087,-.011,.087],[.133,.088,-.006,.091],[.158,.087,-.004,.091],[.181,.084,.001,.089],[.211,.07,.009,.075],[.23,.043,.015,.046]],cols=hero?32:16;
  const p=[],uv=[],idx=[];
  for(let r=0;r<rows.length;r++)for(let i=0;i<=cols;i++){
    const [y,w,side,depth]=rows[r],theta=(i/cols-.5)*Math.PI,x=Math.sin(theta)*w;
    const ridge=Math.exp(-((x/.016)**2))*Math.exp(-(((y-.12)/.052)**2))*.025;
    const brow=Math.exp(-(((Math.abs(x)-.034)/.028)**2))*Math.exp(-(((y-.174)/.017)**2))*.008;
    p.push(x,y,side-Math.cos(theta)*depth-ridge-brow);uv.push(i/cols,r/(rows.length-1));
  }
  for(let r=0;r<rows.length-1;r++)for(let i=0;i<cols;i++){
    const a=r*(cols+1)+i,b=a+cols+1;
    const x=(p[a*3]+p[(a+1)*3])/2,y=(rows[r][0]+rows[r+1][0])/2;
    if(y>.132&&y<.169&&Math.abs(x)>.017&&Math.abs(x)<.056)continue;
    idx.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  if(angular){const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;}
  return g;
}

export function createRunner(id,{detail='hero',civilian=false}={}){
  const def=RUNNERS.find(x=>x.id===id)||RUNNERS[0],hero=detail==='hero',sides=hero?20:10;
  if(def.paid&&!civilian)return withRunnerEquipment(createPaidRunner(def,{detail}));
  if(def.style==='woven-runner'&&!civilian)return withRunnerEquipment(createUnravelRunner(def,{detail}));
  if(def.style==='shadow-runner'&&!civilian)return withRunnerEquipment(createCastawayRunner(def,{detail}));
  if(def.rarity==='legendary'&&!civilian)return withRunnerEquipment(createLegendaryRunner(def,{detail}));
  if(!civilian)return withRunnerEquipment(createComicRunner(def,{detail}));
  const group=new THREE.Group();group.name='runner-'+def.id;group.userData.runnerId=def.id;
  const resources=new Set(),textures=[surfaceTexture('cloth'),surfaceTexture('skin')];
  const material=(color,roughness=.86,metalness=0,kind='cloth')=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,map:kind==='cloth'?textures[0]:null,bumpMap:kind==='cloth'?textures[0]:kind==='skin'?textures[1]:null,bumpScale:kind==='cloth'?.0007:.00025});resources.add(m);return m;};
  const cloth=material(def.cloth),dark=material(def.secondary),accent=material(def.accent),skin=material(def.skin,.67,0,'skin'),hair=material(def.hair,.96,0,'none'),rubber=material('#1c2021',.95),metal=material('#8a8c83',.38,.72,'none'),strap=material('#252a27'),eye=material('#25221d',.42,0,'none'),white=material('#aaa69a',.82),lip=material(def.gender==='male'?'#765147':'#895c53',.7,0,'none');
  const add=(parent,g,m,x=0,y=0,z=0)=>{resources.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const ell=(parent,m,x,y,z,rx,ry,rz)=>{const o=add(parent,new THREE.SphereGeometry(1,hero?20:10,hero?14:7),m,x,y,z);o.scale.set(rx,ry,rz);return o;};
  const box=(parent,m,x,y,z,w,h,d)=>add(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const tube=(parent,m,points,r=.008)=>{const curve=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));return add(parent,new THREE.TubeGeometry(curve,hero?Math.max(12,points.length*5):8,r,hero?7:5,false),m);};
  const ring=(parent,m,x,y,z,r,t=.008)=>{const o=add(parent,new THREE.TorusGeometry(r,t,6,hero?24:12),m,x,y,z);return o;};
  const part=(parent,name,x,y,z)=>{const o=new THREE.Group();o.name=name;o.position.set(x,y,z);parent.add(o);return o;};
  const female=def.gender==='female',build=def.build;
  const root=part(group,'body',0,0,0),hips=part(root,'hips',0,.91,0),chest=part(hips,'chest',0,.04,0);
  add(hips,loft([[-.12,.135*build,.085],[0,.155*build,.10],[.12,.148*build,.09]],sides,.8),dark);
  const chestWidth=(female?.207:.235)*build;
  add(chest,garment([[-.055,.165*build,.103],[.015,.171*build,.108],[.07,.162*build,.106],[.15,chestWidth*.79,.111],[.25,chestWidth*.92,.122],[.34,chestWidth*.99,.122],[.405,chestWidth,.104],[.45,chestWidth*.79,.079],[.48,.085,.068]],sides,.93,.003),cloth);
  // Jacket hem, articulated fabric collar, front placket, and actual pocket volumes.
  add(chest,loft([[-.08,.183*build,.113],[-.062,.184*build,.115],[-.043,.177*build,.111]],sides,.88),cloth);
  add(chest,loft([[.43,.089,.078],[.49,.092,.079],[.55,.078,.071]],sides),cloth);
  tube(chest,metal,[[0,.035,-.101],[0,.18,-.103],[0,.3,-.12],[0,.45,-.085]],.0025);
  box(chest,metal,.008,.36,-.124,.012,.022,.008);
  for(const side of [-1,1]){
    tube(chest,dark,[[side*.16,-.03,-.079],[side*.2,.23,-.084],[side*chestWidth,.39,-.052]],.0022);
    if(def.style==='shell'||def.style==='anorak')tube(chest,dark,[[side*.07,.3,-.128],[side*.15,.32,-.12]],.002);
  }
  // A broad webbing waist belt prevents the characters looking like unbroken mannequins.
  add(hips,loft([[.015,.16*build,.109],[.055,.16*build,.109]],sides,.75),strap);
  box(hips,metal,0,.036,-.113,.047,.028,.014);box(hips,strap,0,.036,-.121,.027,.014,.005);
  const head=part(chest,'head',0,.535,0);
  // The neck, skull and hood are separate fitted forms. The previous tall
  // tapered face made every runner read as the same plastic mannequin.
  add(head,loft([[-.09,.054,.052],[-.025,.053,.05],[.045,.06,.055]],sides),civilian?skin:strap);
  if(!civilian){
    const lining=material(def.secondary,.95,0,'cloth');
    const hoodShape=[[-.105,.151,.094,0,.022],[-.065,.14,.107,0,.026],[.005,.12,.112,0,.022],[.08,.118,.116,0,.018],[.165,.114,.115,0,.015],[.224,.098,.10,0,.014],[.262,.06,.061,0,.014],[.276,.005,.009,0,.014]];
    const hoodGeometry=garment(hoodShape,sides,.96,.0015),pos=hoodGeometry.attributes.position,index=hoodGeometry.index,kept=[];
    for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),z=(pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/3,y=(pos.getY(a)+pos.getY(b)+pos.getY(c))/3;if(z>-.041||y<-.055||y>.259)kept.push(a,b,c);}
    hoodGeometry.setIndex(kept);add(head,hoodGeometry,cloth);
    const inside=add(head,hoodGeometry.clone(),lining);inside.scale.set(.973,.989,.977);lining.side=THREE.BackSide;
    const rim=[[-.145,-.087,-.055],[-.119,-.018,-.071],[-.108,.07,-.077],[-.105,.16,-.069],[-.086,.225,-.06],[-.046,.26,-.041],[0,.27,-.031],[.046,.26,-.041],[.086,.225,-.06],[.105,.16,-.069],[.108,.07,-.077],[.119,-.018,-.071],[.145,-.087,-.055]];
    tube(head,cloth,rim,.008);
    for(const side of [-1,1]){
      tube(head,dark,[[side*.128,-.07,.042],[side*.115,.065,.06],[side*.089,.205,.059],[side*.025,.27,.027]],.0015);
      tube(head,cloth,[[side*.139,-.084,-.043],[side*.108,-.055,-.057],[side*.07,-.025,-.056]],.004);
    }
    // A skull behind the shell gives the eye apertures depth in every view.
    add(head,loft([[.005,.037,.043,0,-.013],[.055,.074,.067,0,-.009],[.13,.085,.08,0,0],[.205,.072,.077,0,.008],[.237,.045,.054,0,.012],[.247,.012,.018,0,.012]],sides),strap);
    const maskColor=def.id==='elias'?'#c9c3ad':def.id==='mara'?'#d3cec0':def.id==='nadia'?'#aaa99b':def.id==='dax'?'#352b2d':'#2b3033';
    const ceramic=def.id==='mara'||def.id==='nadia',maskMat=material(maskColor,ceramic?.48:.72,ceramic?.04:0,ceramic?'none':'cloth');
    maskMat.name=def.name+' sculpted face cover';
    add(head,faceShell({angular:def.id==='mara'||def.id==='nadia',hero}),maskMat);
    const eyeWhite=material('#8c8c80',.48,0,'none'),iris=material(def.skin,.42,0,'none');
    eyeWhite.name='eyes beneath the face cover';
    for(const side of [-1,1]){
      ell(head,eye,side*.036,.15,-.082,.02,.013,.003);
      ell(head,eyeWhite,side*.035,.149,-.085,.014,.0045,.0015);
      ell(head,iris,side*.035,.149,-.0868,.0043,.0043,.001);
      ell(head,eye,side*.035,.149,-.0878,.0022,.003,.0006);
      tube(head,maskMat,[[side*.016,.17,-.1],[side*.035,.176,-.096],[side*.057,.169,-.084]],.003);
      tube(head,maskMat,[[side*.017,.132,-.098],[side*.036,.127,-.091],[side*.056,.137,-.084]],.002);
    }
    if(def.id==='rowan'){
      for(let k=0;k<4;k++)tube(head,dark,[[-.064,.047+k*.014,-.067],[0,.052+k*.014,-.116],[.064,.047+k*.014,-.067]],.0032);
      for(let k=0;k<3;k++)tube(head,accent,[[.025+k*.009,.086,-.102],[.031+k*.009,.066,-.101]],.0016);
    }else if(def.id==='elias'){
      for(const x of [-.024,-.012,0,.012,.024])tube(head,dark,[[x,.092,-.113+Math.abs(x)*.2],[x,.045,-.105+Math.abs(x)*.25]],.002);
      tube(head,maskMat,[[-.064,.188,-.076],[0,.194,-.089],[.064,.188,-.076]],.003);
    }else if(def.id==='mara'){
      tube(head,dark,[[-.049,.218,-.068],[-.06,.188,-.081],[-.059,.126,-.086],[-.026,.036,-.097]],.0015);
      tube(head,accent,[[.035,.221,-.071],[.023,.186,-.094],[.018,.113,-.119],[.012,.042,-.106]],.003);
    }else if(def.id==='nadia'){
      tube(head,dark,[[-.058,.207,-.07],[-.065,.173,-.081],[-.06,.111,-.085],[-.025,.035,-.1]],.003);
      tube(head,dark,[[.053,.087,-.092],[.032,.057,-.106],[.018,.031,-.103]],.0015);
      tube(head,maskMat,[[-.06,.065,-.09],[0,.054,-.111],[.06,.065,-.09]],.003);
    }else if(def.id==='sera'){
      tube(head,accent,[[-.032,.222,-.071],[-.018,.18,-.096],[-.011,.11,-.12],[.01,.034,-.104]],.003);
      tube(head,dark,[[.034,.207,-.077],[.046,.18,-.092],[.058,.113,-.091]],.0017);
    }else{
      for(let k=0;k<4;k++)tube(head,cloth,[[-.059,.047+k*.017,-.072],[0,.05+k*.017,-.117],[.059,.047+k*.017,-.072]],.003);
    }
    for(const side of [-1,1]){tube(chest,accent,[[side*.065,.48,-.072],[side*.064,.4,-.116],[side*.069,.3,-.128]],.0022);box(chest,metal,side*.069,.295,-.128,.005,.016,.005);}
    if(def.style==='hoodie'||def.style==='shell')add(chest,loft([[-.13,.185,.113],[.03,.157,.104],[.15,.149,.10]],sides,.78),cloth);
    if(def.style==='hoodie'){
      add(chest,loft([[-.015,.145,.012,0,-.12],[.015,.15,.019,0,-.121],[.08,.14,.019,0,-.12],[.1,.12,.01,0,-.119]],sides,.8),cloth);tube(chest,dark,[[-.11,.087,-.134],[-.135,.04,-.139]],.002);tube(chest,dark,[[.11,.087,-.134],[.135,.04,-.139]],.002);
      // Original fractured horizon graphic, intentionally restrained.
      for(let k=0;k<5;k++){const line=box(chest,accent,(k-2)*.025,.285+(k%2)*.01,-.128,.014,.057,.002);line.rotation.z=.18;}
    }
    if(def.style==='anorak'){
      add(chest,garment([[.109,.104,.006,0,-.124],[.12,.122,.012,0,-.129],[.18,.124,.016,0,-.128],[.203,.115,.006,0,-.125]],sides,.72,.001),cloth);
      add(chest,loft([[.185,.126,.006,0,-.142],[.213,.12,.006,0,-.131]],sides,.65),cloth);
      tube(chest,accent,[[-.113,.204,-.137],[0,.209,-.14],[.113,.204,-.137]],.0016);
    }
    if(def.style==='vest'){
      add(chest,loft([[.015,.16,.107],[.23,.207,.129],[.39,chestWidth*.98,.123]],sides,.75),dark);
      for(const side of [-1,1]){
        add(chest,loft([[.067,.035,.007,side*.104,-.131],[.078,.043,.014,side*.104,-.136],[.184,.042,.014,side*.104,-.135],[.201,.035,.007,side*.104,-.13]],sides,.65),dark);
        tube(chest,accent,[[side*.066,.08,-.15],[side*.144,.08,-.147]],.0013);
      }
    }
    if(def.style==='puffer'){
      for(let k=0;k<5;k++){const y=.015+k*.083,w=k<2?.16:chestWidth*(k===4?.93:1);add(chest,loft([[y,w*.97,.105],[y+.015,w*1.055,.126],[y+.06,w*1.055,.126],[y+.08,w*.97,.105]],sides,.77),cloth);}
      for(const side of [-1,1])tube(chest,strap,[[side*.09,.03,-.14],[side*.14,.25,-.14],[side*.15,.43,-.08],[side*.13,.43,.1],[side*.08,.08,.15]],.016);
    }
    if(def.style==='shell'){for(const side of [-1,1])box(chest,cloth,side*.12,-.035,-.119,.088,.12,.007);tube(chest,accent,[[.17,.39,-.105],[.12,.3,-.135]],.003);}
  }
  if(civilian){
    ell(head,skin,0,.09,-.015,.085,.12,.077);ell(head,hair,0,.153,.008,.09,.073,.078);
    ell(head,skin,0,.085,-.087,.015,.027,.022);
    for(const side of [-1,1]){ell(head,eye,side*.032,.12,-.083,.009,.005,.003);ell(head,skin,side*.085,.09,0,.015,.025,.013);}
    tube(head,lip,[[-.022,.041,-.082],[0,.038,-.088],[.022,.041,-.082]],.0025);
    add(chest,loft([[.42,.1,.08],[.49,.095,.075]],sides),cloth);
  }
  if(def.style==='courier'){
    add(chest,loft([[.06,.158,.104],[.29,.2,.123],[.42,.213,.117]],sides,.75),dark);
    tube(chest,accent,[[-.18,.435,-.09],[-.10,.29,-.132],[0,.17,-.13],[.16,.02,-.11]],.021);
    const bag=box(hips,cloth,.18,-.035,.035,.14,.19,.12);bag.rotation.z=-.12;
    box(bag,strap,0,.06,-.066,.14,.025,.014);box(bag,metal,0,0,-.07,.025,.035,.008);
  }
  if(def.style==='rescue'||def.style==='alpine'){
    for(const side of [-1,1]){
      tube(chest,strap,[[side*.105,.01,-.11],[side*.14,.22,-.13],[side*.15,.43,-.08],[side*.15,.43,.075],[side*.1,.08,.105]],.018);
      box(chest,metal,side*.133,.25,-.147,.031,.043,.008);
      const carabiner=ring(hips,metal,side*.14,.01,-.125,.024,.004);carabiner.scale.y=1.4;carabiner.rotation.z=side*.25;
      tube(hips,strap,[[side*.055,-.1,-.08],[side*.12,-.15,-.08],[side*.19,-.1,0],[side*.12,-.08,.1]],.012);
    }
    const coil=part(chest,'rope coil',-.12,.18,.15);
    for(let j=0;j<6;j++){const r=ring(coil,accent,j*.006,0,0,.095+j*.001,.006);r.scale.x=.67;}
    box(coil,strap,0,.086,0,.055,.025,.04);
  }
  if(def.style==='medic'){
    add(chest,loft([[-.18,.175,.108],[.025,.153,.10],[.12,.146,.096]],sides,.76),cloth);
    for(const side of [-1,1])box(chest,dark,side*.12,-.035,-.11,.088,.12,.025);
    tube(chest,strap,[[.16,.44,-.08],[.075,.25,-.13],[-.02,.1,-.12],[-.16,-.1,-.1]],.023);
    const satchel=box(hips,cloth,-.21,-.13,.015,.14,.2,.11);satchel.rotation.z=.08;box(satchel,accent,0,0,-.061,.052,.052,.005);box(satchel,dark,0,0,-.065,.029,.007,.003);box(satchel,dark,0,0,-.065,.007,.029,.003);
  }
  if(def.style==='night'){
    const scarf=add(chest,loft([[.43,.086,.077],[.49,.085,.076],[.51,.073,.066]],sides),dark);
    tube(chest,accent,[[-.19,.4,-.09],[-.13,.42,-.095],[-.06,.44,-.078]],.004);
    box(chest,dark,0,.24,.14,.16,.29,.085);tube(chest,strap,[[-.08,.08,.115],[-.15,.39,.08],[-.15,.39,-.07],[-.08,.12,-.11]],.016);tube(chest,strap,[[.08,.08,.115],[.15,.39,.08],[.15,.39,-.07],[.08,.12,-.11]],.016);
  }
  if(def.style!=='night'&&def.style!=='courier'){box(chest,dark,.05,.23,.125,.15,.23,.065);box(chest,strap,.05,.26,.163,.15,.018,.007);}
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const shoulder=part(chest,(side<0?'left':'right')+' shoulder',side*(chestWidth+.012),.405,0);
    add(shoulder,garment([[.045,.026,.03,-side*.024,0],[.025,.066,.067,-side*.014,0],[-.025,.081,.078,-side*.004,0],[-.075,.083,.076],[-.13,.08,.073],[-.18,.076,.07,.003,0],[-.221,.072,.067,-.004,.002],[-.252,.069,.063],[-.28,.064,.058]],sides,.98,.003),def.style==='courier'?dark:cloth);
    const elbow=part(shoulder,'elbow',0,-.265,0),bare=false;
    ell(elbow,bare?skin:cloth,0,0,0,.06,.058,.055);
    add(elbow,garment([[.025,.064,.058],[-.015,.067,.062],[-.055,.066,.06],[-.1,.063,.055,.002,0],[-.145,.057,.049],[-.18,.051,.045,-.002,.003],[-.207,.043,.037],[-.225,.04,.035],[-.245,.033,.03]],sides,.97,.0025),bare?skin:cloth);
    if(bare){add(shoulder,loft([[-.23,.052,.053],[-.278,.052,.052]],sides),cloth);tube(shoulder,dark,[[-.04,-.256,-.034],[0,-.256,-.052],[.04,-.256,-.034]],.0025);}
    add(elbow,loft([[-.218,.032,.029],[-.248,.032,.029]],sides),dark);
    const hand=part(elbow,'hand',0,-.26,0);ell(hand,skin,0,-.031,-.004,.035,.055,.022);
    for(let f=0;f<4;f++){
      const xx=(f-1.5)*.016,yy=-.069+(f===0||f===3?.006:0),finger=part(hand,'finger '+f,xx,yy,-.003);
      ell(finger,skin,0,-.013,-.007,.008,.024,.008);ell(finger,skin,0,-.032,-.019,.007,.013,.008);
    }
    ell(hand,skin,side*.033,-.016,-.013,.012,.028,.013).rotation.z=side*.35;
    if(def.style==='medic'&&side===-1){add(shoulder,loft([[-.1,.0615,.0625],[-.155,.058,.059]],sides),accent);box(shoulder,dark,0,-.127,-.065,.025,.008,.004);box(shoulder,dark,0,-.127,-.065,.008,.025,.004);}
    if(hero){for(let k=0;k<3;k++)tube(shoulder,dark,[[-.04,-.18-k*.015,-.031],[0,-.174-k*.015,-.055],[.04,-.18-k*.015,-.031]],.0013);}
    arms.push({side,shoulder,elbow,hand});
    const hip=part(hips,(side<0?'left':'right')+' hip',side*.09,-.045,0);
    add(hip,garment([[.035,.094,.094],[-.035,.1,.099],[-.10,.099,.097],[-.17,.094,.094],[-.23,.087,.09,.004,0],[-.285,.08,.084,-.003,.003],[-.33,.073,.077],[-.39,.067,.069]],sides,.96,.003),dark);
    const knee=part(hip,'knee',0,-.385,0);ell(knee,dark,0,0,0,.067,.059,.065);
    add(knee,garment([[.018,.067,.066],[-.03,.069,.067],[-.075,.07,.069],[-.14,.073,.07,.002,.004],[-.21,.064,.064],[-.265,.056,.056,-.002,.002],[-.31,.049,.049],[-.35,.045,.044],[-.39,.039,.039]],sides,.96,.0026),dark);
    // Cargo pockets and selective reinforced knees create functional silhouettes.
    const pocket=box(hip,dark,side*.098,-.19,.016,.014,.125,.077);pocket.rotation.z=side*.025;
    box(hip,strap,side*.105,-.143,.016,.006,.015,.076);
    if(hero)for(let j=0;j<3;j++)tube(knee,dark,[[-.047,.015-j*.02,-.039],[0,.022-j*.02,-.063],[.047,.009-j*.02,-.039]],.0025);
    const ankle=part(knee,'ankle',0,-.385,0);
    add(ankle,loft([[-.058,.053,.112,0,-.04],[-.041,.056,.114,0,-.041],[-.031,.054,.111,0,-.04]],sides,.77),rubber);
    add(ankle,loft([[-.035,.052,.106,0,-.042],[-.014,.052,.102,0,-.039],[.009,.046,.086,0,-.027],[.035,.036,.051,0,-.005],[.055,.032,.033,0,.012]],sides,.92),def.style==='puffer'?accent:cloth);
    add(ankle,loft([[-.033,.048,.098,0,-.04],[-.021,.049,.097,0,-.038],[-.013,.045,.09,0,-.036]],sides,.8),dark);
    // Raised instep, separate tongue and heel counter. The sole remains exactly
    // on the existing gait contact plane; cosmetic work cannot alter foot IK.
    ell(ankle,cloth,0,.028,-.039,.031,.012,.045);
    tube(ankle,accent,[[side*.046,-.011,.028],[side*.052,-.009,-.026],[side*.042,-.025,-.102]],.0028);
    tube(ankle,dark,[[-.032,.033,.018],[0,.046,.039],[.032,.033,.018]],.003);
    if(hero)for(let j=0;j<5;j++)tube(ankle,accent,[[-.023,.033-j*.006,-.021-j*.011],[.023,.033-j*.006,-.021-j*.011]],.0014);
    legs.push({side,hip,knee,ankle});
  }
  const secondary=[];
  if(!civilian){
    const glove=material(def.secondary,.72,0,'none');
    const seam=material(def.accent,.85),reinforced=material(def.secondary,.68,.08);
    for(const side of [-1,1]){
      for(let i=0;i<5;i++)tube(chest,seam,[[side*(.134+i*.008),.33,-.119],[side*(.137+i*.008),.34,-.118]],.0012);
    }
    for(const {side,shoulder,elbow,hand}of arms){
      // Fingerless gloves retain the runner's skin tone, with padded knuckles,
      // seam piping and articulated wrist cuffs that follow the actual bones.
      ell(hand,glove,0,-.021,.001,.038,.042,.025);
      for(let i=0;i<4;i++)ell(hand,reinforced,(i-1.5)*.016,-.046,-.021,.008,.011,.004);
      tube(hand,seam,[[-.027,-.02,-.023],[0,-.026,-.029],[.027,-.02,-.023]],.0013);
      add(elbow,loft([[-.199,.044,.04],[-.228,.044,.039]],sides),glove);box(elbow,metal,side*.035,-.213,-.014,.009,.017,.019);
      if(def.style==='puffer')for(let i=0;i<3;i++)add(shoulder,loft([[-.04-i*.058,.09,.085],[-.073-i*.058,.089,.083]],sides),cloth);
      if(def.style==='vest'){
        add(shoulder,garment([[.009,.053,.067,-side*.008,0],[-.02,.076,.079],[-.075,.081,.077],[-.095,.075,.072]],sides,.93,.001),reinforced);
        add(elbow,loft([[-.065,.068,.063],[-.105,.064,.057],[-.16,.056,.051]],sides,.8),reinforced);
      }
      if(def.style==='hoodie')for(let i=0;i<4;i++)tube(shoulder,dark,[[side*.03,-.02-i*.026,-.077],[side*.072,-.032-i*.026,-.053]],.0014);
      if(def.style==='anorak'||def.style==='night'){
        tube(shoulder,accent,[[side*.03,-.02,-.075],[side*.052,-.12,-.061],[side*.04,-.21,-.057]],.0024);
        box(shoulder,glove,side*.064,-.13,-.026,.009,.067,.044);
      }
    }
    for(const {side,hip,knee,ankle}of legs){
      // Sculpted midsoles replace the flat-looking shoe edge; tread is kept
      // above the contact plane, including the grounded neutral stance.
      add(ankle,loft([[-.059,.052,.109,0,-.04],[-.049,.054,.113,0,-.04],[-.041,.055,.113,0,-.04]],sides,.77),accent);
      for(let i=0;i<5;i++)box(ankle,rubber,0,-.057,-.13+i*.043,.09,.007,.009);
      tube(ankle,dark,[[side*.05,-.027,.038],[side*.055,-.025,-.032],[side*.046,-.037,-.105]],.002);
      tube(hip,seam,[[side*.09,-.16,-.03],[side*.085,-.245,-.03]],.0015);
      if(def.style==='vest'||def.style==='anorak')ell(knee,reinforced,0,-.015,-.068,.066,.073,.022);
    }
    if(def.style==='shell')for(const side of [-1,1]){
      const tail=part(hips,'storm-shell split tail '+side,side*.081,-.025,.09);
      add(tail,loft([[.02,.082,.018],[-.12,.087,.021],[-.28,.09,.017],[-.345,.067,.014]],sides,.65),cloth);
      tube(tail,dark,[[side*.071,0,-.012],[side*.076,-.26,-.012],[side*.055,-.331,-.012]],.002);
      secondary.push({object:tail,x:.06,z:side*.025,idle:.01,run:.085,phase:side});
    }
    if(def.style==='night'){
      for(let i=0;i<3;i++)tube(chest,accent,[[-.057,.15+i*.04,.19],[.057,.15+i*.04,.19]],.004);
      for(const side of [-1,1])ring(chest,metal,side*.073,.12,.184,.018,.003);
    }
    if(def.style==='anorak'){
      const tab=part(chest,'zipper pull',.008,.364,-.132);box(tab,metal,0,-.013,0,.008,.026,.004);
      secondary.push({object:tab,x:0,z:0,idle:.01,run:.08,phase:1});
    }
    group.userData.silhouette=def.style+' / sculpted face cover / fitted hood / articulated tailoring / trail footwear';
  }
  group.scale.setScalar(def.height/1.765);
  const animate=createRunnerAnimator({group,hips,chest,head,arms,legs,secondary});
  const update=(time,state={})=>{
    const gait=animate(time,state);
    if(!civilian&&gait==='idle'){
      // A quiet asymmetric stance, with each foot solved back to the same
      // ground plane. Running/walking retain the existing planted-foot gait.
      const fade=1-(group.userData.animation?.blend||0);
      hips.position.y-=.012*fade;hips.rotation.y+=.025*fade;chest.rotation.y-=.045*fade;
      for(const leg of legs){
        const reachY=hips.position.y-.045-.061,z=leg.side<0?.025:-.032;
        const bend=Math.acos(clamp((reachY*reachY+z*z-2*.385*.385)/(2*.385*.385),-1,1));
        leg.hip.rotation.x=(Math.atan2(-z,reachY)+bend*.5)*fade;
        leg.knee.rotation.x=-bend*fade;leg.ankle.rotation.x=-leg.hip.rotation.x-leg.knee.rotation.x;
      }
      for(const arm of arms){arm.shoulder.rotation.x+=(arm.side<0?.04:-.045)*fade;arm.elbow.rotation.x+=(arm.side<0?.14:.08)*fade;arm.hand.rotation.y=arm.side*.08*fade;}
    }
    return gait;
  };
  update(0);
  const stats=finishRunnerBuild(group,resources);
  return {group,definition:def,update,stats,dispose(){for(const r of resources)r.dispose();for(const t of textures)t.dispose();group.removeFromParent();}};
}
