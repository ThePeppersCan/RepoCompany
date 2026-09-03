/* V34.46.7 — fill the scene while keeping guests aligned with the sofa. */
(function installGreenhouseSceneFit(){
  'use strict';
  if(window.__repoGreenhouseSceneFitInstalled)return;
  window.__repoGreenhouseSceneFitInstalled=true;

  // Existing guest positions and sprite widths were calibrated in the old
  // 543 x 426 scene, whose lobby had a 2px overscan on every edge (547 x 430).
  // Recover that crop, then map it onto the new edge-to-edge room crop.
  const SEAT_WIDTH=547;
  const SEAT_HEIGHT=430;
  // Frame both background characters above the sofa, with less floor below.
  const IMAGE_POSITION_Y=.58;

  function sceneFitGeometry(width,height,imageWidth,imageHeight){
    if(![width,height,imageWidth,imageHeight].every(n=>Number.isFinite(n)&&n>0))return null;
    const oldCover=Math.max(SEAT_WIDTH/imageWidth,SEAT_HEIGHT/imageHeight);
    const fit=Math.max(width/imageWidth,height/imageHeight);
    const scale=fit/oldCover;
    const cropX=(SEAT_WIDTH-imageWidth*oldCover)/2;
    const cropY=(SEAT_HEIGHT-imageHeight*oldCover)/2;
    const imageX=(width-imageWidth*fit)/2;
    const imageY=(height-imageHeight*fit)*IMAGE_POSITION_Y;
    return {
      left:imageX-cropX*scale,
      top:imageY-cropY*scale,
      scale
    };
  }

  function boot(){
    const scene=document.getElementById('scene');
    const lobby=document.getElementById('tavernLobby');
    const guests=document.getElementById('tavernGuestLayer');
    const image=scene?.querySelector('.sanctuary-backdrop');
    if(!scene||!lobby||!guests||!image)return;

    function update(){
      const active=document.body.classList.contains('repo-dashboard-v20-desktop')&&
        !!scene.closest('#repoDashboardV20[data-repo-theme="greenhouse-v34-46"]');
      const geometry=active&&image.complete&&sceneFitGeometry(
        lobby.clientWidth,lobby.clientHeight,image.naturalWidth,image.naturalHeight
      );
      if(!geometry){
        scene.classList.remove('repo-scene-fit-active');
        return;
      }
      // Use untransformed CSS dimensions. getBoundingClientRect() would apply
      // the dashboard's viewport scale a second time on resized desktops.
      const properties={
        '--repo-scene-image-position':'50% '+(IMAGE_POSITION_Y*100)+'%',
        '--repo-scene-seat-width':SEAT_WIDTH+'px',
        '--repo-scene-seat-height':SEAT_HEIGHT+'px',
        '--repo-scene-seat-left':geometry.left+'px',
        '--repo-scene-seat-top':geometry.top+'px',
        '--repo-scene-seat-scale':String(geometry.scale)
      };
      for(const [name,value] of Object.entries(properties)){
        if(scene.style.getPropertyValue(name)!==value)scene.style.setProperty(name,value);
      }
      scene.classList.add('repo-scene-fit-active');
    }

    image.addEventListener('load',update);
    image.addEventListener('error',update);
    window.addEventListener('resize',update,{passive:true});
    window.addEventListener('pageshow',update);
    // Theme activation and desktop/mobile transitions are body class changes.
    new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(update).observe(lobby);
    update();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* 2026-09-03 — Quidditch TCG pack Grand Exchange sale display.
   Server purchase pricing remains authoritative; this keeps the market row in sync. */
(function installTcgGrandExchangeSale(){
  'use strict';
  if(window.__repoTcgGrandExchangeSaleInstalled)return;
  window.__repoTcgGrandExchangeSaleInstalled=true;

  const PACK_NAME='Quidditch TCG Card Pack';
  const BASE_PRICE=25000;
  const SALE_PRICE=10000;
  const SALE_END=Date.parse('2026-09-07T01:00:00Z');
  const STYLE_ID='repoTcgGrandExchangeSaleStyles';

  function saleActive(){return Date.now()<SALE_END;}
  function gp(value){return Number(value).toLocaleString('en-GB');}

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
#grandExchangeDialog .ge-price.ge-tcg-sale-price{align-items:center}
#grandExchangeDialog .ge-tcg-sale-stack{display:flex;flex-direction:column;align-items:flex-end;gap:1px;line-height:1.05}
#grandExchangeDialog .ge-tcg-sale-now{color:#f3d476;font-size:15px;font-weight:800;white-space:nowrap}
#grandExchangeDialog .ge-tcg-sale-meta{color:#9fbd94;font-size:8px;font-weight:800;letter-spacing:.35px;white-space:nowrap;text-transform:uppercase}
#grandExchangeDialog .ge-tcg-sale-was{color:#7f9080;text-decoration:line-through;text-decoration-thickness:1px}
`;
    document.head.appendChild(style);
  }

  function applyRow(row){
    const name=row.querySelector('.ge-item-info b')?.textContent?.trim();
    if(name!==PACK_NAME)return;
    const price=row.querySelector('.ge-price');
    if(!price)return;

    if(!saleActive()){
      if(price.dataset.tcgSaleOriginalHtml){
        price.innerHTML=price.dataset.tcgSaleOriginalHtml;
        delete price.dataset.tcgSaleOriginalHtml;
      }
      price.classList.remove('ge-tcg-sale-price');
      delete row.dataset.tcgSale;
      return;
    }

    ensureStyles();
    const existing=price.querySelector('.ge-tcg-sale-now');
    if(existing&&existing.textContent===gp(SALE_PRICE))return;

    if(!price.dataset.tcgSaleOriginalHtml)price.dataset.tcgSaleOriginalHtml=price.innerHTML;
    const coin=price.querySelector('img')?.cloneNode(true);
    price.replaceChildren();
    if(coin)price.appendChild(coin);

    const stack=document.createElement('span');
    stack.className='ge-tcg-sale-stack';
    const now=document.createElement('strong');
    now.className='ge-tcg-sale-now';
    now.textContent=gp(SALE_PRICE);
    const meta=document.createElement('small');
    meta.className='ge-tcg-sale-meta';
    const was=document.createElement('span');
    was.className='ge-tcg-sale-was';
    was.textContent=gp(BASE_PRICE);
    meta.append(was,document.createTextNode(' · 60% OFF'));
    stack.append(now,meta);
    price.appendChild(stack);
    price.classList.add('ge-tcg-sale-price');
    row.dataset.tcgSale='60-off';
  }

  function apply(){
    document.querySelectorAll('#geResults .ge-item-row').forEach(applyRow);
  }

  function boot(){
    const results=document.getElementById('geResults');
    if(!results)return;
    new MutationObserver(apply).observe(results,{childList:true,subtree:true,characterData:true});
    apply();
    const remaining=SALE_END-Date.now();
    if(remaining>0)setTimeout(apply,Math.min(remaining+1000,2147483647));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
