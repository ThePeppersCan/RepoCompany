(() => {
  'use strict';
  const root=document.getElementById('dashboard');
  const assets='original-case-assets/';
  const booklet=document.getElementById('booklet');
  const rotor=document.getElementById('disc-spin');
  const details=document.querySelector('.game-details');
  const play=document.querySelector('[data-note="Play"]');
  const shots=[...document.querySelectorAll('[data-shot]')];
  const thumbs=[...document.querySelectorAll('[data-gallery-shot]')];
  const publisher='<div class="disc-brand" role="img" aria-label="Repo Company"></div>';
  const playMarkup=play.innerHTML;
  const downloadNotice=document.createElement('p');
  downloadNotice.className='coming-soon-download';
  downloadNotice.textContent='Download · Coming soon';
  downloadNotice.hidden=true;
  details.append(downloadNotice);
  const managerLogo=className=>`<svg class="${className} manager-wordmark" viewBox="57 178 2073 432" role="img" aria-label="Velmora Manager"><image href="${assets}manager-logo-clean.png" width="2167" height="725"/></svg>`;
  const managerCast=className=>`<svg class="${className}" viewBox="800 95 960 755" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><image href="${assets}manager-menu.png" width="1770" height="888"/></svg>`;
  const original={
    title:document.querySelector('.game-logo').outerHTML,
    booklet:booklet.innerHTML,disc:rotor.innerHTML,
    bookletLabel:booklet.getAttribute('aria-label'),
    meta:details.querySelector('.meta').textContent,
    description:details.querySelector('.description').textContent,
    shots:shots.map(button=>({file:button.querySelector('img').getAttribute('src').split('/').pop(),caption:button.querySelector('.caption').textContent,alt:button.querySelector('img').alt}))
  };
  const scenes={
    'comp-run':{
      name:'COMP-RUN',meta:'First-person horror parkour · Solo',
      description:'Chain jumps, chase faster times and race through a first-person horror parkour campaign. Keep moving when the nightmare catches up.',
      url:'https://comp-run.fluffy-star-4855.chatgpt.site/',glow:'194,37,35',
      title:`<img class="game-logo comp-run-wordmark" src="${assets}comp-run/comp-run-logo.png" alt="COMP-RUN">`,
      booklet:`<img class="comp-run-booklet-art" src="${assets}comp-run/booklet-art.webp" alt=""><div class="comp-run-paper-shade"></div><img class="title" src="${assets}comp-run/comp-run-logo.png" alt="">`,
      bookletLabel:'COMP-RUN illustrated booklet with the original game logo',
      disc:`<img class="comp-run-disc-art" src="${assets}comp-run/disc-art.webp" alt=""><div class="disc-print-shade"></div><div class="disc-foil-lines" aria-hidden="true"></div><img class="disc-title" src="${assets}comp-run/comp-run-logo.png" alt="COMP-RUN">${publisher}`,
      discLabel:'COMP-RUN red and black printed disc',
      shots:[
        {file:'comp-run/screenshots/playdate.png',caption:'The Last Playdate',alt:'COMP-RUN in-engine opening of The Last Playdate'},
        {file:'comp-run/screenshots/small-hours.png',caption:'Small Hours',alt:'COMP-RUN in-engine opening of Small Hours'},
        {file:'comp-run/screenshots/final-curtain.png',caption:'Final Curtain',alt:'COMP-RUN in-engine opening of Final Curtain'}
      ]
    },
    'velmora-tales':{
      name:'Velmora Tales',meta:'Coming soon',comingSoon:true,
      description:'A new adventure in Velmora is on the horizon. More details coming soon.',
      glow:'116,155,122',
      title:`<img class="game-logo velmora-wordmark" src="${assets}velmora-tales-logo.png" alt="Velmora Tales">`,
      booklet:`<svg class="velmora-booklet-art" viewBox="100 0 986 1448" preserveAspectRatio="none" aria-hidden="true"><image href="${assets}velmora-tales-artwork.png" width="1086" height="1448"/></svg><img class="title" src="${assets}velmora-tales-logo.png" alt=""><div class="velmora-booklet-publisher" aria-label="Repo Company"></div>`,
      bookletLabel:'Velmora Tales illustrated front cover',
      disc:`<img class="velmora-disc-art" src="${assets}velmora-tales-artwork.png" alt=""><div class="disc-print-shade"></div><div class="disc-foil-lines" aria-hidden="true"></div><img class="disc-title" src="${assets}velmora-tales-logo.png" alt="Velmora Tales">${publisher}`,
      discLabel:'Velmora Tales illustrated disc — coming soon',
      shots:[]
    },
    moratales:{name:'Moratales',meta:original.meta,description:original.description,url:'https://moratales.repocompany.uk/',glow:'125,155,113',title:original.title,booklet:original.booklet,bookletLabel:original.bookletLabel,disc:original.disc,discLabel:'Moratales botanical disc',shots:original.shots},
    manager:{
      name:'Velmora Manager',meta:'Fantasy sports management · Career mode',
      description:'Build your club in Velmora. Sign players, train your squad and set the tactics as you chase glory through the season.',
      url:'https://manager.repocompany.uk/',glow:'91,137,190',
      title:managerLogo('game-logo'),
      booklet:`<div class="manager-paper"></div>${managerCast('manager-booklet-art')}${managerLogo('title')}<div class="booklet-footer">BUILD YOUR CLUB. SHAPE ITS FUTURE.</div>`,
      bookletLabel:'Velmora Manager booklet with its original logo and character artwork',
      disc:`<div class="manager-disc-art" aria-hidden="true">${managerCast('disc-cast')}</div><div class="disc-print-shade"></div><div class="disc-foil-lines" aria-hidden="true"></div>${managerLogo('disc-title')}${publisher}`,
      discLabel:'Velmora Manager cobalt disc with the original character artwork',
      shots:[
        {file:'manager-central.png',caption:'Your club, your career',alt:'Velmora Manager career hub, calendar and club finances'},
        {file:'manager-squad.png',caption:'Build your squad',alt:'Velmora Manager squad selection and player profile'},
        {file:'manager-matchday.png',caption:'Prepare for matchday',alt:'Velmora Manager matchday briefing and team lineups'}
      ]
    },
    morogue:{
      name:'Morogue',meta:'Action roguelite · Solo',
      description:'Survive the night in the Moratales universe. Forge your build, master your weapons and face twelve bosses before challenging the Uncrowned.',
      url:'https://morogue.repocompany.uk/',glow:'181,91,77',
      title:`<img class="game-logo morogue-wordmark" src="${assets}morogue-logo.png" alt="Morogue">`,
      booklet:`<img class="morogue-booklet-art" src="${assets}morogue-cover-art.png" alt=""><div class="morogue-paper-shade"></div><img class="title" src="${assets}morogue-logo.png" alt="">`,
      bookletLabel:'Morogue Uncrowned cover artwork with the original Morogue wordmark',
      disc:`<img class="morogue-disc-art" src="${assets}morogue-disc-vortex.png" alt=""><div class="disc-print-shade"></div><div class="disc-foil-lines" aria-hidden="true"></div><img class="disc-title" src="${assets}morogue-logo.png" alt="Morogue">${publisher}`,
      discLabel:'Morogue crimson disc with swirling engraved vortex artwork',
      shots:[
        {file:'morogue-uncrowned.png',caption:'Face the Uncrowned',alt:'Morogue Uncrowned boss battle across collapsing platforms'},
        {file:'morogue-kiln.png',caption:'The Furnace Court',alt:'Morogue battle against the Kiln Sovereign with marked attacks'},
        {file:'morogue-upgrades.png',caption:'Forge your build',alt:'Morogue weapon and perk upgrade choices during a run'}
      ]
    }
  };
  // Change print and game data on the same physical shell. Do not replace interactive nodes:
  // the existing disc, gallery, keyboard and audio handlers remain shared across all games.
  let sceneRevision=0;
  function activate(id) {
    const scene=scenes[id];
    if(!scene)throw new Error(`Unknown scene: ${id}`);
    const revision=++sceneRevision;
    root.dataset.openGame=id;
    root.dataset.comingSoon=String(Boolean(scene.comingSoon));
    root.dataset.gameName=scene.name;
    const achievements=details.querySelector('[data-open-achievements]');
    if(achievements){achievements.hidden=Boolean(scene.comingSoon)||scene.achievements===false;achievements.dataset.openAchievements=id;achievements.setAttribute('aria-label','View '+scene.name+' achievements');}
    root.style.setProperty('--game-glow',scene.glow);
    root.setAttribute('aria-label',`${scene.name} open case`);
    document.getElementById('open-scene').setAttribute('aria-label',scene.name);
    details.setAttribute('aria-label',`About ${scene.name}`);
    details.querySelector('.game-logo').outerHTML=scene.title;
    details.querySelector('.meta').textContent=scene.meta;
    details.querySelector('.description').textContent=scene.description;
    booklet.innerHTML=scene.booklet;booklet.setAttribute('aria-label',scene.bookletLabel);
    rotor.innerHTML=scene.disc;
    document.getElementById('disc-plane').setAttribute('aria-label',scene.discLabel);
    document.getElementById('case-preview').setAttribute('aria-label',`Animate ${scene.name} disc`);
    play.disabled=Boolean(scene.comingSoon);
    play.setAttribute('aria-disabled',String(Boolean(scene.comingSoon)));
    play.setAttribute('aria-label',scene.comingSoon?`${scene.name}: Coming soon`:`Play ${scene.name}`);
    play.innerHTML=scene.comingSoon?'Coming soon':playMarkup;
    delete play.dataset.launcherCta;
    delete play.dataset.launcherLong;
    if(scene.url)play.dataset.gameUrl=scene.url;
    else delete play.dataset.gameUrl;
    delete root.dataset.launcherUpdateRequired;
    downloadNotice.textContent='Download · Coming soon';
    downloadNotice.hidden=!scene.comingSoon;
    play.dataset.gameName=scene.name;
    document.querySelector('.gallery-game').replaceChildren(document.createTextNode(scene.name+' '));
    const suffix=document.createElement('span');suffix.textContent='/ Screenshots';
    document.querySelector('.gallery-game').append(suffix);
    document.getElementById('gallery').style.setProperty('--gallery-glow',scene.glow);
    shots.forEach((button,i)=>{
      button.disabled=Boolean(scene.comingSoon);
      button.dataset.shotReady=String(!scene.comingSoon);
      const image=button.querySelector('img');image.onload=image.onerror=null;image.hidden=false;
      thumbs[i].disabled=Boolean(scene.comingSoon);thumbs[i].querySelector('img').hidden=false;
      button.setAttribute('aria-label',scene.comingSoon?'Screenshots coming soon':scene.shots[i].caption);
      let placeholder=button.querySelector('.shot-coming-soon');
      if(!placeholder){
        placeholder=document.createElement('span');
        placeholder.className='shot-coming-soon';
        placeholder.textContent='Coming soon';
        button.querySelector('.frame').append(placeholder);
      }
      placeholder.hidden=!scene.comingSoon;
      if(scene.comingSoon){
        button.querySelector('img').removeAttribute('src');
        button.querySelector('img').alt='';
        button.querySelector('.caption').textContent='Screenshots coming soon';
        thumbs[i].querySelector('img').removeAttribute('src');
      }
    });
    scene.shots.forEach((shot,i)=>{
      const button=shots[i],image=button.querySelector('img'),thumb=thumbs[i],thumbnail=thumb.querySelector('img');
      image.alt=shot.alt;
      if(id==='comp-run'){
        const placeholder=button.querySelector('.shot-coming-soon');
        const ready=value=>{
          if(revision!==sceneRevision)return;
          button.disabled=!value;button.dataset.shotReady=String(value);image.hidden=!value;
          button.setAttribute('aria-label',value?shot.caption:'Screenshot pending');
          placeholder.hidden=value;placeholder.textContent='Screenshot pending';
          button.querySelector('.caption').textContent=value?shot.caption:'Screenshot pending';
          thumb.disabled=!value;thumbnail.hidden=!value;
          if(value)thumbnail.src=image.src;else thumbnail.removeAttribute('src');
        };
        image.onload=()=>ready(image.naturalWidth>0);image.onerror=()=>ready(false);
        ready(false);image.src=assets+shot.file;
        if(image.complete&&image.naturalWidth>0)ready(true);
        thumb.setAttribute('aria-label',shot.caption);
        return;
      }
      image.src=assets+shot.file;
      shots[i].querySelector('.caption').textContent=shot.caption;
      thumbnail.src=image.src;thumb.setAttribute('aria-label',shot.caption);
    });
    // Preload the first full-size screenshot; it shares the original file with its rail image.
    if(scene.shots.length&&id!=='comp-run'){
      document.getElementById('gallery-image').src=assets+scene.shots[0].file;
      document.getElementById('gallery-image').alt=scene.shots[0].alt;
      document.getElementById('gallery-caption').textContent=scene.shots[0].caption;
    }else{
      document.getElementById('gallery-image').removeAttribute('src');
      document.getElementById('gallery-image').alt='';
      document.getElementById('gallery-caption').textContent=scene.comingSoon?'Screenshots coming soon':'Screenshots pending';
    }
    root.dispatchEvent(new Event('game-change'));
    document.title=`Repo Company — ${scene.name}`;
    syncLauncherAvailability();
  }
  // Older installed launchers share this website but do not yet know this game.
  // Keep their button local and explicit until a catalogue-capable client loads.
  function syncLauncherAvailability(){
    if(root.dataset.openGame!=='comp-run')return;
    const missing=document.documentElement.dataset.repoLauncher==='true'&&document.documentElement.dataset.repoCompRunNative!=='true';
    if(missing){
      root.dataset.launcherUpdateRequired='true';
      play.disabled=true;play.setAttribute('aria-disabled','true');
      play.setAttribute('aria-label','Update Repo Company to play COMP-RUN');
      play.textContent='Update launcher';delete play.dataset.gameUrl;
      downloadNotice.textContent='Update Repo Company from Account → Settings, then reopen COMP-RUN.';downloadNotice.hidden=false;
    }else if(root.dataset.launcherUpdateRequired==='true'){
      delete root.dataset.launcherUpdateRequired;
      play.disabled=false;play.setAttribute('aria-disabled','false');play.setAttribute('aria-label','Play COMP-RUN');
      play.innerHTML=playMarkup;play.dataset.gameUrl=scenes['comp-run'].url;
      downloadNotice.hidden=true;
    }
  }
  new MutationObserver(syncLauncherAvailability).observe(document.documentElement,{attributes:true,attributeFilter:['data-repo-launcher','data-repo-comp-run-native']});
  window.dashboardScenes=Object.freeze({activate,ids:Object.freeze(Object.keys(scenes))});
})();
