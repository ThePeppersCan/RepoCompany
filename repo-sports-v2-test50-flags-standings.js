(() => {
  'use strict';
  if (window.__repoSportsV2Test50FlagsStandings) return;
  window.__repoSportsV2Test50FlagsStandings = true;

  const ROOT = 'assets/repo-sports-v2/club-flags/';
  const FLAGS = Object.freeze({
    'HRAFNVIK':'hrafnvik.png',
    'BLACKGLASS':'blackglass.png',
    'SAINT CIRO':'saint-ciro.png',
    'MARENZA':'marenza.png',
    'GRAND KHOR':'grand-khor.png',
    'AURELIA':'aurelia.png',
    'DRAZH HOLLOW':'drazh-hollow.png',
    'ROVA END':'rova-end.png',
    'ZAFIR ROW':'zafir-row.png',
    'TALUN CROSS':'talun-cross.png',
    'OSSA MERE':'ossa-mere.png',
    'VARKA FELL':'varka-fell.png',
    'ISKARA':'iskara.png',
    'NASKOR':'naskor.png',
    'ASHWICK':'ashwick.png',
    'SKARHOLT':'skarholt.png',
    'ORSANNE':'orsanne.png',
    'CINDERBANK':'cinderbank.png'
  });
  const TEAM_NAMES = Object.keys(FLAGS).sort((a,b)=>b.length-a.length);

  const normalise = value => String(value || '')
    .replace(/\s+/g,' ')
    .trim()
    .toUpperCase();

  function detectTeam(value, exactFirst=true){
    const text=normalise(value);
    if(!text) return null;
    if(exactFirst && FLAGS[text]) return text;
    return TEAM_NAMES.find(name =>
      text===name ||
      text.startsWith(name+' ') ||
      text.startsWith(name+'\n') ||
      text.includes(' '+name+' ') ||
      text.endsWith(' '+name) ||
      text.includes(name+' VS') ||
      text.includes('VS '+name)
    ) || null;
  }

  function flagSrc(team){ return ROOT + FLAGS[team]; }

  function makeFlag(team, cls='rs-v2-club-flag'){
    const img=document.createElement('img');
    img.className=cls;
    img.src=flagSrc(team);
    img.alt='';
    img.decoding='async';
    img.loading='eager';
    img.dataset.rsTeam=team;
    return img;
  }

  function ensureStyles(){
    if(document.getElementById('rsV2Test50Styles')) return;
    const style=document.createElement('style');
    style.id='rsV2Test50Styles';
    style.textContent=`
      /* TEST 50 — readable attached side panels */
      #wcWorldCupBroadcast.is-open .wcg-v2-broadcast-layout{
        display:grid!important;
        grid-template-columns:clamp(225px,13vw,255px) minmax(0,1fr) clamp(380px,22vw,420px)!important;
        gap:6px!important;
        align-items:start!important;
        justify-content:center!important;
        width:calc(100vw - 14px)!important;
        max-width:2240px!important;
        margin:0 auto!important;
      }
      #wcWorldCupBroadcast .wcg-v2-tv-column{
        width:100%!important;
        min-width:0!important;
        margin:0!important;
      }
      #wcWorldCupBroadcast .wcg-v2-tv-column>.wcg-shell{
        width:100%!important;
        max-width:none!important;
        margin:0!important;
      }
      #wcWorldCupBroadcast .wcg-v2-career-board{
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        margin:0!important;
        justify-self:stretch!important;
      }
      #wcWorldCupBroadcast .wcg-v2-broadcast-layout>.wcg-v2-standings-board{
        grid-column:3!important;
        grid-row:1!important;
        position:relative!important;
        inset:auto!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        height:min(820px,calc(100vh - 90px))!important;
        max-height:none!important;
        margin:0!important;
        align-self:start!important;
        justify-self:stretch!important;
        overflow:visible!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-frame{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:fill!important;
        image-rendering:auto!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-surface{
        position:absolute!important;
        left:6.3%!important;
        right:6.3%!important;
        top:9.4%!important;
        bottom:5.0%!important;
        display:flex!important;
        flex-direction:column!important;
        overflow:hidden!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-kicker{
        min-height:24px!important;
        margin:0 2px 7px!important;
        font-size:9px!important;
        line-height:1!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-kicker b{
        font-size:12px!important;
        letter-spacing:.07em!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-head,
      #wcWorldCupBroadcast .wcg-v2-standings-row{
        display:grid!important;
        grid-template-columns:20px minmax(105px,1fr) 20px 20px 24px 24px 25px 38px!important;
        gap:3px!important;
        align-items:center!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-head{
        min-height:31px!important;
        padding:6px 6px!important;
        margin-bottom:4px!important;
        font-size:9px!important;
        letter-spacing:.055em!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-body{
        flex:1 1 auto!important;
        display:grid!important;
        grid-template-rows:repeat(18,minmax(25px,1fr))!important;
        gap:2px!important;
        min-height:0!important;
        overflow:hidden!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-row{
        min-height:0!important;
        height:auto!important;
        padding:4px 6px!important;
        font-size:10px!important;
        line-height:1!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-pos,
      #wcWorldCupBroadcast .wcg-v2-standings-num,
      #wcWorldCupBroadcast .wcg-v2-standings-rate{
        font-size:10px!important;
        line-height:1!important;
      }
      #wcWorldCupBroadcast .wcg-v2-standings-team{
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        min-width:0!important;
        overflow:visible!important;
        text-overflow:clip!important;
        white-space:nowrap!important;
        font-size:10px!important;
        line-height:1!important;
      }
      .rs-v2-table-flag{
        width:22px!important;
        height:16px!important;
        flex:0 0 22px!important;
        object-fit:contain!important;
        image-rendering:pixelated!important;
        filter:drop-shadow(0 1px 1px rgba(0,0,0,.8));
      }
      .rs-v2-club-flag{
        display:inline-block!important;
        width:24px!important;
        height:17px!important;
        object-fit:contain!important;
        vertical-align:middle!important;
        margin-right:7px!important;
        image-rendering:pixelated!important;
        filter:drop-shadow(0 1px 1px rgba(0,0,0,.75));
      }
      #wcWorldCupBroadcast .wcg-team-copy b .rs-v2-club-flag,
      #wcWorldCupBroadcast .wcg-scorebar .rs-v2-club-flag{
        width:30px!important;
        height:21px!important;
        margin-right:8px!important;
      }
      #wcWorldCupBroadcast .wcg-lineup-side h3 .rs-v2-club-flag,
      #wcWorldCupBroadcast .wcg-lineup-side h2 .rs-v2-club-flag{
        width:29px!important;
        height:20px!important;
      }
      #wcWorldCupBroadcast button .rs-v2-club-flag{
        width:27px!important;
        height:19px!important;
        margin-right:8px!important;
      }
      #wcWorldCupBroadcast .wcg-v2-career-row .rs-v2-club-flag{
        width:19px!important;
        height:14px!important;
        margin-right:5px!important;
      }
      #wcWorldCupBroadcast .wcg-team-badge.rs-v2-flag-badge{
        transform:none!important;
        overflow:hidden!important;
        background:rgba(2,9,15,.88)!important;
      }
      #wcWorldCupBroadcast .wcg-team-badge.rs-v2-flag-badge img{
        width:100%!important;
        height:100%!important;
        object-fit:contain!important;
        image-rendering:pixelated!important;
      }
      @media(max-width:1600px){
        #wcWorldCupBroadcast.is-open .wcg-v2-broadcast-layout{
          grid-template-columns:215px minmax(0,1fr) 360px!important;
          gap:5px!important;
          width:calc(100vw - 10px)!important;
        }
        #wcWorldCupBroadcast .wcg-v2-standings-head,
        #wcWorldCupBroadcast .wcg-v2-standings-row{
          grid-template-columns:19px minmax(94px,1fr) 19px 19px 23px 23px 24px 37px!important;
          gap:2px!important;
        }
        #wcWorldCupBroadcast .wcg-v2-standings-team,
        #wcWorldCupBroadcast .wcg-v2-standings-row,
        #wcWorldCupBroadcast .wcg-v2-standings-num,
        #wcWorldCupBroadcast .wcg-v2-standings-rate{font-size:9px!important}
      }
      @media(max-width:1320px){
        #wcWorldCupBroadcast.is-open .wcg-v2-broadcast-layout{
          grid-template-columns:190px minmax(0,1fr) 330px!important;
          gap:4px!important;
        }
        #wcWorldCupBroadcast .wcg-v2-standings-head,
        #wcWorldCupBroadcast .wcg-v2-standings-row{
          grid-template-columns:18px minmax(84px,1fr) 18px 18px 22px 22px 23px 35px!important;
        }
        .rs-v2-table-flag{width:18px!important;height:13px!important;flex-basis:18px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function directText(el){
    return Array.from(el.childNodes)
      .filter(n=>n.nodeType===Node.TEXT_NODE)
      .map(n=>n.textContent)
      .join(' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function decorateLabel(el, specialClass='rs-v2-club-flag'){
    if(!el || el.closest('.wcg-v2-standings-team')) return;
    const raw = directText(el) || el.textContent || '';
    const team=detectTeam(raw, true);
    const current=el.querySelector(':scope > img.rs-v2-club-flag');
    if(!team){
      if(current) current.remove();
      delete el.dataset.rsV2Team;
      return;
    }
    if(current){
      if(current.dataset.rsTeam!==team){ current.src=flagSrc(team); current.dataset.rsTeam=team; }
      el.dataset.rsV2Team=team;
      return;
    }
    el.insertBefore(makeFlag(team,specialClass),el.firstChild);
    el.dataset.rsV2Team=team;
  }

  function decorateStandings(root){
    root.querySelectorAll('.wcg-v2-standings-team').forEach(cell=>{
      const team=detectTeam(directText(cell) || cell.textContent, true);
      if(!team) return;
      let img=cell.querySelector(':scope > img.rs-v2-table-flag');
      if(!img){ img=makeFlag(team,'rs-v2-table-flag'); cell.insertBefore(img,cell.firstChild); }
      else if(img.dataset.rsTeam!==team){ img.src=flagSrc(team); img.dataset.rsTeam=team; }
      cell.dataset.rsV2Team=team;
    });
  }

  function decorateScoreBadges(root){
    root.querySelectorAll('.wcg-team-score').forEach(score=>{
      const label=score.querySelector('.wcg-team-copy b') || score.querySelector('b');
      const team=detectTeam(label?.textContent, true);
      if(!team) return;
      const badge=score.querySelector('.wcg-team-badge');
      if(!badge) return;
      const existing=badge.querySelector('img.rs-v2-score-flag');
      if(existing){
        if(existing.dataset.rsTeam!==team){ existing.src=flagSrc(team); existing.dataset.rsTeam=team; }
        return;
      }
      badge.textContent='';
      const img=makeFlag(team,'rs-v2-score-flag');
      badge.appendChild(img);
      badge.classList.add('rs-v2-flag-badge');
    });
  }

  function replaceBrandLogoInTeamContainer(el,team){
    const container=el.closest('.wcg-lineup-side,.wcg-team-score,button,.wcg-key-player,.wcg-fulltime-side,.wcg-team-card');
    if(!container) return;
    container.querySelectorAll('img').forEach(img=>{
      if(img.classList.contains('rs-v2-club-flag') || img.classList.contains('rs-v2-table-flag') || img.classList.contains('rs-v2-score-flag')) return;
      const src=String(img.getAttribute('src')||'').toLowerCase();
      if(src.includes('repo-sports-logo') && !src.includes('tv-sting')){
        img.src=flagSrc(team);
        img.classList.add('rs-v2-context-team-flag');
        img.style.objectFit='contain';
        img.style.imageRendering='pixelated';
      }
    });
  }

  function decorateLabels(root){
    const selector=[
      '.wcg-team-copy b',
      '.wcg-lineup-side h2','.wcg-lineup-side h3',
      '.wcg-versus b',
      '.wcg-mini-stats header span','.wcg-mini-stats header b',
      '.wcg-v2-career-row b','.wcg-v2-career-row strong',
      '.wcg-overlay-card h1','.wcg-overlay-card h2','.wcg-overlay-card h3',
      '.wcg-panel h1','.wcg-panel h2','.wcg-panel h3',
      '.wcg-key-player b',
      'button'
    ].join(',');
    root.querySelectorAll(selector).forEach(el=>{
      const team=detectTeam(directText(el) || el.textContent, true);
      if(!team) return;
      decorateLabel(el);
      replaceBrandLogoInTeamContainer(el,team);
    });
  }

  let queued=false;
  function refresh(){
    queued=false;
    const root=document.getElementById('wcWorldCupBroadcast');
    if(!root) return;
    decorateStandings(root);
    decorateScoreBadges(root);
    decorateLabels(root);
  }
  function queueRefresh(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(refresh);
  }

  function attach(){
    ensureStyles();
    const root=document.getElementById('wcWorldCupBroadcast');
    if(!root){ setTimeout(attach,250); return; }
    queueRefresh();
    const observer=new MutationObserver(queueRefresh);
    observer.observe(root,{subtree:true,childList:true,characterData:true});
    // A slow safety refresh handles any third-party render that mutates properties
    // without adding/removing DOM nodes.
    setInterval(queueRefresh,1500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attach,{once:true});
  else attach();
})();
