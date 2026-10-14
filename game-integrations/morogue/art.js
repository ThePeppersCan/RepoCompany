(function(root){
  'use strict';
  const trioIds=['baker','groundskeeper','clockmaker','mirrorlord','huntsman','nightmayor'],trioArt=id=>trioIds.includes(id)?root['MOROGUE_'+id.toUpperCase()+'_ART']:null;
  const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const atlas=new Image();atlas.src='assets/vampire-survivor/weapon-atlas.png';
  const atlasCells={espresso:[32,48,600,656],garlic:[715,72,600,624],tray:[1360,160,660,560]};
  const ENEMY_STYLES=Object.fromEntries([
    ['villager','shirt_linen','plum','trousers','tan','none','cape','#b897c2'],
    ['runner','shirt_sash','claret','trousers_shorts','navy','hat_1','hood','#d9a278'],
    ['brute','shirt_vest','slate','trousers_loose','brown','none','pauldrons','#a0b8c1'],
    ['caster','shirt_linen','plum','trousers_skirt','plum','hat_3','staff','#e6a3c7'],
    ['skulker','shirt_patch','navy','trousers_wrap','navy','hat_1','daggers','#a5c9cc'],
    ['courier','shirt_sailor','teal','trousers','tan','hat_2','satchel','#c5dca9'],
    ['slinger','shirt_openvest','rust','trousers_patch','brown','none','sling','#e0b796'],
    ['bellringer','shirt_short','claret','trousers_wrap','slate','hat_4','bell','#e4c886'],
    ['lamplighter','shirt_vest','teal','trousers','navy','hat_2','lantern','#f2d080'],
    ['duelist','shirt_sash','linen','trousers','plum','none','rapier','#e5d0a3'],
    ['glutton','shirt_apron','claret','trousers_apronskirt','brown','hat_4','cleaver','#e1b69b'],
    ['leech','shirt_short','plum','trousers_wrap','claret','none','siphon','#d59bae'],
    ['archer','shirt_linen','brown','trousers','navy','hat_1','bow','#c6c394'],
    ['mourner','shirt_linen','slate','trousers_skirt','navy','hat_3','veil','#bab4d3'],
    ['mirror','shirt_sash','stone','trousers_wrap','plum','none','mirror','#c6e6ed'],
    ['wisp','shirt_linen','teal','trousers_skirt','linen','none','flames','#bcefe2'],
    ['marshal','shirt_vest','navy','trousers','navy','hat_4','shield','#dbc88c'],
    ['miller','shirt_apron','linen','trousers_loose','stone','hat_2','paddle','#e8d3a5'],
    ['watchman','shirt_sailor','slate','trousers','brown','hat_4','halberd','#c0d2d9'],
    ['herald','shirt_patch','rust','trousers_skirt','claret','hat_3','banner','#e5af86']
  ].map(([id,shirt,colour,trousers,legs,hat,prop,accent],variant)=>[id,{id,variant,shirt,colour,trousers,legs,hat,prop,accent}]));
  const BOSS_STYLES=Object.fromEntries([
    ['landlord','shirt_apron','claret','kettle','#e0b578'],
    ['bellkeeper','shirt_linen','slate','greatbell','#e7c887'],
    ['duchess','shirt_sash','plum','fan','#e5afd1'],
    ['ferryman','shirt_sailor','navy','oar','#b4dcd9'],
    ['baker','shirt_apron','linen','breadpaddle','#f1d49a'],
    ['groundskeeper','shirt_patch','teal','scythe','#b9d39a'],
    ['clockmaker','shirt_vest','brown','clock','#e1be85'],
    ['mirrorlord','shirt_sash','stone','greatmirror','#cce9ed'],
    ['huntsman','shirt_openvest','brown','crossbow','#d3c493'],
    ['nightmayor','shirt_vest','navy','mayor','#dab5cd'],
    ['kiln','shirt_apron','rust','kettle','#f8ad6e'],['admiral','shirt_sailor','teal','oar','#ace2e1'],['briar','shirt_patch','teal','scythe','#c4dd91'],['prism','shirt_sash','stone','greatmirror','#d7e9ff'],['clock','shirt_vest','brown','clock','#e8c88d'],['star','shirt_linen','plum','staff','#dbc2ef'],['cantor','shirt_linen','navy','greatbell','#c3e6ef'],['duelist','shirt_sash','claret','rapier','#eacf9b'],['beekeeper','shirt_apron','linen','staff','#ddd49b'],['magistrate','shirt_linen','plum','staff','#cab3e3'],['railmaster','shirt_vest','rust','paddle','#e6ad76'],['oracle','shirt_sash','teal','staff','#c1eee5']
  ].map(([id,shirt,colour,prop,accent],i)=>[id,{id,variant:20+i,shirt,colour,trousers:i%2?'trousers_wrap':'trousers_loose',legs:i%2?'navy':'slate',hat:'none',prop,accent}]));
  // The bread blade is drawn once for menu icons and reused for each live swing.
  // Its stepped crust and scoring retain the character art's pixel scale.
  function baguette(g){root.MOROGUE_COSMETIC_ART.blade(g,'crust');}

  function icon(type,size=64){
    const pixels=type==='baguette'?64:32,c=makeCanvas(pixels,pixels),g=c.getContext('2d');g.imageSmoothingEnabled=false;
    const rect=(colour,x,y,w,h)=>{g.fillStyle=colour;g.fillRect(x,y,w,h);};
    if(type==='espresso'){g.save();g.translate(15,18);g.scale(1.05,1.05);root.MOROGUE_COSMETIC_ART.cup(g,'roast');g.restore();
    }else if(type==='garlic'){
      rect('#52865c',15,3,3,7);rect('#8fb46b',18,2,3,4);rect('#345a49',13,7,8,3);
      for(const [x,y] of [[10,14],[18,14],[14,21]]){rect('#585867',x-5,y-3,10,10);rect('#d8cfb6',x-4,y-4,8,10);rect('#eee4c9',x-2,y-5,5,10);rect('#b9b3a1',x+3,y-1,2,6);rect('#f6f0dd',x-2,y-2,2,5);rect('#7a8870',x-1,y-7,2,3);rect('#9b8e7e',x-2,y+6,4,2);}
    }else if(type==='tray'){
      rect('#23303d',3,9,26,15);rect('#7594ad',4,8,24,15);rect('#aecbd7',6,7,20,17);rect('#daebeb',8,7,16,2);rect('#668495',7,10,18,11);rect('#9fbfca',9,11,14,9);rect('#e8f4e8',10,11,11,2);rect('#6c92a7',7,22,18,2);rect('#466276',4,15,2,6);rect('#e6efe8',21,13,2,3);
    }else if(type==='baguette'){
      g.save();g.translate(14,51);g.rotate(-.82);g.scale(.82,.82);baguette(g);g.restore();
    }else if(type==='heal'){
      rect('#5d3837',6,15,21,10);rect('#a26743',5,14,21,9);rect('#e3ae66',7,12,17,9);rect('#f3ca88',10,11,11,8);rect('#905b3e',10,13,2,5);rect('#905b3e',17,12,2,5);
    }else if(type==='chest'){
      rect('#352f37',5,10,23,18);rect('#874f3b',6,9,21,17);rect('#bc8150',8,8,17,8);rect('#dabd78',8,8,3,18);rect('#dabd78',22,8,3,18);rect('#45302e',6,16,21,3);rect('#f1da91',14,16,5,6);
    }else{
      g.fillStyle=type==='magnet'?'#a4e1df':'#f1d08b';g.beginPath();g.moveTo(16,2);g.lineTo(20,11);g.lineTo(30,16);g.lineTo(20,21);g.lineTo(16,30);g.lineTo(12,21);g.lineTo(2,16);g.lineTo(12,11);g.closePath();g.fill();rect('#ffefca',14,12,4,8);
    }
    const out=makeCanvas(size,size),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(c,0,0,size,size);out.className='vs-icon';out.setAttribute('aria-hidden','true');
    if(atlasCells[type]&&type!=='espresso'){const draw=()=>{const [sx,sy,sw,sh]=atlasCells[type],scale=size/Math.max(sw,sh),dw=sw*scale,dh=sh*scale;ctx.clearRect(0,0,size,size);ctx.drawImage(atlas,sx,sy,sw,sh,(size-dw)/2,(size-dh)/2,dw,dh);};if(atlas.complete&&atlas.naturalWidth)draw();else atlas.addEventListener('load',draw,{once:true});}
    return out;
  }
  function create(canvas,model,pack){
    let resultState=null,resultAge=0;
    const ctx=canvas.getContext('2d'),map=new Image();map.src='assets/vampire-survivor/copper-kettle-open.png';
    const ready=map.decode?map.decode():new Promise((resolve,reject)=>{map.onload=resolve;map.onerror=reject;});
    const icons=Object.fromEntries(['espresso','garlic','tray','baguette','heal','chest','magnet','nova'].map(k=>[k,icon(k,32)]));
    const animations=[],tints=new WeakMap(),hitMasks=new WeakMap(),cameraController=root.MORATALES_SURVIVOR_CAMERA.create(),BLADE_LENGTH=42;
    const CosmeticArt=root.MOROGUE_COSMETIC_ART;let cosmetics={...root.MOROGUE_COSMETICS.defaults},cloth={};
    function setCosmetics(data){cosmetics=root.MOROGUE_COSMETICS.read(data).equipped;}
    let passageOrigins=new WeakMap(),lastPlayer=null,departureFrame=null,departureTransition=null;
    let echoes=new WeakMap(),recentHits=new WeakMap(),shotTrails=new WeakMap(),playerAnimator=null,activeEmote=null,w=innerWidth,h=innerHeight,dpr=1,hitFlash=0,elapsed=0,camera={},numbers=[],impacts=[],muzzles=[],dodgeBursts=[],deaths=[],bladeDrawCount=0,bladeLength=0;
    for(const style of [...Object.values(ENEMY_STYLES),...Object.values(BOSS_STYLES)]){
      const i=style.variant;
      const pick=(key,j)=>{const list=model.options(key);return list.length?list[j%list.length].id:model.initial[key];};
      const look=model.normalize({...model.initial,skin:pick('skin',i),hair:pick('hair',i*5+3),hair_colour:pick('hair_colour',i*3),face:pick('face',i*2),eyes:pick('eyes',i*3),nose:pick('nose',i),mouth:pick('mouth',i*2),shirt:style.shirt,shirt_colour:style.colour,trousers:style.trousers,trousers_colour:style.legs,hat:style.hat,hat_colour:style.colour});
      const animator=root.MORATALES_SURVIVOR_MOTION.create(model,pack,look,makeCanvas);animations.push(animator);
    }
    function setPlayer(look){cloth={};passageOrigins=new WeakMap();lastPlayer=null;playerAnimator=root.MORATALES_SURVIVOR_MOTION.create(model,pack,model.normalize(look),makeCanvas);echoes=new WeakMap();recentHits=new WeakMap();shotTrails=new WeakMap();numbers=[];impacts=[];muzzles=[];dodgeBursts=[];deaths=[];cameraController.reset();}
    function setCameraOptions(options){return cameraController.setOptions(options);}
    function portrait(look,width=48,height=68){const c=makeCanvas(width,height),g=c.getContext('2d');const a=root.createCharacterAnimator(model,pack,model.normalize(look),makeCanvas);g.imageSmoothingEnabled=false;g.drawImage(a.frame('front',-1),(width-48)/2,0,48,68);return c;}
    function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(1.75,devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    function glow(x,y,r,colour){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,colour);g.addColorStop(1,colour.slice(0,7)+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
    function shadow(x,y,size,g=ctx){g.fillStyle='#132b3c4a';g.beginPath();g.ellipse(x,y,size,size*.33,0,0,TAU);g.fill();}
    function tinted(frame){if(tints.has(frame))return tints.get(frame);const c=makeCanvas(48,68),g=c.getContext('2d');g.drawImage(frame,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#7297b433';g.fillRect(0,0,48,68);tints.set(frame,c);return c;}
    function capeShape(g){g.beginPath();g.moveTo(-7,27);g.lineTo(7,27);g.lineTo(7,35);g.lineTo(9,35);g.lineTo(9,43);g.lineTo(11,43);g.lineTo(11,51);g.lineTo(13,51);g.lineTo(13,56);g.lineTo(4,56);g.lineTo(4,58);g.lineTo(-4,58);g.lineTo(-4,56);g.lineTo(-13,56);g.lineTo(-13,51);g.lineTo(-11,51);g.lineTo(-11,43);g.lineTo(-9,43);g.lineTo(-9,35);g.lineTo(-7,35);g.closePath();}
    function hitMask(frame,view){
      let variants=hitMasks.get(frame);if(!variants){variants=[];hitMasks.set(frame,variants);}const key=view==='front'?0:1;
      if(!variants[key]){const c=makeCanvas(48,68),g=c.getContext('2d');g.drawImage(frame,0,0);if(key){g.save();g.translate(24,0);capeShape(g);g.fill();g.restore();}g.globalCompositeOperation='source-in';g.fillStyle='#fff0c3';g.fillRect(0,0,48,68);variants[key]=c;}
      return variants[key];
    }
    function afterimage(f,s){
      if(!playerAnimator)return;
      const frame=playerAnimator.frame(f.view||s.player.view,-1,{kind:f.decoy?'idle':'dash',phase:.45,gait:0,body:!f.decoy,weapon:s.mainWeapon,moveAngle:Math.atan2(s.player.dy,s.player.dx)}),step=clamp(f.step||1,1,3),colours=['#8ecbcc','#b9ded2','#f2d48d'];
      // Snapshot each echo once, including its cloth pose; older echoes never keep waving.
      let echo=echoes.get(f);if(!echo){echo=makeCanvas(112,112);const g=echo.getContext('2d'),view=f.view||s.player.view;g.translate(56,84);
        CosmeticArt.cape(g,cosmetics.cape,view,s.time,true,false,false,cloth,frame);g.drawImage(frame,-24,-65);CosmeticArt.cape(g,cosmetics.cape,view,s.time,true,true,false,cloth,frame);
        g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-in';g.fillStyle=colours[step-1];g.fillRect(0,0,112,112);echoes.set(f,echo);}
      ctx.globalAlpha=clamp(1-f.age/f.life,0,1)*.42;ctx.drawImage(echo,Math.round(f.x)-56,Math.round(f.y)+18-84);CosmeticArt.trail(ctx,cosmetics.trail,f.x,f.y+18,s.time,1-f.age/f.life,false);
    }
    function slash(f,reduced){
      const t=clamp(f.age/f.life,0,1),heavy=!!f.heavy,radius=f.radius||64,span=f.span||1.8,angle=f.angle||0;
      const reverse=f.weapon==='baguette'&&f.step===2,direction=reverse?-1:1,progress=clamp(t/.7,.08,1),start=angle-direction*span*.5,end=start+direction*span*progress;
      const tail=reverse?Math.min(start,end+span*(reduced?.48:.72)):Math.max(start,end-span*(reduced?.48:.72));
      const fade=Math.min(1,(1-t)*3)*((f.ghost||f.echo)?.45:.8),edge=heavy?'#fff0bc':f.colour||'#f7d595';
      ctx.save();ctx.translate(f.x,f.y);ctx.globalAlpha=fade;ctx.lineCap='butt';
      // A translucent, tapered ribbon leaves the floor and danger circles legible.
      if(!reduced){
        const steps=12,points=[];for(let i=0;i<=steps;i++){const a=tail+(end-tail)*i/steps;points.push([Math.cos(a)*radius,Math.sin(a)*radius]);}
        for(let i=steps;i>=0;i--){const a=tail+(end-tail)*i/steps,r=radius-(heavy?7:4)*Math.sin(i/steps*Math.PI*.65);points.push([Math.cos(a)*r,Math.sin(a)*r]);}
        ctx.fillStyle=f.weapon==='garlic'?'#bde1a222':f.weapon==='tray'?'#9bdeed22':heavy?'#f8c96925':'#f3db921c';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
      }
      ctx.lineWidth=heavy?3.5:2.5;ctx.strokeStyle='#46372b90';ctx.beginPath();ctx.arc(0,0,radius,tail,end,reverse);ctx.stroke();
      ctx.lineWidth=heavy?2:1.4;ctx.strokeStyle=f.weapon==='garlic'?'#d6edb5':f.weapon==='tray'?'#d7f1f4':edge;ctx.beginPath();ctx.arc(0,0,radius,tail,end,reverse);ctx.stroke();
      if(f.weapon==='garlic'){for(let i=0;i<4;i++){const a=tail+(end-tail)*i/3;ctx.save();ctx.translate(Math.cos(a)*radius,Math.sin(a)*radius);ctx.rotate(a);ctx.drawImage(icons.garlic,-7,-7,14,14);ctx.restore();}}
      if(heavy){ctx.lineWidth=1.5;ctx.strokeStyle='#e7ad5bb0';ctx.beginPath();ctx.arc(0,0,radius-8,tail+direction*.08,end,reverse);ctx.stroke();}
      if(heavy&&span<1.1){ctx.save();ctx.rotate(angle);ctx.lineWidth=2;ctx.strokeStyle='#fff2cbb0';ctx.beginPath();ctx.moveTo(radius*.3,-3);ctx.lineTo(radius+7,0);ctx.lineTo(radius*.3,3);ctx.stroke();ctx.restore();}
      if(!reduced){for(let i=0;i<(heavy?5:3);i++){const a=end-direction*i*.17,r=radius+4+i*2,x=Math.round(Math.cos(a)*r),y=Math.round(Math.sin(a)*r),size=i===0&&heavy?4:2;ctx.globalAlpha=fade*(1-i*.15);ctx.fillStyle=i===0?'#fff3ce':'#edc172';ctx.fillRect(x-size/2,y-size/2,size,size);}}
      ctx.restore();
      if(f.weapon==='baguette')CosmeticArt.flourish(ctx,cosmetics.strike,f.x,f.y,end,radius,t,fade,reduced);
    }
    function actionPose(s){
      const p=s.player,a=p.attack,pose={chainRide:!!p.admiralRide,kind:'idle',phase:0,gait:p.gait||0,step:a?.step||0,weapon:a?.weapon||s.mainWeapon,aimAngle:a?.angle??s.aimAngle};
      if(root.MOROGUE_PASSAGE_ART?.supported(s.transition))return {...pose,body:true,kind:'infection',phase:root.MOROGUE_PASSAGE_ART.progress(s.transition),view:'front'};
      if(p.starLeap){pose.kind='vault';pose.phase=p.starLeap.age/p.starLeap.duration;return pose;}
      if(p.finaleLeap){pose.kind='vault';pose.phase=p.finaleLeap.age/p.finaleLeap.duration;return pose;}
      if(a?.whirl){pose.kind=a.age<a.windup+a.active?'whirl':'recover';pose.phase=pose.kind==='whirl'?clamp((a.age-a.windup)/a.active,0,1):(a.age-a.windup-a.active)/a.recovery;}
      else if(p.dash>0){pose.kind='dash';pose.phase=1-p.dash/.14;}
      else if(a){pose.kind=a.age<a.windup?'windup':a.age<a.windup+a.active?'strike':'recover';pose.phase=pose.kind==='windup'?a.age/a.windup:pose.kind==='strike'?(a.age-a.windup)/a.active:(a.age-a.windup-a.active)/a.recovery;}
      else if(p.cast){const cast=p.cast,t=clamp(cast.age/cast.duration,0,1);pose.kind='cast';pose.style=cast.style;pose.phase=t<.25?t*.8:t<.7?.2+(t-.25)/.45*.8:1-(t-.7)/.3;pose.aimAngle=cast.angle;}
      else if(p.hurtTime>0){pose.kind='hurt';pose.phase=1-p.hurtTime/.22;}
      else if(p.land>0){pose.kind='landing';pose.phase=1-p.land/.13;}
      else if(p.admiralRide){pose.kind='chainRide';pose.phase=(p.admiralRide.age*.8)%1;}
      else if(p.moving){pose.kind='run';pose.phase=(p.gait||0)%1;}
      else if(activeEmote)return {...pose,...activeEmote.pose};
      if(['idle','run','windup','strike','recover','whirl'].includes(pose.kind)&&(!p.land||a)&&['baguette','espresso'].includes(pose.weapon)){
        pose.combat=!a?.whirl;pose.combatMoving=!!p.moving;pose.dashAttack=!!a?.dash;
      }
      if(['run','idle','dash','landing'].includes(pose.kind)&&!p.admiralRide){pose.body=true;pose.bodyMoving=!!p.moving;pose.moveAngle=Math.atan2(p.dy,p.dx);if(pose.kind==='idle')pose.phase=(s.time*.35)%1;}
      return pose;
    }
    function heldWeapon(s,pose,frame,view,rear=false,reduced=false){
      if(['cast','emote','vault','infection'].includes(pose.kind))return;
      const isCup=s.mainWeapon==='espresso',isSword=s.mainWeapon==='baguette';if(!isCup&&!isSword)return;
      const attack=s.player.attack,facing=attack?.angle??s.aimAngle;
      let angle=frame.weaponPose?.angle;
      if(angle===undefined){
        angle=facing+.45;
        if(attack){const reverse=attack.step===2?-1:1,t=clamp((attack.age-attack.windup)/attack.active,0,1);angle=attack.age<attack.windup?facing-reverse*(.4+pose.phase*.65):facing-reverse*1.05+reverse*t*(attack.step===3?TAU:2.15);if(attack.dash&&!attack.whirl)angle=facing;if(attack.whirl)angle=facing+pose.phase*TAU;}
        else if(s.player.dash>0)angle=facing;
      }
      const behind=isCup?CosmeticArt.cupBehind(frame,view):Math.sin(angle)<-.38;
      if(rear!==behind)return;
      if(isCup){CosmeticArt.heldCup(ctx,cosmetics.espresso,frame,view,reduced?0:s.time);return;}
      const hand=frame.grip;ctx.save();ctx.translate(hand.x-24,hand.y-65);ctx.rotate(angle);
      // A short, tapered blade smear belongs to the grip; the wider slash still
      // describes the unchanged hit area on the ground.
      if(!reduced&&['strike','whirl'].includes(pose.kind)){
        const dir=pose.step===2?-1:1,fade=Math.sin(pose.phase*Math.PI);
        ctx.fillStyle='#dfbd7238';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(41,0);ctx.quadraticCurveTo(37,-dir*11,25,-dir*14);ctx.quadraticCurveTo(22,-dir*5,9,0);ctx.fill();
        ctx.globalAlpha=.45*fade;ctx.strokeStyle='#f8e5b7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(39,0);ctx.quadraticCurveTo(38,-dir*6,31,-dir*10);ctx.stroke();ctx.globalAlpha=1;
      }
      ctx.scale(BLADE_LENGTH/75,BLADE_LENGTH/75);CosmeticArt.blade(ctx,cosmetics.baguette,pose.phase,!!s.player.attack,pose.kind);ctx.restore();
      if(!rear){const x=Math.round(hand.x)-2,y=Math.round(hand.y)-2;ctx.drawImage(frame,x,y,5,5,x-24,y-65,5,5);}
      bladeDrawCount++;bladeLength=BLADE_LENGTH;
    }
    function heldBlade(s){
      const p=s.player,a=p.attack,weapon=s.mainWeapon,pose=actionPose(s),facing=a?.angle??s.aimAngle;
      if(['emote','infection'].includes(pose.kind)||p.finaleLeap||p.beeTunnel>0||p.inkCaptured)return;
      let angle=facing+.45,extension=0;
      if(a){
        const reverse=a.step===2?-1:1,t=clamp((a.age-a.windup)/a.active,0,1);
        angle=a.age<a.windup?facing-reverse*(.4+pose.phase*.65):facing-reverse*1.05+reverse*t*(a.step===3?TAU:2.15);
        if(a.weapon==='espresso'||a.dash&&!a.whirl)angle=facing;if(a.whirl)angle=facing+pose.phase*TAU;
        extension=pose.kind==='strike'?4:0;
      }
      let view=p.view;if((pose.kind==='whirl'||pose.kind==='strike'&&pose.step===3)&&s.mainWeapon!=='espresso'){const views=['right','front','left','back'];view=views[(views.indexOf(p.view)+Math.floor(pose.phase*4))%4];}
      const grip=playerAnimator.frame(view,-1,pose).grip;
      const handX=grip?p.x-24+grip.x:Math.round(p.x)+Math.cos(angle)*(10+extension),handY=grip?p.y-65+grip.y:Math.round(p.y)-29+Math.sin(angle)*7+(p.dash>0?7:0);
      if(pose.kind==='cast'){root.ROUGE_MORA_BUILD_ART.prop(ctx,p.cast,handX,handY);return;}
      ctx.save();ctx.translate(handX,handY-(p.admiralRide?.lift||0));
      if(weapon==='baguette'){/* Composed with the player's depth layers. */}
      else if(weapon==='espresso'){/* The cup is composed inside the character's depth layers. */}
      else{ctx.rotate(weapon==='espresso'?angle*.12:angle);const size=weapon==='tray'?19:15;ctx.drawImage(icons[weapon],-size*.5,-size*.5,size,size);}
      ctx.restore();
      // Ground-level aim pip and a restrained wind-up arc show commitment without covering threats.
      if(s.status==='playing'){ctx.save();ctx.translate(p.x,p.y-18);ctx.rotate(facing);ctx.fillStyle='#eee2b7b0';ctx.beginPath();ctx.moveTo(36,0);ctx.lineTo(31,-3);ctx.lineTo(31,3);ctx.fill();ctx.restore();}
      if(a&&pose.kind==='windup'){ctx.save();ctx.globalAlpha=.22+pose.phase*.25;ctx.strokeStyle=a.clean?'#f8f3d4':WEAPON_COLOURS[weapon]||'#efd395';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,23,8,0,-Math.PI/2,-Math.PI/2+TAU*pose.phase);ctx.stroke();ctx.restore();}
    }
    const WEAPON_COLOURS={espresso:'#edb77c',tray:'#aadced',baguette:'#f1cb83',garlic:'#bad69a'};
    function projectile(shot,reduced){
      if(shot.echoDelay>0)return;
      if(shot.x<camera.x-70||shot.y<camera.y-70||shot.x>camera.x+camera.viewWidth+70||shot.y>camera.y+camera.viewHeight+70)return;
      const angle=Math.atan2(shot.vy,shot.vx);
      if(shot.type==='espresso'){if(shot.attack)CosmeticArt.flourish(ctx,cosmetics.strike,shot.x,shot.y,angle,10,shot.age,.7,reduced);if(CosmeticArt.shot(ctx,cosmetics.espresso,shot.x,shot.y,angle,shot.age,reduced,shot.r||7))return;}
      if(shot.type==='crescent'){
        ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(angle);ctx.lineCap='round';
        if(!reduced){ctx.strokeStyle='#d68b4c38';ctx.lineWidth=10;ctx.beginPath();ctx.arc(-8,0,24,-1.2,1.2);ctx.stroke();}
        ctx.strokeStyle='#f0bb69';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-4,0,23,-1.25,1.25);ctx.stroke();
        ctx.strokeStyle='#fff4c5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-3,0,23,-1.15,1.15);ctx.stroke();ctx.restore();
      }else if(shot.type==='tray'){
        let history=shotTrails.get(shot);if(!history){history=[];shotTrails.set(shot,history);}
        if(!history.length||Math.hypot(shot.x-history[history.length-1].x,shot.y-history[history.length-1].y)>7){history.push({x:shot.x,y:shot.y});if(history.length>6)history.shift();}
        if(!reduced&&history.length>1){ctx.save();ctx.lineWidth=1.5;for(let i=1;i<history.length;i++){ctx.strokeStyle='rgba(174,220,238,'+(i/history.length*.3)+')';ctx.beginPath();ctx.moveTo(history[i-1].x,history[i-1].y);ctx.lineTo(history[i].x,history[i].y);ctx.stroke();}ctx.restore();}
        ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate((reduced?0:shot.age*13)+(shot.spin||0));ctx.scale(1,reduced?.86:.76+Math.sin(shot.age*9)*.13);ctx.drawImage(icons.tray,-17,-17,34,34);
        ctx.strokeStyle='#e9f8ffb0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,16,-.8,.6);ctx.stroke();ctx.fillStyle='#fff8d2';ctx.fillRect(10,-10,3,2);ctx.restore();
      }else{
        ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(angle);
        ctx.fillStyle='#ae64352c';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-30,-5);ctx.lineTo(-22,0);ctx.lineTo(-30,5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#633d2e';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(5,-3);ctx.lineTo(2,-5);ctx.lineTo(-6,-5);ctx.lineTo(-10,-3);ctx.lineTo(-14,0);ctx.lineTo(-10,3);ctx.lineTo(-6,5);ctx.lineTo(2,5);ctx.lineTo(5,3);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ca773a';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(3,-3);ctx.lineTo(-5,-3);ctx.lineTo(-11,0);ctx.lineTo(-5,3);ctx.lineTo(3,3);ctx.closePath();ctx.fill();
        ctx.fillStyle='#f3c577';ctx.fillRect(-3,-3,5,2);ctx.fillRect(2,-2,3,4);ctx.fillStyle='#fff1b7';ctx.fillRect(3,-1,3,2);
        if(!reduced){const pulse=Math.sin(shot.age*35+(shot.id||0));ctx.fillStyle='#d6914f';ctx.fillRect(-21,-2+pulse*2,3,2);ctx.fillStyle='#f8d88f';ctx.fillRect(-28,2-pulse,2,2);}
        ctx.restore();
      }
    }
    function garlicOrbit(s,orbitals,reduced){
      if(!orbitals.length)return;
      const radius=53+s.weapons.garlic*7+(s.evolutions?.garlic?20:0),centreY=s.player.y-18;
      ctx.save();ctx.strokeStyle='#d5eab529';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(s.player.x,centreY,radius,radius*.78,0,0,TAU);ctx.stroke();
      orbitals.forEach((o,i)=>{
        const angle=Math.atan2((o.y-centreY)/.78,o.x-s.player.x);
        if(!reduced){for(let j=0;j<3;j++){ctx.strokeStyle=['#d5edb877','#c6e0a345','#c6e0a31f'][j];ctx.lineWidth=2-j*.35;ctx.beginPath();ctx.ellipse(s.player.x,centreY,radius,radius*.78,0,angle-.13-j*.15,angle-j*.15);ctx.stroke();}
          const leafAngle=angle-.4;ctx.fillStyle='#b6d59190';ctx.fillRect(s.player.x+Math.cos(leafAngle)*radius-1,centreY+Math.sin(leafAngle)*radius*.78-1,3,2);}
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(reduced?0:angle+Math.PI*.5+Math.sin(s.time*5+i)*.1);ctx.drawImage(icons.garlic,-13,-13,26,26);ctx.restore();
      });ctx.restore();
    }
    function muzzle(f,reduced){
      const t=clamp(f.age/f.life,0,1),espresso=f.weapon==='espresso',origin=espresso&&f.socket?f.socket:f;
      ctx.save();ctx.translate(origin.x,origin.y);ctx.rotate(f.angle||0);ctx.globalAlpha=(1-t)*.8;
      if(espresso){
        ctx.strokeStyle='#39251d';ctx.lineWidth=(f.heavy||f.compressed?3:2)*(1-t)+.7;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(9,-5*(1-t),18+t*7,0);ctx.stroke();
        ctx.strokeStyle='#b6b9aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-1);ctx.quadraticCurveTo(7,-5,13,-2);ctx.stroke();
        if(!reduced)for(let i=0;i<(f.heavy?5:3);i++){ctx.fillStyle=i?'#38251d':'#999c90';ctx.beginPath();ctx.ellipse(9+i*6+t*12,(i-1)*(2+t*5),1.5,1,0,0,TAU);ctx.fill();}
      }else{ctx.fillStyle='#ceeafa';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(14,-4*(1-t));ctx.lineTo(20,0);ctx.lineTo(14,4*(1-t));ctx.closePath();ctx.fill();}ctx.restore();
    }

    function weaponSpark(f,reduced){
      impact({x:f.x,y:f.y,angle:f.angle,heavy:!!f.heavy,age:f.age,life:Math.min(f.life,.2),weapon:f.weapon||(f.colour==='#b6e3f3'?'tray':f.colour==='#c8eaa0'?'garlic':'espresso')},reduced);
    }
    function impact(f,reduced){
      const t=clamp(f.age/f.life,0,1),heavy=!!f.heavy,angle=Number.isFinite(f.angle)?f.angle:0;
      ctx.save();ctx.translate(Math.round(f.x),Math.round(f.y));ctx.rotate(angle);ctx.globalAlpha=(1-t)*(reduced?.55:1);
      if(f.weapon==='espresso'){
        ctx.fillStyle='#271c18';ctx.beginPath();ctx.ellipse(0,0,4*(1-t)+1,3*(1-t)+1,0,0,TAU);ctx.fill();
        for(let i=0;i<(reduced?2:heavy?6:4);i++){const a=(i-1.5)*1.2,r=3+t*17,px=Math.cos(a)*r,py=Math.sin(a)*r-t*3;ctx.fillStyle=i%2?'#3d2a20':'#918e79';ctx.beginPath();ctx.ellipse(px,py,(2.4-i*.15)*(1-t*.65),1.2, a,0,TAU);ctx.fill();}
        ctx.restore();return;
      }
      const point=(length,width)=>{ctx.beginPath();ctx.moveTo(-length,0);ctx.lineTo(0,-width);ctx.lineTo(length,0);ctx.lineTo(0,width);ctx.closePath();};
      const colours=f.weapon==='tray'?['#e9f6ff','#8dc3de']:f.weapon==='garlic'?['#e8f5c5','#a4cf87']:['#fff1c4','#e8ad63'];
      const length=(heavy?10:6)*(1-t*.7);ctx.fillStyle='#4e342d';point(length+1,(heavy?4:2)+1);ctx.fill();ctx.fillStyle=colours[0];point(length,heavy?4:2);ctx.fill();
      if(!reduced){for(let i=0;i<(heavy?5:3);i++){const a=(i-(heavy?2:1))*.73,near=4+t*16,far=near+(heavy?10:6)*(1-t);ctx.lineWidth=i===0?2:1.4;ctx.strokeStyle=colours[i%2];ctx.beginPath();ctx.moveTo(Math.cos(a)*near,Math.sin(a)*near);ctx.lineTo(Math.cos(a)*far,Math.sin(a)*far);ctx.stroke();}}
      ctx.restore();
    }
    function comboRing(s){
      if(s.flowTime>0){ctx.save();ctx.strokeStyle='#c2eee2b0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(s.player.x,s.player.y+1,23,8,0,0,TAU);ctx.stroke();for(let i=0;i<4;i++){const a=i*TAU/4;ctx.fillStyle='#d8f2c4';ctx.fillRect(s.player.x+Math.cos(a)*26-1,s.player.y+Math.sin(a)*9-1,2,2);}ctx.restore();}
      if(!(s.dashFollow>0))return;
      ctx.save();ctx.strokeStyle='#e9d99d99';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(s.player.x,s.player.y+2,26,9,0,-Math.PI/2,-Math.PI/2+TAU*clamp(s.dashFollow/.65,0,1));ctx.stroke();ctx.restore();
    }
    function foeStyle(e){return e.type==='boss'?(BOSS_STYLES[e.bossType]||BOSS_STYLES.landlord):(ENEMY_STYLES[e.type]||ENEMY_STYLES.villager);}
    function dangerStyle(kind=''){
      if(/lantern|lamplighter|oven|baker/.test(kind))return {colour:'#e2ac6b',shape:'fire'};
      if(/thorn|groundskeeper|garden/.test(kind))return {colour:'#b6c891',shape:'thorn'};
      if(/clock|hour/.test(kind))return {colour:'#d6bd85',shape:'clock'};
      if(/glass|mirror/.test(kind))return {colour:'#bedbe5',shape:'glass'};
      if(/tide|ferryman/.test(kind))return {colour:'#a6d8d5',shape:'tide'};
      if(/bell|chime/.test(kind))return {colour:'#dfc39b',shape:'chime'};
      if(/decree|mayor|watchman/.test(kind))return {colour:'#d7b5c4',shape:'decree'};
      return {colour:'#cd9fbd',shape:'hex'};
    }
    function dangerZone(z,outlineOnly=false,reduced=false){
      if(root.MOROGUE_MAGISTRATE_ART?.zone(ctx,z,outlineOnly,reduced))return;
      if(root.MOROGUE_BEEKEEPER_ART?.zone(ctx,z,outlineOnly,reduced))return;
      if(root.MOROGUE_RAILMASTER_ART?.zone(ctx,z,outlineOnly,reduced))return;
      if(root.MOROGUE_CANTOR_STAGE?.zone(ctx,z,outlineOnly))return;
      const customDemi=trioArt(z.source);if(customDemi?.ready){customDemi.zone(ctx,z,outlineOnly);return;}
      if(z.source==='ferryman'&&root.MOROGUE_FERRYMAN_ART?.ready){root.MOROGUE_FERRYMAN_ART.zone(ctx,z,outlineOnly);return;}
      if(z.source==='bellkeeper'&&root.MOROGUE_BELLKEEPER_ART?.ready){root.MOROGUE_BELLKEEPER_ART.zone(ctx,z,outlineOnly);return;}
      if(z.source==='landlord'&&root.MOROGUE_LANDLORD_ART?.ready){root.MOROGUE_LANDLORD_ART.zone(ctx,z,outlineOnly);return;}
      if(z.source==='star'&&root.MOROGUE_STAR_FLOOR?.zone(ctx,z,outlineOnly))return;
      if(z.source==='uncrowned'||z.source==='uncrownedWave'){root.ROUGE_MORA_FINALE_ART.zone(ctx,z,outlineOnly,reduced);return;}
      if(z.shape){root.ROUGE_MORA_WORLD_ART.zone(ctx,z,outlineOnly);return;}
      if(z.x+z.r<camera.x||z.y+z.r<camera.y||z.x-z.r>camera.x+camera.viewWidth||z.y-z.r>camera.y+camera.viewHeight)return;
      const active=z.age>=z.delay,style=dangerStyle(z.kind||z.source),progress=clamp(z.age/Math.max(.01,z.delay),0,1);
      ctx.save();ctx.lineWidth=active?4:3;ctx.strokeStyle='#583b4b';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.stroke();
      ctx.lineWidth=active?2.5:1.5;ctx.strokeStyle=active?'#ffcfbc':'#eda5a0';ctx.stroke();
      if(outlineOnly){ctx.restore();return;}
      ctx.fillStyle=style.colour+(active?'32':'17');ctx.fill();
      if(!active){ctx.strokeStyle=style.colour+'c0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(z.x,z.y,z.r*.88,-Math.PI/2,-Math.PI/2+progress*TAU);ctx.stroke();}
      ctx.translate(z.x,z.y);ctx.strokeStyle=style.colour;ctx.fillStyle=style.colour;ctx.lineWidth=1.5;
      if(style.shape==='clock'){ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.moveTo(0,-6);ctx.lineTo(0,0);ctx.lineTo(5,3);ctx.stroke();}
      else if(style.shape==='glass'||style.shape==='hex'){ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,0);ctx.lineTo(0,12);ctx.lineTo(-9,0);ctx.closePath();ctx.stroke();if(style.shape==='hex'){ctx.beginPath();ctx.moveTo(-13,0);ctx.lineTo(13,0);ctx.moveTo(0,-16);ctx.lineTo(0,16);ctx.stroke();}}
      else if(style.shape==='chime'){for(let r=4;r<=12;r+=4){ctx.beginPath();ctx.arc(0,0,r,.25,Math.PI-.25);ctx.stroke();}}
      else if(style.shape==='tide'){for(const y of [-6,0,6]){ctx.beginPath();ctx.moveTo(-13,y);ctx.quadraticCurveTo(-6,y-6,0,y);ctx.quadraticCurveTo(6,y+6,13,y);ctx.stroke();}}
      else if(style.shape==='fire'){ctx.beginPath();ctx.moveTo(-7,8);ctx.lineTo(-9,0);ctx.lineTo(-3,2);ctx.lineTo(1,-11);ctx.lineTo(7,-2);ctx.lineTo(9,6);ctx.lineTo(2,11);ctx.closePath();ctx.stroke();ctx.fillRect(-1,2,3,5);}
      else if(style.shape==='thorn'){for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-13);ctx.moveTo(0,-7);ctx.lineTo(-5,-11);ctx.moveTo(0,-4);ctx.lineTo(5,-8);ctx.stroke();}}
      else{ctx.strokeRect(-9,-11,18,22);ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(5,5);ctx.moveTo(5,-5);ctx.lineTo(-5,5);ctx.stroke();}
      ctx.restore();
    }
    function enemyHazard(h,reduced=false){
      if(root.MOROGUE_MAGISTRATE_ART?.projectile(ctx,h,reduced))return;
      if(root.MOROGUE_BEEKEEPER_ART?.projectile(ctx,h,reduced))return;
      if(h.source==='landlord'&&root.MOROGUE_LANDLORD_ART?.ready){root.MOROGUE_LANDLORD_ART.projectile(ctx,h,reduced);return;}
      if(h.source==='duchess'&&root.MOROGUE_DUCHESS_ART?.ready){root.MOROGUE_DUCHESS_ART.projectile(ctx,h,reduced);return;}
      if(h.x<camera.x-24||h.y<camera.y-24||h.x>camera.x+camera.viewWidth+24||h.y>camera.y+camera.viewHeight+24)return;
      if(h.source==='uncrowned'){root.ROUGE_MORA_FINALE_ART.projectile(ctx,h);return;}
      const kind=h.kind||h.source||'',style=dangerStyle(kind),r=clamp(h.r||8,4,12),angle=Math.atan2(h.vy||0,h.vx||1);
      ctx.save();ctx.translate(h.x,h.y);
      if(kind==='slinger'){
        ctx.rotate(angle);ctx.fillStyle='#4d3945';ctx.fillRect(-8,-5,13,10);ctx.fillRect(4,-3,5,6);ctx.fillStyle='#7d9778';ctx.fillRect(-6,-3,10,6);ctx.fillStyle='#d2c69e';ctx.fillRect(-3,-3,3,6);ctx.fillStyle='#b6d7bc';ctx.fillRect(5,-1,3,2);
      }else if(kind==='miller'){
        ctx.rotate(angle);ctx.fillStyle='#6c5a60';ctx.fillRect(-6,-6,12,12);ctx.fillStyle='#e4d7b9';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#b9a381';ctx.fillRect(-5,-2,10,2);ctx.fillStyle='#f5eacb';ctx.fillRect(-3,-4,4,2);
      }else if(/archer|huntsman|watchman/.test(kind)){
        ctx.rotate(angle);ctx.strokeStyle='#533846';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-r*1.4,0);ctx.lineTo(r,0);ctx.stroke();ctx.strokeStyle='#e9c6bd';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#f2d7cc';ctx.beginPath();ctx.moveTo(r+2,0);ctx.lineTo(r-4,-4);ctx.lineTo(r-4,4);ctx.closePath();ctx.fill();
      }else if(style.shape==='glass'||style.shape==='thorn'){
        ctx.rotate(angle);ctx.fillStyle='#50364f';ctx.beginPath();ctx.moveTo(r+2,0);ctx.lineTo(0,r*.7+2);ctx.lineTo(-r-2,0);ctx.lineTo(0,-r*.7-2);ctx.closePath();ctx.fill();ctx.fillStyle=style.colour;ctx.beginPath();ctx.moveTo(r,0);ctx.lineTo(0,r*.55);ctx.lineTo(-r,0);ctx.lineTo(0,-r*.55);ctx.closePath();ctx.fill();ctx.fillStyle='#ffe2d7';ctx.fillRect(0,-1,3,2);
      }else{
        ctx.fillStyle='#53324f';ctx.beginPath();ctx.arc(0,0,r+2,0,TAU);ctx.fill();ctx.fillStyle=style.colour;ctx.beginPath();ctx.arc(0,0,r*.7,0,TAU);ctx.fill();ctx.fillStyle='#ffe0df';ctx.fillRect(-2,-3,3,3);
        if(style.shape==='fire'){ctx.fillStyle='#d78960a0';ctx.rotate(angle);ctx.fillRect(-r-6,-2,5,4);}
      }
      ctx.restore();
    }
    function foeWarning(e,s,g){
      if(e.major)return;
      if(!(e.telegraph>0))return;
      const role=e.role||(root.MORATALES_SURVIVOR.ENEMY_TYPES?.[e.type]?.role),aimed=['charger','duelist','sniper','spearman'].includes(role)||['baker','huntsman'].includes(e.bossType),aimLength=Math.hypot(e.aimX||0,e.aimY||0);
      g.save();g.strokeStyle='#f2b397';g.lineWidth=2;g.beginPath();g.ellipse(e.x,e.y,24+(e.r||14)*.3,10,0,0,TAU);g.stroke();
      if(aimed&&aimLength>.1){
        const dx=e.aimX/aimLength,dy=e.aimY/aimLength,length=role==='sniper'||e.bossType==='huntsman'?320:175;
        g.strokeStyle='#d69289b0';g.lineWidth=1.4;g.setLineDash([5,5]);g.beginPath();g.moveTo(e.x+dx*20,e.y-18+dy*20);g.lineTo(e.x+dx*length,e.y-18+dy*length);g.stroke();g.setLineDash([]);
        for(const at of [45,85]){const x=e.x+dx*at,y=e.y-18+dy*at;g.beginPath();g.moveTo(x-dx*6-dy*4,y-dy*6+dx*4);g.lineTo(x,y);g.lineTo(x-dx*6+dy*4,y-dy*6-dx*4);g.stroke();}
      }else if(['zoner','summoner','spinner'].includes(role)||e.type==='boss'){
        g.strokeStyle='#e1abbf';g.lineWidth=1;g.beginPath();g.ellipse(e.x,e.y,34,14,0,0,TAU);g.stroke();for(let i=0;i<4;i++){const a=i*TAU/4;g.fillStyle='#eec6ab';g.fillRect(e.x+Math.cos(a)*34-2,e.y+Math.sin(a)*14-2,4,4);}
      }
      g.restore();
    }
    function foeProps(g,style,e){
      const prop=style.prop,accent=style.accent,ink='#26313a',wood='#806049';
      const rect=(colour,x,y,w,h)=>{g.fillStyle=colour;g.fillRect(x,y,w,h);};
      const line=(colour,width,points)=>{g.strokeStyle=colour;g.lineWidth=width;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.stroke();};
      const diamond=(x,y,r,colour)=>{g.fillStyle=colour;g.beginPath();g.moveTo(x,y-r);g.lineTo(x+r*.65,y);g.lineTo(x,y+r);g.lineTo(x-r*.65,y);g.closePath();g.fill();};
      const bell=(x,y,big=false)=>{const k=big?1.35:1;g.save();g.translate(x,y);g.scale(k,k);g.fillStyle=ink;g.beginPath();g.moveTo(-4,-6);g.lineTo(4,-6);g.lineTo(4,-2);g.lineTo(6,3);g.lineTo(8,3);g.lineTo(8,6);g.lineTo(-8,6);g.lineTo(-8,3);g.lineTo(-6,3);g.lineTo(-4,-2);g.closePath();g.fill();rect('#ae8145',-3,-5,6,9);rect(accent,-2,-5,3,8);rect('#d7b266',-5,1,10,3);rect('#e6cb8d',-7,4,14,1);rect('#644b39',-1,6,3,3);rect('#dec99b',-2,-9,4,3);g.restore();};
      const mirror=(x,y,big=false)=>{const r=big?10:6;rect(wood,x-1,y+r,3,15);g.strokeStyle='#a5b0ac';g.lineWidth=3;g.fillStyle='#698c9a';g.beginPath();g.ellipse(x,y,r,r*1.3,0,0,TAU);g.fill();g.stroke();line('#e2f2ee',2,[[x-3,y+3],[x+4,y-5]]);};
      g.save();
      if(prop==='hood'){g.fillStyle='#443645';g.beginPath();g.moveTo(-9,22);g.lineTo(-8,10);g.lineTo(0,5);g.lineTo(9,13);g.lineTo(10,22);g.lineTo(6,17);g.lineTo(3,12);g.lineTo(-3,12);g.lineTo(-6,18);g.closePath();g.fill();rect(accent,-12,31,5,2);rect(accent,7,31,5,2);}
      else if(prop==='pauldrons'){for(const x of [-15,7]){rect(ink,x,28,9,9);rect('#788b92',x+1,29,7,7);rect('#b3c6c7',x+1,29,7,2);}rect('#9d855d',-8,43,16,4);rect(accent,-2,42,4,6);}
      else if(prop==='staff'){rect(wood,17,34,3,29);diamond(18,30,7,ink);diamond(18,30,5,accent);rect('#f3dcec',17,27,2,3);}
      else if(prop==='daggers'){for(const x of [-15,14]){line(ink,4,[[x,38],[x+(x<0?-5:5),51]]);line(accent,2,[[x,39],[x+(x<0?-5:5),50]]);rect('#806f56',x-3,37,6,2);}}
      else if(prop==='satchel'){line('#c5ad79',3,[[-8,28],[11,48]]);rect(ink,6,41,13,14);rect('#946443',7,42,11,12);rect('#c29264',7,42,11,4);rect('#efdfb7',11,46,5,4);}
      else if(prop==='sling'){line('#c2b39a',1.5,[[12,37],[22,24],[29,33],[12,37]]);rect('#867562',25,29,6,5);rect(accent,-7,47,13,3);}
      else if(prop==='bell')bell(18,44);
      else if(prop==='lantern'){line(wood,3,[[17,32],[17,62]]);line('#d0bb83',1.5,[[13,36],[13,31],[21,31],[21,36]]);rect(ink,10,36,15,17);rect('#a58a55',11,37,13,15);rect('#eec576',13,39,9,11);rect('#fff1ac',16,39,3,10);rect(ink,9,51,17,3);}
      else if(prop==='rapier'){line(ink,3,[[16,42],[29,23]]);line('#d9e2da',1.5,[[16,41],[29,23]]);g.strokeStyle=accent;g.lineWidth=2;g.beginPath();g.arc(15,44,4,0,TAU);g.stroke();}
      else if(prop==='cleaver'){rect('#d5c5a0',-8,31,16,15);rect('#8b5260',-5,38,3,6);rect(wood,15,42,3,14);rect(ink,16,28,12,16);rect('#a6b3b5',17,29,10,13);rect('#e4e6cc',17,29,10,2);}
      else if(prop==='siphon'){line('#d49eb4',2,[[9,34],[18,38],[18,54]]);rect('#6d495d',12,41,11,15);rect('#bb728e',14,44,7,10);rect('#efd0d3',14,43,3,3);}
      else if(prop==='bow'){g.strokeStyle=wood;g.lineWidth=3;g.beginPath();g.arc(13,42,17,-1.25,1.25);g.stroke();line('#ddd1b0',1,[[18,26],[18,58]]);line(accent,1.5,[[8,42],[32,42]]);}
      else if(prop==='veil'){rect('#343749b0',-10,12,20,18);rect('#5b586c',-12,13,4,27);rect('#5b586c',8,13,4,27);line('#6f8865',2,[[12,53],[18,41]]);for(const [x,y] of [[15,40],[20,39],[18,44]]){rect('#d2bdca',x,y,4,3);rect('#ecdacc',x+1,y,1,1);}}
      else if(prop==='mirror')mirror(18,38);
      else if(prop==='flames'){for(const [x,y] of [[-17,34],[16,42],[-9,61]]){diamond(x,y,5,'#569b9290');diamond(x,y-1,3,accent);}rect(accent,-6,31,12,2);}
      else if(prop==='shield'){g.fillStyle=ink;g.beginPath();g.moveTo(10,31);g.lineTo(26,31);g.lineTo(26,45);g.lineTo(18,54);g.lineTo(10,45);g.closePath();g.fill();g.fillStyle='#687889';g.fillRect(12,33,12,11);line(accent,2,[[18,33],[18,48]]);line(accent,2,[[13,38],[23,38]]);}
      else if(prop==='paddle'){rect(wood,18,20,3,43);rect('#cbb88b',14,18,11,16);rect('#efe0bd',15,20,7,3);rect('#d8c599',-10,36,9,14);}
      else if(prop==='halberd'){rect(wood,18,17,3,47);diamond(19,14,7,accent);g.fillStyle='#9baeb4';g.beginPath();g.moveTo(20,21);g.lineTo(30,24);g.lineTo(30,34);g.lineTo(20,30);g.closePath();g.fill();}
      else if(prop==='banner'){rect(wood,18,7,3,58);g.fillStyle='#9d4f61';g.beginPath();g.moveTo(21,10);g.lineTo(35,10);g.lineTo(35,31);g.lineTo(28,27);g.lineTo(21,31);g.closePath();g.fill();rect(accent,24,13,7,2);diamond(27,20,4,accent);}
      else if(prop==='kettle'){rect(wood,17,45,3,12);g.fillStyle='#604134';g.beginPath();g.ellipse(19,39,11,9,0,0,TAU);g.fill();g.fillStyle='#aa6e42';g.beginPath();g.ellipse(19,38,9,7,0,0,TAU);g.fill();rect('#d9a66b',14,32,10,3);rect('#734d35',16,29,6,3);rect('#e3b77f',13,36,3,6);rect('#754832',23,38,3,6);rect('#c49461',16,44,7,1);line(accent,3,[[27,38],[33,33],[33,30]]);g.strokeStyle=accent;g.lineWidth=2;g.beginPath();g.arc(10,38,5,Math.PI*.5,Math.PI*1.5);g.stroke();}
      else if(prop==='greatbell'){bell(21,40,true);rect('#b29a62',-13,27,25,4);rect('#e5d3a1',-2,28,4,13);}
      else if(prop==='fan'){g.fillStyle='#aa668d';g.strokeStyle='#603e58';g.lineWidth=2;g.beginPath();g.moveTo(12,47);g.arc(12,47,22,-1.8,-.2);g.closePath();g.fill();g.stroke();for(let i=0;i<5;i++){const a=-1.7+i*.35;line(accent,1,[[12,47],[12+Math.cos(a)*21,47+Math.sin(a)*21]]);diamond(12+Math.cos(a)*16,47+Math.sin(a)*16,1.7,'#efd2da');}rect(accent,-7,9,15,3);for(const x of [-6,0,6])diamond(x,6,4,accent);}
      else if(prop==='oar'){line(wood,4,[[12,18],[27,65]]);g.save();g.translate(23,55);g.rotate(-.3);rect('#aaa98d',-4,-4,8,17);rect('#d7d8b6',-3,-3,2,13);g.restore();rect('#80958d',-11,14,23,4);rect('#586d6c',-8,8,16,7);}
      else if(prop==='breadpaddle'){rect(wood,18,26,3,38);rect('#674e3d',10,22,19,22);rect('#ad8657',11,23,17,20);rect('#d1ad71',12,24,2,18);g.fillStyle='#996034';g.beginPath();g.ellipse(19,30,8,7,0,0,TAU);g.fill();g.fillStyle='#dfb269';g.beginPath();g.ellipse(19,29,7,5,0,0,TAU);g.fill();line('#ffe0a0',2,[[15,25],[17,31],[20,25],[22,31]]);rect('#958e80',-12,8,25,11);rect('#e1d8bd',-11,8,23,9);rect('#f1e7c9',-11,3,8,9);rect('#fff0d6',-4,0,9,12);rect('#e9ddc0',5,3,7,9);rect('#b9b29c',-10,15,21,2);}
      else if(prop==='scythe'){rect(wood,19,9,3,55);g.strokeStyle='#3a5048';g.lineWidth=6;g.beginPath();g.arc(8,25,22,-1.1,.13);g.stroke();g.strokeStyle='#b9c6ad';g.lineWidth=3;g.stroke();rect('#bda56a',18,29,5,3);for(const x of [-8,0,8])diamond(x,12,5,'#7da175');}
      else if(prop==='clock'){g.fillStyle='#80674c';g.beginPath();g.arc(19,37,12,0,TAU);g.fill();g.fillStyle='#dbcd9c';g.beginPath();g.arc(19,37,9,0,TAU);g.fill();line('#594936',1.5,[[19,30],[19,37],[24,39]]);for(let i=0;i<8;i++){const a=i*TAU/8;rect('#e0c78b',18+Math.cos(a)*13,36+Math.sin(a)*13,3,3);rect('#766040',18+Math.cos(a)*7,36+Math.sin(a)*7,1.5,1.5);}rect('#b99d65',-9,8,19,5);rect('#daca99',-8,8,17,1);}
      else if(prop==='greatmirror'){mirror(20,35,true);for(const x of [-8,0,8])diamond(x,10,5,accent);rect('#9fb9bb',-8,27,17,3);}
      else if(prop==='crossbow'){line(wood,4,[[11,34],[24,55]]);line('#c1b993',3,[[8,46],[18,35],[29,35]]);line('#ddd5b0',1,[[8,46],[29,35]]);rect('#644f3c',-17,24,7,26);for(const x of [-16,-13])line(accent,1,[[x,28],[x-3,15]]);}
      else if(prop==='mayor'){line('#dbba72',3,[[-10,27],[-7,36],[0,40],[7,36],[10,27]]);diamond(0,41,5,'#f0d48b');rect('#3e4557',-10,7,21,12);rect('#8b7890',-13,17,27,3);rect('#d5bb89',-9,14,19,2);rect('#846177',16,34,5,29);diamond(18,31,5,accent);}
      g.restore();
    }
    let bossFlashCanvas=null,bossFlashPaint=null;
    function bossDraw(paint,e,reduced,draw){
      const flash=Math.max(0,Math.min(1,((e.hitConfirmUntil||0)-(e.age||0))/.09));
      if(!flash){paint.save();draw(paint,e,reduced);paint.restore();return;}
      // A rig can contain hundreds of texture slices. Brighten the completed
      // silhouette once, rather than making the GPU filter every slice.
      if(!bossFlashCanvas){bossFlashCanvas=document.createElement('canvas');bossFlashPaint=bossFlashCanvas.getContext('2d');}
      const layer=bossFlashPaint,w=paint.canvas.width,h=paint.canvas.height;
      if(bossFlashCanvas.width!==w||bossFlashCanvas.height!==h){bossFlashCanvas.width=w;bossFlashCanvas.height=h;}
      layer.setTransform(1,0,0,1,0,0);layer.clearRect(0,0,w,h);layer.save();
      layer.setTransform(paint.getTransform());layer.globalAlpha=paint.globalAlpha;layer.imageSmoothingEnabled=paint.imageSmoothingEnabled;
      draw(layer,e,reduced);layer.restore();
      paint.save();paint.setTransform(1,0,0,1,0,0);paint.globalAlpha=1;
      paint.filter='brightness('+(1+flash*(reduced?.12:.32))+')';paint.drawImage(bossFlashCanvas,0,0);paint.restore();
    }
    const easeInk=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
    function drawPaintedRival(paint,e,reduced,echo=null){root.MOROGUE_MAGISTRATE_ART.rival(paint,e,null,reduced,echo);}
    function actor(e,isPlayer,s,reduced,paint=ctx){
      if(e.inkFight&&['duel','tear','exit'].includes(e.inkFight.mode)){if(e.inkFight.mode==='exit'&&e.inkFight.age>=2.3){paint.save();paint.globalAlpha=easeInk((e.inkFight.age-2.3)/.7);root.MOROGUE_MAGISTRATE_ART.draw(paint,e,reduced);paint.restore();}if(e.inkFight.mode!=='exit'||e.inkFight.age<2){paint.save();if(e.inkFight.mode==='exit')paint.globalAlpha=1-e.inkFight.age/2;drawPaintedRival(paint,e,reduced);paint.restore();}return;}
      if(e.finalBoss){bossDraw(paint,e,reduced,root.ROUGE_MORA_FINALE_ART.target);return;}
      const customDemi=trioArt(e.bossType);if(!e.major&&customDemi?.ready){bossDraw(paint,e,reduced,customDemi.draw);recentHits.set(e,e.hit||0);return;}
      if(!e.major&&e.bossType==='ferryman'&&root.MOROGUE_FERRYMAN_ART?.ready){bossDraw(paint,e,reduced,root.MOROGUE_FERRYMAN_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(!e.major&&e.bossType==='bellkeeper'&&root.MOROGUE_BELLKEEPER_ART?.ready){bossDraw(paint,e,reduced,root.MOROGUE_BELLKEEPER_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(!e.major&&e.bossType==='landlord'&&root.MOROGUE_LANDLORD_ART?.ready){bossDraw(paint,e,reduced,root.MOROGUE_LANDLORD_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(!e.major&&e.bossType==='duchess'&&root.MOROGUE_DUCHESS_ART?.ready){bossDraw(paint,e,reduced,root.MOROGUE_DUCHESS_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.type==='sigil'){if(e.bossType==='admiral'&&root.MOROGUE_ADMIRAL_ART?.ready){root.MOROGUE_ADMIRAL_ART.object(paint,e,reduced);return;}if(e.bossType==='oracle'&&root.MOROGUE_ORACLE_ART?.ready){root.MOROGUE_ORACLE_ART.object(paint,e,reduced);return;}if(e.finaleAnchor)root.ROUGE_MORA_FINALE_ART.anchor(paint,e,reduced);else if(e.bossType==='briar'&&root.MOROGUE_BRIAR_ART?.ready)root.MOROGUE_BRIAR_ART.object(paint,e,reduced);else if(e.bossType==='prism'&&root.MOROGUE_PRISM_ART?.ready)root.MOROGUE_PRISM_ART.object(paint,e,reduced);else if(e.bossType==='clock'&&root.MOROGUE_CLOCK_ART?.ready)root.MOROGUE_CLOCK_ART.object(paint,e,reduced);else if(e.bossType==='star'&&root.MOROGUE_STAR_ART?.ready)root.MOROGUE_STAR_ART.object(paint,e,reduced);else if(e.bossType==='cantor'&&root.MOROGUE_CANTOR_ART?.ready)root.MOROGUE_CANTOR_ART.object(paint,e,reduced);else if(e.bossType==='duelist'&&root.MOROGUE_DUELIST_ART?.ready)root.MOROGUE_DUELIST_ART.object(paint,e,reduced);else if(e.bossType==='beekeeper'&&root.MOROGUE_BEEKEEPER_ART?.ready)root.MOROGUE_BEEKEEPER_ART.object(paint,e,reduced);
      else if(e.bossType==='magistrate'&&root.MOROGUE_MAGISTRATE_ART?.ready)root.MOROGUE_MAGISTRATE_ART.object(paint,e,reduced);else if(e.bossType==='railmaster'&&root.MOROGUE_RAILMASTER_ART?.ready)root.MOROGUE_RAILMASTER_ART.object(paint,e,reduced);else root.ROUGE_MORA_WORLD_ART.object(paint,e);return;}
      if(e.major&&e.bossType==='kiln'&&root.MOROGUE_KILN_ART?.ready){
        root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_KILN_ART.draw);
        recentHits.set(e,e.hit||0);return;
      }
      if(e.major&&e.bossType==='admiral'&&root.MOROGUE_ADMIRAL_ART?.ready){
        root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_ADMIRAL_ART.draw);
        recentHits.set(e,e.hit||0);return;
      }
      if(e.major&&e.bossType==='briar'&&root.MOROGUE_BRIAR_ART?.ready){
        root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_BRIAR_ART.draw);
        recentHits.set(e,e.hit||0);return;
      }
      if(e.major&&e.bossType==='prism'&&root.MOROGUE_PRISM_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_PRISM_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='clock'&&root.MOROGUE_CLOCK_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_CLOCK_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='star'&&root.MOROGUE_STAR_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_STAR_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='duelist'&&root.MOROGUE_DUELIST_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_DUELIST_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='beekeeper'&&root.MOROGUE_BEEKEEPER_ART?.ready){if(!e.beeFight)root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_BEEKEEPER_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.railCarriageMinion&&root.MOROGUE_RAILMASTER_ART?.minion){root.MOROGUE_RAILMASTER_ART.minion(paint,e,reduced);return;}
      if(e.major&&e.bossType==='railmaster'&&root.MOROGUE_RAILMASTER_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_RAILMASTER_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='magistrate'&&root.MOROGUE_MAGISTRATE_ART?.ready){if(!e.inkFight)root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_MAGISTRATE_ART.draw);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='oracle'&&root.MOROGUE_ORACLE_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);if(e.phase<4)bossDraw(paint,e,reduced,root.MOROGUE_ORACLE_ART.draw);else root.MOROGUE_ORACLE_ART.draw(paint,e,reduced);recentHits.set(e,e.hit||0);return;}
      if(e.major&&e.bossType==='cantor'&&root.MOROGUE_CANTOR_ART?.ready){root.ROUGE_MORA_WORLD_ART.boss(paint,e,reduced);bossDraw(paint,e,reduced,root.MOROGUE_CANTOR_ART.draw);recentHits.set(e,e.hit||0);return;}
      const ctx=paint,style=isPlayer?null:foeStyle(e),a=isPlayer?playerAnimator:animations[style.variant];if(!a)return;
      if(paint.canvas===canvas&&!isPlayer&&(e.x<camera.x-85||e.y<camera.y-25||e.x>camera.x+camera.viewWidth+85||e.y>camera.y+camera.viewHeight+115))return;
      const size=isPlayer?1:e.major?1.85:e.type==='boss'?1.55:e.type==='elite'?1.25:['brute','glutton','miller'].includes(e.type)?1.1:e.type==='wisp'?.84:.91;
      const step=e.major&&!['approach'].includes(e.majorState)&&!e.charge?-1:isPlayer?(e.moving||e.dash>0?Math.floor(s.time*11)%8:-1):Math.floor(e.age*(e.charge>0?16:['runner','courier','leech'].includes(e.type)?13:8))%8;
      const pose=isPlayer?actionPose(s):root.ROUGE_MORA_FOE_MOTION.pose(e,reduced);let view=e.view;if(isPlayer&&(pose.kind==='whirl'||pose.kind==='strike'&&pose.step===3)&&s.mainWeapon!=='espresso'){const views=['right','front','left','back'];view=views[(views.indexOf(e.view)+Math.floor(pose.phase*4))%4];}
      if(isPlayer&&pose.view)view=pose.view;
      const gesture=isPlayer&&pose.kind==='emote'?activeEmote:null;if(gesture)view=gesture.view;
      const display=isPlayer&&root.MOROGUE_PASSAGE_ART?.supported(s.transition)?root.MOROGUE_PASSAGE_ART.player(s.transition,e,passageOrigins.get(s.transition)):e;
      const frame=a.frame(view,step,pose),x=Math.round(display.x),y=Math.round(display.y),top=y-65*size;
      shadow(x,y,16*size,ctx);
      if(e.major&&e.charge>0&&!reduced&&e.majorPlan?.motions){const age=e.majorPlan.duration-e.majorClock,m=e.majorPlan.motions.find(m=>age>=m.start&&age<=m.start+m.duration);if(m){const f=(age-m.start)/m.duration;ctx.save();for(let i=3;i>0;i--){const t=Math.max(0,f-i*.13),tx=m.from.x+(m.to.x-m.from.x)*t,ty=m.from.y+(m.to.y-m.from.y)*t-Math.sin(t*Math.PI)*m.height;ctx.globalAlpha=.15*(1-i/4);ctx.drawImage(tinted(frame),tx-24*size,ty-65*size,48*size,68*size);}ctx.restore();}}
      if(isPlayer){ctx.strokeStyle='#f3dd8c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,19,7,0,0,TAU);ctx.stroke();}
      if(!isPlayer){foeWarning(e,s,ctx);root.ROUGE_MORA_WORLD_ART.boss(ctx,e,reduced);}
      ctx.save();if(!isPlayer){ctx.translate(x,y);ctx.translate(0,-(pose.lift||0)*size);ctx.rotate(pose.lean||0);if(e.dying){ctx.globalAlpha=1-e.dying;ctx.scale(1-e.dying*.2,1-e.dying*.65);}ctx.translate(-x,-y);}if(isPlayer&&!e.colossusThrow&&!e.admiralRide&&e.invulnerable>0&&e.hurtTime<=0&&Math.floor(e.invulnerable*16)%2)ctx.globalAlpha=.65;
      if(isPlayer){ctx.save();ctx.translate(x,y);if(e.colossusThrow){ctx.translate(0,-e.colossusThrow.lift);if(e.colossusThrow.u>0&&e.colossusThrow.u<1){const light=ctx.createRadialGradient(0,-30,0,0,-30,48);light.addColorStop(0,'#f5d7a02b');light.addColorStop(1,'#f5d7a000');ctx.fillStyle=light;ctx.fillRect(-48,-78,96,96);}ctx.rotate(reduced?0:e.colossusThrow.angle);}if(e.admiralRide){ctx.translate(0,-e.admiralRide.lift);ctx.rotate(reduced?0:e.admiralRide.lean);}if(e.starLeap)ctx.translate(0,-Math.sin(Math.min(1,e.starLeap.age/e.starLeap.duration)*Math.PI)*72);if(e.finaleLeap)ctx.translate(0,-Math.sin(Math.min(1,e.finaleLeap.age/e.finaleLeap.duration)*Math.PI)*(e.finaleLeap.colossus?52:78));const squash=e.land>0?Math.sin((1-e.land/.13)*Math.PI)*.07:0;ctx.scale(1+squash,1-squash);if(gesture){ctx.translate(gesture.offsetX,-gesture.lift);ctx.scale(gesture.scaleX,gesture.scaleY);ctx.translate(0,-32);ctx.rotate(gesture.rotation+gesture.lean);ctx.translate(0,32);}
        heldWeapon(s,pose,frame,view,true,reduced);
        CosmeticArt.cape(ctx,cosmetics.cape,view,s.time,e.moving,false,reduced,cloth,frame);
        ctx.drawImage(frame,-24,-65,48,68);
        CosmeticArt.cape(ctx,cosmetics.cape,view,s.time,e.moving,true,reduced,cloth,frame);
        heldWeapon(s,pose,frame,view,false,reduced);
        if(pose.kind==='infection')root.MOROGUE_PASSAGE_ART.hand(ctx,frame,s.transition,reduced);
        if(s.mainWeapon==='espresso')for(const f of muzzles){if(f.weapon!=='espresso'||f.socket)continue;const hand=frame.grip,tilt=frame.weaponPose?.tilt||0,side=view==='left'?1:-1;
          const rx=-side*6.3,ry=-4.2,px=hand.x-24+Math.cos(tilt)*rx-Math.sin(tilt)*ry,py=hand.y-65+Math.sin(tilt)*rx+Math.cos(tilt)*ry;
          const ride=e.admiralRide,roll=ride?.lean||0;f.socket={x:e.x+Math.cos(roll)*px-Math.sin(roll)*py,y:e.y-(ride?.lift||0)+Math.sin(roll)*px+Math.cos(roll)*py};
        }
        if(e.hurtTime>0){ctx.save();ctx.globalAlpha=Math.min(1,e.hurtTime/.16)*(reduced?.35:.78);ctx.drawImage(hitMask(frame,'front'),-24,-65,48,68);ctx.restore();}ctx.restore();
        if(gesture?.accent>0){ctx.save();ctx.globalAlpha*=gesture.accent*.85;ctx.translate(x,top-13-gesture.lift);if(gesture.id==='heart'){ctx.fillStyle='#eaa4a9';ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(-13,-3,-6,-11,0,-5);ctx.bezierCurveTo(6,-11,13,-3,0,5);ctx.fill();}else{ctx.fillStyle='#ead7a0';for(const dx of [-17,17]){ctx.fillRect(dx-1,-4,2,8);ctx.fillRect(dx-4,-1,8,2);}}ctx.restore();}}
      else ctx.drawImage(tinted(frame),x-24*size,top,48*size,68*size);
      if(!isPlayer){
        // Distinct vampire silhouettes keep every enemy rooted in the shared creator.
        ctx.fillStyle=({claret:'#633a49',navy:'#354654',teal:'#355651',linen:'#716b5a',rust:'#704d48',brown:'#584a40',stone:'#646471',slate:'#454957',plum:'#513c54'})[style.colour]||'#513c54';
        if(e.view!=='front'&&!e.major){
          ctx.save();ctx.translate(x,top);ctx.scale(size,size);capeShape(ctx);ctx.fill();
          ctx.fillStyle=e.type==='boss'?'#a35a79':'#746079';ctx.fillRect(-5,30,3,13);ctx.fillRect(-7,42,3,12);ctx.fillStyle='#292c3d';ctx.fillRect(4,32,2,15);ctx.fillRect(6,46,2,9);ctx.fillStyle='#bfa58a';ctx.fillRect(-6,27,12,2);ctx.restore();
        }
        if(e.view==='front'){ctx.fillStyle='#ef9e9c';ctx.fillRect(x-5*size,top+20*size,3*size,2*size);ctx.fillRect(x+3*size,top+20*size,3*size,2*size);ctx.fillStyle='#f3dfd1';ctx.fillRect(x-3*size,top+27*size,2*size,3*size);ctx.fillRect(x+3*size,top+27*size,2*size,3*size);}
        if(e.type==='elite'){ctx.fillStyle='#eed18f';const cy=top-5;ctx.fillRect(x-9,cy,18,5);ctx.fillRect(x-10,cy-6,4,8);ctx.fillRect(x-2,cy-9,4,10);ctx.fillRect(x+6,cy-6,4,8);}
        ctx.save();ctx.translate(x,top);ctx.scale(e.view==='left'?-size:size,size);if(e.major)root.ROUGE_MORA_FOE_MOTION.regalia(ctx,e,pose,reduced);else{ctx.translate(12,36);ctx.rotate(pose.propAngle||0);ctx.translate(-12,-36);foeProps(ctx,style,e);}ctx.restore();
        if(e.hit>0){
          ctx.save();ctx.globalAlpha=clamp(e.hit/.12,0,1)*(reduced?.3:.83);ctx.drawImage(hitMask(frame,e.view),x-24*size,top,48*size,68*size);ctx.restore();
          if(e.hit>(recentHits.get(e)||0)+.005&&(e.hitHeavy||e.hitWeapon==='baguette')&&impacts.length<48)impacts.push({x:e.x,y:top+36*size,angle:e.hitAngle,heavy:e.hitHeavy,age:0,life:e.hitHeavy?.18:.12});
        }
        recentHits.set(e,e.hit||0);
      }
      ctx.restore();
      if(!isPlayer&&!e.dying&&e.hp<e.maxHp){ctx.fillStyle='#243140';ctx.fillRect(x-17,top-9,34,4);ctx.fillStyle=e.type==='boss'?'#dca4bd':'#dabf95';ctx.fillRect(x-17,top-9,34*e.hp/e.maxHp,3);}
      if(e.type==='boss'&&e.phase>1){ctx.fillStyle=style.accent;for(let i=0;i<Math.min(3,e.phase);i++)ctx.fillRect(x-6+i*6,top-15,3,3);}
      if(isPlayer){ctx.fillStyle='#f3df9d';ctx.beginPath();const lift=e.colossusThrow?.lift||0;ctx.moveTo(x,top-6-lift);ctx.lineTo(x-4,top-12-lift);ctx.lineTo(x+4,top-12-lift);ctx.fill();}
    }
    function enemyPortrait(type,width=64,height=88,bossType=null){
      const customDemi=trioArt(bossType);if(customDemi?.ready){const c=makeCanvas(width,height);customDemi.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='ferryman'&&root.MOROGUE_FERRYMAN_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_FERRYMAN_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='bellkeeper'&&root.MOROGUE_BELLKEEPER_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_BELLKEEPER_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='landlord'&&root.MOROGUE_LANDLORD_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_LANDLORD_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='duchess'&&root.MOROGUE_DUCHESS_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_DUCHESS_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='prism'&&root.MOROGUE_PRISM_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_PRISM_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='clock'&&root.MOROGUE_CLOCK_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_CLOCK_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='star'&&root.MOROGUE_STAR_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_STAR_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='duelist'&&root.MOROGUE_DUELIST_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_DUELIST_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='beekeeper'&&root.MOROGUE_BEEKEEPER_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_BEEKEEPER_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='railmaster'&&root.MOROGUE_RAILMASTER_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_RAILMASTER_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='magistrate'&&root.MOROGUE_MAGISTRATE_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_MAGISTRATE_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='cantor'&&root.MOROGUE_CANTOR_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_CANTOR_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='briar'&&root.MOROGUE_BRIAR_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_BRIAR_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='admiral'&&root.MOROGUE_ADMIRAL_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_ADMIRAL_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='kiln'&&root.MOROGUE_KILN_ART?.ready){const c=makeCanvas(width,height);root.MOROGUE_KILN_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;}
      if(bossType==='uncrowned'){const c=makeCanvas(width,height);root.ROUGE_MORA_FINALE_ART.portrait(c.getContext('2d'),width,height);c.className='vs-enemy-portrait';return c;}
      const c=makeCanvas(width,height),g=c.getContext('2d'),boss=type==='boss',scale=Math.min(width/(boss?112:76),height/(boss?116:82));
      g.imageSmoothingEnabled=false;g.scale(scale,scale);actor({type,bossType,major:!!root.ROUGE_MORA_MAJORS.BOSSES[bossType],majorState:'intro',majorClock:1.2,phase:1,variant:0,x:width/scale*.43,y:height/scale-3,view:'front',age:0,hp:1,maxHp:1,hit:0,r:14},false,{time:0},true,g);
      c.className='vs-enemy-portrait';c.setAttribute('aria-hidden','true');return c;
    }
    function feedback(event,reduced){
      if(['oracleShellBreak','admiralAnchorBreak'].includes(event.type)&&deaths.length<18)deaths.push({...event.foe,dying:.001,deathAge:0,life:1.15,oracleShellBroken:true});
      if(event.type==='banished'&&!event.foe.finalBoss&&!reduced&&deaths.length<18)deaths.push({...event.foe,dying:.001,deathAge:0,life:event.foe.major||['duchess','landlord','bellkeeper','ferryman',...trioIds].includes(event.foe.bossType)?1.1:.36});
      if(event.type==='specialImpact'||event.type==='specialBlock'||event.type==='relicImpact'&&event.id==='meteor')cameraController.impact('hit',event.angle,reduced);
      if(event.type==='bossLanding'&&event.heavy&&event.id!=='uncrowned')cameraController.impact('heavy',0,reduced);
      if(event.type==='admiralJointHit'||event.type==='admiralLegBreak')cameraController.impact(event.type==='admiralLegBreak'?'slam':'heavy',Math.PI/2,reduced);
      if(event.type==='clockUnfold'||event.type==='clockKeyBreak')cameraController.impact('slam',Math.PI/2,reduced);
      if(event.type==='prismGiantImpact'||event.type==='prismRupture')cameraController.impact('slam',Math.PI/2,reduced);
      if(event.type==='finaleImpact')cameraController.impact('slam',Math.PI/2,reduced);
      if(event.type==='finaleFloorCollapse'||event.type==='bossPhase'&&event.id==='uncrowned')cameraController.impact('collapse',Math.PI/2,reduced);
      if(event.type==='hurt'){cameraController.impact('hurt',event.angle,reduced);if(!reduced)hitFlash=.16;}
      if(event.type==='finisher'&&event.hits>0)cameraController.impact('finisher',event.angle,reduced);
      if(event.type==='attackImpact')cameraController.impact(event.heavy?'heavy':'hit',event.angle,reduced);
      if(event.type==='hit'||event.type==='slashImpact')cameraController.impact(event.heavy?'heavy':'hit',event.angle,reduced);
      if(event.type==='perfectDodge'){cameraController.impact('perfectDodge',event.angle,reduced);if(dodgeBursts.length<4)dodgeBursts.push({...event,age:0,life:.3});}
      if(event.type==='fire'&&['espresso','tray'].includes(event.weapon)&&Number.isFinite(event.x)&&muzzles.length<16)muzzles.push({...event,age:0,life:event.weapon==='espresso'?.12:.16});
      if(event.type==='heal'&&event.amount>0&&numbers.length<40)numbers.push({...event,damage:'+'+Math.round(event.amount),healing:true,age:0,life:1});
      if(event.type==='hit'&&numbers.length<40)numbers.push({...event,age:0,life:.65});
      if((event.type==='bossHit'&&!reduced||event.type==='attackImpact'||event.type==='slashImpact'||event.type==='hit'&&event.critical)&&impacts.length<48&&Number.isFinite(event.x)&&Number.isFinite(event.y))impacts.push({...event,age:0,life:event.heavy?.18:.12});
    }
    function edgeWarnings(s){
      if(!camera.follow||s.transition)return;
      const candidates=[],placed=[],top=Math.min(h*.23,w<600?136:104),bottom=h-Math.min(h*.24,w<600?168:92);
      for(const e of s.enemies){
        const role=e.role||(root.MORATALES_SURVIVOR.ENEMY_TYPES?.[e.type]?.role);
        if(e.type!=='boss'&&!(e.telegraph>0&&['caster','sniper','spreader','lobber','zoner','charger','duelist'].includes(role))&&!(e.charge>0&&['charger','duelist'].includes(role)))continue;
        const x=e.x,y=e.y-22,dx=Math.max(camera.x-x,0,x-camera.x-camera.viewWidth),dy=Math.max(camera.y-y,0,y-camera.y-camera.viewHeight),distance=Math.hypot(dx,dy);
        if(distance<=0||distance>120)continue;
        candidates.push({e,x:(x-camera.x)*camera.zoom,y:(y-camera.y)*camera.zoom,distance});
      }
      candidates.sort((a,b)=>(a.e.type==='boss'?-1000:0)+a.distance-((b.e.type==='boss'?-1000:0)+b.distance));
      for(const mark of candidates){const x=clamp(mark.x,14,w-14),y=clamp(mark.y,top,bottom);if(placed.some(p=>Math.hypot(p.x-x,p.y-y)<35))continue;placed.push({x,y});
        ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(mark.y-y,mark.x-x));ctx.fillStyle='#26343fe8';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.fillStyle=mark.e.type==='boss'?'#edc38e':'#eeaaa5';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-3,-4);ctx.lineTo(-1,0);ctx.lineTo(-3,4);ctx.closePath();ctx.fill();ctx.restore();if(placed.length===3)break;}
    }
    function render(s,orbitals=[],dt=.016,reduced=false,emote=null){
      if(s?.status==='paused')dt=0;
      const passage=root.MOROGUE_PASSAGE_ART?.supported(s?.transition);
      if(s?.transition?.returning&&departureTransition!==s.transition){departureTransition=s.transition;departureFrame=makeCanvas(canvas.width,canvas.height);departureFrame.getContext('2d').drawImage(canvas,0,0);}
      if(!s?.transition){departureFrame=null;departureTransition=null;}
      if(s?.transition?.returning){s={...s,boss:null};deaths=deaths.filter(e=>!e.major);}
      if(passage&&!passageOrigins.has(s.transition))passageOrigins.set(s.transition,lastPlayer||{x:s.player.x,y:s.player.y});
      const passagePlayer=passage?{...s.player,...root.MOROGUE_PASSAGE_ART.player(s.transition,s.player,passageOrigins.get(s.transition)),moving:false}:null;
      if(s)CosmeticArt.stepCape(cloth,{id:cosmetics.cape,time:s.time,x:s.player.x,y:s.player.y,reduced});
      activeEmote=s?.status==='playing'?emote:null;
      if(resultState!==s){resultState=s;resultAge=0;}if(s?.status==='lost')resultAge+=dt;else resultAge=0;elapsed+=dt;hitFlash=Math.max(0,hitFlash-dt);bladeDrawCount=0;bladeLength=0;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=s?.boss?.finalBoss?'#090c15':'#1b3039';ctx.fillRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
      const running=!!s;camera=cameraController.update({width:w,height:h,player:s?(passagePlayer||root.MOROGUE_ADMIRAL_ART?.focus(s,reduced)||root.ROUGE_MORA_FINALE_ART.focus(s)):null,dt,reduced,admiral:!!s?.player.admiralRide,harbour:!!s?.boss?.majorPlan?.admiralWave,briar:s?.boss?.bossType==='briar'?(s.boss.briarFight?.blend||0):0,finale:s?.world.arena==='uncrowned',ascent:s?.boss?.finale?.colossus?root.MOROGUE_UNCROWNED_COLOSSUS.pose(s.boss).fall:0,cantor:s?.boss?.bossType==='cantor'?(s.boss.cantorFight?.roof||0):0,star:s?.boss?.bossType==='star'?(s.boss.starFight?.blend||0):0,clock:s?.boss?.bossType==='clock'?Math.max(s.boss.clockFight?.stage||0,s.boss.clockFight?.active?.kind==='ride'?.75:0):0,prism:s?.boss?.bossType==='prism'?(s.boss.prismFight?.giant?.blend||0):0,oracle:s?.boss?.bossType==='oracle'?Math.max(0,Math.min(1,(s.boss.oracleRig?.form||0)-2)):0});
      if(passage&&!reduced&&!s.transition.returning){const t=root.MOROGUE_PASSAGE_ART.progress(s.transition),pulse=Math.sin(clamp(t/.72,0,1)*Math.PI)*.28,oldWidth=camera.viewWidth,oldHeight=camera.viewHeight;camera.zoom*=1+pulse;camera.viewWidth=w/camera.zoom;camera.viewHeight=h/camera.zoom;camera.x+=(oldWidth-camera.viewWidth)*.5;camera.y+=(oldHeight-camera.viewHeight)*.5;const targetY=clamp(passagePlayer.y-28-camera.viewHeight*.59,0,1024-camera.viewHeight);camera.y+=(targetY-camera.y)*pulse/.28;}
      if(root.MOROGUE_RAILMASTER?.Fight.inside(s?.boss)){camera.zoom=w<h?Math.min(w/560,h/1000):Math.min(w/1440,h/960);camera.viewWidth=w/camera.zoom;camera.viewHeight=h/camera.zoom;const railFocus=s.boss.railFight.secured===0?345:s.boss.railFight.secured===1?1190:768;camera.x=w<h?clamp(s.player.x*.72+railFocus*.28-camera.viewWidth/2,0,1536-camera.viewWidth):(1536-camera.viewWidth)/2;camera.y=(1024-camera.viewHeight)/2;camera.shakeX=camera.shakeY=0;}
      const beeView=!s?.transition?.returning&&root.MOROGUE_BEEKEEPER_ART?.focus(s,w,h,camera);if(beeView){Object.assign(camera,beeView);camera.viewWidth=w/camera.zoom;camera.viewHeight=h/camera.zoom;camera.shakeX=camera.shakeY=0;}
      const inkView=!s?.transition?.returning&&root.MOROGUE_MAGISTRATE_ART?.focus(s,w,h,camera);if(inkView){Object.assign(camera,inkView);camera.viewWidth=w/camera.zoom;camera.viewHeight=h/camera.zoom;camera.shakeX=camera.shakeY=0;}
      // Finite arenas must cover every pixel, including specialist camera overrides.
      // The pursuit course has its own unbounded painted tunnel and coordinates.
      if(!beeView||!root.MOROGUE_BEEKEEPER?.Fight.inside(s?.boss)||s?.transition?.returning){const cx=camera.x+camera.viewWidth/2,cy=camera.y+camera.viewHeight/2;camera.zoom=Math.max(camera.zoom,(w+6)/1536,(h+6)/1024);camera.viewWidth=w/camera.zoom;camera.viewHeight=h/camera.zoom;const mx=3/camera.zoom,my=3/camera.zoom;camera.x=clamp(cx-camera.viewWidth/2,mx,1536-camera.viewWidth-mx);camera.y=clamp(cy-camera.viewHeight/2,my,1024-camera.viewHeight-my);}
      const zoom=camera.zoom,vw=camera.viewWidth,vh=camera.viewHeight;
      ctx.translate(camera.shakeX,camera.shakeY);ctx.scale(zoom,zoom);ctx.translate(-camera.x,-camera.y);
      const fill=ctx.createLinearGradient(0,camera.y,0,camera.y+vh);fill.addColorStop(0,s?.boss?.finalBoss?'#171820':'#22383d');fill.addColorStop(1,s?.boss?.finalBoss?'#050912':'#142d3c');ctx.fillStyle=fill;ctx.fillRect(camera.x,camera.y,vw,vh);
      root.ROUGE_MORA_WORLD_ART.background(ctx,s?.world,map,s?.transition,elapsed,reduced);
      ctx.fillStyle='#16274824';ctx.fillRect(0,0,1536,1024);
      if(running){
        if(!passage||root.MOROGUE_PASSAGE_ART.progress(s.transition)>.87){
        root.ROUGE_MORA_FINALE_ART.back(ctx,s,reduced);
        }
        root.ROUGE_MORA_WORLD_ART.render(ctx,s,elapsed,reduced,map);
        if(!s.transition?.returning){root.MOROGUE_RAILMASTER_ART?.back(ctx,s,reduced);
        root.MOROGUE_BEEKEEPER_ART?.back(ctx,s,reduced);if(['duel','tear'].includes(s.boss?.inkFight?.mode)){ctx.fillStyle='#130f1c';ctx.fillRect(camera.x,camera.y,vw,vh);}root.MOROGUE_MAGISTRATE_ART?.back(ctx,s,reduced);}
        root.ROUGE_MORA_BUILD_ART.render(ctx,s,reduced);
        if(!passage||root.MOROGUE_PASSAGE_ART.progress(s.transition)>.87){
        root.MOROGUE_ORACLE_ART?.back(ctx,s,reduced);
        root.MOROGUE_BRIAR_ART?.back(ctx,s,reduced);
        root.MOROGUE_PRISM_THEATRE?.back(ctx,s,reduced);
        root.MOROGUE_CLOCK_STAGE?.floor(ctx,s,reduced);
        root.MOROGUE_STAR_FLOOR?.draw(ctx,s,reduced);
        root.MOROGUE_CANTOR_STAGE?.back(ctx,s,reduced);
        for(const z of s.zones)dangerZone(z,false,reduced);
        root.MOROGUE_PRISM_THEATRE?.entrances(ctx,s,reduced);
        root.MOROGUE_LANDLORD_ART?.groundEffects(ctx,s,reduced);
        root.MOROGUE_BELLKEEPER_ART?.groundEffects(ctx,s,reduced);
        root.MOROGUE_FERRYMAN_ART?.groundEffects(ctx,s,reduced);
        for(const id of trioIds)trioArt(id)?.groundEffects(ctx,s,reduced);
        root.MOROGUE_CLOCK_STAGE?.bridge(ctx,s,reduced);
        root.MOROGUE_CLOCK_STAGE?.link(ctx,s,reduced);
        root.MOROGUE_KILN_ART?.effects(ctx,s,reduced);
        root.MOROGUE_ADMIRAL_ART?.effects(ctx,s,reduced);
        root.MOROGUE_BRIAR_ART?.effects(ctx,s,reduced);
        root.MOROGUE_PRISM_ART?.effects(ctx,s,reduced);
        root.MOROGUE_CLOCK_ART?.effects(ctx,s,reduced);
        root.MOROGUE_STAR_ART?.effects(ctx,s,reduced);
        root.MOROGUE_CANTOR_ART?.effects(ctx,s,reduced);
        root.MOROGUE_DUELIST_ART?.effects(ctx,s,reduced);
        root.MOROGUE_BEEKEEPER_ART?.effects(ctx,s,reduced);
      root.MOROGUE_MAGISTRATE_ART?.effects(ctx,s,reduced);
      root.MOROGUE_RAILMASTER_ART?.effects(ctx,s,reduced);
      root.MOROGUE_ORACLE_ART?.effects(ctx,s,reduced);
        }
        for(const g of s.gems){const bob=reduced?0:Math.sin(elapsed*3+g.phase)*2,x=g.x,y=g.y-4+bob;ctx.fillStyle='#214853';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+5,y);ctx.lineTo(x,y+7);ctx.lineTo(x-5,y);ctx.fill();ctx.fillStyle=g.value>=4?'#edb972':'#a6dfcd';ctx.beginPath();ctx.moveTo(x,y-5);ctx.lineTo(x+4,y);ctx.lineTo(x,y+5);ctx.lineTo(x-3,y);ctx.fill();ctx.fillStyle='#e0f4d4';ctx.fillRect(x-1,y-3,2,3);}
        for(const d of s.drops){if(d.type==='recovery'){root.MOROGUE_COSMETIC_ART.tonic(ctx,d.x,d.y,elapsed,reduced);continue;}const bob=reduced?0:Math.sin(elapsed*3)*3;shadow(d.x,d.y,14);glow(d.x,d.y-12,32,d.type==='heal'?'#e5b98433':'#b1e3da44');ctx.drawImage(icons[d.type],d.x-16,d.y-29+bob,32,32);}
        for(const f of s.effects){if(f.type==='slash'||f.type==='spark')continue;const alpha=clamp(1-f.age/f.life,0,1);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=f.colour;ctx.fillStyle=f.colour;if(f.type==='ring'){ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y,(10+f.age*160)*f.size,(5+f.age*90)*f.size,0,0,TAU);ctx.stroke();}else if(f.type==='trail'){if(!reduced||f.decoy)afterimage(f,s);}else{for(let i=0;i<(reduced?3:7);i++){const a=i*2.4,r=f.age*55*f.size;ctx.fillRect(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,3,3);}}ctx.restore();}
        comboRing(s);
        for(const f of dodgeBursts){f.age+=dt;const t=clamp(f.age/f.life,0,1);ctx.save();ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle='#c2eee2';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y+18,reduced?26:20+t*16,reduced?10:8+t*5,0,0,TAU);ctx.stroke();ctx.restore();}dodgeBursts=dodgeBursts.filter(f=>f.age<f.life);
        for(const e of deaths){if(e.major&&e.bossType==='oracle')root.MOROGUE_ORACLE_ART?.back(ctx,{boss:e},reduced);e.deathAge+=dt;e.dying=clamp(e.deathAge/e.life,0,1);actor(e,false,s,reduced);}deaths=deaths.filter(e=>e.deathAge<e.life);
        if(s.boss?.inkFight?.act){const q=s.boss.inkFight.act;for(const echo of q.echoes){const remaining=echo.at-q.age;if(remaining<1.2&&remaining>-.5){ctx.save();ctx.globalAlpha=clamp(1-Math.max(0,-remaining)*2,0,1);drawPaintedRival(ctx,s.boss,reduced,echo);ctx.restore();}}}
        const colossusLayers=root.MOROGUE_UNCROWNED_COLOSSUS_ART.layers(s.boss);const actors=[...s.enemies.filter(e=>e.hp>0),s.player,...colossusLayers].sort((a,b)=>a.finalBoss||a.bossType==='oracle'&&a.oracleRig?.form>2?-1:b.finalBoss||b.bossType==='oracle'&&b.oracleRig?.form>2?1:a.y-b.y);for(const e of actors){
      if(e.colossusLayer!==undefined){root.MOROGUE_UNCROWNED_COLOSSUS_ART.layer(ctx,s.boss,reduced,e.colossusLayer);continue;}if(e.finaleJoint&&colossusLayers.length)continue;
      if(s.status==='grove'&&e===s.player&&!s.grove?.returningPlayer)continue;
      if(passage&&e!==s.player&&root.MOROGUE_PASSAGE_ART.progress(s.transition)<.87)continue;
      const dissolve=s.status==='merchant'&&e!==s.player?Math.max(0,Math.min(1,((s.merchant.sceneAge||0)-1.8)/1.7)):0;
      if(dissolve>0){ctx.save();ctx.beginPath();const size=4;for(let y=-100;y<15;y+=size)for(let x=-45;x<45;x+=size){const n=((x*17+y*31+(e.id||0)*97)%101+101)%101/101;if(n>dissolve)ctx.rect(e.x+x,e.y+y,size,size);}ctx.clip();ctx.globalAlpha=1-dissolve*.6;actor(e,false,s,reduced);ctx.restore();if(!reduced){ctx.save();ctx.fillStyle='#b1a38c';ctx.globalAlpha=Math.sin(dissolve*Math.PI)*.5;for(let i=0;i<8;i++)ctx.fillRect(e.x+Math.sin(i*7+e.id)*22+dissolve*25,e.y-i*7-dissolve*30,2,2);ctx.restore();}}
      else {ctx.save();if(e===s.player&&s.status==='grove')ctx.globalAlpha*=s.grove?.returningPlayer||0;if(e===s.player&&e.inkCaptured){const c=e.inkCaptured;ctx.translate(e.x,e.y-32);ctx.rotate(c.angle);ctx.scale(c.scale,c.scale);ctx.translate(-e.x,-e.y+32);}if(e===s.player&&e.beeTunnel>0){ctx.globalAlpha*=1-clamp((e.beeTunnel-.2)/.75,0,1);ctx.translate(e.x,e.y);ctx.scale(1-e.beeTunnel*.25,1-e.beeTunnel*.25);ctx.translate(-e.x,-e.y);}if(passage&&e!==s.player)ctx.globalAlpha*=clamp((root.MOROGUE_PASSAGE_ART.progress(s.transition)-.87)/.11,0,1);if(e===s.player&&s.status==='lost'){const t=reduced?1:clamp(resultAge/.8,0,1);ctx.translate(e.x,e.y);ctx.rotate(-t*.95);ctx.scale(1,1-t*.18);ctx.translate(-e.x,-e.y);ctx.globalAlpha*=1-t*.35;}actor(e,e===s.player,s,reduced);ctx.restore();if(e===s.player&&colossusLayers.length)heldBlade(s);}
    }
        for(const f of s.effects)if(f.type==='slash')slash(f,reduced);
        root.MOROGUE_ADMIRAL_ART?.foreground(ctx,s,reduced);root.MOROGUE_PRISM_THEATRE?.foreground(ctx,s,reduced);if((s.status!=='grove'||s.grove?.returningPlayer)&&!colossusLayers.length&&!s.player.colossusThrow){ctx.save();if(s.status==='grove')ctx.globalAlpha*=s.grove.returningPlayer;heldBlade(s);ctx.restore();}root.MOROGUE_UNCROWNED_COLOSSUS_ART.foreground(ctx,s,reduced);garlicOrbit(s,orbitals,reduced);
        for(const shot of s.shots)projectile(shot,reduced);
        root.MOROGUE_MERCHANT?.combat(ctx,s,reduced);
        for(const f of muzzles){f.age+=dt;muzzle(f,reduced);}muzzles=muzzles.filter(f=>f.age<f.life);
        for(const f of s.effects)if(f.type==='spark')weaponSpark(f,reduced);
        for(const f of impacts){f.age+=dt;impact(f,reduced);}impacts=impacts.filter(f=>f.age<f.life);
        // Draw warnings above attacks, so a bright finisher never masks a threat.
        for(const z of s.zones)dangerZone(z,true,reduced);
        root.MOROGUE_CLOCK_STAGE?.foreground(ctx,s,reduced);
        root.MOROGUE_CANTOR_STAGE?.foreground(ctx,s,reduced);
        root.MOROGUE_BEEKEEPER_ART?.foreground(ctx,s,reduced);root.MOROGUE_MAGISTRATE_ART?.foreground(ctx,s,reduced);
        root.MOROGUE_DUCHESS_ART?.effects(ctx,s,reduced);
        root.MOROGUE_LANDLORD_ART?.effects(ctx,s,reduced);
        root.MOROGUE_BELLKEEPER_ART?.effects(ctx,s,reduced);
        root.MOROGUE_FERRYMAN_ART?.effects(ctx,s,reduced);
        for(const id of trioIds)trioArt(id)?.effects(ctx,s,reduced);
        for(const h of s.hazards)enemyHazard(h,reduced);
        ctx.textAlign='center';for(const n of numbers){n.age+=dt;ctx.globalAlpha=1-n.age/n.life;ctx.font=`${n.critical?23:18}px "Velmora Pixel"`;ctx.lineWidth=3;ctx.strokeStyle='#282d37';ctx.fillStyle=n.healing?'#b6e4bc':n.critical?'#ffdc8c':'#f8edcf';ctx.strokeText(n.damage,n.x,n.y-n.age*40);ctx.fillText(n.damage,n.x,n.y-n.age*40);}ctx.globalAlpha=1;numbers=numbers.filter(n=>n.age<n.life);
      }
      if(!reduced){for(let i=0;i<20;i++){const x=(i*157+elapsed*(6+i%3))%1536,y=330+(i*67)%470+Math.sin(elapsed*.5+i)*10;ctx.globalAlpha=.15+.15*Math.sin(elapsed*1.5+i);ctx.fillStyle='#f5d397';ctx.fillRect(x,y,2,2);}ctx.globalAlpha=1;}
      ctx.setTransform(dpr,0,0,dpr,0,0);if(running)edgeWarnings(s);if(hitFlash&&!reduced){const v=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.25,w/2,h/2,Math.hypot(w,h)*.55);v.addColorStop(0,'#962b4100');v.addColorStop(1,`rgba(168,49,64,${hitFlash/.16*.23})`);ctx.fillStyle=v;ctx.fillRect(0,0,w,h);}
      if(running)root.ROUGE_MORA_BUILD_ART.ready(ctx,s,reduced,camera);
      root.MOROGUE_PASSAGE_ART?.departure(ctx,departureFrame,s?.transition,w,h,reduced);
      root.ROUGE_MORA_WORLD_ART.cinema(ctx,s,w,h,reduced);
      root.MOROGUE_RAILMASTER_ART?.cinema(ctx,s,w,h,reduced);
      root.MOROGUE_BEEKEEPER_ART?.cinema(ctx,s,w,h,reduced);root.MOROGUE_MAGISTRATE_ART?.cinema(ctx,s,w,h,reduced,camera,playerAnimator?.frame('front',-1,{kind:'idle',phase:0}));
      root.MOROGUE_BEEKEEPER_ART?.passage(ctx,canvas,s);
      if(s&&!s.transition)lastPlayer={x:s.player.x,y:s.player.y};
    }
    resize();return {ready,render,resize,setPlayer,setCosmetics,portrait,playerFrame:(view,pose)=>playerAnimator?.frame(view,-1,pose),enemyPortrait,feedback,icon,setCameraOptions,get cameraState(){return {...camera,bladeDrawCount,bladeLength,bladeScreenLength:bladeLength*(camera.zoom||1)};}};
  }
  root.MORATALES_SURVIVOR_ART={create,icon,makeCanvas,ENEMY_STYLES,BOSS_STYLES};
})(globalThis);
