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
      disc:`<img class="morogue-disc-art" src="${assets}morogue-cover-art.png" alt=""><div class="disc-print-shade"></div><div class="disc-foil-lines" aria-hidden="true"></div><img class="disc-title" src="${assets}morogue-logo.png" alt="Morogue">${publisher}`,
      discLabel:'Morogue burgundy and copper disc with Uncrowned cover artwork',
      shots:[
        {file:'morogue-uncrowned.png',caption:'Face the Uncrowned',alt:'Morogue Uncrowned boss battle across collapsing platforms'},
        {file:'morogue-kiln.png',caption:'The Furnace Court',alt:'Morogue battle against the Kiln Sovereign with marked attacks'},
        {file:'morogue-upgrades.png',caption:'Forge your build',alt:'Morogue weapon and perk upgrade choices during a run'}
      ]
    }
  };
  // Change print and game data on the same physical shell. Do not replace interactive nodes:
  // the existing disc, gallery, keyboard and audio handlers remain shared across all games.
  function activate(id) {
    const scene=scenes[id];
    if(!scene)throw new Error(`Unknown scene: ${id}`);
    root.dataset.openGame=id;
    root.dataset.gameName=scene.name;
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
    play.dataset.gameUrl=scene.url;
    play.dataset.gameName=scene.name;
    document.querySelector('.gallery-game').replaceChildren(document.createTextNode(scene.name+' '));
    const suffix=document.createElement('span');suffix.textContent='/ Screenshots';
    document.querySelector('.gallery-game').append(suffix);
    document.getElementById('gallery').style.setProperty('--gallery-glow',scene.glow);
    scene.shots.forEach((shot,i)=>{
      const image=shots[i].querySelector('img');image.src=assets+shot.file;image.alt=shot.alt;
      shots[i].querySelector('.caption').textContent=shot.caption;
      thumbs[i].querySelector('img').src=image.src;
      thumbs[i].setAttribute('aria-label',shot.caption);
    });
    // Preload the first full-size screenshot; it shares the original file with its rail image.
    document.getElementById('gallery-image').src=assets+scene.shots[0].file;
    document.getElementById('gallery-image').alt=scene.shots[0].alt;
    document.getElementById('gallery-caption').textContent=scene.shots[0].caption;
    root.dispatchEvent(new Event('game-change'));
    document.title=`Repo Company — ${scene.name}`;
  }
  window.dashboardScenes=Object.freeze({activate,ids:Object.freeze(Object.keys(scenes))});
})();
