(() => {
  'use strict';
  const originalSite='https://repocompany.uk/';
  // Names and descriptions are sourced from the local RepoCompany game menus.
  // Embedded games have no standalone deep link; never invent a working game URL.
  const games=[
    {id:'runners',name:'Repo Runners',lines:['REPO','RUNNERS'],genre:'Obstacle running · Solo',description:'Run, jump and bounce through obstacle courses. Customise your runner and try the available solo tracks.',color:'183,155,84',url:'/repo-runners/'},
    {id:'broomflight',name:'Broomflight',lines:['VELMORA','BROOMFLIGHT'],genre:'Broomstick racing · Solo',description:'Race three rivals from Valeron Ridge to Elvara. Bank through the woods, climb over Solmere’s vineyards and catch the updrafts on the Elvane Run.',color:'137,167,123',url:'/broomflight/'},
    {id:'dragonbound',name:'Dragonbound',lines:['DRAGONBOUND'],genre:'Fantasy adventure',description:'A smaller adventure from the world of Velmora. Pick up a new journey from the Repo Company collection.',color:'115,136,170',url:'https://dragonbound.repocompany.uk/'},
    {id:'diver',name:'Repo Diver',lines:['REPO','DIVER'],genre:'Underwater exploration',description:'Explore living marine ecosystems, follow migrating schools and discover the creatures of a shared ocean.',color:'90,153,167',menu:'Fishing → Repo Diver'},
    {id:'goblin',name:'Goblin Bomb Party',lines:['GOBLIN BOMB','PARTY'],genre:'Party action · Solo / online',description:'Pass, throw and dodge a magical bomb. Play solo or bring friends into an increasingly frantic party.',color:'170,111,92',menu:'Slayer → Goblin Bomb Party'},
    {id:'rooftops',name:'Repo Rooftops',lines:['REPO','ROOFTOPS'],genre:'Parkour',description:'Take to the rooftops and find your rhythm across the course. A smaller parkour challenge from the collection.',color:'148,132,109',menu:'Agility → Repo Rooftops',prototype:true},
    {id:'seas',name:'High Seas',lines:['HIGH','SEAS'],genre:'Parkour voyage',description:'Master double-jumps and chase clean runs across a checkpoint-based voyage. Choose a route and take to the seas.',color:'99,143,167',menu:'Sailing',prototype:true},
    {id:'sports',name:'Repo Sports',lines:['REPO','SPORTS'],genre:'Fantasy sports',description:'Visit the league, browse its clubs and follow the live broadcast. The sporting side of the Repo Company collection.',color:'124,151,131',menu:'Repo Sports'}
  ].filter(game=>game.id!=='runners'||document.documentElement.dataset.repoLauncher!=='true').filter(game=>game.id!=='broomflight'||document.documentElement.dataset.repoLauncher!=='true'||document.documentElement.dataset.repoBroomflight==='true');
  const dialog=document.createElement('dialog');
  dialog.id='demo-library';dialog.className='demo-dashboard';
  dialog.setAttribute('aria-labelledby','demo-heading');
  const num=i=>String(i+1).padStart(2,'0');
  function disc(game,i){
    return `<span class="demo-disc" style="--disc-accent:${game.color}" aria-hidden="true"><span class="demo-disc-rotor"><span class="demo-disc-foil"></span><span class="demo-disc-label"><span class="demo-disc-series">REPO COMPANY · DEMO COLLECTION</span><span class="demo-disc-title">${game.lines.join('<br>')}</span><span class="demo-disc-id">RC—${num(i)}</span><span class="demo-disc-edition">DEMO ${num(i)}<small>THE PLAYABLE COLLECTION</small></span><svg class="demo-disc-publisher" viewBox="565 234 335 341"><image href="original-case-assets/repo-brand.png" width="1440" height="900"/></svg><span class="demo-disc-rimtype">REPO COMPANY INTERACTIVE · ${num(i)} / ${String(games.length).padStart(2,'0')}</span></span><span class="demo-disc-hub"></span><span class="demo-disc-sheen"></span></span></span>`;
  }
  const motes=Array.from({length:26},(_,i)=>`<i style="--x:${(i*37+11)%100}%;--y:${(i*23+7)%100}%;--delay:-${i*1.9}s"></i>`).join('');
  dialog.innerHTML=`<div class="demo-atmosphere" aria-hidden="true">${motes}</div>
    <header class="demo-header"><div class="demo-heading-group"><button class="demo-back" aria-label="Back to collection"><span>←</span></button><div><p>YOUR COLLECTION</p><h1 id="demo-heading">Demos</h1></div></div><div class="demo-header-end"><button class="demo-account">Account</button><span class="demo-publisher-name">repo company</span><button class="demo-sound" aria-label="Mute audio"><svg viewBox="0 0 30 26" aria-hidden="true"><path d="M3 9h5l7-6v20l-7-6H3Z"/><path class="demo-sound-waves" d="M20 7q7 6 0 12M24 3q11 10 0 20"/></svg></button></div></header>
    <section class="demo-feature" aria-labelledby="demo-selected-title"><div class="demo-copy"><p class="demo-kicker">THE DEMO COLLECTION <span>/ <b id="demo-current-number">01</b></span></p><h2 id="demo-selected-title"></h2><p class="demo-genre" id="demo-selected-genre"></p><p class="demo-description" id="demo-selected-description"></p><a class="demo-launch" id="demo-launch" href="#"><span aria-hidden="true">▶</span><span id="demo-launch-label">Play</span></a><p class="demo-location" id="demo-location"></p></div><div class="demo-feature-disc"><div class="demo-disc-halo" aria-hidden="true"></div><button class="demo-hero-disc" id="demo-hero-disc" aria-label="Spin selected disc" aria-pressed="false"></button><p class="demo-hover-hint">A little something worth discovering.</p></div></section>
    <section class="demo-shelf" aria-label="Demo game library"><div class="demo-shelf-heading"><h2>Choose a disc <span>${games.length} titles</span></h2><div class="demo-shelf-controls"><button id="demo-previous" aria-label="Previous demo">←</button><button id="demo-next" aria-label="Next demo">→</button></div></div><div class="demo-disc-rail" id="demo-disc-rail" role="group" aria-label="Choose a game">${games.map((g,i)=>`<button class="demo-disc-choice" data-demo="${g.id}" data-disc-index="${i}" aria-label="Select ${g.name}" aria-pressed="${i===0}" tabindex="${i===0?0:-1}">${disc(g,i)}</button>`).join('')}</div></section>
    <footer class="demo-footer"><span><kbd>←</kbd> <kbd>→</kbd> Browse <span class="demo-footer-select"><kbd>Enter</kbd> Select</span></span><span><kbd>Esc</kbd> Back to collection</span></footer><div class="demo-launch-black" role="status" aria-live="polite"><span class="visually-hidden"></span></div>`;
  document.body.append(dialog);
  const root=document.getElementById('dashboard'),audio=window.dashboardAudio;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const choices=[...dialog.querySelectorAll('.demo-disc-choice')];
  const hero=dialog.querySelector('#demo-hero-disc'),launch=dialog.querySelector('#demo-launch');
  const curtain=dialog.querySelector('.demo-launch-black');
  let selected=0,opener=null,routeOnClose=true,spinning=false,pinned=false,angle=0,speed=0,coast=null,frame=null,last=0,launching=false,launchAt=0,launchFrom=0,timers=[];
  function select(index,{focus=false,sound=true,scroll=true}={}){
    if(launching)return;
    const previous=selected;selected=(index+games.length)%games.length;
    const game=games[selected];
    stopSpin();angle=speed=0;
    if(sound&&previous!==selected)audio?.effect('hover');
    dialog.dataset.selectedDemo=game.id;dialog.style.setProperty('--demo-accent',game.color);
    choices.forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===selected));button.tabIndex=i===selected?0:-1;});
    hero.innerHTML=disc(game,selected);hero.setAttribute('aria-label',`Spin ${game.name} disc`);
    dialog.querySelector('#demo-current-number').textContent=num(selected);
    dialog.querySelector('#demo-selected-title').textContent=game.name;
    dialog.querySelector('#demo-selected-genre').textContent=game.genre;
    dialog.querySelector('#demo-selected-description').textContent=game.description;
    launch.href=window.repoRoutes?.href('demo/'+game.id)||'#demo/'+game.id;
    launch.setAttribute('aria-label',`Play ${game.name}`);
    dialog.querySelector('#demo-launch-label').textContent='Play';
    dialog.querySelector('#demo-location').textContent='';
    if(focus)choices[selected].focus({preventScroll:true});
    if(scroll)choices[selected].scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'nearest',inline:'center'});
  }
  function stopSpin(){spinning=pinned=false;coast=null;hero.setAttribute('aria-pressed','false');audio?.spin(false);}
  function spin(value){
    if(launching)return;
    if(value)coast=null;
    else if(spinning&&speed>1)coast={from:angle,to:Math.ceil((angle+Math.max(80,speed*.6))/360)*360,start:performance.now(),duration:1800};
    spinning=value;audio?.spin(value);hero.setAttribute('aria-pressed',String(value));
  }
  function tick(now){
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    const target=launching?2520:spinning?620:0;
    speed+= (target-speed)*(1-Math.exp(-dt*(launching?4:spinning?.7:3)));
    if(launching)speed=launchFrom+(2520-launchFrom)*Math.min((now-launchAt)/900,1);
    if(reduce.matches){speed=angle=0;coast=null;}
    else if(coast&&!launching){
      const t=Math.min(1,(now-coast.start)/coast.duration);
      angle=coast.from+(coast.to-coast.from)*(1-Math.pow(1-t,3));
      speed=3*(coast.to-coast.from)/(coast.duration/1000)*Math.pow(1-t,2);
      if(t===1){coast=null;angle=speed=0;}
    }else angle=(angle+speed*dt)%360;
    const rotor=hero.querySelector('.demo-disc-rotor');
    if(rotor){rotor.style.transform=`rotate(${angle}deg)`;rotor.style.filter=speed>200?`blur(${Math.min((speed-200)/1500,launching?1.1:.28)}px)`:'';}
    hero.dataset.speed=speed.toFixed(1);
    frame=requestAnimationFrame(tick);
  }
  function startLoop(){if(dialog.open&&!document.hidden&&frame===null&&!reduce.matches){last=0;frame=requestAnimationFrame(tick);}}
  function stopLoop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;}
  function open({route=true,gameId}={}){
    if(gameId){const index=games.findIndex(g=>g.id===gameId);if(index>=0)select(index,{sound:false,scroll:false});}
    if(dialog.open)return;
    opener=document.activeElement;routeOnClose=route;launching=false;
    select(selected,{sound:false,scroll:false});
    dialog.showModal();root.inert=true;document.body.classList.add('demo-library-open');
    document.title='Repo Company — Demos';
    if(route)history.pushState({scene:'demos'},'',window.repoRoutes?.href('demos')||'#demos');
    dialog.querySelector('.demo-back').focus({preventScroll:true});
    choices[selected].scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});
    startLoop();
  }
  function close(route=true){
    if(!dialog.open||launching)return;
    routeOnClose=route;dialog.close();
    stopSpin();stopLoop();root.inert=false;document.body.classList.remove('demo-library-open');
    if(routeOnClose)history.pushState({scene:'collection'},'',window.repoRoutes?.href('collection')||'#collection');
    if(routeOnClose){document.title='Repo Company — Your collection';opener?.focus({preventScroll:true});}
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!launching)close();});
  dialog.querySelector('.demo-back').onclick=()=>close();
  dialog.querySelector('.demo-account').onclick=()=>{if(!launching)window.accountMenu?.open();};
  root.addEventListener('account-opening',stopSpin);
  choices.forEach((button,i)=>button.addEventListener('click',()=>select(i,{focus:true})));
  dialog.querySelector('#demo-previous').onclick=()=>select(selected-1,{focus:true});
  dialog.querySelector('#demo-next').onclick=()=>select(selected+1,{focus:true});
  dialog.addEventListener('keydown',event=>{
    if(launching){event.preventDefault();return;}
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();select(event.key==='Home'?0:event.key==='End'?games.length-1:selected+(event.key==='ArrowRight'?1:-1),{focus:true});
    }
  });
  hero.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')spin(true);});
  hero.addEventListener('pointerleave',()=>{if(!pinned)spin(false);});
  hero.addEventListener('click',()=>{pinned=!pinned;spin(pinned);});
  hero.addEventListener('blur',()=>{pinned=false;spin(false);});
  const sourceToggle=document.querySelector('[data-audio]'),soundToggle=dialog.querySelector('.demo-sound');
  function syncSound(){const muted=sourceToggle.getAttribute('aria-pressed')==='true';soundToggle.setAttribute('aria-label',muted?'Unmute audio':'Mute audio');soundToggle.setAttribute('aria-pressed',String(muted));soundToggle.querySelector('.demo-sound-waves').style.opacity=muted?0:1;}
  new MutationObserver(syncSound).observe(sourceToggle,{attributes:true,attributeFilter:['aria-pressed']});syncSound();
  soundToggle.onclick=()=>sourceToggle.click();
  launch.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();if(launching)return;
    launching=true;coast=null;launchAt=performance.now();launchFrom=Math.max(80,speed);
    const duration=reduce.matches?320:1900;
    dialog.classList.add('demo-is-launching');curtain.firstChild.textContent=`Opening ${games[selected].name}`;
    audio?.launch(duration-200);
    timers.push(setTimeout(()=>curtain.classList.add('visible'),reduce.matches?0:900));
    timers.push(setTimeout(()=>audio?.finish(),duration-280));
    timers.push(setTimeout(()=>{
      resetLaunch();window.repoLegacy.open(games[selected].id);
    },duration));
  });
  function resetLaunch(){timers.forEach(clearTimeout);timers=[];launching=false;angle=speed=0;stopSpin();curtain.classList.remove('visible');dialog.classList.remove('demo-is-launching');root.inert=dialog.open;audio?.reset();startLoop();}
  addEventListener('pageshow',event=>{if(event.persisted)resetLaunch();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLoop();else startLoop();});
  reduce.addEventListener('change',()=>{if(reduce.matches){stopLoop();speed=angle=0;hero.dataset.speed='0';const r=hero.querySelector('.demo-disc-rotor');if(r){r.style.transform='';r.style.filter='';}}else startLoop();});
  window.demoLibrary=Object.freeze({open,close,games:Object.freeze(games)});
})();
