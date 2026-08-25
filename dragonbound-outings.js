/* Velmora: Dragonbound V34.09 — Go Out + reusable outing destination framework.
   First destination: The Lantern Nook Café (exterior, café interior, dragon garden).
   Uses the existing account-linked Bedroom keeper sprite and the live baby-dragon profile.
*/
(()=>{
  'use strict';
  if(window.__dragonboundOutingsV3409)return;
  window.__dragonboundOutingsV3409=true;

  const VERSION='34.09.7';
  const ASSET_ROOT='assets/dragonbound/outings/lantern-nook/';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const choose=a=>a?.length?a[Math.floor(Math.random()*a.length)]:null;
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const now=()=>performance.now();
  const pointInRect=(p,r,padX=0,padY=padX)=>p[0]>=r[0]-padX&&p[0]<=r[2]+padX&&p[1]>=r[1]-padY&&p[1]<=r[3]+padY;
  const rectCenter=r=>[(r[0]+r[2])/2,(r[1]+r[3])/2];
  const dist=(a,b)=>Math.hypot((a[0]-b[0])*1536,(a[1]-b[1])*1024);
  const isFormFocus=()=>{const el=document.activeElement;if(!el)return false;if(el.closest?.('.dragonbound-outing-context[hidden],.dragonbound-outings-overlay:not(.is-visible),.dragonbound-outing-destination:not(.is-visible)'))return false;return /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName||'')||!!el.isContentEditable;};

  const DESTINATIONS={
    'lantern-nook-cafe':{
      id:'lantern-nook-cafe',
      title:'The Lantern Nook Café',
      subtitle:'Dragon-friendly café · Play garden · Social',
      description:'A glasshouse café built for keepers and baby dragons, with cosy nests, play equipment and a lantern-lit garden.',
      preview:ASSET_ROOT+'exterior.png',
      startMap:'exterior',
      maps:{
        exterior:{
          id:'exterior',name:'Front Lawn',image:ASSET_ROOT+'exterior.png',
          keeperSpawn:[.50,.90],dragonSpawn:[.47,.94],guestSpawn:[.56,.91],
          bounds:[.025,.035,.975,.965],
          // V34.09.4: collisions are now footprints, not huge art rectangles.
          // Soft cushions/stools remain usable instead of becoming invisible walls.
          blocked:[
            [.18,.035,.465,.49],[.575,.035,.895,.49],[.465,.035,.575,.355],
            [.078,.505,.165,.565],[.205,.605,.285,.665],[.080,.715,.165,.775],
            [.805,.585,.945,.655],[.64,.77,.95,.93],
            [.00,.00,.04,1],[.96,.00,1,1]
          ],
          passages:[
            [.455,.34,.585,.515]
          ],
          transitions:[
            {id:'front-door',zone:[.455,.355,.585,.515],to:'interior',spawn:[.50,.76],dragonSpawn:[.47,.75],direction:'up'}
          ],
          interactions:[
            {id:'outside-cushion-green',name:'Green Floor Cushion',type:'rest',pos:[.69,.62],approach:[.64,.62],duration:[15,34],tags:['soft','rest','sleep','social']},
            {id:'outside-cushion-red',name:'Red Floor Cushion',type:'rest',pos:[.68,.70],approach:[.63,.70],duration:[15,34],tags:['soft','rest','sleep','social']},
            {id:'outside-table-left',name:'Garden Table',type:'inspect',pos:[.12,.535],approach:[.19,.55],duration:[5,10],tags:['table','social','food','curious']},
            {id:'outside-table-mid',name:'Garden Table',type:'inspect',pos:[.235,.635],approach:[.31,.65],duration:[5,10],tags:['table','social','food','curious']},
            {id:'outside-table-low',name:'Garden Table',type:'inspect',pos:[.12,.745],approach:[.20,.76],duration:[5,10],tags:['table','social','food','curious']},
            {id:'outside-herbs',name:'Herb Garden',type:'inspect',pos:[.76,.81],approach:[.62,.82],duration:[5,12],tags:['plants','curious','sniff']},
            {id:'outside-bench',name:'Garden Bench',type:'rest',pos:[.87,.63],approach:[.86,.70],duration:[10,26],tags:['rest','keeper','social']},
            {id:'outside-lawn',name:'Open Lawn',type:'play',pos:[.52,.70],approach:[.52,.70],duration:[8,18],tags:['play','zoomies','grass']}
          ],
          keeperSeats:[
            {id:'outside-bench-seat',name:'Garden Bench',pos:[.865,.625],approach:[.865,.705],facing:'down',kind:'bench'},
            {id:'outside-table-top-seat',name:'Café Stool',pos:[.115,.595],approach:[.115,.625],facing:'up',kind:'chair'},
            {id:'outside-table-mid-seat',name:'Café Stool',pos:[.235,.700],approach:[.235,.730],facing:'up',kind:'chair'},
            {id:'outside-table-low-seat',name:'Café Stool',pos:[.125,.810],approach:[.125,.840],facing:'up',kind:'chair'},
            {id:'outside-green-cushion-seat',name:'Green Floor Cushion',pos:[.69,.61],approach:[.64,.62],facing:'down',kind:'cushion'},
            {id:'outside-red-cushion-seat',name:'Red Floor Cushion',pos:[.68,.69],approach:[.63,.70],facing:'down',kind:'cushion'}
          ],
          roamPoints:[[.39,.56],[.47,.62],[.57,.56],[.58,.72],[.43,.76],[.35,.84],[.73,.73],[.73,.55],[.28,.54],[.25,.82],[.51,.89]]
        },
        interior:{
          id:'interior',name:'Main Café',image:ASSET_ROOT+'interior.png',
          keeperSpawn:[.50,.81],dragonSpawn:[.47,.85],guestSpawn:[.57,.84],
          bounds:[.055,.17,.945,.895],
          blocked:[
            [.145,.285,.705,.425],
            [.095,.405,.195,.465],[.095,.535,.195,.595],[.095,.675,.195,.735],
            [.605,.365,.715,.605],[.725,.405,.835,.605],[.865,.36,.895,.555],
            [.055,.83,.445,.895],[.565,.83,.945,.895],
            [.00,.00,.055,1],[.945,.00,1,1],[.055,.00,.945,.18]
          ],
          keeperBlocked:[
            [.69,.66,.77,.76],[.62,.75,.72,.84],[.83,.66,.92,.76]
          ],
          passages:[
            [.44,.765,.57,.915],
            // Direct keeper route from the central café floor, behind/across the
            // play-ramp edge and into the garden doorway. These overlapping
            // sections deliberately remove every collision seam on the approach.
            [.48,.45,.67,.60],[.58,.385,.85,.51],[.78,.19,.945,.60]
          ],
          transitions:[
            {id:'main-exit',zone:[.44,.79,.57,.915],to:'exterior',spawn:[.52,.55],dragonSpawn:[.49,.58],direction:'down'},
            {id:'garden-door',zone:[.78,.20,.94,.48],to:'garden',spawn:[.59,.25],dragonSpawn:[.56,.28],direction:'right'}
          ],
          interactions:[
            {id:'cafe-cushion-left',name:'Café Cushion',type:'rest',pos:[.105,.47],approach:[.08,.49],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-cushion-left-right',name:'Café Cushion',type:'rest',pos:[.205,.47],approach:[.23,.49],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-cushion-middle',name:'Café Cushion',type:'rest',pos:[.105,.605],approach:[.08,.625],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-cushion-middle-right',name:'Café Cushion',type:'rest',pos:[.205,.605],approach:[.235,.625],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-cushion-low',name:'Café Cushion',type:'rest',pos:[.105,.745],approach:[.08,.765],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-cushion-low-right',name:'Café Cushion',type:'rest',pos:[.205,.745],approach:[.235,.765],duration:[15,35],tags:['soft','rest','social','sleep']},
            {id:'cafe-table-top',name:'Café Table',type:'inspect',pos:[.145,.435],approach:[.25,.45],duration:[5,11],tags:['table','food','social','curious']},
            {id:'cafe-table-middle',name:'Café Table',type:'inspect',pos:[.145,.565],approach:[.25,.58],duration:[5,11],tags:['table','food','social','curious']},
            {id:'cafe-table-low',name:'Café Table',type:'inspect',pos:[.145,.705],approach:[.25,.72],duration:[5,11],tags:['table','food','social','curious']},
            {id:'cafe-big-cushion',name:'Lantern Floor Cushion',type:'rest',pos:[.44,.55],approach:[.44,.64],duration:[18,42],tags:['soft','rest','sleep','social']},
            {id:'cafe-ramp',name:'Dragon Play Ramp',type:'play',pos:[.665,.485],approach:[.575,.55],usePos:[.635,.52],duration:[10,22],tags:['play','training','energetic']},
            {id:'cafe-tunnel',name:'Dragon Play Tunnel',type:'play',pos:[.785,.50],approach:[.70,.62],usePos:[.77,.54],hideActor:true,duration:[9,20],tags:['play','hide','mischief']},
            {id:'cafe-hanging-toy',name:'Hanging Toy',type:'play',pos:[.885,.46],approach:[.91,.57],duration:[8,18],tags:['play','toy','curious']},
            {id:'cafe-nest-gold',name:'Gold Dragon Nest',type:'sleep',pos:[.73,.70],approach:[.76,.64],duration:[22,55],tags:['sleep','rest','nest']},
            {id:'cafe-nest-red',name:'Red Dragon Nest',type:'sleep',pos:[.67,.78],approach:[.67,.68],duration:[22,55],tags:['sleep','rest','nest']},
            {id:'cafe-nest-green',name:'Green Dragon Nest',type:'sleep',pos:[.86,.70],approach:[.86,.59],duration:[22,55],tags:['sleep','rest','nest']},
            {id:'cafe-counter',name:'Café Counter',type:'food',pos:[.46,.36],approach:[.46,.455],duration:[5,12],tags:['food','inspect','counter','curious']},
            {id:'cafe-display',name:'Pastry Display',type:'food',pos:[.61,.35],approach:[.61,.455],duration:[5,12],tags:['food','inspect','curious']},
            {id:'cafe-coffee-urn',name:'Copper Tea Urn',type:'inspect',pos:[.285,.31],approach:[.285,.455],duration:[5,11],tags:['food','inspect','curious']},
            {id:'cafe-windows-left',name:'Glasshouse Window',type:'inspect',pos:[.12,.29],approach:[.105,.35],duration:[5,11],tags:['window','calm','curious']},
            {id:'cafe-windows-right',name:'Glasshouse Window',type:'inspect',pos:[.79,.29],approach:[.79,.36],duration:[5,11],tags:['window','calm','curious']}
          ],
          keeperSeats:[
            {id:'cafe-top-left-seat',name:'Café Cushion',pos:[.105,.47],approach:[.08,.49],facing:'right',kind:'cushion'},
            {id:'cafe-top-right-seat',name:'Café Cushion',pos:[.205,.47],approach:[.24,.49],facing:'left',kind:'cushion'},
            {id:'cafe-middle-left-seat',name:'Café Cushion',pos:[.105,.605],approach:[.08,.625],facing:'right',kind:'cushion'},
            {id:'cafe-middle-right-seat',name:'Café Cushion',pos:[.205,.605],approach:[.24,.625],facing:'left',kind:'cushion'},
            {id:'cafe-low-left-seat',name:'Café Cushion',pos:[.105,.745],approach:[.08,.765],facing:'right',kind:'cushion'},
            {id:'cafe-low-right-seat',name:'Café Cushion',pos:[.205,.745],approach:[.24,.765],facing:'left',kind:'cushion'},
            {id:'cafe-big-cushion-seat',name:'Lantern Floor Cushion',pos:[.44,.55],approach:[.44,.64],facing:'down',kind:'cushion'}
          ],
          roamPoints:[[.30,.39],[.39,.44],[.49,.46],[.55,.62],[.38,.70],[.31,.80],[.53,.80],[.82,.82],[.89,.58],[.75,.58],[.80,.36]]
        },
        garden:{
          id:'garden',name:'Dragon Garden',image:ASSET_ROOT+'garden.png',
          keeperSpawn:[.59,.205],dragonSpawn:[.56,.235],guestSpawn:[.65,.23],
          bounds:[.025,.075,.975,.955],
          blocked:[
            [.075,.45,.32,.73],
            [.335,.425,.445,.60],[.475,.405,.555,.585],[.565,.425,.675,.61],
            [.05,.15,.30,.315],
            [.72,.68,.80,.75],
            [.73,.14,.94,.47],
            [.00,.00,.025,1],[.975,.00,1,1],[.025,.00,.545,.18],[.655,.00,.975,.18]
          ],
          keeperBlocked:[
            [.695,.34,.80,.46],[.865,.34,.965,.46],[.775,.43,.90,.56]
          ],
          passages:[
            [.535,.06,.675,.215]
          ],
          // The painted stone trail squeezes between the tunnel and nest/tree
          // artwork. Keep it open for the keeper without letting dragons ignore
          // those furniture collisions when roaming.
          keeperPassages:[
            [.58,.20,.70,.38],[.62,.30,.76,.58],
            [.66,.48,.84,.68],[.74,.58,.92,.88]
          ],
          transitions:[
            {id:'cafe-door',zone:[.535,.075,.675,.215],to:'interior',spawn:[.91,.44],dragonSpawn:[.92,.49],direction:'up'}
          ],
          interactions:[
            {id:'garden-pond',name:'Garden Pond',type:'water',pos:[.20,.60],approach:[.35,.62],usePos:[.285,.60],duration:[10,24],tags:['water','play','hygiene','curious']},
            {id:'garden-stones',name:'Stepping Stones',type:'play',pos:[.205,.59],approach:[.36,.64],usePos:[.275,.58],duration:[8,16],tags:['play','balance','curious']},
            {id:'garden-ramp',name:'Garden Play Ramp',type:'play',pos:[.395,.52],approach:[.31,.64],usePos:[.37,.54],duration:[10,22],tags:['play','training','energetic']},
            {id:'garden-hoop',name:'Dragon Hoop',type:'play',pos:[.515,.49],approach:[.515,.62],usePos:[.515,.55],duration:[8,18],tags:['play','training','energetic']},
            {id:'garden-tunnel',name:'Garden Tunnel',type:'play',pos:[.625,.52],approach:[.56,.63],usePos:[.62,.56],hideActor:true,duration:[9,20],tags:['play','hide','mischief']},
            {id:'garden-lantern-tree',name:'Lantern Tree',type:'rest',pos:[.82,.49],approach:[.70,.54],duration:[14,38],tags:['rest','calm','window','sleep','curious']},
            {id:'garden-gold-nest',name:'Gold Garden Nest',type:'sleep',pos:[.77,.40],approach:[.68,.64],duration:[22,58],tags:['sleep','rest','nest']},
            {id:'garden-red-nest',name:'Red Garden Nest',type:'sleep',pos:[.91,.40],approach:[.94,.49],duration:[22,58],tags:['sleep','rest','nest']},
            {id:'garden-green-nest',name:'Green Garden Nest',type:'sleep',pos:[.84,.49],approach:[.77,.58],duration:[22,58],tags:['sleep','rest','nest']},
            {id:'garden-table',name:'Garden Café Table',type:'rest',pos:[.755,.72],approach:[.67,.75],duration:[9,22],tags:['social','rest','keeper']},
            {id:'garden-herbs',name:'Herb Patch',type:'inspect',pos:[.18,.24],approach:[.31,.28],duration:[5,12],tags:['plants','curious','sniff']},
            {id:'garden-roaster',name:'Garden Roaster',type:'inspect',pos:[.245,.25],approach:[.31,.34],duration:[5,11],tags:['food','curious','inspect']},
            {id:'garden-grass',name:'Open Garden Lawn',type:'play',pos:[.47,.70],approach:[.47,.70],duration:[8,18],tags:['play','zoomies','grass']}
          ],
          keeperSeats:[
            {id:'garden-table-green-seat',name:'Green Café Cushion',pos:[.705,.755],approach:[.65,.76],facing:'right',kind:'cushion'},
            {id:'garden-table-red-seat',name:'Red Café Cushion',pos:[.81,.755],approach:[.86,.76],facing:'left',kind:'cushion'},
            {id:'garden-lantern-rest-seat',name:'Lantern Tree Rest',pos:[.71,.52],approach:[.68,.63],facing:'right',kind:'cushion'}
          ],
          roamPoints:[[.34,.26],[.46,.30],[.56,.31],[.67,.31],[.38,.67],[.52,.72],[.64,.70],[.30,.82],[.48,.88],[.69,.84],[.85,.82],[.68,.55]]
        }
      }
    }
  };

  const state={
    launcher:null,menu:null,destination:null,viewport:null,mapEl:null,mapImg:null,keeperEl:null,keeperImg:null,dragonEl:null,dragonImg:null,guestEl:null,guestImg:null,
    destinationId:'',mapId:'',keeper:[.5,.9],dragon:[.47,.94],guest:[.57,.9],keeperDir:'up',keeperState:'idle',keeperSeat:null,nearbySeat:null,dragonFacing:'right',guestFacing:'right',
    dragonMode:'follow',dragonState:'idle',dragonPath:[],dragonPathIndex:0,dragonTarget:null,dragonInteraction:null,dragonInteractionApproach:null,dragonInteractionUntil:0,dragonTween:null,nextRoamDecision:0,nextFollowRepath:0,dragonFarSince:0,recentNodeIds:[],
    guestState:'idle',guestPath:[],guestPathIndex:0,guestInteractionUntil:0,nextGuestDecision:0,nextGuestSocial:0,
    keys:{up:false,down:false,left:false,right:false},raf:0,lastT:0,keeperFrame:0,keeperFrameAt:0,dragonFrame:0,dragonFrameAt:0,dragonAnimKey:'',guestFrame:0,guestFrameAt:0,guestAnimKey:'',
    contextMenu:null,toast:null,thought:null,thoughtUntil:0,lastThoughtAt:0,transitioning:false,transitionLockUntil:0,debug:false,debugLayer:null,seatLayer:null,actionPrompt:null,previousFocus:null
  };

  const activeDestination=()=>DESTINATIONS[state.destinationId]||null;
  const activeMap=()=>activeDestination()?.maps?.[state.mapId]||null;
  const homeActor=()=>window.DragonboundBabyEngine?.actor||null;
  const dragonProfile=()=>homeActor()?.dragon||null;
  const dragonDef=()=>{const d=dragonProfile();return d?window.DragonboundBabyRegistry?.[d.breedId]||null:null;};
  const KEEPER_ACCOUNT_MAP=Object.freeze({
    covidpanda:'covidpanda',emlux:'emlux',kat:'kat',proco:'proco',smokedrope1028:'smokedrope1028',catasthma:'catasthma'
  });
  const normaliseKeeperName=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  function currentKeeperAccount(){
    // IMPORTANT: the Bedroom API can still contain its default/previous local state
    // before the bedroom has been opened. Always resolve the authenticated account
    // first, otherwise an outing can incorrectly inherit another keeper.
    const candidates=[];
    try{if(typeof character!=='undefined'&&character)candidates.push(character.username,character.displayName);}catch(_e){}
    try{candidates.push(window.currentUser?.username,window.currentUser?.displayName);}catch(_e){}
    candidates.push(document.getElementById('passportUsername')?.textContent);
    for(const value of candidates){
      const key=normaliseKeeperName(value);
      if(KEEPER_ACCOUNT_MAP[key])return key;
    }
    return '';
  }
  const keeperSheetId=()=>{
    const account=currentKeeperAccount();
    if(account)return KEEPER_ACCOUNT_MAP[account];
    // Bedroom state is only a last-resort fallback when no account identity exists.
    try{
      const sheet=normaliseKeeperName(window.VelmoraBedroom?.state?.()?.player?.sheetId);
      if(Object.values(KEEPER_ACCOUNT_MAP).includes(sheet))return sheet;
    }catch(_e){}
    return 'catasthma';
  };
  const keeperFrame=(dir,moving,frame)=>{
    const sheet=keeperSheetId();let row=0,col=0,flip=false;
    if(moving){if(dir==='down'){row=1;col=frame%4;}else if(dir==='up'){row=2;col=frame%4;}else{row=3;col=frame%4;flip=dir==='left';}}
    else if(dir==='down'){row=0;col=0;}else if(dir==='up'){row=0;col=2;}else if(dir==='left'){row=0;col=3;}else{row=0;col=1;}
    return{src:`assets/bedroom/keepers/${sheet}/r${row}_c${col}.png?v=v33-32-covidpanda-keeper-hotfix-20260822`,flip};
  };

  function isBlocked(map,p,entity='keeper'){
    if(!map)return true;
    const b=map.bounds||[0,0,1,1];if(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3])return true;
    // Door corridors explicitly carve through wall/collision footprints. This keeps
    // transitions reachable even when the visual doorway overlaps a larger prop.
    const passages=entity==='keeper'?[...(map.passages||[]),...(map.keeperPassages||[])]:map.passages||[];
    if(passages.some(r=>pointInRect(p,r)))return false;
    const px=(entity==='keeper'?19:15)/1536,py=(entity==='keeper'?14:11)/1024;
    const extra=entity==='keeper'?(map.keeperBlocked||[]):(map.dragonBlocked||[]);
    for(const r of [...(map.blocked||[]),...extra])if(pointInRect(p,r,px,py))return true;
    return false;
  }
  function nearestValid(map,p,entity='dragon'){
    if(!isBlocked(map,p,entity))return p.slice();
    for(let ring=1;ring<=18;ring++)for(let i=0;i<24;i++){
      const a=Math.PI*2*i/24,r=ring*.0105,q=[clamp(p[0]+Math.cos(a)*r,.03,.97),clamp(p[1]+Math.sin(a)*r,.05,.95)];
      if(!isBlocked(map,q,entity))return q;
    }
    return (map[entity==='keeper'?'keeperSpawn':'dragonSpawn']||[.5,.8]).slice();
  }

  function gridPath(map,start,end,entity='dragon'){
    const target=nearestValid(map,end,entity),cols=52,rows=34,key=(x,y)=>y*cols+x;
    const point=(x,y)=>[(x+.5)/cols,(y+.5)/rows];
    const toCell=p=>[clamp(Math.floor(p[0]*cols),0,cols-1),clamp(Math.floor(p[1]*rows),0,rows-1)];
    const [sx,sy]=toCell(start),[tx,ty]=toCell(target),startK=key(sx,sy),targetK=key(tx,ty);
    const queue=[[sx,sy]],came=new Map([[startK,null]]);let qi=0;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
    while(qi<queue.length&&queue.length<cols*rows){const [x,y]=queue[qi++],k=key(x,y);if(k===targetK)break;
      for(const [dx,dy]of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const nk=key(nx,ny);if(came.has(nk))continue;const p=point(nx,ny);if(isBlocked(map,p,entity))continue;if(dx&&dy){if(isBlocked(map,point(x+dx,y),entity)||isBlocked(map,point(x,y+dy),entity))continue;}came.set(nk,k);queue.push([nx,ny]);}}
    if(!came.has(targetK))return[];
    const rev=[];let k=targetK;while(k!==startK&&k!=null){const x=k%cols,y=Math.floor(k/cols);rev.push(point(x,y));k=came.get(k);}rev.reverse();
    if(!rev.length)return dist(start,target)<14?[]:[target];rev[rev.length-1]=target;
    const out=[];let lastDir='';for(let i=0;i<rev.length;i++){const prev=i?rev[i-1]:start,dx=Math.sign(Math.round((rev[i][0]-prev[0])*1000)),dy=Math.sign(Math.round((rev[i][1]-prev[1])*1000)),d=`${dx},${dy}`;if(i===rev.length-1||d!==lastDir)out.push(rev[i]);else out[out.length-1]=rev[i];lastDir=d;}return out;
  }


  function traits(){const a=homeActor();return [...(a?.signatureTraits||[]),...(a?.assignedTraits||[]),...(a?.discoveredTraits||[])].map(v=>String(v).toLowerCase());}
  function hasTrait(...names){const t=traits();return names.some(name=>t.some(v=>v.includes(String(name).toLowerCase())));}
  function preferenceTypes(){try{return(homeActor()?.dailyPreferenceSummary?.()?.preferences||[]).map(v=>String(v.type||v.preferenceType||v.label||'').toLowerCase());}catch(_e){return[];}}
  function moodName(){const a=homeActor();return String(a?.dailyMood?.mood||a?.moodSummary?.()?.name||'').toLowerCase();}

  function interactionWeight(node){
    const a=homeActor(),c=a?.coreStats||{},needs=a?.needs||{},tags=node.tags||[],type=node.type;let w=1;
    if(type==='sleep'||type==='rest')w+=Math.max(0,Number(needs.rest||0))/24+Number(c.sleepiness||50)/65;
    if(type==='play')w+=Math.max(0,Number(needs.stimulation||0))/22+Number(c.playfulness||50)/65+Number(c.energy||50)/120;
    if(type==='inspect')w+=Number(c.curiosity||50)/48;
    if(type==='food')w+=Number(c.appetite||50)/40+Math.max(0,Number(needs.hunger||0))/28;
    if(type==='water')w+=Number(needs.hygiene||0)/35+Number(c.curiosity||50)/90;
    if(tags.includes('keeper')&&hasTrait('affectionate','clingy'))w+=1.2;
    if(tags.includes('play')&&hasTrait('playful','energetic','hyper'))w+=1.7;
    if(tags.includes('sleep')&&hasTrait('lazy','sleepy','deep sleeper','professional napper'))w+=1.7;
    if(tags.includes('curious')&&hasTrait('curious','adventurous','furniture inspector'))w+=1.4;
    if(tags.includes('food')&&hasTrait('food obsessed','foodie','food goblin','greedy'))w+=2.2;
    if(tags.includes('hide')&&hasTrait('shy','nervous','mischievous'))w+=1.25;
    if(tags.includes('training')&&hasTrait('competitive','energetic'))w+=1.25;
    const prefs=preferenceTypes();if(prefs.some(v=>v.includes('toy')||v.includes('play'))&&tags.includes('play'))w+=1.2;if(prefs.some(v=>v.includes('nap')||v.includes('comfort'))&&(tags.includes('sleep')||tags.includes('rest')))w+=1.15;if(prefs.some(v=>v.includes('bath'))&&type==='water')w+=1.1;
    const mood=moodName();if(['bouncy','playful','restless'].includes(mood)&&tags.includes('play'))w+=1;if(mood==='sleepy'&&(tags.includes('sleep')||tags.includes('rest')))w+=1.3;if(mood==='curious'&&tags.includes('curious'))w+=1;if(mood==='relaxed'&&tags.includes('rest'))w+=.8;
    if(state.recentNodeIds.includes(node.id))w*=.24;
    return Math.max(.1,w*rand(.78,1.22));
  }

  function weightedInteraction(map){
    const nodes=(map.interactions||[]).filter(n=>Array.isArray(n.pos)&&n.pos.length===2);if(!nodes.length)return null;
    const scored=nodes.map(n=>[n,interactionWeight(n)]),total=scored.reduce((s,v)=>s+v[1],0);let r=Math.random()*total;for(const [n,w]of scored){r-=w;if(r<=0)return n;}return scored.at(-1)?.[0]||null;
  }

  function setDragonPath(target,{mode='walk'}={}){
    const map=activeMap();if(!map)return false;const safe=nearestValid(map,target,'dragon'),path=gridPath(map,state.dragon,safe,'dragon');
    if(!path.length&&dist(state.dragon,safe)>18)return false;
    state.dragonPath=path;state.dragonPathIndex=0;state.dragonTarget=safe;state.dragonState=mode;return true;
  }
  function setGuestPath(target){const map=activeMap();if(!map)return false;const safe=nearestValid(map,target,'dragon'),path=gridPath(map,state.guest,safe,'dragon');if(!path.length&&dist(state.guest,safe)>18)return false;state.guestPath=path;state.guestPathIndex=0;state.guestState='walk';return true;}

  function followTarget(){
    const offset={up:[0,.095],down:[0,-.095],left:[.076,0],right:[-.076,0]}[state.keeperDir]||[0,.09];
    return nearestValid(activeMap(),[state.keeper[0]+offset[0],state.keeper[1]+offset[1]],'dragon');
  }

  function interactionState(node){
    if(node?.type==='sleep')return'sleep';
    if(node?.type==='rest'||node?.type==='water')return'rest';
    if(node?.type==='play')return'play';
    return'look';
  }
  function beginDragonTween(to,duration=240,afterState='idle'){
    const target=Array.isArray(to)?to.slice():state.dragon.slice(),from=state.dragon.slice(),t=now();
    state.dragonTween={from,to:target,start:t,end:t+Math.max(80,duration),afterState};state.dragonState='walk';state.dragonPath=[];state.dragonPathIndex=0;
  }
  function tickDragonTween(t){
    const tw=state.dragonTween;if(!tw)return false;const span=Math.max(1,tw.end-tw.start),raw=clamp((t-tw.start)/span,0,1),e=raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2;
    state.dragon[0]=tw.from[0]+(tw.to[0]-tw.from[0])*e;state.dragon[1]=tw.from[1]+(tw.to[1]-tw.from[1])*e;
    const dx=tw.to[0]-tw.from[0];if(Math.abs(dx)>.002)state.dragonFacing=dx>=0?'right':'left';
    if(raw>=1){state.dragon=tw.to.slice();state.dragonState=tw.afterState||'idle';state.dragonTween=null;return false;}return true;
  }
  function nodeUsesOccupancyPoint(node){
    const tags=node?.tags||[];
    return !!node?.usePos||node?.occupy===true||node?.type==='sleep'||node?.type==='rest'||node?.type==='water'||tags.some(t=>['soft','nest','hide'].includes(t));
  }
  function startInteraction(node,approach=null){
    if(!node)return;const map=activeMap(),safeApproach=(approach||nearestValid(map,node.approach||node.pos,'dragon')).slice(),usePoint=(node.usePos||node.pos||safeApproach).slice(),finalState=interactionState(node);
    state.dragonInteraction=node;state.dragonInteractionApproach=safeApproach;
    const range=node.duration||[6,14],enterMs=nodeUsesOccupancyPoint(node)&&dist(state.dragon,usePoint)>8?clamp(dist(state.dragon,usePoint)*2.15,150,420):0;
    if(enterMs)beginDragonTween(usePoint,enterMs,finalState);else state.dragonState=finalState;
    state.dragonInteractionUntil=now()+enterMs+rand(range[0],range[1])*1000;state.dragonPath=[];state.dragonPathIndex=0;
    const phrases={sleep:['This looks comfy.','Nap spot found.'],rest:['I like it here.','This is nice.'],play:['Look at this!','Again!'],food:['That smells GOOD.','Surely there are snacks.'],inspect:['What is this?','Interesting...'],water:['Splash?','Water!']}[node.type]||[];
    if(Math.random()<.28)showThought(choose(phrases)||node.name,3600);
  }
  function finishInteraction(reason='done'){
    const node=state.dragonInteraction;if(!node)return;const approach=state.dragonInteractionApproach?.slice?.()||null;state.dragonInteraction=null;state.dragonInteractionApproach=null;state.dragonInteractionUntil=0;
    if(reason==='done'&&approach&&dist(state.dragon,approach)>12)beginDragonTween(approach,clamp(dist(state.dragon,approach)*1.8,140,330),'idle');
    else{state.dragonTween=null;if(approach&&isBlocked(activeMap(),state.dragon,'dragon'))state.dragon=approach;state.dragonState='idle';}
    state.recentNodeIds=[node.id,...state.recentNodeIds.filter(id=>id!==node.id)].slice(0,4);state.nextRoamDecision=now()+rand(1800,4600);
    const a=homeActor();try{
      if(a&&reason==='done'){
        if(node.type==='sleep')a.applyCareBenefit?.('energy',3.2);
        else if(node.type==='rest')a.applyCareBenefit?.('comfort',1.5);
        else if(node.type==='play')a.applyCareBenefit?.('fun',2.2);
        else if(node.type==='water'){a.applyCareBenefit?.('fun',1.1);a.applyCareBenefit?.('hygiene',1.4);}
        a.noteUniverseActivity?.(`outing:${node.type}`,{name:node.name});a.behaviourDirty=true;window.DragonboundBabyEngine?.saveBehaviourLocal?.();
        const name=a.dragon?.name||'Your dragon',special={
          'cafe-tunnel':['The Tunnel Problem',`${name} disappeared into the Lantern Nook play tunnel and seemed to reconsider ever coming out.`],
          'garden-tunnel':['The Tunnel Problem',`${name} disappeared into the garden tunnel and came out looking extremely pleased with the decision.`],
          'cafe-counter':['Counter Negotiations',`${name} spent several increasingly obvious moments studying the Lantern Nook café counter.`],
          'cafe-display':['Pastry Surveillance',`${name} inspected the pastry display with the seriousness of an official investigation.`],
          'garden-lantern-tree':['The Perfect Nap',`${name} found the lantern tree and briefly abandoned every other plan for the outing.`],
          'garden-pond':['Pond Discovery',`${name} discovered the garden pond and decided water required immediate investigation.`],
          'garden-grass':['Café Zoomies',`${name} discovered that the Lantern Nook garden contained considerably more running space than expected.`]
        }[node.id];
        if(special&&Math.random()<.16)a.rememberLifeEvent?.('outing',special[0],special[1],`outing-${state.mapId}-${node.id}`);
      }
    }catch(_e){}
  }


  function chooseRoamAction(){
    const map=activeMap();if(!map)return;const urgent=homeActor()?.needs||{};
    const pick=()=>{let node=null;if(Number(urgent.rest||0)>80)node=weightedByTag(map,'sleep');else if(Number(urgent.stimulation||0)>80)node=weightedByTag(map,'play');else if(Number(urgent.hygiene||0)>84)node=weightedByType(map,'water');return node||(Math.random()<.72?weightedInteraction(map):null);};
    for(let attempt=0;attempt<6;attempt++){
      const node=pick();if(!node)break;const approach=nearestValid(map,node.approach||node.pos,'dragon'),path=gridPath(map,state.dragon,approach,'dragon');
      if((path.length||dist(state.dragon,approach)<=18)){state.dragonPath=path;state.dragonPathIndex=0;state.dragonTarget={node,approach};state.dragonState=path.length?'walk':'idle';state.nextRoamDecision=now()+rand(10000,21000);return;}
      state.recentNodeIds=[node.id,...state.recentNodeIds].slice(0,4);
    }
    const candidates=(map.roamPoints||[]).slice().sort(()=>Math.random()-.5);for(const p of candidates){if(setDragonPath([p[0]+rand(-.018,.018),p[1]+rand(-.014,.014)])){state.dragonTarget={wander:true};break;}}
    state.nextRoamDecision=now()+rand(8000,16000);
  }
  function weightedByTag(map,tag){const arr=(map.interactions||[]).filter(n=>(n.tags||[]).includes(tag));if(!arr.length)return null;const fresh=arr.filter(n=>!state.recentNodeIds.includes(n.id));return choose(fresh.length?fresh:arr);}
  function weightedByType(map,type){const arr=(map.interactions||[]).filter(n=>n.type===type);if(!arr.length)return null;const fresh=arr.filter(n=>!state.recentNodeIds.includes(n.id));return choose(fresh.length?fresh:arr);}


  function renderMasks(map){
    const holder=state.mapEl?.querySelector('.dragonbound-outing-mask-layer');if(!holder)return;holder.replaceChildren();
    // Broad rectangular background clones created obvious square cut-outs over
    // characters. Only explicitly reviewed precision masks may render now.
    (map.masks||[]).filter(m=>m?.precision===true).forEach((m,i)=>{
      const img=document.createElement('img');img.src=map.image;img.alt='';img.className='dragonbound-outing-mask';
      img.style.clipPath=`polygon(${m.poly})`;img.style.zIndex=String(1004+Math.round((m.depthY||.5)*1000));img.dataset.mask=String(i);holder.appendChild(img);
    });
  }

  function renderDebug(map){
    if(!state.debugLayer)return;state.debugLayer.replaceChildren();state.debugLayer.hidden=!state.debug;if(!state.debug)return;
    for(const r of [...(map.blocked||[]),...(map.keeperBlocked||[])]){const el=document.createElement('i');el.className='is-blocked';el.style.left=`${r[0]*100}%`;el.style.top=`${r[1]*100}%`;el.style.width=`${(r[2]-r[0])*100}%`;el.style.height=`${(r[3]-r[1])*100}%`;state.debugLayer.appendChild(el);}
    for(const r of [...(map.passages||[]),...(map.keeperPassages||[])]){const el=document.createElement('i');el.className='is-passage';el.style.left=`${r[0]*100}%`;el.style.top=`${r[1]*100}%`;el.style.width=`${(r[2]-r[0])*100}%`;el.style.height=`${(r[3]-r[1])*100}%`;state.debugLayer.appendChild(el);}
    for(const t of map.transitions||[]){const r=t.zone,el=document.createElement('i');el.className='is-transition';el.style.left=`${r[0]*100}%`;el.style.top=`${r[1]*100}%`;el.style.width=`${(r[2]-r[0])*100}%`;el.style.height=`${(r[3]-r[1])*100}%`;state.debugLayer.appendChild(el);}
    for(const n of map.interactions||[]){const el=document.createElement('b');el.className='is-node';el.style.left=`${n.pos[0]*100}%`;el.style.top=`${n.pos[1]*100}%`;el.title=n.name;state.debugLayer.appendChild(el);}
    for(const seat of map.keeperSeats||[]){const el=document.createElement('b');el.className='is-seat';el.style.left=`${seat.pos[0]*100}%`;el.style.top=`${seat.pos[1]*100}%`;el.title=seat.name;state.debugLayer.appendChild(el);}
  }

  function renderKeeperSeats(map){
    if(!state.seatLayer)return;state.seatLayer.replaceChildren();for(const seat of map.keeperSeats||[]){const btn=document.createElement('button');btn.type='button';btn.className='dragonbound-outing-seat-hotspot';btn.setAttribute('aria-label',`Sit on ${seat.name}`);btn.title=`Sit · ${seat.name}`;btn.style.left=`${seat.pos[0]*100}%`;btn.style.top=`${seat.pos[1]*100}%`;btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();tryUseKeeperSeat(seat);});state.seatLayer.appendChild(btn);}
  }
  function nearestKeeperSeat(){
    const map=activeMap(),seats=map?.keeperSeats||[];if(!seats.length)return null;let best=null,bestD=Infinity;for(const seat of seats){const d=dist(state.keeper,seat.approach||seat.pos);if(d<bestD){bestD=d;best=seat;}}return bestD<=105?best:null;
  }
  function updateKeeperActionPrompt(){
    if(!state.actionPrompt)return;if(state.keeperSeat){state.actionPrompt.hidden=false;state.actionPrompt.innerHTML='<kbd>E</kbd><span>Stand up</span>';return;}
    const seat=nearestKeeperSeat();state.nearbySeat=seat;if(!seat){state.actionPrompt.hidden=true;return;}state.actionPrompt.hidden=false;state.actionPrompt.innerHTML=`<kbd>E</kbd><span>Sit · ${esc(seat.name)}</span>`;
  }
  function tryUseKeeperSeat(seat=state.nearbySeat){
    if(!seat)return false;const d=dist(state.keeper,seat.approach||seat.pos);if(d>120){showToast('Move a little closer to sit down.',1800);return false;}
    state.keys={up:false,down:false,left:false,right:false};state.keeperSeat=seat;state.keeperState='sit';state.keeper=seat.pos.slice();state.keeperDir=seat.facing||'down';state.keeperEl?.classList.add('is-seated');state.keeperEl?.setAttribute('data-seat-kind',seat.kind||'chair');state.keeperFrameAt=0;updateKeeperActionPrompt();renderAll(true);return true;
  }
  function standKeeper({silent=false}={}){
    if(!state.keeperSeat)return false;const seat=state.keeperSeat,map=activeMap(),stand=nearestValid(map,seat.approach||[seat.pos[0],seat.pos[1]+.04],'keeper');state.keeper=stand;state.keeperSeat=null;state.keeperState='idle';state.keeperEl?.classList.remove('is-seated');state.keeperEl?.removeAttribute('data-seat-kind');state.keeperFrameAt=0;if(!silent)showToast('Back on your feet.',1200);updateKeeperActionPrompt();return true;
  }


  function ensureLauncher(){
    const scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');if(!scene)return null;
    let el=scene.querySelector('.dragonbound-go-out-launcher');

    // V34.09.2: use the same non-<button> launcher pattern as the existing
    // Calendar control. The home scene intentionally has pointer-events:none
    // and this avoids site-wide button skins/capture handlers swallowing it.
    if(el && el.tagName==='BUTTON'){
      const replacement=document.createElement('div');
      replacement.className='dragonbound-go-out-launcher';
      el.replaceWith(replacement);
      el=replacement;
    }
    if(!el){
      el=document.createElement('div');
      el.className='dragonbound-go-out-launcher';
      scene.appendChild(el);
    }
    el.setAttribute('role','button');
    el.tabIndex=0;
    el.setAttribute('aria-label','Go out with your dragon');
    el.setAttribute('title','Go out with your dragon');
    el.dataset.dragonboundGoOut='true';
    el.innerHTML='<span class="dragonbound-go-out-icon" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="10.2"></circle><path d="M20.9 10.7l-3.1 7.1-7.1 3.1 3.1-7.1 7.1-3.1z"></path><circle cx="16" cy="16" r="1.8"></circle></svg></span><span class="dragonbound-go-out-copy"><small>OUTINGS</small><strong>Go out</strong><em>Explore Velmora</em></span>';

    // Direct target listener mirrors Calendar. Capture delegation below remains
    // as a second route, so a home-scene capture handler cannot eat the click.
    if(el.dataset.outingBound!=='1'){
      el.dataset.outingBound='1';
      el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openMenu();},true);
      el.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();openMenu();}
      },true);
    }
    state.launcher=el;
    return el;
  }

  function ensureMenu(){
    if(state.menu?.isConnected){
      // Mount at document.body so transformed/overflow-hidden Dragonbound ancestors cannot clip it.
      if(state.menu.parentElement!==document.body)document.body.appendChild(state.menu);
      return state.menu;
    }
    const root=document.body,el=document.createElement('div');el.className='dragonbound-outings-overlay';el.setAttribute('aria-hidden','true');
    el.innerHTML=`<div class="dragonbound-outings-backdrop"></div><section class="dragonbound-outings-panel" role="dialog" aria-modal="true" aria-labelledby="dragonboundOutingsTitle"><button type="button" class="dragonbound-outings-close" aria-label="Close outings">×</button><header><small>DRAGONBOUND OUTINGS</small><h2 id="dragonboundOutingsTitle">Go out</h2><p>Take your dragon somewhere in Velmora.</p></header><div class="dragonbound-outings-list"></div></section>`;root.appendChild(el);state.menu=el;
    el.querySelector('.dragonbound-outings-backdrop').addEventListener('click',closeMenu);el.querySelector('.dragonbound-outings-close').addEventListener('click',closeMenu);return el;
  }
  function renderMenu(){const el=ensureMenu(),list=el.querySelector('.dragonbound-outings-list');list.innerHTML=Object.values(DESTINATIONS).map(d=>`<article class="dragonbound-outing-card"><div class="dragonbound-outing-card-art"><img src="${esc(d.preview)}" alt="${esc(d.title)}"></div><div class="dragonbound-outing-card-copy"><small>AVAILABLE NOW</small><h3>${esc(d.title)}</h3><b>${esc(d.subtitle)}</b><p>${esc(d.description)}</p><button type="button" data-outing-visit="${esc(d.id)}">VISIT</button></div></article>`).join('');list.querySelectorAll('[data-outing-visit]').forEach(btn=>btn.addEventListener('click',()=>visit(btn.dataset.outingVisit)));}
  function openMenu(){
    try{
      ensureLauncher();
      renderMenu();
      const el=ensureMenu();
      state.previousFocus=document.activeElement;
      document.body.classList.add('dragonbound-outings-menu-open');
      el.classList.add('is-visible');
      el.setAttribute('aria-hidden','false');
      requestAnimationFrame(()=>el.querySelector('[data-outing-visit]')?.focus({preventScroll:true}));
    }catch(err){
      console.error('[Dragonbound Outings] Could not open Go out menu',err);
    }
  }
  function closeMenu(){const el=state.menu;if(!el)return;el.classList.remove('is-visible');el.setAttribute('aria-hidden','true');document.body.classList.remove('dragonbound-outings-menu-open');try{state.previousFocus?.focus?.({preventScroll:true});}catch(_e){}}

  function ensureDestination(){
    if(state.destination?.isConnected){if(state.destination.parentElement!==document.body)document.body.appendChild(state.destination);return state.destination;}const root=document.body,el=document.createElement('div');el.className='dragonbound-outing-destination';el.setAttribute('aria-hidden','true');
    el.innerHTML=`<div class="dragonbound-outing-shell"><header class="dragonbound-outing-topbar"><div><small>GO OUT · THE LANTERN NOOK CAFÉ</small><strong data-outing-map-title>Front Lawn</strong></div><div class="dragonbound-outing-top-actions"><span data-outing-mode>Following You</span><button type="button" data-outing-home>Return Home</button></div></header><div class="dragonbound-outing-viewport"><div class="dragonbound-outing-map"><img class="dragonbound-outing-background" alt=""><div class="dragonbound-outing-world-layer"><div class="dragonbound-outing-keeper" aria-label="Your keeper"><img alt=""></div><button type="button" class="dragonbound-outing-dragon" aria-label="Your dragon"><img alt=""></button><div class="dragonbound-outing-guest" hidden aria-hidden="true"><img alt=""></div><div class="dragonbound-outing-seat-layer"></div><div class="dragonbound-outing-mask-layer" aria-hidden="true"></div><div class="dragonbound-outing-debug-layer" hidden aria-hidden="true"></div><div class="dragonbound-outing-thought" hidden></div><div class="dragonbound-outing-pet-effect" aria-hidden="true"></div><div class="dragonbound-outing-action-prompt" hidden></div></div></div></div><div class="dragonbound-outing-controls"><span><b>WASD</b> Move keeper</span><span><b>E</b> Sit / stand</span><span><b>CLICK DRAGON</b> Pet · Call · Roam</span><span data-outing-location>Lantern Nook · Front Lawn</span></div><div class="dragonbound-outing-context" hidden aria-hidden="true"></div><div class="dragonbound-outing-toast" aria-live="polite"></div><div class="dragonbound-outing-fade" aria-hidden="true"></div></div>`;root.appendChild(el);state.destination=el;state.viewport=el.querySelector('.dragonbound-outing-viewport');state.mapEl=el.querySelector('.dragonbound-outing-map');state.mapImg=el.querySelector('.dragonbound-outing-background');state.keeperEl=el.querySelector('.dragonbound-outing-keeper');state.keeperImg=state.keeperEl.querySelector('img');state.dragonEl=el.querySelector('.dragonbound-outing-dragon');state.dragonImg=state.dragonEl.querySelector('img');state.guestEl=el.querySelector('.dragonbound-outing-guest');state.guestImg=state.guestEl.querySelector('img');state.contextMenu=el.querySelector('.dragonbound-outing-context');state.toast=el.querySelector('.dragonbound-outing-toast');state.thought=el.querySelector('.dragonbound-outing-thought');state.debugLayer=el.querySelector('.dragonbound-outing-debug-layer');state.seatLayer=el.querySelector('.dragonbound-outing-seat-layer');state.actionPrompt=el.querySelector('.dragonbound-outing-action-prompt');
    el.querySelector('[data-outing-home]').addEventListener('click',leave);state.dragonEl.addEventListener('click',e=>{e.stopPropagation();openDragonMenu();});state.mapEl.addEventListener('click',()=>closeDragonMenu());return el;
  }

  function buildDragonMenu(){
    const d=dragonProfile(),name=d?.name||'Your Dragon',roam=state.dragonMode==='roam';state.contextMenu.innerHTML=`<div class="dragonbound-outing-context-head"><div><small>YOUR DRAGON</small><strong>${esc(name)}</strong></div><span>${roam?'ROAMING FREE':'FOLLOWING YOU'}</span></div><div class="dragonbound-outing-context-actions"><button type="button" data-action="pet"><b>Pet</b><small>Bond</small></button><button type="button" data-action="call"><b>Call Over</b><small>Come here</small></button><button type="button" class="is-primary" data-action="${roam?'follow':'roam'}"><b>${roam?'Follow Me':'Roam Free'}</b><small>${roam?'Stay close':'Explore'}</small></button><button type="button" data-action="treat"><b>Dragon Bites</b><small>Treat</small></button><button type="button" class="is-wide" data-action="profile"><b>View Dragon</b><small>Open Dragonbound Book</small></button></div>`;
    state.contextMenu.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();handleDragonAction(btn.dataset.action);}));
  }
  function buildOutingTreatConfirm(){
    const name=dragonProfile()?.name||'your dragon';state.contextMenu.innerHTML=`<div class="dragonbound-outing-context-head"><strong>Dragon Bites</strong><small>OUTING TREAT</small></div><div class="dragonbound-outing-context-confirm"><p>Spend <b>200 GP</b> on a Dragon Bite for ${esc(name)}?</p><div><button type="button" data-outing-treat-yes>Yes — 200 GP</button><button type="button" data-outing-treat-back>Not right now</button></div></div>`;
    state.contextMenu.querySelector('[data-outing-treat-back]')?.addEventListener('click',e=>{e.stopPropagation();buildDragonMenu();});
    state.contextMenu.querySelector('[data-outing-treat-yes]')?.addEventListener('click',async e=>{e.stopPropagation();const yes=e.currentTarget;yes.disabled=true;try{const result=await window.DragonboundHomeActions?.giveOutingTreat?.();if(result?.ok){petEffect('CRUNCH!');showThought(hasTrait('food obsessed','foodie','food goblin','greedy')?'TREATS!':'Yum!',2600);showToast(`${result.name||'Your dragon'} gets a Dragon Bite.`);closeDragonMenu();}else{showToast(result?.message||'Dragon Bites are not available right now.');buildDragonMenu();}}catch(err){showToast(err?.message||'Dragon Bites are not available right now.');buildDragonMenu();}});
  }
  function positionDragonMenu(){
    if(!state.contextMenu||state.contextMenu.hidden||!state.mapEl||!state.destination)return;
    const mapRect=state.mapEl.getBoundingClientRect(),shellRect=state.destination.querySelector('.dragonbound-outing-shell')?.getBoundingClientRect();
    if(!shellRect)return;
    const width=Math.min(286,Math.max(238,state.contextMenu.offsetWidth||270));
    const height=Math.max(160,state.contextMenu.offsetHeight||190);
    const anchorX=mapRect.left-shellRect.left+state.dragon[0]*mapRect.width;
    const anchorY=mapRect.top-shellRect.top+state.dragon[1]*mapRect.height;
    let left=anchorX+38,top=anchorY-height*.58;
    if(left+width>shellRect.width-14)left=anchorX-width-38;
    left=clamp(left,14,Math.max(14,shellRect.width-width-14));
    top=clamp(top,66,Math.max(66,shellRect.height-height-48));
    state.contextMenu.style.left=`${Math.round(left)}px`;
    state.contextMenu.style.top=`${Math.round(top)}px`;
    state.contextMenu.style.right='auto';
  }
  function openDragonMenu(){buildDragonMenu();state.contextMenu.hidden=false;state.contextMenu.setAttribute('aria-hidden','false');requestAnimationFrame(positionDragonMenu);}
  function closeDragonMenu(){if(!state.contextMenu)return;const focused=state.contextMenu.contains(document.activeElement);state.contextMenu.hidden=true;state.contextMenu.setAttribute('aria-hidden','true');if(focused)try{document.activeElement?.blur?.();}catch(_e){}}
  async function handleDragonAction(action){
    if(action==='roam'){setMode('roam');showThought(hasTrait('shy')?'Can I explore?':'I’m going!',3200);}
    else if(action==='follow'){setMode('follow');showThought('Okay!',2600);}
    else if(action==='call'){callOver();}
    else if(action==='pet'){
      const a=homeActor(),ok=a?.pet?.();if(ok){petEffect('♥');showToast(`${a.dragon?.name||'Your dragon'} leans into the fuss.`);}else showToast(a?.petCooldownRemaining?.()?`Pet again in ${a.formatPetCooldown?.(a.petCooldownRemaining())||'a little while'}.`:'Not right now.');
    }else if(action==='treat'){buildOutingTreatConfirm();return;
    }else if(action==='profile'){window.DragonboundHomeActions?.openProfile?.();}
    closeDragonMenu();
  }

  function setMode(mode){
    if(!['follow','roam'].includes(mode))return;finishInteraction('interrupted');state.dragonMode=mode;state.dragonPath=[];state.dragonTarget=null;state.nextRoamDecision=now()+900;state.nextFollowRepath=0;state.dragonFarSince=0;syncModeUi();
  }
  function callOver(){finishInteraction('interrupted');const target=nearestValid(activeMap(),[state.keeper[0]+rand(-.025,.025),state.keeper[1]+.035],'dragon');setDragonPath(target);state.dragonTarget={call:true};showThought('Coming!',2600);}
  function syncModeUi(){const el=state.destination?.querySelector('[data-outing-mode]');if(el)el.textContent=state.dragonMode==='roam'?'Roaming Free':'Following You';state.dragonEl?.classList.toggle('is-roaming',state.dragonMode==='roam');}

  function showToast(text,duration=3200){if(!state.toast)return;state.toast.textContent=String(text||'');state.toast.classList.add('is-visible');clearTimeout(state.toast._timer);state.toast._timer=setTimeout(()=>state.toast?.classList.remove('is-visible'),duration);}
  function showThought(text,duration=3200){if(!state.thought||Date.now()-state.lastThoughtAt<7500)return false;state.lastThoughtAt=Date.now();state.thought.textContent=String(text||'');state.thought.hidden=false;state.thought.classList.add('is-visible');state.thoughtUntil=Date.now()+duration;clearTimeout(state.thought._timer);state.thought._timer=setTimeout(()=>{state.thought?.classList.remove('is-visible');setTimeout(()=>{if(state.thought)state.thought.hidden=true;},220);},duration);return true;}
  function petEffect(text){const layer=state.destination?.querySelector('.dragonbound-outing-pet-effect');if(!layer)return;const el=document.createElement('b');el.textContent=text;layer.appendChild(el);setTimeout(()=>el.remove(),1300);}

  function visit(id){
    const dest=DESTINATIONS[id];if(!dest)return;const d=dragonProfile();if(!d||!dragonDef()){showToast('Hatch your Dragonbound dragon before taking them out.');return;}
    closeMenu();ensureDestination();state.destinationId=id;state.mapId=dest.startMap;state.dragonMode='follow';state.keys={up:false,down:false,left:false,right:false};state.previousFocus=document.activeElement;document.body.classList.add('dragonbound-outing-active');state.destination.classList.add('is-visible');state.destination.setAttribute('aria-hidden','false');loadMap(state.mapId,{initial:true});startLoop();setTimeout(()=>showThought(hasTrait('food obsessed','foodie','food goblin')?'That smells GOOD.':hasTrait('shy')?'It’s busy here...':'What’s this place?',3800),800);
  }

  function loadMap(mapId,{spawn=null,dragonSpawn=null,initial=false}={}){
    const dest=activeDestination(),map=dest?.maps?.[mapId];if(!map)return;state.transitioning=false;state.transitionLockUntil=now()+(initial?220:900);state.mapId=mapId;state.keeper=(spawn||map.keeperSpawn).slice();state.dragon=(dragonSpawn||map.dragonSpawn).slice();state.keeperDir='up';state.keeperState='idle';state.keeperSeat=null;state.nearbySeat=null;state.dragonFacing='right';state.dragonPath=[];state.dragonTarget=null;state.dragonInteraction=null;state.dragonInteractionApproach=null;state.dragonTween=null;state.dragonState='idle';state.dragonAnimKey='';state.dragonFrame=0;state.dragonFrameAt=0;state.recentNodeIds=[];state.nextRoamDecision=now()+rand(2500,5000);state.nextFollowRepath=0;state.dragonFarSince=0;state.mapImg.src=map.image;state.mapImg.alt=`${dest.title} — ${map.name}`;state.destination.querySelector('[data-outing-map-title]').textContent=map.name;state.destination.querySelector('[data-outing-location]').textContent=`Lantern Nook · ${map.name}`;state.keeperEl?.classList.remove('is-seated');state.keeperEl?.removeAttribute('data-seat-kind');renderMasks(map);renderKeeperSeats(map);renderDebug(map);syncModeUi();spawnGuest(map);updateKeeperActionPrompt();renderAll(true);
    if(!initial)showToast(mapId==='garden'?'Dragon Garden':mapId==='interior'?'Main Café':'Front Lawn',1500);
  }

  function transitionTo(t){
    if(state.transitioning)return;state.transitioning=true;finishInteraction('transition');closeDragonMenu();const fade=state.destination.querySelector('.dragonbound-outing-fade');fade.classList.add('is-visible');
    setTimeout(()=>{loadMap(t.to,{spawn:t.spawn,dragonSpawn:t.dragonSpawn});setTimeout(()=>fade.classList.remove('is-visible'),80);},220);
  }
  function checkTransitions(){const map=activeMap();if(!map||state.transitioning||state.keeperSeat||now()<state.transitionLockUntil)return;for(const t of map.transitions||[])if(pointInRect(state.keeper,t.zone,.008,.010)){transitionTo(t);return;}}

  function leave(){
    if(!state.destination?.classList.contains('is-visible'))return;finishInteraction('leave');if(state.keeperSeat)standKeeper({silent:true});stopLoop();closeDragonMenu();state.destination.classList.remove('is-visible');state.destination.setAttribute('aria-hidden','true');document.body.classList.remove('dragonbound-outing-active');state.destinationId='';state.mapId='';state.keys={up:false,down:false,left:false,right:false};try{window.DragonboundBabyEngine?.saveBehaviour?.(true);}catch(_e){}try{state.previousFocus?.focus?.({preventScroll:true});}catch(_e){}
  }

  function spawnGuest(map){
    const snap=window.DragonboundHomeActions?.playdateSnapshot?.();const profile=snap?.guest||null,def=profile?.breedId?window.DragonboundBabyRegistry?.[profile.breedId]:null;
    if(!profile||!def){state.guestEl.hidden=true;state.guestEl.setAttribute('aria-hidden','true');state.guestEl.dataset.breedId='';return;}
    state.guest=(map.guestSpawn||map.dragonSpawn).slice();state.guestDef=def;state.guestProfile=profile;state.guestState='idle';state.guestPath=[];state.nextGuestDecision=now()+rand(3200,6500);state.nextGuestSocial=now()+rand(8000,15000);state.guestEl.hidden=false;state.guestEl.setAttribute('aria-hidden','false');state.guestEl.dataset.breedId=profile.breedId||'';state.guestImg.alt=profile.name||'Visiting dragon';
  }

  function moveKeeper(dt){
    const map=activeMap();if(!map)return;let dx=(state.keys.right?1:0)-(state.keys.left?1:0),dy=(state.keys.down?1:0)-(state.keys.up?1:0);if(!dx&&!dy)return;
    if(state.keeperSeat)standKeeper({silent:true});state.keeperState='walk';if(dx&&dy){dx*=.7071;dy*=.7071;}if(Math.abs(dx)>Math.abs(dy))state.keeperDir=dx<0?'left':'right';else state.keeperDir=dy<0?'up':'down';const speed=230,rx=speed*dt/1536,ry=speed*dt/1024;
    let moved=false,next=[state.keeper[0]+dx*rx,state.keeper[1]];if(!isBlocked(map,next,'keeper')){state.keeper[0]=next[0];moved=true;}next=[state.keeper[0],state.keeper[1]+dy*ry];if(!isBlocked(map,next,'keeper')){state.keeper[1]=next[1];moved=true;}if(!moved)state.keeperState='idle';
  }


  function advancePath(entity,dt,speed){
    const map=activeMap();if(!map)return false;const pos=entity==='dragon'?state.dragon:state.guest,path=entity==='dragon'?state.dragonPath:state.guestPath,idxKey=entity==='dragon'?'dragonPathIndex':'guestPathIndex';if(!path.length||state[idxKey]>=path.length)return false;const target=path[state[idxKey]],dx=(target[0]-pos[0])*1536,dy=(target[1]-pos[1])*1024,d=Math.hypot(dx,dy);if(Math.abs(dx)>2){if(entity==='dragon')state.dragonFacing=dx>=0?'right':'left';else state.guestFacing=dx>=0?'right':'left';}
    const step=speed*dt;if(d<=step+2){pos[0]=target[0];pos[1]=target[1];state[idxKey]++;if(state[idxKey]>=path.length){path.length=0;state[idxKey]=0;return false;}return true;}pos[0]+=(dx/d*step)/1536;pos[1]+=(dy/d*step)/1024;return true;
  }

  function updateDragon(t,dt){
    const map=activeMap();if(!map)return;
    if(state.dragonTween){if(tickDragonTween(t))return;}
    if(state.dragonInteraction){
      const n=homeActor()?.needs||{},type=state.dragonInteraction.type;
      const urgent=(Number(n.rest||0)>94&&!['sleep','rest'].includes(type))||(Number(n.stimulation||0)>96&&type!=='play')||(Number(n.hygiene||0)>97&&type!=='water');
      if(urgent)finishInteraction('urgent');else{if(t>=state.dragonInteractionUntil)finishInteraction('done');return;}
    }
    const followDistance=state.dragonMode==='follow'?dist(state.dragon,state.keeper):0;
    const followSpeed=followDistance>260?280:followDistance>155?246:followDistance>110?218:192;
    const moving=advancePath('dragon',dt,state.dragonMode==='follow'?followSpeed:165);if(moving){state.dragonState='walk';return;}
    if(state.dragonTarget?.node){const node=state.dragonTarget.node,approach=state.dragonTarget.approach||nearestValid(map,node.approach||node.pos,'dragon');if(dist(state.dragon,approach)<42){state.dragonTarget=null;startInteraction(node,approach);return;}state.dragonTarget=null;state.nextRoamDecision=t+900;}
    if(state.dragonTarget?.call){state.dragonTarget=null;state.dragonState='idle';}
    if(state.dragonMode==='follow'){
      const target=followTarget(),d=dist(state.dragon,state.keeper),toTarget=dist(state.dragon,target);
      if(d>128&&t>=state.nextFollowRepath){if(setDragonPath(target))state.nextFollowRepath=t+(d>220?300:620);else state.nextFollowRepath=t+900;}
      else if(d>220&&t>=state.nextFollowRepath){setDragonPath(target);state.nextFollowRepath=t+280;}
      else if(toTarget>48&&d>100&&t>=state.nextFollowRepath){setDragonPath(target);state.nextFollowRepath=t+760;}
      else state.dragonState=d<135?'idle':'look';
      if(d>360){if(!state.dragonFarSince)state.dragonFarSince=t;}else state.dragonFarSince=0;
      if(d>470&&state.dragonFarSince&&t-state.dragonFarSince>4500){const safe=nearestValid(map,target,'dragon');state.dragon=safe.slice();state.dragonPath=[];state.dragonState='idle';state.dragonFarSince=0;}
    }else{
      state.dragonFarSince=0;
      if(t>=state.nextRoamDecision)chooseRoamAction();else if(!state.dragonTween)state.dragonState='idle';
      if(hasTrait('affectionate','clingy')&&Math.random()<dt*.012&&dist(state.dragon,state.keeper)>260){setDragonPath([state.keeper[0]+rand(-.05,.05),state.keeper[1]+rand(.02,.07)]);state.dragonTarget={checkin:true};state.nextRoamDecision=t+rand(9000,16000);}
    }
  }


  function runGuestSocialEvent(t){
    if(state.guestEl.hidden||!state.guestProfile)return false;const snap=window.DragonboundHomeActions?.playdateSnapshot?.(),label=String(snap?.relationship?.relationshipType||'Stranger'),map=activeMap();if(!map)return false;
    const ownPlay=hasTrait('playful','energetic','hyper'),ownSleep=hasTrait('lazy','sleepy','calm'),guestText=JSON.stringify(state.guestProfile?.personality||{}).toLowerCase();let pool=['calm_proximity','follow'];
    if(ownPlay||/play|energetic|bouncy/.test(guestText))pool.push('play','chase','chase');
    if(ownSleep||/lazy|sleep|calm/.test(guestText))pool.push('shared_nap');
    if(/rival/i.test(label)||hasTrait('competitive'))pool.push('rival_challenge','training');
    if(hasTrait('food obsessed','foodie','food goblin','greedy')||/food|appetite/.test(guestText))pool.push('food_negotiation');
    if(/nervous|avoid/i.test(label))pool=['nervous_retreat','calm_proximity'];
    const type=choose(pool),nodes=map.roamPoints||[],near=[state.dragon[0]+rand(-.06,.06),state.dragon[1]+rand(-.03,.07)];
    if(type==='chase'){const target=choose(nodes)||near;setGuestPath(target);if(state.dragonMode==='roam'){setDragonPath([target[0]+rand(-.05,.05),target[1]+rand(-.04,.04)]);state.dragonTarget={social:true};}showGuestThought('Catch me!');showThought('Again?',2600);}
    else if(type==='shared_nap'){const rest=weightedByTag(map,'rest')||weightedByTag(map,'sleep');setGuestPath(rest?.pos||near);if(state.dragonMode==='roam'&&rest){setDragonPath([rest.pos[0]+rand(-.04,.04),rest.pos[1]+rand(-.02,.04)]);state.dragonTarget={social:true};}showGuestThought('This spot is good.');}
    else if(type==='rival_challenge'||type==='training'){const play=weightedByTag(map,'training')||weightedByTag(map,'play');setGuestPath(play?.pos||near);showGuestThought(type==='rival_challenge'?'You again.':'Watch this.');}
    else if(type==='food_negotiation'){const food=weightedByTag(map,'food');setGuestPath(food?.pos||near);showGuestThought('Snacks?');}
    else if(type==='nervous_retreat'){const far=nodes.slice().sort((a,b)=>dist(b,state.dragon)-dist(a,state.dragon))[0]||near;setGuestPath(far);showGuestThought('I’ll watch from here...');}
    else{setGuestPath(near);if(type==='follow')showGuestThought('I’m coming too.');}
    window.DragonboundHomeActions?.recordSocial?.(type);state.nextGuestSocial=t+rand(22000,45000);state.nextGuestDecision=t+rand(12000,22000);return true;
  }

  function updateGuest(t,dt){
    if(state.guestEl.hidden||!state.guestDef)return;const moving=advancePath('guest',dt,158);if(moving){state.guestState='walk';return;}if(t<state.guestInteractionUntil)return;
    if(t>=state.nextGuestSocial&&dist(state.guest,state.dragon)<420){if(runGuestSocialEvent(t))return;}
    if(t>=state.nextGuestDecision){const map=activeMap(),node=Math.random()<.58?choose(map.interactions||[]):null,target=node?.pos||choose(map.roamPoints||[])||map.guestSpawn;setGuestPath(target);state.nextGuestDecision=t+rand(10000,21000);state.guestInteractionUntil=t+rand(7000,13000);}
    else state.guestState='idle';
  }
  function showGuestThought(text){if(state.guestEl.hidden)return;let b=state.guestEl.querySelector('span');if(!b){b=document.createElement('span');state.guestEl.appendChild(b);}b.textContent=text;b.classList.add('is-visible');clearTimeout(b._timer);b._timer=setTimeout(()=>b.classList.remove('is-visible'),2600);}

  function dragonAnimationInfo(){
    const def=dragonDef();if(!def)return{key:'',anim:null};let key='idle';
    if(state.dragonState==='walk')key='walk';else if(state.dragonState==='sleep')key='sleep';else if(state.dragonState==='rest')key=(state.dragonInteraction?.tags||[]).includes('social')&&def.animations?.sit?'sit':'rest';else if(state.dragonState==='play'||state.dragonState==='look')key='look';
    return{key,anim:def.animations?.[key]||def.animations?.idle};
  }
  function guestAnimationInfo(){const def=state.guestDef;if(!def)return{key:'',anim:null};const key=state.guestState==='walk'?'walk':state.guestState==='sleep'?'sleep':state.guestState==='rest'?'rest':'idle';return{key,anim:def.animations?.[key]||def.animations?.idle};}
  function tickFrames(t){
    const moving=state.keeperState!=='sit'&&(state.keys.up||state.keys.down||state.keys.left||state.keys.right);
    if(state.keeperState==='sit'){
      // Use the normal account-linked keeper frame and pose it into the seat.
      const seated=keeperFrame(state.keeperDir,false,0);state.keeperEl.classList.add('is-seated');state.keeperEl.classList.toggle('is-flipped',seated.flip);if(state.keeperImg.dataset.outingSrc!==seated.src){state.keeperImg.src=seated.src;state.keeperImg.dataset.outingSrc=seated.src;}
    }else{
      state.keeperEl.classList.remove('is-seated');if(t>=state.keeperFrameAt){if(moving)state.keeperFrame=(state.keeperFrame+1)%4;else state.keeperFrame=0;state.keeperFrameAt=t+(moving?150:450);}const kf=keeperFrame(state.keeperDir,moving,state.keeperFrame);if(state.keeperImg.dataset.outingSrc!==kf.src){state.keeperImg.src=kf.src;state.keeperImg.dataset.outingSrc=kf.src;}state.keeperEl.classList.toggle('is-flipped',kf.flip);
    }
    const info=dragonAnimationInfo(),anim=info.anim;if(info.key!==state.dragonAnimKey){state.dragonAnimKey=info.key;state.dragonFrame=0;state.dragonFrameAt=0;}if(anim?.frames?.length){if(!state.dragonFrameAt){state.dragonFrame=0;}else if(t>=state.dragonFrameAt){state.dragonFrame=(state.dragonFrame+1)%anim.frames.length;}const fr=anim.frames[state.dragonFrame%anim.frames.length];if(!state.dragonFrameAt||t>=state.dragonFrameAt)state.dragonFrameAt=t+Math.max(120,Number(fr.durationMs)||250);if(state.dragonImg.dataset.src!==fr.src){state.dragonImg.src=fr.src;state.dragonImg.dataset.src=fr.src;}}
    const gi=guestAnimationInfo(),ga=gi.anim;if(gi.key!==state.guestAnimKey){state.guestAnimKey=gi.key;state.guestFrame=0;state.guestFrameAt=0;}if(ga?.frames?.length&&!state.guestEl.hidden){if(!state.guestFrameAt){state.guestFrame=0;}else if(t>=state.guestFrameAt){state.guestFrame=(state.guestFrame+1)%ga.frames.length;}const fr=ga.frames[state.guestFrame%ga.frames.length];if(!state.guestFrameAt||t>=state.guestFrameAt)state.guestFrameAt=t+Math.max(120,Number(fr.durationMs)||250);if(state.guestImg.dataset.src!==fr.src){state.guestImg.src=fr.src;state.guestImg.dataset.src=fr.src;}}
  }


  function renderAll(force=false){
    if(!state.destination?.classList.contains('is-visible'))return;const map=activeMap();if(!map)return;state.keeperEl.style.left=`${state.keeper[0]*100}%`;state.keeperEl.style.top=`${state.keeper[1]*100}%`;state.keeperEl.style.zIndex=String(1000+Math.round(state.keeper[1]*1000));state.keeperEl.style.setProperty('--outing-seat-x',currentKeeperAccount()==='proco'?'9px':'0px');state.dragonEl.style.left=`${state.dragon[0]*100}%`;state.dragonEl.style.top=`${state.dragon[1]*100}%`;state.dragonEl.style.zIndex=String(1006+Math.round(state.dragon[1]*1000));state.dragonEl.classList.toggle('is-flipped',state.dragonFacing!==(dragonDef()?.nativeFacing||'right'));
    const scale=clamp((dragonDef()?.renderedScale||.65)*.80,.38,.68);state.dragonEl.style.setProperty('--outing-dragon-scale',String(scale));state.dragonEl.dataset.state=state.dragonState;state.dragonEl.classList.toggle('is-hidden-interaction',!!state.dragonInteraction?.hideActor&&!state.dragonTween);updateKeeperActionPrompt();
    if(!state.guestEl.hidden){state.guestEl.style.left=`${state.guest[0]*100}%`;state.guestEl.style.top=`${state.guest[1]*100}%`;state.guestEl.style.zIndex=String(1004+Math.round(state.guest[1]*1000));state.guestEl.classList.toggle('is-flipped',state.guestFacing!==(state.guestDef?.nativeFacing||'right'));state.guestEl.style.setProperty('--outing-dragon-scale',String(clamp((state.guestDef?.renderedScale||.65)*.80,.38,.68)));}
    if(state.thought&&!state.thought.hidden){state.thought.style.left=`${state.dragon[0]*100}%`;state.thought.style.top=`${state.dragon[1]*100}%`;}
    if(state.contextMenu&&!state.contextMenu.hidden)positionDragonMenu();
    const effect=state.destination.querySelector('.dragonbound-outing-pet-effect');if(effect){effect.style.left=`${state.dragon[0]*100}%`;effect.style.top=`${state.dragon[1]*100}%`;}
    if(force)tickFrames(now());
  }

  function loop(t){state.raf=requestAnimationFrame(loop);if(!state.destination?.classList.contains('is-visible'))return;if(!document.querySelector('#dragonboundOverlay.is-open')){leave();return;}const dt=Math.min(.05,(t-state.lastT||16)/1000);state.lastT=t;moveKeeper(dt);checkTransitions();updateDragon(t,dt);updateGuest(t,dt);tickFrames(t);renderAll();}
  function startLoop(){if(state.raf)return;state.lastT=now();state.raf=requestAnimationFrame(loop);}
  function stopLoop(){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.lastT=0;state.keys={up:false,down:false,left:false,right:false};}

  function onKeyDown(e){
    if(e.key==='Escape'){
      if(document.querySelector('.dragonbound-my-dragon-overlay.is-visible'))return;
      if(state.contextMenu&&!state.contextMenu.hidden){e.preventDefault();e.stopImmediatePropagation();closeDragonMenu();return;}
      if(state.destination?.classList.contains('is-visible')){e.preventDefault();e.stopImmediatePropagation();leave();return;}
      if(state.menu?.classList.contains('is-visible')){e.preventDefault();e.stopImmediatePropagation();closeMenu();return;}
    }
    if(!state.destination?.classList.contains('is-visible')||isFormFocus())return;const k=String(e.key||'').toLowerCase();if(k==='e'){e.preventDefault();e.stopPropagation();if(state.keeperSeat)standKeeper();else if(state.nearbySeat)tryUseKeeperSeat(state.nearbySeat);return;}const m={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'}[k];if(m){state.keys[m]=true;e.preventDefault();}
  }
  function onKeyUp(e){if(!state.destination?.classList.contains('is-visible'))return;const k=String(e.key||'').toLowerCase(),m={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'}[k];if(m){state.keys[m]=false;e.preventDefault();}}

  function onGlobalLauncherClick(e){
    const launcher=e.target?.closest?.('.dragonbound-go-out-launcher,[data-dragonbound-go-out="true"]');
    if(!launcher)return;
    e.preventDefault();
    e.stopPropagation();
    if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
    openMenu();
  }
  function attach(){ensureLauncher();}
  // Capture delegation survives home-scene re-renders/clones that strip element listeners.
  document.addEventListener('click',onGlobalLauncherClick,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  window.addEventListener('dragonbound:engine-attach',()=>setTimeout(ensureLauncher,60));
  window.addEventListener('dragonbound:home-ready',()=>setTimeout(ensureLauncher,60));
  window.addEventListener('repo-character-changed',()=>{if(state.destination?.classList.contains('is-visible'))leave();setTimeout(ensureLauncher,120);});
  window.addEventListener('resize',()=>renderAll(true),{passive:true});
  document.addEventListener('keydown',onKeyDown,true);document.addEventListener('keyup',onKeyUp,true);
  // Bounded fallback for dynamically-created Dragonbound markup. Stops after finding the scene.
  let tries=0;const finder=setInterval(()=>{tries++;if(ensureLauncher()||tries>40)clearInterval(finder);},500);

  window.DragonboundOutings={
    version:VERSION,
    destinations:()=>Object.values(DESTINATIONS).map(d=>({id:d.id,title:d.title,subtitle:d.subtitle,preview:d.preview})),
    open:openMenu,visit,leave,
    state:()=>({destinationId:state.destinationId,mapId:state.mapId,dragonMode:state.dragonMode,keeper:state.keeper.slice(),dragon:state.dragon.slice()}),
    setDebug:on=>{state.debug=!!on;renderDebug(activeMap());}
  };
})();
