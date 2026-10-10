(() => {
 'use strict';
 const base=new URL('account-assets/avatar-v2/',document.currentScript.src),size=1254;
 const images=new Map(),tints=new Map(),jobs=new WeakMap();
 let catalog;
 const ready=fetch(new URL('catalog.json',base)).then(r=>{if(!r.ok)throw Error('Avatar styles could not be loaded.');return r.json();}).then(v=>(catalog=v));
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const bytes=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16));
 function lab(r,g,b){
  [r,g,b]=[r,g,b].map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
 }
 function rgb(L,a,b){
  const l=Math.pow(L+.3963377774*a+.2158037573*b,3),m=Math.pow(L-.1055613458*a-.0638541728*b,3),s=Math.pow(L-.0894841775*a-1.291485548*b,3);
  return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(v=>Math.round(255*clamp(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055)));
 }
 function normalize(value={}){
  if(!catalog)throw Error('Avatar catalogue is loading.');
  if(!value||typeof value!=='object'||Array.isArray(value))value={};
  const v={...catalog.defaults};
  if(catalog.bodies.some(b=>b.id===value.body))v.body=value.body;
  if(catalog.clothing.some(p=>p.id===value.clothing))v.clothing=value.clothing;
  for(const key of Object.keys(catalog.parts))if(catalog.parts[key].some(p=>p.id===value[key]))v[key]=value[key];
  for(const key of ['hairColor','beardColor','eyeColor','skinColor','clothingColor'])if(typeof value[key]==='string'&&/^#[a-f\d]{6}$/i.test(value[key]))v[key]=value[key].toLowerCase();
  if(typeof value.linkHairBeard==='boolean')v.linkHairBeard=value.linkHairBeard;
  if(v.linkHairBeard)v.beardColor=v.hairColor;
  return v;
 }
 const regions={eyes:[296,496,391,115],nose:[362,590,220,138],mouth:[377,735,229,113],ears:[754,455,207,283]};
 function load(file){
  if(!images.has(file))images.set(file,(async()=>{
   const im=new Image();im.src=new URL(file,base);await im.decode();
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;ctx.drawImage(im,0,0,size,size);
   const pixels=ctx.getImageData(0,0,size,size),data=pixels.data;
   // The background remains unchanged when skin colour changes. It is connected
   // to the outer edge and has the portrait's ochre hue, unlike the peach face.
   const backdrop=new Uint8Array(size*size),queue=new Int32Array(size*size);let head=0,tail=0;
   const visit=i=>{if(backdrop[i])return;const k=i*4,r=data[k],g=data[k+1],b=data[k+2];if(data[k+3]>240&&r>g&&g>b&&(g-b)/(r-b)>.51&&r-g<92){backdrop[i]=1;queue[tail++]=i;}};
   for(let x=0;x<size;x++){visit(x);visit((size-1)*size+x);}for(let y=0;y<size;y++){visit(y*size);visit(y*size+size-1);}
   while(head<tail){const i=queue[head++],x=i%size;if(x)visit(i-1);if(x<size-1)visit(i+1);if(i>=size)visit(i-size);if(i<size*(size-1))visit(i+size);}
   function bounds(yMin=0,yMax=size){let x0=size,y0=size,x1=-1,y1=-1;for(let y=yMin;y<yMax;y++)for(let x=0;x<size;x++)if(data[(y*size+x)*4+3]>96){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}return [x0,y0,x1-x0+1,y1-y0+1];}
   return {canvas,pixels,backdrop,bbox:file.startsWith('beard')?bounds():null,sections:file==='beard-04.png'?[bounds(0,900),bounds(900)]:null};
  })().catch(error=>{images.delete(file);throw error;}));
  return images.get(file);
 }
 const refSkin=lab(...bytes('#ffc69d')),refHair=lab(...bytes('#874209')),refEye=lab(...bytes('#416680'));
 function remap(source,target,ref,kind){
  const strength=kind==='skin'?.62+target[0]*.38:.78;
  let L=target[0]+(source[0]-ref[0])*strength;
  // Keep a dark outline and the bright clusters which describe each shape.
  if(kind==='hair'&&source[0]<.29)L=source[0]*(.65+target[0]*.55);
  const chroma=kind==='skin'?.12+target[0]*.58:.45;
  return rgb(clamp(L,.07,.97),target[1]+(source[1]-ref[1])*chroma,target[2]+(source[2]-ref[2])*chroma);
 }
 function indexedPalette(asset,kind){
  if(asset.indexed)return asset.indexed;
  const data=asset.pixels.data,index=new Uint32Array(size*size),palette=[null],seen=new Map();
  for(let i=0;i<data.length;i+=4){
   if(!data[i+3])continue;
   const pixel=i/4,x=pixel%size,y=Math.floor(pixel/size),r=data[i],g=data[i+1],b=data[i+2];let material;
   if(kind==='hair'||kind==='beard')material=1;
   else if(!asset.backdrop[pixel]){
    if(y>450&&y<610&&x>298&&x<690&&b>r*1.08&&g>r*1.03&&Math.max(r,g,b)<205)material=3;
    else if(y>447&&y<494&&x>300&&x<695&&r>g*1.7&&r>b*1.5&&g<100)material=1;
    else if(r>g*1.12&&r>b*1.10&&r>65)material=2;
   }
   if(!material)continue;
   const key=material*16777216+r*65536+g*256+b;let entry=seen.get(key);
   if(!entry){entry=palette.length;seen.set(key,entry);palette.push({material,source:lab(r,g,b)});}
   index[pixel]=entry;
  }
  return asset.indexed={index,palette};
 }
 function tinted(asset,file,kind,state){
  const hairKey=kind==='beard'?state.beardColor:state.hairColor;
  const hairOnly=kind==='hair'||kind==='beard';
  const key=(hairOnly?[file,hairKey]:[file,hairKey,state.eyeColor,state.skinColor]).join('|');
  if(tints.has(key))return tints.get(key);
  if(hairKey==='#874209'&&(hairOnly||(state.eyeColor==='#416680'&&state.skinColor==='#ffc69d')))return asset.canvas;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),data=new Uint8ClampedArray(asset.pixels.data);
  const hair=lab(...bytes(hairKey)),skin=lab(...bytes(state.skinColor)),eye=lab(...bytes(state.eyeColor));
  // Material and source-colour analysis is done once per layer. Colour dragging
  // now updates the small palette and uses numeric lookups for the pixels.
  const {index,palette}=indexedPalette(asset,kind),lookup=new Uint32Array(palette.length),enabled=new Uint8Array(palette.length);
  for(let i=1;i<palette.length;i++){
   const {material,source}=palette[i];
   if((material===1&&hairKey==='#874209')||(material===2&&state.skinColor==='#ffc69d')||(material===3&&state.eyeColor==='#416680'))continue;
   const [r,g,b]=remap(source,material===1?hair:material===2?skin:eye,material===1?refHair:material===2?refSkin:refEye,material===1?'hair':material===2?'skin':'eye');
   lookup[i]=r|(g<<8)|(b<<16);enabled[i]=1;
  }
  const output=new Uint32Array(data.buffer);
  for(let pixel=0;pixel<index.length;pixel++){
   const entry=index[pixel];if(enabled[entry])output[pixel]=(output[pixel]&0xff000000)|lookup[entry];
  }
  ctx.putImageData(new ImageData(data,size,size),0,0);tints.set(key,canvas);
  while(tints.size>18)tints.delete(tints.keys().next().value);
  return canvas;
 }
 const wardrobe=new Map();
 function clothingMask(asset,body){
  if(asset.clothingMask)return asset.clothingMask;
  const mask=document.createElement('canvas');mask.width=mask.height=size;
  const pixels=new ImageData(size,size),source=asset.pixels.data,marked=new Uint8Array(size*size);
  for(let i=0;i<marked.length;i++){
   const x=i%size,y=Math.floor(i/size),k=i*4,r=source[k],g=source[k+1],b=source[k+2];
   const belowNeck=y>(body==='female'?855:825)&&(x>825||y>(body==='female'?925:943));
   if(belowNeck&&!asset.backdrop[i]&&((b>=r*.85&&g>=r*.7&&r<175)||(r<100&&g<65&&b<100))){marked[i]=1;pixels.data[k+3]=255;}
  }
  mask.getContext('2d').putImageData(pixels,0,0);
  // The outline follows each body's existing silhouette, including the neck.
  const edge=document.createElement('canvas');edge.width=edge.height=size;
  const edges=new ImageData(size,size);
  for(let i=0;i<marked.length;i++)if(marked[i]){
   const x=i%size,y=Math.floor(i/size),d=10;
   if((x>=d&&!marked[i-d])||(x<size-d&&!marked[i+d])||(y>=d&&!marked[i-d*size]))edges.data[i*4+3]=255;
  }
  edge.getContext('2d').putImageData(edges,0,0);
  return asset.clothingMask={mask,edge,marked};
 }
 function clothingLayer(asset,state){
  if(state.clothing==='jacket'&&state.clothingColor==='#41434f')return null;
  const key=[state.body,state.clothing,state.clothingColor].join('|');if(wardrobe.has(key))return wardrobe.get(key);
  const {mask,edge,marked}=clothingMask(asset,state.body),colour=bytes(state.clothingColor),mix=(other,t)=>colour.map((v,i)=>Math.round(v*(1-t)+other[i]*t));
  const shades=[mix([32,16,31],.78),mix([28,25,40],.48),mix([28,31,45],.22),colour,mix([228,218,200],.15),mix([245,232,207],.28)];
  const css=c=>'rgb('+c.join(',')+')',layer=document.createElement('canvas');layer.width=layer.height=size;const ctx=layer.getContext('2d');ctx.imageSmoothingEnabled=false;
  if(state.clothing==='jacket'){
   // Keep the approved jacket's folds and teal undershirt; tint its outer fabric.
   const data=new Uint8ClampedArray(asset.pixels.data),target=lab(...colour),ref=lab(...bytes('#41434f')),palette=new Map();
   for(let i=0;i<marked.length;i++){const k=i*4;if(!marked[i]){data[k+3]=0;continue;}const r=data[k],g=data[k+1],b=data[k+2];if(g>r*1.18&&b>r*1.10)continue;const id=r*65536+g*256+b;let tint=palette.get(id);if(!tint){tint=remap(lab(r,g,b),target,ref,'cloth');palette.set(id,tint);}[data[k],data[k+1],data[k+2]]=tint;}
   ctx.putImageData(new ImageData(data,size,size),0,0);
  }else{
   // Small, integer-grid garment patterns stay crisp at every portrait size.
   const tile=document.createElement('canvas');tile.width=tile.height=80;const tc=tile.getContext('2d'),grid=new Uint8Array(6400);grid.fill(3);
   function poly(points,shade){for(let y=0;y<80;y++)for(let x=0;x<80;x++){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>y+.5)!==(d>y+.5)&&x+.5<(c-a)*(y+.5-b)/(d-b)+a)inside=!inside;}if(inside)grid[y*80+x]=shade;}}
   function rect(x,y,w,h,shade){for(let yy=Math.max(0,y);yy<Math.min(80,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(80,x+w);xx++)grid[yy*80+xx]=shade;}
   const neck=points=>points.map(([x,y])=>[x+(state.body==='female'&&x<43?2:0),y+(state.body==='female'?1:0)]);
   poly([[0,80],[0,71],[24,60],[31,59],[26,67],[21,80]],2);
   poly([[3,80],[8,73],[22,66],[20,71],[15,76],[14,80]],4);
   poly([[80,80],[59,80],[58,66],[55,58],[60,60],[66,64],[62,71],[66,80]],2);
   poly([[80,71],[70,66],[65,65],[69,73],[70,80],[80,80]],1);
   poly([[29,78],[34,74],[45,75],[47,78],[39,77]],4);
   poly([[42,80],[46,77],[58,76],[52,80]],2);
   poly([[14,80],[18,72],[21,70],[20,76],[19,80]],1);
   if(state.clothing==='tshirt'){
    poly(neck([[27,60],[31,60],[30,66],[33,69],[41,70],[47,67],[50,63],[53,57],[54,56],[54,61],[51,66],[47,70],[42,72],[33,72],[29,69],[28,65]]),1);
    poly(neck([[30,66],[33,70],[41,71],[47,69],[44,72],[34,73],[31,71]]),4);
    poly([[21,69],[22,70],[19,80],[18,80]],2);poly([[60,70],[63,80],[62,80],[59,73]],4);
   }else if(state.clothing==='polo'||state.clothing==='shirt'){
    const shirt=state.clothing==='shirt';
    poly(neck([[27,60],[31,59],[30,66],[36,70],[32,75],[25,70]]),0);
    poly(neck([[28,61],[30,61],[30,67],[34,70],[32,73],[27,69]]),shirt?5:4);
    poly(neck([[53,55],[57,58],[58,64],[50,74],[45,70],[50,64]]),0);
    poly(neck([[53,57],[55,59],[56,63],[50,71],[47,70],[52,63]]),4);
    const front=state.body==='female'?40:38;rect(front,71,2,shirt?9:6,1);rect(front,71,1,shirt?9:6,4);
    for(let y=73;y<80;y+=3){rect(front+1,y,1,1,0);rect(front,y,1,1,5);}
    if(shirt){poly([[50,75],[60,73],[60,79],[52,80]],2);poly([[50,74],[60,72],[60,74],[50,76]],4);rect(55,75,1,1,0);}
   }else if(state.clothing==='hoodie'){
    poly(neck([[24,61],[29,58],[33,59],[29,64],[31,69],[38,73],[32,75],[25,71],[22,67]]),0);
    poly(neck([[25,62],[29,60],[31,60],[27,64],[29,69],[34,72],[31,73],[26,69],[24,66]]),4);
    poly(neck([[53,54],[58,57],[60,62],[57,68],[49,74],[43,74],[46,70],[51,65]]),0);
    poly(neck([[54,56],[57,58],[58,62],[55,67],[48,72],[46,72],[52,65]]),4);
    poly(neck([[54,58],[56,60],[56,64],[53,69],[49,71],[51,67]]),2);
    rect(32,73,1,7,5);rect(47,73,1,6,5);rect(31,78,2,2,0);rect(47,78,2,2,0);
   }
   const pixels=new ImageData(80,80);for(let i=0;i<grid.length;i++){pixels.data.set(shades[grid[i]],i*4);pixels.data[i*4+3]=255;}tc.putImageData(pixels,0,0);
   ctx.drawImage(tile,0,0,size,size);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
   const border=document.createElement('canvas');border.width=border.height=size;const bc=border.getContext('2d');bc.fillStyle=css(shades[0]);bc.fillRect(0,0,size,size);bc.globalCompositeOperation='destination-in';bc.drawImage(edge,0,0);ctx.drawImage(border,0,0);
  }
  wardrobe.set(key,layer);while(wardrobe.size>12)wardrobe.delete(wardrobe.keys().next().value);return layer;
 }
 async function draw(canvas,value,options={}){
  const ticket={};jobs.set(canvas,ticket);await ready;
  const state=normalize(value),parts=[['body',catalog.bodies.find(b=>b.id===state.body)],...['ears','eyes','nose','mouth','hair','beard'].flatMap(k=>k==='beard'&&state.beard==='06'?['01','05'].map(id=>[k,catalog.parts[k].find(p=>p.id===id)]):[[k,catalog.parts[k].find(p=>p.id===state[k])]])].filter(([kind,p])=>p?.file&&!(regions[kind]&&p.id==='01'));
  const layers=await Promise.all(parts.map(async([kind,part])=>({kind,part,asset:await load(part.file)})));
  if(jobs.get(canvas)!==ticket)return false;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(canvas.width/size,canvas.height/size);ctx.imageSmoothingEnabled=false;
  for(const {kind,part,asset} of layers){
   const image=tinted(asset,part.file,kind,state),box=regions[kind];
   // Feature edits stay at their native coordinates. Never stretch a feature's
   // detected bounding box into a different eye, nose or mouth shape.
   if(box)ctx.drawImage(image,...box,...box);
   else if(kind==='beard'&&part.id==='04'){
    ctx.drawImage(image,...asset.sections[0],324,697,335,109);
    ctx.drawImage(image,...asset.sections[1],401,813,185,160);
   }else if(kind==='beard'&&part.id!=='03'){
    const target=part.id==='01'?[315,635,525,310]:part.id==='02'?[316,626,515,321]:[324,697,335,110];
    ctx.drawImage(image,...asset.bbox,...target);
   }else ctx.drawImage(image,0,0,size,size);
   if(kind==='body'){const clothes=clothingLayer(asset,state);if(clothes)ctx.drawImage(clothes,0,0,size,size);}
  }
  ctx.restore();canvas.dataset.avatarReady='true';return true;
 }
 async function feature(canvas,kind,id,value){
  // Showing each choice on a complete portrait makes its actual fit visible.
  return draw(canvas,{...value,...(['nose','mouth'].includes(kind)?{beard:'none'}:{}),...(kind==='ears'?{hair:'none'}:{}),[kind]:id});
 }
 function markup(value,label='Player avatar'){
  if(!value||typeof value!=='object')return '';
  return `<canvas class="repo-avatar-image" width="256" height="256" data-repo-avatar="${encodeURIComponent(JSON.stringify(value))}" role="img" aria-label="${String(label).replace(/[&<>"']/g,'')}"></canvas>`;
 }
 function hydrate(root=document){root.querySelectorAll('canvas[data-repo-avatar]').forEach(c=>{if(c.dataset.avatarLoading)return;c.dataset.avatarLoading='true';let value;try{value=JSON.parse(decodeURIComponent(c.dataset.repoAvatar));}catch{return;}draw(c,value).catch(()=>{c.hidden=true;});});}
 window.repoAvatar=Object.freeze({ready,normalize,draw,feature,markup,hydrate,get catalog(){return catalog;}});
 ready.catch(()=>{});
})();
