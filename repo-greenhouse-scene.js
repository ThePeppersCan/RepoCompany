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
