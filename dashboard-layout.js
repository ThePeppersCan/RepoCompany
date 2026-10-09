(() => {
  'use strict';
  const root=document.getElementById('dashboard'),viewport=document.getElementById('viewport');
  function fit(){
    const home=root.classList.contains('home-mode'),mobile=home&&innerWidth<=700;
    const baseWidth=mobile?700:1672,baseHeight=mobile?1420:941;
    const scale=mobile?innerWidth/baseWidth:Math.min(innerWidth/baseWidth,innerHeight/baseHeight);
    const width=innerWidth/scale,height=Math.max(baseHeight,innerHeight/scale);
    root.style.width=width+'px';root.style.height=height+'px';
    root.style.transform=`scale(${scale})`;
    root.style.setProperty('--scene-extra',Math.max(0,width-baseWidth)+'px');
    root.style.setProperty('--scene-top',mobile?'0px':Math.max(0,(height-baseHeight)/2)+'px');
    root.style.setProperty('--scene-height',baseHeight+'px');
    viewport.style.width=innerWidth+'px';viewport.style.height=Math.max(innerHeight,baseHeight*scale)+'px';
  }
  window.fitDashboard=fit;
  addEventListener('resize',fit);root.addEventListener('scene-change',fit);
  fit();
})();
