// Sidebar-only cream-and-opal mark, using the supplied ai-mark-animation.html renderer. The response and welcome mascots keep their own rig.
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
    let searching=false,hovered=false,focused=false,visible=false,inViewport=true,destroyed=false;
    let clock=0,activity=0,searchMix=0,px=0,py=0,targetX=0,targetY=0,last=0,raf=0,width=132,height=93,dpr=1;
    let attempted=false;
    let gl=null,program=null,buffer=null,texture=null,uniforms={},ready=false;

    const markPath=new Path2D('M35 7 C46 5 52 15 55 29 C57 37 60 41 65 39 C70 37 72 29 78 25 C82 21 87 21 92 24 C99 28 102 40 109 40 C115 40 115 32 117 24 C119 14 126 8 132 9 C144 8 152 20 154 33 C157 48 146 65 132 70 C115 79 101 67 94 53 L86 40 C80 48 77 56 68 65 C57 77 40 74 28 62 C16 50 13 39 20 23 C23 14 28 8 35 7 Z');
    function makeDistanceField(){
      const w=1328,h=672,s=8,source=document.createElement('canvas');source.width=w;source.height=h;
      const ctx=source.getContext('2d',{willReadFrequently:true});ctx.scale(s,s);ctx.fill(markPath);
      const pixels=ctx.getImageData(0,0,w,h).data,n=w*h,inside=new Uint8Array(n),dist=new Float32Array(n);
      for(let i=0;i<n;i++){inside[i]=pixels[i*4+3]>127?1:0;dist[i]=10000;}
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x,v=inside[i];
        if(v!==inside[i-1]||v!==inside[i+1]||v!==inside[i-w]||v!==inside[i+w])dist[i]=Math.max(.05,Math.abs(pixels[i*4+3]/255-.5));
      }
      const d=Math.SQRT2;
      for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
        const i=y*w+x;dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-w]+1,dist[i-w-1]+d,dist[i-w+1]+d);
      }
      for(let y=h-2;y>0;y--)for(let x=w-2;x>0;x--){
        const i=y*w+x;dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+w]+1,dist[i+w+1]+d,dist[i+w-1]+d);
      }
      const data=new Uint8Array(n*4);
      for(let i=0;i<n;i++){
        const signed=dist[i]/s*(inside[i]?-1:1),v=Math.round(Math.max(0,Math.min(1,signed/128+.5))*65535);
        data[i*4]=v>>8;data[i*4+1]=v&255;data[i*4+3]=255;
      }
      return{data,w,h};
    }
    const vertex=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
    const fragment=`precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_field;
    uniform vec2 u_size,u_pointer;
    uniform float u_time,u_activity,u_search,u_depth,u_opal,u_scale,u_pixel;
    float field(vec2 p){
      vec2 uv=(p+vec2(83.,42.))/vec2(166.,84.);
      vec2 rg=texture2D(u_field,clamp(uv,vec2(.001),vec2(.999))).rg;
      float sdf=(dot(rg,vec2(65280.,255.))/65535.-.5)*128.;
      return sdf+length(max(abs(p)-vec2(82.8,41.8),0.));
    }
    vec2 flow(vec2 p,float t,float strength){
      float a=u_activity*u_depth;
      float s=u_search*u_depth*strength;
      float roll=a*(.025*sin(t*.83)+u_pointer.x*.018);
      p=mat2(cos(roll),-sin(roll),sin(roll),cos(roll))*p;
      p/=1.+.008*sin(t*.7)+a*.018+s*.026*sin(t*.72);
      // Local counter-rotating curls roll each lobe into the connecting ribbon.
      vec2 left=p-vec2(-39.,1.);
      float turnL=s*(.35+.85*sin(t*.88))*exp(-dot(left,left)/1350.);
      p=vec2(-39.,1.)+mat2(cos(turnL),-sin(turnL),sin(turnL),cos(turnL))*left;
      vec2 right=p-vec2(41.,1.);
      float turnR=s*(-.35+.85*sin(t*.88+2.2))*exp(-dot(right,right)/1350.);
      p=vec2(41.,1.)+mat2(cos(turnR),-sin(turnR),sin(turnR),cos(turnR))*right;
      p.x+=a*(1.1+u_search*1.3)*sin(p.y*.063+t*.8)*strength;
      p.y+=a*(2.4+u_search*5.2)*sin(p.x*.057-t*1.25)*strength;
      p.y+=a*.7*sin(p.x*.115+t*.75)*strength;
      p.x+=s*3.7*sin(p.y*.075+t*.72)*exp(-p.x*p.x/2300.);
      return p;
    }
    vec3 pearl(float phase){
      return .80+.20*cos(6.28318*(vec3(.03,.35,.61)+phase));
    }
    void main(){
      vec2 screen=(v_uv-.5)*u_size;screen.y=-screen.y;
      vec2 p=screen/u_scale-u_pointer*vec2(2.4,1.4)*u_activity;
      if(abs(p.x)>108.||abs(p.y)>73.){gl_FragColor=vec4(0.);return;}
      float t=u_time;
      vec2 q=flow(p,t,1.);
      float d=field(q);
      float aa=1.1/(u_scale*u_pixel);
      float mask=1.-smoothstep(-aa,aa,d);
      float outside=max(d,0.);
      float aura=exp(-outside*outside/65.)*(.014+.025*u_activity)*(1.-mask);
      vec3 color=vec3(.85,.84,.74)*aura;
      float alpha=aura;
      // Partial, tapered strokes peel off the moving edge like a loaded brush.
      for(int i=1;i<=4;i++){
        float f=float(i);
        vec2 echoP=p/(1.+f*.021*u_activity);
        echoP+=u_search*vec2(sin(t*.9+f*.2),cos(t*.7+f*.2))*f*.5;
        vec2 echoQ=flow(echoP,t-f*.18,1.);
        float e=field(echoQ);
        float angle=atan(echoQ.y*.9,echoQ.x);
        float sweep=.5+.5*sin(angle*2.-t*1.1-f*.34);
        float taper=smoothstep(.37,.86,sweep);
        float brushWidth=(1.35-f*.22)*(.20+.80*taper);
        float stroke=exp(-e*e/(brushWidth*brushWidth+aa*aa*.45));
        float line=stroke*(.34-f*.057)*taper*u_activity*(.08+.92*u_search)*(1.-mask);
        vec3 echo=mix(vec3(.96,.918,.80),pearl(f*.16+t*.035),u_opal*.22);
        color+=echo*line;alpha+=line;
      }
      // A small, staggered dusting follows the two brush tips; no particle burst.
      for(int i=0;i<10;i++){
        float f=float(i),seed=fract(sin(f*13.73+1.2)*381.17);
        float life=fract(t*(.16+seed*.025)+f*.618034);
        float side=mod(f,2.)*2.-1.;
        vec2 tip=vec2(side*(64.+15.*life+3.*sin(life*3.14159)),side*(-14.-16.*life));
        tip.y+=sin(life*4.2+f)*3.5;
        float radius=(.32+seed*.46)*(1.-life*.48);
        float point=1.-smoothstep(radius,radius+aa*.72,length(q-tip));
        float fade=smoothstep(0.,.15,life)*(1.-smoothstep(.36,1.,life));
        float dust=point*fade*(.24+seed*.28)*u_search*u_search*(1.-mask);
        color+=vec3(.96,.92,.82)*dust;alpha+=dust;
      }
      if(mask>.001){
        float eps=.35;
        vec2 grad=vec2(field(q+vec2(eps,0.))-field(q-vec2(eps,0.)),field(q+vec2(0.,eps))-field(q-vec2(0.,eps)))/(2.*eps);
        float bevel=exp(min(d,0.)/2.7);
        vec3 n=normalize(vec3(grad*.52*bevel,1.));
        vec3 light=normalize(vec3(-.42,-.64,1.1));
        float diffuse=dot(n,light);
        vec3 cream=vec3(.957,.919,.809);
        vec3 body=cream*(.91+.105*diffuse);
        body+=.026*(.5-.5*q.y/42.);
        float wave=q.x*.043+q.y*.047+sin(q.y*.071-t*.45)*.9-t*.65;
        float ribbon=pow(.5+.5*sin(wave),5.);
        float counter=pow(.5+.5*sin(wave*1.4+q.x*.026+t*.9),12.);
        float opal=u_opal*(.10+.90*u_activity);
        vec3 interference=pearl(wave*.11+t*.018);
        body=mix(body,interference,opal*(.35*ribbon+.12*counter));
        body+=u_activity*(ribbon*.026-counter*.017);
        // Broad cream ribbons and a soft occlusion seam suggest an actual fold.
        float folding=u_search*u_depth;
        float fold=q.y+12.*sin(q.x*.047-t*.91)+4.*sin(q.x*.093+t*.44);
        float seam=exp(-pow((fold-1.8)/2.5,2.));
        float underside=exp(-pow((fold-5.)/6.8,2.));
        float crest=exp(-pow((fold+3.9)/4.1,2.));
        float curlFade=.38+.62*pow(.5+.5*sin(q.x*.038+t*.65),2.);
        body-=folding*curlFade*(seam*.10+underside*.095)*vec3(.83,.80,.73);
        body+=folding*curlFade*crest*vec3(.065,.061,.047);
        float brush=pow(.5+.5*sin(fold*1.9+sin(q.x*.052-t*.5)),16.);
        body-=folding*brush*.012*(1.-smoothstep(-12.,-3.,d));
        float satin=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),22.);
        body+=satin*.037;
        body+=vec3(.05,.044,.032)*bevel*max(0.,-grad.y*.7-grad.x*.3);
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
        body+=grain*.0025;
        color=color*(1.-mask)+body*mask;alpha=alpha*(1.-mask)+mask;
      }
      gl_FragColor=vec4(color,min(alpha,1.));
    }`;
    function compile(type,source){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(message);}
      return shader;
    }
    function init(){
      gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'low-power'});
      if(!gl)throw Error('WebGL unavailable');
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
      buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      for(const name of ['field','size','pointer','time','activity','search','depth','opal','scale','pixel'])uniforms[name]=gl.getUniformLocation(program,'u_'+name);
      const field=makeDistanceField();texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,field.w,field.h,0,gl.RGBA,gl.UNSIGNED_BYTE,field.data);gl.uniform1i(uniforms.field,0);
      ready=true;
    }

    function useFallback(){ready=false;canvas.hidden=true;fallback.hidden=false;host.dataset.renderer='static';}
    function scale(){return Math.min(width/206,height/150);}
    function draw(){
      if(!ready)return;
      // Freeze the supplied motion at its original pose when idle. Fade its
      // clock back only below hover strength, so full motion matches the source.
      const amount=reduced.matches?0:activity;
      const rest=Math.min(1,amount/.62),time=clock*rest*rest*(3-2*rest);
      gl.uniform2f(uniforms.size,width,height);gl.uniform2f(uniforms.pointer,px,py);
      gl.uniform1f(uniforms.time,time);gl.uniform1f(uniforms.activity,amount);
      gl.uniform1f(uniforms.search,reduced.matches?0:searchMix);
      gl.uniform1f(uniforms.depth,1);gl.uniform1f(uniforms.opal,.32);
      gl.uniform1f(uniforms.scale,scale());gl.uniform1f(uniforms.pixel,dpr);
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
      host.dataset.motion=reduced.matches?'idle':searching?'searching':hovered||focused?'hover':activity>0?'settling':'idle';
    }
    function active(){return searching||hovered||focused||activity>0||searchMix>0;}
    function tick(now){
      raf=0;if(destroyed||!visible||!inViewport||document.hidden)return;
      if(reduced.matches){updateState();draw();return;}
      const dt=last?Math.min((now-last)/1000,.045):0;last=now;
      const blend=1-Math.exp(-dt*3.8),pointerBlend=1-Math.exp(-dt*5.5);
      const target=searching?1:(hovered||focused)?.62:0;
      activity+=(target-activity)*blend;searchMix+=((searching?1:0)-searchMix)*blend;
      px+=(targetX-px)*pointerBlend;py+=(targetY-py)*pointerBlend;
      if(!target&&activity<.001)activity=0;
      if(!searching&&searchMix<.001)searchMix=0;
      if(active())clock+=dt;else{clock=px=py=0;}
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
      searching=next;
      updateState();start();
    }
    function setVisible(value){
      const next=Boolean(value);if(next===visible)return;visible=next;
      if(!visible){hovered=focused=false;targetX=targetY=px=py=0;if(!searching){activity=searchMix=clock=0;}}
      updateState();start();
    }
    listen(host,'pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;start();});
    listen(host,'pointerleave',()=>{hovered=false;targetX=targetY=0;start();});
    listen(host,'pointermove',event=>{const bounds=host.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));targetY=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));});
    listen(host,'focus',()=>{focused=host.matches(':focus-visible');start();});
    listen(host,'blur',()=>{focused=false;start();});
    listen(document,'visibilitychange',start);
    listen(reduced,'change',()=>{if(reduced.matches){activity=searchMix=clock=px=py=0;}updateState();start();});
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(raf);raf=0;useFallback();});
    listen(canvas,'webglcontextrestored',()=>{if(destroyed)return;try{init();canvas.hidden=false;fallback.hidden=true;host.dataset.renderer='webgl';resize();start();}catch{useFallback();}});
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
    const intersection=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;start();});intersection.observe(host);
    const dialog=host.closest('dialog');if(dialog)listen(dialog,'close',()=>setVisible(false));
    const controller={setSearching,setVisible,destroy(){
      destroyed=true;cancelAnimationFrame(raf);life.abort();resizeObserver.disconnect();intersection.disconnect();
      if(gl){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}
      canvas.remove();fallback.remove();delete host.wibsworthLogo;
    }};
    host.wibsworthLogo=controller;return controller;
  }
  window.repoWibsworthLogo=Object.freeze({mount});
})();
