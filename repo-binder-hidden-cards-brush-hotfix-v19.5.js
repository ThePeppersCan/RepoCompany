(function repoBinderHiddenCardsBrushHotfixV195(){
  if(window.__repoBinderHiddenCardsBrushHotfixV195Installed)return;
  window.__repoBinderHiddenCardsBrushHotfixV195Installed=true;

  const style=document.createElement('style');
  style.id='repo-binder-hidden-cards-brush-hotfix-v19-5-styles';
  style.textContent=`
    .repo-binder-hotfix-hidden-brush{
      opacity:0 !important;
      visibility:hidden !important;
      pointer-events:none !important;
    }
  `;
  document.head.appendChild(style);

  const BRUSH_SELECTORS=[
    '#binderStyleControl',
    '#binderStyleTrigger',
    '.repo-binder-customize-launch',
    '.repo-binder-style-control',
    '.repo-binder-style-trigger'
  ];

  const DRAWER_SELECTORS=[
    '.repo-binder-storage',
    '#repoTcgCardStorageDrawer',
    '[id*="CardStorageDrawer"]',
    '[class*="binder-storage"]'
  ];

  function isVisible(el){
    if(!el)return false;
    const cs=window.getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;
    const rect=el.getBoundingClientRect();
    return rect.width>0 && rect.height>0;
  }

  function findBrushControls(){
    const found=new Set();
    BRUSH_SELECTORS.forEach(sel=>document.querySelectorAll(sel).forEach(el=>found.add(el)));

    document.querySelectorAll('img').forEach(img=>{
      const src=(img.getAttribute('src')||'').toLowerCase();
      if(src.includes('binder-style-icon')||src.includes('paintbrush')){
        found.add(img.closest('button, a, div')||img);
      }
    });

    return [...found].filter(Boolean);
  }

  function hiddenCardsOpen(){
    for(const sel of DRAWER_SELECTORS){
      const els=document.querySelectorAll(sel);
      for(const el of els){
        if(!isVisible(el))continue;
        const txt=(el.textContent||'').toUpperCase();
        if(txt.includes('HIDDEN CARDS')) return true;
      }
    }

    // Fallback: look for any visible panel/header saying HIDDEN CARDS.
    const all=document.querySelectorAll('div,section,aside');
    for(const el of all){
      if(!isVisible(el))continue;
      const txt=(el.textContent||'').trim().toUpperCase();
      if(txt.startsWith('HIDDEN CARDS')||txt.includes('HIDDEN CARDS REMAIN')) return true;
    }
    return false;
  }

  function sync(){
    const open=hiddenCardsOpen();
    findBrushControls().forEach(el=>{
      el.classList.toggle('repo-binder-hotfix-hidden-brush', open);
    });
  }

  const observer=new MutationObserver(()=>sync());
  function boot(){
    sync();
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open','aria-hidden']});
    ['click','pointerup','mouseup','touchend','keydown'].forEach(evt=>{
      document.addEventListener(evt,()=>setTimeout(sync,0),true);
    });
    window.addEventListener('resize',sync);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
