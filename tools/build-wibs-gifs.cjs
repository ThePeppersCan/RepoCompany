// Render the repo-native Wibs vectors into four looping GIFs and still posters.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/wibs-gifs'),frames=path.resolve(root,'../wibs-gif-frames');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(frames,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:320,height:240},deviceScaleFactor:1});
  for(const id of ['wave','love','laugh','hype']){
   const dir=path.join(frames,id);fs.mkdirSync(dir,{recursive:true});const svg=fs.readFileSync(path.join(root,'assets/wibs-emotes',id+'.svg'),'utf8');
   await page.setContent('<style>html,body{margin:0;background:transparent;width:320px;height:240px;overflow:hidden}svg{width:320px;height:240px}</style>'+svg);
   await page.evaluate(id=>{
    const svg=document.querySelector('svg'),ns=svg.namespaceURI,actor=document.createElementNS(ns,'g');if(id==='hype')svg.setAttribute('viewBox','190 220 880 660');for(const n of [...svg.children])if(n.tagName!=='defs')actor.append(n);svg.append(actor);
    const paw=id==='wave'?actor.querySelector('g[transform^="translate(110"]'):null,base=paw?.getAttribute('transform');
    const hearts=id==='love'?[...actor.querySelectorAll('g[transform]')].map(n=>({n,base:n.getAttribute('transform')})):[];
    window.draw=t=>{const phase=t*Math.PI*2,pulse=Math.sin(phase),bounce=id==='hype'?Math.abs(Math.sin(phase*2)):id==='laugh'?Math.abs(Math.sin(phase*4)):.5+.5*pulse;
     const lift=id==='hype'?-56*bounce:id==='laugh'?-12*bounce:-7*bounce,tilt=id==='wave'?2*pulse:id==='laugh'?3*Math.sin(phase*4):0;
     const stretch=id==='hype'?1+.06*bounce:1+.012*pulse;
     actor.setAttribute('transform',`translate(0 ${lift}) translate(627 842) rotate(${tilt}) scale(${1/Math.sqrt(stretch)} ${stretch}) translate(-627 -842)`);
     if(paw)paw.setAttribute('transform',`translate(840 660) rotate(${14*Math.sin(phase*3)}) translate(-840 -660) `+base);
     for(const h of hearts)h.n.setAttribute('transform',h.base+` scale(${1+.13*Math.sin(phase*2)})`);
     if(id==='wave'){const blink=Math.max(0,1-Math.abs(t-.72)/.045);for(const eye of actor.querySelectorAll('ellipse[cy="663"]'))eye.setAttribute('ry',String(47*(1-.9*blink)));}
    };
   },id);
   for(let frame=0;frame<48;frame++){await page.evaluate(t=>window.draw(t),frame/48);await page.screenshot({path:path.join(dir,String(frame).padStart(3,'0')+'.png'),omitBackground:true});}
   console.log('Rendered '+id);
  }
 }finally{await browser.close();}
 const python=process.env.WIBS_PYTHON;if(!python)throw Error('Set WIBS_PYTHON to a Python runtime with Pillow.');
 execFileSync(python,[path.join(__dirname,'encode-wibs-gifs.py'),frames,out],{stdio:'inherit'});
})().catch(e=>{console.error(e);process.exitCode=1;});
