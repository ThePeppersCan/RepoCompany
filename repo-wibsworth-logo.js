// Sidebar-only liquid mark. The response and welcome mascots keep their own rig.
(() => {
  'use strict';
  function mount(host) {
    if(host.wibsworthLogo)return host.wibsworthLogo;
    const canvas=document.createElement('canvas'),fallback=document.createElement('span');
    canvas.className='ws-logo-canvas';canvas.setAttribute('aria-hidden','true');
    fallback.className='ws-logo-fallback';fallback.setAttribute('aria-hidden','true');
    fallback.innerHTML='<svg viewBox="-103 -75 206 150" xmlns="http://www.w3.org/2000/svg"><path transform="translate(-83 -42)" fill="#f3ead3" d="M35 7 C46 5 52 15 55 29 C57 37 60 41 65 39 C70 37 72 29 78 25 C82 21 87 21 92 24 C99 28 102 40 109 40 C115 40 115 32 117 24 C119 14 126 8 132 9 C144 8 152 20 154 33 C157 48 146 65 132 70 C115 79 101 67 94 53 L86 40 C80 48 77 56 68 65 C57 77 40 74 28 62 C16 50 13 39 20 23 C23 14 28 8 35 7 Z"/></svg>';
    host.replaceChildren(canvas,fallback);host.dataset.motion='idle';canvas.hidden=true;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),life=new AbortController();
    const listen=(target,event,handler)=>target.addEventListener(event,handler,{signal:life.signal});
    const ease=(lo,hi,x)=>{const v=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return v*v*v*(v*(v*6-15)+10);};
    let searching=false,hovered=false,focused=false,visible=false,inViewport=true,destroyed=false;
    let phase=0,clock=0,searchAmount=0,hoverAmount=0,last=0,raf=0,width=132,height=93,dpr=1;
    let cycleCount=0,fleck=0,attempted=false;
    let gl=null,program=null,buffer=null,texture=null,earTexture=null,uniforms={},ready=false;

    const logo=new Path2D('M35 7 C46 5 52 15 55 29 C57 37 60 41 65 39 C70 37 72 29 78 25 C82 21 87 21 92 24 C99 28 102 40 109 40 C115 40 115 32 117 24 C119 14 126 8 132 9 C144 8 152 20 154 33 C157 48 146 65 132 70 C115 79 101 67 94 53 L86 40 C80 48 77 56 68 65 C57 77 40 74 28 62 C16 50 13 39 20 23 C23 14 28 8 35 7 Z');
    const ear=new Path2D('M35 7 C46 5 52 15 55 29 C57 37 60 41 65 39 C70 37 72 29 78 25 C82 22 86 21 90 24 C94 27 91 33 86 40 C80 48 77 56 68 65 C57 77 40 74 28 62 C16 50 13 39 20 23 C23 14 28 8 35 7 Z');
    function makeField(shape){
      const w=1328,h=672,scale=8,c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d',{willReadFrequently:true});ctx.scale(scale,scale);ctx.fill(shape);
      const pix=ctx.getImageData(0,0,w,h).data,n=w*h,inside=new Uint8Array(n),dist=new Float32Array(n);
      for(let i=0;i<n;i++){inside[i]=pix[i*4+3]>127?1:0;dist[i]=10000;}
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x,v=inside[i];if(v!==inside[i-1]||v!==inside[i+1]||v!==inside[i-w]||v!==inside[i+w])dist[i]=Math.max(.05,Math.abs(pix[i*4+3]/255-.5));
      }
      const s=Math.SQRT2;
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-w]+1,dist[i-w-1]+s,dist[i-w+1]+s);}
      for(let y=h-2;y>0;y--)for(let x=w-2;x>0;x--){const i=y*w+x;dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+w]+1,dist[i+w+1]+s,dist[i+w-1]+s);}
      const data=new Uint8Array(n*4);
      for(let i=0;i<n;i++){const sd=dist[i]/scale*(inside[i]?-1:1),v=Math.round(Math.max(0,Math.min(1,sd/128+.5))*65535);data[i*4]=v>>8;data[i*4+1]=v&255;data[i*4+3]=255;}
      return{data,w,h};
    }
    const vertex='attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}';
    const fragment=`#extension GL_OES_standard_derivatives : enable
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_logo,u_ear;
    uniform vec2 u_size;
    uniform float u_scale,u_pixel,u_melt,u_phase,u_stroke,u_fleck,u_hover,u_time;
    float softMin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
    float ease(float a,float b,float t){float v=clamp((t-a)/(b-a),0.,1.);return v*v*v*(v*(v*6.-15.)+10.);}
    float logoField(vec2 p){
      vec2 uv=(p+vec2(83.,42.))/vec2(166.,84.);
      vec2 rg=texture2D(u_logo,clamp(uv,vec2(.001),vec2(.999))).rg;
      return (dot(rg,vec2(65280.,255.))/65535.-.5)*128.+length(max(abs(p)-vec2(82.8,41.8),0.));
    }
    float earField(vec2 q){
      vec2 uv=(q+vec2(49.,41.))/vec2(166.,84.);
      vec2 rg=texture2D(u_ear,clamp(uv,vec2(.001),vec2(.999))).rg;
      return (dot(rg,vec2(65280.,255.))/65535.-.5)*128.;
    }
    float paintEar(vec2 p,float side){
      float t=u_phase-(side>0.?.035:0.);
      float pull=ease(0.,.16,t)*(1.-ease(.23,.40,t));
      float surge=ease(.12,.48,t)*(1.-ease(.51,.73,t));
      float recoil=ease(.51,.65,t)*(1.-ease(.68,.88,t));
      float impact=exp(-pow((t-.495)/.062,2.));
      float stretch=sin(3.141593*ease(.015,.49,t))*(1.-ease(.54,.7,t));
      // The source ear is the moving body. No circle or orbit substitutes for it.
      vec2 center=vec2(side*(34.-2.*pull-14.*surge+3.*recoil),side*(-8.*surge+3.*recoil));
      vec2 q=p-center;q.x*=-side;
      float tilt=-.13*pull+.30*surge-.23*recoil;
      q=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q;
      vec2 scale=vec2(1.+.08*pull+.48*stretch*u_stroke-.05*impact,1.-.06*pull-.17*stretch+.18*impact);
      q/=scale;
      float top=clamp(-q.y/34.,0.,1.);
      // Lag at the ear tip gives the paint its floppy, elastic character.
      q.x-=(3.*surge-2.*pull-6.*recoil)*top*top*u_stroke;
      q.y+=stretch*3.5*sin(q.x*.06)+recoil*2.8*sin(q.x*.07);
      q.x-=stretch*3.5*sin(q.y*.07);
      return earField(q)*min(scale.x,scale.y);
    }
    void main(){
      vec2 p=(v_uv-.5)*u_size/u_scale;p.y=-p.y;
      float tilt=u_hover*.022*sin(u_time*.9);
      p=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*p;
      p.y+=u_hover*1.7*sin(p.x*.06-u_time*1.35);
      p.x+=u_hover*.7*sin(p.y*.07+u_time*.8);
      if(abs(p.x)>109.||abs(p.y)>77.){gl_FragColor=vec4(0.);return;}
      float collision=exp(-pow((u_phase-.51)/.075,2.));
      float left=paintEar(p,-1.);
      float right=paintEar(p,1.);
      float fluid=softMin(left,right,8.+collision*14.);
      float original=logoField(p);
      float neckRetention=(1.-ease(.09,.23,u_phase))*(1.-ease(7.,22.,abs(p.x)));
      fluid=mix(fluid,original,neckRetention);
      // A viscous bridge closes the gap as the two inner paint tips meet.
      float joining=ease(.16,.26,u_phase)*(1.-ease(.43,.50,u_phase));
      vec2 bridgeStart=vec2(-16.,-8.),bridgeEnd=vec2(10.,5.);
      vec2 bridgeAxis=bridgeEnd-bridgeStart;
      float along=clamp(dot(p-bridgeStart,bridgeAxis)/dot(bridgeAxis,bridgeAxis),0.,1.);
      float bridge=length(p-bridgeStart-bridgeAxis*along)-6.+(1.-joining)*60.;
      fluid=softMin(fluid,bridge,4.);
      // Distance interpolation changes the silhouette itself; it never crossfades.
      float d=mix(original,fluid,u_melt);
      float aa=clamp(fwidth(d)*.65,.55/(u_scale*u_pixel),1.5/(u_scale*u_pixel));
      float alpha=1.-smoothstep(-aa,aa,d);
      vec2 gradient=vec2(dFdx(d),-dFdy(d))*u_scale*u_pixel;
      float rim=exp(min(d,0.)/2.8);
      vec3 normal=normalize(vec3(gradient*.38*rim,1.));
      vec3 light=normalize(vec3(-.4,-.65,1.2));
      float diffuse=dot(normal,light);
      vec3 cream=vec3(.951,.919,.817);
      vec3 color=cream*(.943+.065*diffuse);
      color+=vec3(.019,.017,.011)*(.5-.5*p.y/45.);
      float sheen=exp(-pow((p.y+p.x*.26+8.*sin(u_phase*6.283)) / 24.,2.));
      color+=u_melt*sheen*.018;
      float opal=.5+.5*sin(p.x*.045+p.y*.05-u_time*.8);
      color+=u_hover*.012*vec3(-opal,opal*.3,1.-opal);
      float overlap=exp(-pow((left-right)/7.,2.))*exp(-pow(min(left,right)/27.,2.));
      color-=u_melt*collision*overlap*.038*vec3(.8,.77,.68);
      // One tapered cream flick on occasional cycles, following a short outward arc.
      float life=clamp((u_phase-.48)/.20,0.,1.);
      float side=u_fleck<0.?-1.:1.;
      vec2 particleCenter=vec2(side*(40.+22.*life),-27.-23.*life+7.*life*life);
      vec2 velocity=normalize(vec2(side*22.,-23.+14.*life));
      vec2 relative=p-particleCenter;
      vec2 local=vec2(dot(relative,velocity),dot(relative,vec2(-velocity.y,velocity.x)));
      float lengthTail=2.7*(1.-.45*life);
      float alongTail=clamp((local.x+lengthTail)/lengthTail,0.,1.);
      float radius=mix(.08,.67,alongTail)*(1.-.32*life);
      float particleDistance=length(local-vec2(-lengthTail+alongTail*lengthTail,0.))-radius;
      float fade=ease(0.,.11,life)*(1.-ease(.45,1.,life));
      float particleAlpha=(1.-smoothstep(-.65/(u_scale*u_pixel),.65/(u_scale*u_pixel),particleDistance))*fade*abs(u_fleck)*u_melt*.88;
      particleAlpha*=1.-alpha;
      gl_FragColor=vec4(color*alpha+cream*particleAlpha,alpha+particleAlpha);
    }`;
    function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;}
    function init(){
      gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power'});
      if(!gl||!gl.getExtension('OES_standard_derivatives'))throw Error('Renderer unavailable');
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      for(const name of ['logo','ear','size','scale','pixel','melt','phase','stroke','fleck','hover','time'])uniforms[name]=gl.getUniformLocation(program,'u_'+name);
      function upload(shape,unit){const field=makeField(shape),result=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,result);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,field.w,field.h,0,gl.RGBA,gl.UNSIGNED_BYTE,field.data);return result;}
      texture=upload(logo,0);earTexture=upload(ear,1);gl.uniform1i(uniforms.logo,0);gl.uniform1i(uniforms.ear,1);ready=true;
    }

    function useFallback(){ready=false;canvas.hidden=true;fallback.hidden=false;host.dataset.renderer='static';}
    function scale(){return Math.min(width/206,height/150);}
    function draw(){
      if(!ready)return;
      const melt=reduced.matches?0:ease(0,.15,phase)*(1-ease(.64,.975,phase))*searchAmount;
      gl.uniform2f(uniforms.size,width,height);gl.uniform1f(uniforms.scale,scale());gl.uniform1f(uniforms.pixel,dpr);
      gl.uniform1f(uniforms.melt,melt);gl.uniform1f(uniforms.phase,reduced.matches?0:phase);
      gl.uniform1f(uniforms.stroke,1);gl.uniform1f(uniforms.fleck,fleck);
      gl.uniform1f(uniforms.hover,reduced.matches?0:hoverAmount);gl.uniform1f(uniforms.time,reduced.matches?0:clock);
      gl.drawArrays(gl.TRIANGLES,0,6);
    }
    function resize(){
      const bounds=canvas.getBoundingClientRect();width=bounds.width||host.clientWidth*1.5||132;height=bounds.height||host.clientHeight*1.5||93;
      dpr=Math.min(devicePixelRatio||1,2);
      const w=Math.round(width*dpr),h=Math.round(height*dpr);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;if(ready)gl.viewport(0,0,w,h);}
      draw();
    }
    function updateState(){
      host.dataset.motion=reduced.matches?'idle':searching?'searching':searchAmount>0?'settling':hovered||focused?'hover':hoverAmount>0?'settling':'idle';
    }
    function chooseFleck(){fleck=cycleCount%3===0?(Math.floor(cycleCount/3)%2===0?1:-1):0;cycleCount++;}
    function active(){return searching||searchAmount>0||hovered||focused||hoverAmount>0;}
    function tick(now){
      raf=0;if(destroyed||!visible||!inViewport||document.hidden)return;
      if(reduced.matches){updateState();draw();return;}
      const dt=last?Math.min((now-last)/1000,.05):0;last=now;
      const blend=1-Math.exp(-dt*7),hoverTarget=!searching&&(hovered||focused)?1:0;
      searchAmount+=((searching?1:0)-searchAmount)*blend;
      hoverAmount+=(hoverTarget-hoverAmount)*blend;
      if(!searching&&searchAmount<.001){searchAmount=0;phase=0;}
      if(!hoverTarget&&hoverAmount<.001)hoverAmount=0;
      if(searching||searchAmount>0){phase+=dt/5.8;if(phase>=1){phase%=1;chooseFleck();}}
      if(active())clock+=dt;else clock=0;
      updateState();draw();if(active())raf=requestAnimationFrame(tick);
    }
    function start(){
      if(destroyed)return;
      if(raf)cancelAnimationFrame(raf);raf=0;last=0;
      if(!visible||!inViewport||document.hidden)return;
      if(!attempted){attempted=true;try{init();canvas.hidden=false;fallback.hidden=true;host.dataset.renderer='webgl';resize();}catch{useFallback();}}
      updateState();draw();
      if(ready&&active()&&!reduced.matches)raf=requestAnimationFrame(tick);
    }
    function setSearching(value){
      const next=Boolean(value);if(next===searching)return;
      searching=next;if(next&&searchAmount===0){phase=0;chooseFleck();}
      updateState();start();
    }
    function setVisible(value){
      const next=Boolean(value);if(next===visible)return;visible=next;
      if(!visible){hovered=focused=false;hoverAmount=0;if(!searching){searchAmount=0;phase=clock=0;}}
      updateState();start();
    }
    listen(host,'pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;start();});
    listen(host,'pointerleave',()=>{hovered=false;start();});
    listen(host,'focus',()=>{focused=host.matches(':focus-visible');start();});
    listen(host,'blur',()=>{focused=false;start();});
    listen(document,'visibilitychange',start);
    listen(reduced,'change',()=>{if(reduced.matches){hoverAmount=searchAmount=0;phase=clock=0;}updateState();start();});
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);raf=0;useFallback();});
    listen(canvas,'webglcontextrestored',()=>{if(destroyed)return;try{init();canvas.hidden=false;fallback.hidden=true;host.dataset.renderer='webgl';resize();start();}catch{useFallback();}});
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
    const intersection=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;start();});intersection.observe(host);
    const dialog=host.closest('dialog');if(dialog)listen(dialog,'close',()=>setVisible(false));
    const controller={setSearching,setVisible,destroy(){
      destroyed=true;cancelAnimationFrame(raf);life.abort();resizeObserver.disconnect();intersection.disconnect();
      if(gl){gl.deleteTexture(texture);gl.deleteTexture(earTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}
      canvas.remove();fallback.remove();delete host.wibsworthLogo;
    }};
    host.wibsworthLogo=controller;return controller;
  }
  window.repoWibsworthLogo=Object.freeze({mount});
})();
