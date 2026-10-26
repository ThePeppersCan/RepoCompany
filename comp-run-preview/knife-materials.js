import * as THREE from './vendor/three.module.js?v=2.16.0';

import {PREMIUM_SURFACES,createPremiumTextures} from './premium-materials.js?v=2.16.0';

const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),fract=x=>x-Math.floor(x);
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const line=(value,width=.04)=>1-clamp(Math.abs(value)/width);
const noise=(x,y)=>{let n=Math.imul(x+131,374761393)^Math.imul(y+479,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};

// One packed surface map supplies roughness (green) and metalness (blue).
// Ceramic and inlay stay physically distinct, without another texture fetch.
const surface=(rough,metal,coat,aniso,handle,hardware,iridescence=0)=>Object.freeze({rough,metal,coat,aniso,handle,hardware,iridescence});
export const FINISH_SURFACES=Object.freeze({
 ...PREMIUM_SURFACES,
 brushed:surface(.36,.94,.12,.58,'#253139','#9da7a9'),
 violet:surface(.31,.76,.28,.28,'#262333','#9691a1'),
 crimson:surface(.32,.18,.56,.12,'#30212a','#b9a49d'),
 amber:surface(.30,.86,.24,.38,'#302b24','#b6a17b'),
 prism:surface(.29,.88,.16,.34,'#262738','#aaa9b4',.21),
 copper:surface(.38,.9,.12,.27,'#302c26','#b88b67'),
 obsidian:surface(.34,.94,.12,.45,'#1c252c','#95a5b0'),
 glacier:surface(.34,.65,.29,.18,'#213141','#a7c9d2'),
 jade:surface(.31,.19,.48,.12,'#17312c','#b9a870'),
 porcelain:surface(.35,.03,.47,.08,'#263347','#b8c1c1'),
 ember:surface(.37,.10,.37,.10,'#28252b','#ba8572'),
 royal:surface(.32,.14,.46,.12,'#282539','#b9a065'),
 carbon:surface(.40,.15,.46,.42,'#202a31','#8e9ca4'),
 aurora:surface(.30,.91,.19,.38,'#233330','#a2b1ad',.19),
 goldline:surface(.33,.10,.35,.15,'#202329','#bc9e60'),
 pearl:surface(.31,.04,.58,.08,'#777a7e','#bbc2c4',.16),
 viper:surface(.39,.81,.14,.34,'#2b3426','#95966d'),
 signal:surface(.38,.10,.32,.12,'#2a3034','#b6bab8'),
 tidal:surface(.32,.91,.16,.43,'#1e303c','#a5bac0'),
 rose:surface(.31,.93,.19,.52,'#37282c','#c49b88'),
 meteor:surface(.37,.95,.12,.40,'#252d32','#a4aeac'),
 dune:surface(.41,.86,.10,.38,'#38332b','#ac9877'),
 marble:surface(.35,.04,.46,.08,'#363b3d','#bdc3c0'),
 petrol:surface(.29,.91,.24,.32,'#252b35','#949ba7',.24),
 blueprint:surface(.40,.12,.29,.14,'#213445','#a3b9bf'),
 garnet:surface(.33,.10,.50,.10,'#34222d','#b38f7c'),
 blackstone:surface(.48,.87,.10,.23,'#232b30','#8b959a'),
 scrimshaw:surface(.39,.03,.30,.09,'#3d3026','#b3a28b'),
});

/** A finish is generated only on selection. Its colour, shallow relief and
 * physical surface response share the same pattern, so inlay catches light
 * differently from its surrounding enamel. No animated texture uploads. */
export function createFinishTextures(finish){
 if(finish.premium)return createPremiumTextures(finish);
 const width=512,height=128,pixels=new Uint8Array(width*height*4),grain=new Uint8Array(width*height*4),packed=new Uint8Array(width*height*4),colours=finish.colors.map(rgb),spec=FINISH_SURFACES[finish.id]||FINISH_SURFACES.brushed;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,at=(y*width+x)*4,n=noise(x,y),flow=Math.sin(u*18+Math.sin(v*11)*1.8),brush=Math.sin(v*height*1.7+Math.sin(u*22)*.1)*.5+.5;
  let colour=colours[0],relief=0,roughness=spec.rough,metalness=spec.metal,inlay=0;
  switch(finish.id){
   case 'brushed':{
    const band=Math.sin(v*29+Math.sin(u*18)*1.8)*.035+Math.sin(v*61+u*9)*.018;
    colour=mix(colours[1],colours[0],.78+band);relief=(brush-.5)*.08;break;
   }
   case 'violet':{
    const satin=.5+.5*Math.sin(u*8+v*2);colour=mix(colours[0],colours[2],.05+satin*.17);roughness+=.035*Math.sin(v*11);break;
   }
   case 'crimson':{
    const vein=Math.abs(Math.sin(u*26+v*9+Math.sin(v*14)*1.4));
    inlay=line(vein,.08);colour=mix(mix(colours[0],colours[2],.08+.07*flow),colours[1],inlay*.88);relief=-inlay*.17;roughness+=inlay*.11;break;
   }
   case 'amber':{
    const stripe=clamp((Math.sin(u*39+v*12+Math.sin(v*14)*2.5)-.25)*4);
    colour=mix(colours[0],colours[1],stripe*.87);roughness+=stripe*.13;metalness-=stripe*.23;break;
   }
   case 'prism':{
    const t=clamp(u+.12*flow+.11*Math.sin(v*12));colour=t<.5?mix(colours[0],colours[1],t*2):mix(colours[1],colours[2],(t-.5)*2);break;
   }
   case 'copper':{
    const patina=Math.sin(u*45+Math.sin(v*15)*4)*Math.sin(v*22+u*8)+Math.sin(u*89+v*31)*.22,wear=clamp((patina-.15)*1.2);
    colour=mix(colours[0],colours[1],wear*.9);roughness+=wear*.28;metalness-=wear*.7;relief=wear*.12;break;
   }
   case 'obsidian':{
    const layers=Math.sin(v*62+Math.sin(u*15)*3.4+Math.sin(u*41+v*7)*1.5),bright=(.5+.5*layers)**5;
    colour=mix(colours[0],colours[1],.11+bright*.65);roughness+=bright*.1;relief=bright*.15;break;
   }
   case 'glacier':{
    const gx=u*17+Math.sin(v*8)*.7,gy=v*8,xx=fract(gx),yy=fract(gy),facet=noise(Math.floor(gx)*2+(xx>yy?1:0),Math.floor(gy));
    inlay=line(Math.min(xx,1-xx,yy,1-yy,Math.abs(xx-yy)),.021);colour=mix(mix(colours[1],colours[0],.49+facet*.46),colours[2],inlay*.7);roughness+=facet*.09;relief=facet*.07-inlay*.10;break;
   }
   case 'jade':{
    const row=Math.floor(v*17),xx=fract(u*43+(row%2)*.5)-.5,yy=fract(v*17)-.5,scale=Math.sqrt(xx*xx+(yy+.28)**2);
    inlay=Math.exp(-(((scale-.48)/.045)**2));colour=mix(mix(colours[0],colours[1],.15+(.5+.5*flow)*.4),colours[2],inlay*.65);
    metalness+=inlay*.62;roughness-=inlay*.07;relief=inlay*.12;break;
   }
   case 'porcelain':{
    const stemV=.5+.10*Math.sin(u*15),stem=line(v-stemV,.009);let ink=stem;
    for(let leaf=0;leaf<9;leaf++){
     const cu=.08+leaf*.105,side=leaf%2?-1:1,cv=.5+.10*Math.sin(cu*15)+side*.055,dx=u-cu,dy=v-cv;
     const lx=dx*.78+dy*side*.63,ly=-dx*side*.63+dy*.78,shape=Math.sqrt((lx/.048)**2+(ly/.024)**2);
     const filled=clamp((1-shape)*7),vein=line(ly,.004)*clamp(1-Math.abs(lx)/.047);
     ink=Math.max(ink,filled*(.76+vein*.24));
    }
    colour=mix(colours[0],colours[1],ink*.86);roughness+=ink*.035;relief=-ink*.035;break;
   }
   case 'ember':{
    const crack=Math.abs(Math.sin(u*27+v*21+Math.sin(v*15)*1.5)),fine=Math.abs(Math.sin(u*63-v*31+flow));
    inlay=Math.max(line(crack,.075),line(fine,.032));colour=mix(colours[0],mix(colours[1],colours[2],clamp(1-crack*10)*.65),inlay*.95);
    metalness+=inlay*.82;roughness-=inlay*.11;relief=-inlay*.12;break;
   }
   case 'royal':{
    const scroll=Math.abs(Math.sin(u*42+Math.sin(v*12)*3)+Math.cos(v*35-u*12)*.55);inlay=line(scroll,.14);
    colour=mix(mix(colours[0],colours[2],.18+.1*flow),colours[1],inlay);metalness+=inlay*.8;roughness-=inlay*.07;relief=inlay*.08;break;
   }
   case 'carbon':{
    const tx=Math.floor(u*74),ty=Math.floor(v*24),warp=((tx+ty)%4)<2,thread=warp?fract(u*74):fract(v*24),bundle=Math.sin(thread*Math.PI)**.45;
    const rib=.5+.5*Math.sin((warp?v*128:u*512)*TAU*.43);
    colour=mix(colours[1],colours[0],.4+bundle*.52);colour=mix(colour,colours[2],bundle*(((tx+ty)%4)/3)*.18);
    roughness+=warp?.04:-.03;relief=bundle*.17+rib*.025;break;
   }
   case 'aurora':{
    const ribbon=.5+.5*Math.sin(u*8-v*3+Math.sin(u*19)*.45),t=.5+.5*Math.sin(v*6+u*13);
    colour=mix(mix(colours[0],colours[1],ribbon),colours[2],t*.13);roughness+=Math.sin(u*22)*.025;break;
   }
   case 'goldline':{
    const diagonals=Math.abs(fract(u*9-v*2.7)-.5),double=Math.abs(fract(u*9-v*2.7+.07)-.5);
    inlay=Math.max(line(diagonals,.014),line(double,.006));colour=mix(mix(colours[0],colours[2],v*.20),colours[1],inlay);
    metalness+=inlay*.85;roughness-=inlay*.08;relief=inlay*.055;break;
   }
   case 'pearl':{
    const shell=.5+.5*Math.sin(u*18+v*7+Math.sin(v*19)*.7);colour=mix(mix(colours[0],colours[1],shell*.28),colours[2],(.5+.5*flow)*.15);
    relief=Math.sin(u*73+v*6)*.018;break;
   }
   case 'viper':{
    const row=Math.floor(v*12),xx=fract(u*34+(row%2)*.5)-.5,yy=fract(v*12)-.5,diamond=Math.abs(xx)*.9+Math.abs(yy)*.65;
    const ridge=line(diamond-.38,.037),heart=clamp(1-diamond*2);
    colour=mix(colours[1],colours[0],.28+heart*.7);colour=mix(colour,colours[2],ridge*.55);roughness-=ridge*.12;relief=heart*.23-ridge*.09;break;
   }
   case 'signal':{
    const panel=fract(u*4.2+v*.22),mark=panel>.70&&panel<.82,black=panel>.83;
    colour=mark?colours[2]:black?colours[1]:colours[0];metalness=black?.78:spec.metal;roughness+=black?-.06:.02;
    const score=line(v-.20,.004)*line(fract(u*29)-.5,.32);colour=mix(colour,colours[1],score*.6);relief=-score*.08;break;
   }
   case 'tidal':{
    const wave=v*37+Math.sin(u*12)*2.2+Math.sin(u*28)*.6,crest=(.5+.5*Math.cos(wave))**9;
    colour=mix(mix(colours[0],colours[1],.20+.12*flow),colours[2],crest*.7);roughness-=crest*.08;relief=crest*.15;break;
   }
   case 'rose':{
    const a=Math.sin(u*138+Math.sin(v*27)*3.6),b=Math.sin(u*138-Math.sin(v*27)*3.6),engraved=Math.max(line(a,.16),line(b,.16));
    colour=mix(mix(colours[0],colours[2],.12+.08*flow),colours[1],engraved*.5);roughness+=engraved*.1;relief=-engraved*.16;break;
   }
   case 'meteor':{
    const a=fract(u*24+v*3.7),b=fract(u*18-v*5.5),c=fract(u*11+v*8.6),slab=Math.floor(a*5)/5;
    const seam=Math.max(line(a-.5,.025),line(b-.5,.018),line(c-.5,.014));
    colour=mix(colours[1],colours[0],.35+slab*.53);colour=mix(colour,colours[2],seam*.70);roughness+=slab*.08-seam*.08;relief=slab*.13;break;
   }
   case 'dune':{
    const terrain=Math.sin(u*15+v*3)+Math.sin(v*12-u*4)*.5+Math.sin(u*34+v*11)*.16,contour=line(Math.sin(terrain*12),.12);
    colour=mix(colours[0],colours[2],.17+.12*terrain);colour=mix(colour,colours[1],contour*.73);roughness+=contour*.07;relief=-contour*.11;break;
   }
   case 'marble':{
    const bend=u*24+v*6+Math.sin(v*8+u*7)*1.4+Math.sin(u*53-v*19)*.14,seam=(1-Math.abs(Math.sin(bend)))**26;
    colour=mix(mix(colours[0],colours[2],(.5+.5*flow)*.09),colours[1],seam*.83);roughness+=seam*.07;relief=-seam*.05;break;
   }
   case 'petrol':{
    const heat=.5+.5*Math.sin(u*12+v*8+Math.sin(u*6-v*3)*2),t=.5+.5*Math.sin(u*19-v*5);
    colour=mix(mix(colours[0],colours[1],heat),colours[2],t*.38);roughness+=heat*.025;break;
   }
   case 'blueprint':{
    const grid=Math.max(line(fract(u*30)-.5,.018),line(fract(v*10)-.5,.018)),ring=line(Math.hypot(fract(u*6)-.5,(fract(v*2)-.5)*.55)-.27,.015);
    const dashes=fract(u*56)>.5?line(v-.5,.010):0;inlay=clamp(grid*.35+ring*.75+dashes*.8);
    colour=mix(colours[0],colours[1],inlay);roughness+=inlay*.035;relief=-inlay*.06;break;
   }
   case 'garnet':{
    const gx=u*19,gy=v*6,row=Math.floor(gy),xx=fract(gx+(row%2)*.5),yy=fract(gy),facet=fract((Math.floor(gx+(row%2)*.5)*.73+row*.37));
    const diagonal=Math.abs(xx-yy),border=Math.min(xx,1-xx,yy,1-yy,diagonal);
    inlay=line(border,.020);colour=mix(colours[1],colours[0],.38+facet*.61);colour=mix(colour,colours[2],inlay*.82);
    roughness+=facet*.06-inlay*.07;metalness+=inlay*.77;relief=facet*.045-inlay*.06;break;
   }
   case 'blackstone':{
    const coarse=noise(Math.floor(x/3),Math.floor(y/3)),pitting=clamp((coarse-.81)*5),speck=clamp((n-.975)*40);
    colour=mix(colours[1],colours[0],.55+coarse*.38);colour=mix(colour,colours[2],speck*.25);roughness+=pitting*.13;relief=-pitting*.18;break;
   }
   case 'scrimshaw':{
    const scroll=Math.sin(u*38+Math.sin(v*12)*2.6)+Math.cos(v*28-u*9)*.45,engrave=line(scroll,.075),hatch=line(Math.sin(u*157+v*36),.08)*clamp(.5-flow);
    colour=mix(mix(colours[0],colours[2],.08+.025*flow),colours[1],Math.max(engrave*.8,hatch*.27));roughness+=engrave*.07;relief=-engrave*.12;break;
   }
  }
  // Long, fine machining marks stay subordinate to the finish. Sparse handling
  // wear breaks up a perfect coating without noisy, sparkling white pixels.
  const streak=noise(Math.floor(x/47),y),micro=(brush-.5)*.032+(streak-.5)*.028+(n-.5)*.012,shade=.978+micro;
  for(let c=0;c<3;c++)pixels[at+c]=clamp(colour[c]*shade,0,255);
  const heightValue=clamp(128+relief*46+(brush-.5)*4+(n-.5)*1.8,0,255);
  grain[at]=grain[at+1]=grain[at+2]=heightValue;
  packed[at]=255;packed[at+1]=clamp((roughness+micro*.34)*255,38,204);packed[at+2]=clamp(metalness*255,0,255);
  pixels[at+3]=grain[at+3]=packed[at+3]=255;
 }
 const textures=[pixels,grain,packed].map((data,index)=>{
  const texture=new THREE.DataTexture(data,width,height);texture.name=finish.name+[' / colour',' / shallow engraving',' / physical surface'][index];texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.anisotropy=8;texture.needsUpdate=true;return texture;
 });
 textures[0].colorSpace=THREE.SRGBColorSpace;
 return{map:textures[0],bump:textures[1],roughness:textures[2],textures};
}
