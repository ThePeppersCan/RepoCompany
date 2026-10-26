import * as THREE from './vendor/three.module.js?v=2.17.0';
import {PREMIUM_FINISHES} from './premium-catalog.js?v=2.17.0';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),fract=n=>n-Math.floor(n),TAU=Math.PI*2;
const hash=(x,y)=>{let n=Math.imul(x+613,374761393)^Math.imul(y+917,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
const ridge=(n,w=.06)=>clamp(1-Math.abs(n)/w),rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*clamp(t));
export const PREMIUM_SURFACES=Object.freeze(Object.fromEntries(PREMIUM_FINISHES.map(f=>{
 const ceramic=['ceramic','lacquer','pearl'].includes(f.style),lux=f.family==='Luxury';
 return[f.id,{rough:ceramic?.25:.30,metal:ceramic?.08:.84,coat:ceramic?.8:.35,aniso:ceramic?.12:.55,handle:f.colors[0],hardware:lux?f.colors[2]:'#a0abb1',iridescence:['pearl','shard','star'].includes(f.style)?.5:0}];
})));

export function createPremiumTextures(finish){
 const w=1024,h=256,buffers=Array.from({length:4},()=>new Uint8Array(w*h*4)),c=finish.colors.map(rgb),spec=PREMIUM_SURFACES[finish.id];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/h,n=hash(x,y),a=u*TAU,b=v*TAU,flow=Math.sin(a*3+Math.sin(b*2)),grain=hash(Math.floor(x/41),y);
  let field=0,ink=0,relief=0;
  switch(finish.pattern){
   case 25:{const rib=Math.sin(a*16+Math.abs(v-.5)*14);field=.10+.14*flow;ink=ridge(rib,.09)*clamp(1-Math.abs(v-.5)*1.6)+ridge(v-.5,.008);break;}
   case 26:{const x=fract(u*18)-.5,y=(fract(v*3)-.5)*1.8;field=.11+.08*flow;ink=ridge(Math.hypot(x,y)-.31,.032)*.85+ridge(Math.sin(a*3+b*6),.025)*.2;break;}
   case 27:{const fang=fract(u*14)-.5;field=.10+.12*hash(Math.floor(x/8),Math.floor(y/7));ink=ridge(Math.abs(v-.5)-.30+Math.abs(fang)*.48,.025)+ridge(Math.sin(a*9+b*4+flow),.07)*.55;break;}
   case 28:{const r=Math.hypot((u-.5)*1.7,v-.5),ang=Math.atan2(v-.5,(u-.5)*1.7);field=.08+.18*Math.sin(r*38);ink=Math.max(ridge(Math.sin(ang*9),.065),ridge(Math.sin(r*90+Math.sin(ang*9)*.2),.07))*.7;break;}
   case 29:{const wave=Math.sin(a*7+b*3+Math.sin(a*3)*2),eye=Math.hypot((fract(u*5)-.5)*1.5,(v-.5)*2);field=.18+.18*flow;ink=Math.max(ridge(eye-.32,.025),ridge(wave,.10)*.55);break;}
   case 24:{const dx=Math.abs(fract(u*16)-.5),dy=Math.abs(fract(v*5)-.5);field=dx+dy<.46?.55:.03;ink=ridge(dx+dy-.46,.025);break;}
   case 0:field=.08;ink=Math.max(ridge(Math.sin(a*34+Math.sin(b*6)*3),.16),ridge(Math.sin(a*34-Math.sin(b*6)*3),.16))*.85;break;
   case 1:{const r=Math.hypot(fract(u*7)-.5,(fract(v*3)-.5)*.65);field=.45+.22*Math.sin(r*170);ink=ridge(Math.sin(r*170),.16);break;}
   case 2:{const cell=hash(Math.floor(u*30),Math.floor(v*9));field=.3+.4*cell+.16*Math.sin(a*3+b*2);ink=ridge(Math.sin(a*9+b*3+flow),.12)*.36;break;}
   case 3:{const dx=fract(u*13)-.5,dy=(fract(v*5)-.5)*.7;field=.16+.1*flow;ink=Math.max(ridge(dx,.015)*ridge(dy,.16),ridge(dy,.015)*ridge(dx,.13),ridge(v-.15,.006),ridge(v-.85,.006));break;}
   case 4:{const f=Math.sin(a*5+b*3+Math.sin(b*4)*1.8)+.24*Math.sin(a*17-b*7);field=clamp(f*3)*.68;ink=ridge(f,.075);break;}
   case 5:{const scroll=Math.sin(a*9+Math.sin(b*3)*3)+Math.cos(b*8-a*2)*.5;field=.2+.6*clamp(flow*.5+.2);ink=ridge(scroll,.16);break;}
   case 6:{const xx=fract(u*22),yy=fract(v*7);field=.15+.5*hash(Math.floor(u*22)+(xx>yy?1:0),Math.floor(v*7));ink=ridge(xx-yy,.025)*.5;break;}
   case 7:field=.22+.24*Math.sin(b*17+Math.sin(a*4)*2+Math.sin(a*11)*.6);ink=Math.max(ridge(Math.sin(b*17+Math.sin(a*4)*2),.08)*.5,ridge(v-.24,.003),ridge(v-.76,.003));break;
   case 8:{const dx=fract(u*19)-.5,dy=fract(v*4)-.5;field=.2+.1*flow;ink=Math.max(ridge(dx,.026)*clamp(.4-Math.abs(dy))*3,ridge(dy-dx*.7,.025)*clamp(.28-Math.abs(dx))*3);break;}
   case 9:{const dx=fract(u*6)-.5,dy=(v-.5)*.6,r=Math.hypot(dx,dy);field=.08;ink=ridge(r-.22,.024)*(.25+.75*clamp(dx*4+.5));break;}
   case 10:{const stem=.5+.16*Math.sin(a*4);field=.4+.1*flow;const roots=ridge(v-stem,.014);const dx=fract(u*11)-.5,dy=(v-stem)*3,r=Math.hypot(dx,dy);ink=Math.max(roots*.6,ridge(r-(.16+.035*Math.cos(Math.atan2(dy,dx)*5)),.035));break;}
   case 11:{const dx=fract(u*10)-.5,dy=fract(v*3)-.5;field=.14;ink=Math.max(ridge(Math.abs(dx)+Math.abs(dy)-.35,.025),ridge(dx,.02)*clamp(.3-Math.abs(dy))*4);break;}
   case 12:{const stream=Math.sin(a*8+b*3+Math.sin(b*4)*1.5);field=.3+.3*flow;ink=ridge(stream,.28);break;}
   case 13:{const dx=fract(u*12+v*3),dy=fract(v*5);field=hash(Math.floor(u*12+v*3),Math.floor(v*5))*.75;ink=Math.max(ridge(dx,.025),ridge(dy,.025),ridge(dx-dy,.02));break;}
   case 14:{const shaft=v-.5-.1*Math.sin(a*4);field=.12+.1*flow;ink=Math.max(ridge(shaft,.012),ridge(Math.sin(a*21+Math.abs(shaft)*55),.2)*clamp(1-Math.abs(shaft)*3.7));break;}
   case 15:{const r=Math.hypot((u-.53)*1.3,(v-.5)*.65);field=.2+.12*Math.sin(r*70);ink=ridge(Math.sin(r*85+Math.atan2(v-.5,u-.53)*2),.12)*clamp(r*3);break;}
   case 16:{const angle=Math.atan2(v-.5,(u-.1)*2);field=.4+.15*flow;ink=ridge(Math.sin(angle*28),.15)*.7+ridge(Math.hypot((u-.1)*2,v-.5)-.19,.025);break;}
   case 17:{const dx=fract(u*9)-.5,dy=fract(v*3)-.5;field=.3+.3*hash(Math.floor(u*9),Math.floor(v*3));ink=Math.max(ridge(dx,.025),ridge(dy-dx*.7,.025),ridge(dy+dx*.7,.025))*clamp(.5-Math.hypot(dx,dy))*2;break;}
   case 18:{const bolt=.5+.14*Math.sin(a*9)+.08*Math.sin(a*25);field=.17+.08*flow;ink=Math.max(ridge(v-bolt,.015),ridge(v-bolt-.18*Math.sin(a*17),.006)*.5);break;}
   case 19:{const lava=Math.sin(a*8+b*5+Math.sin(b*4)*1.4);field=.06+.15*hash(Math.floor(x/5),Math.floor(y/5));ink=ridge(lava,.2);break;}
   case 20:{const wave=Math.sin(a*6+b*3+flow);field=.3+.25*wave;ink=ridge(wave,.16)*.6+ridge(Math.sin(a*3-b*5),.09)*.4;break;}
   case 21:{const stream=b*8+Math.sin(a*2)*2+Math.sin(a*5)*.4;field=.35+.15*Math.sin(stream);ink=ridge(Math.sin(stream),.085);break;}
   case 22:{const f=Math.sin(a*9+b*4)+.4*Math.sin(a*23-b*7);field=.45+.12*flow;ink=ridge(f,.095);break;}
   case 23:{const cloud=Math.sin(a*3+b*2+flow)*Math.sin(b*4-a*2);field=.2+clamp(cloud)*.65;const cell=hash(Math.floor(x/6),Math.floor(y/6));ink=cell>.98?ridge(fract(x/6)-.5,.13)*ridge(fract(y/6)-.5,.13):ridge(Math.sin(a*5+b*2),.025)*.18;break;}
  }
  ink=clamp(ink);relief=(finish.pattern===19?-1:1)*ink;
  const base=mix(mix(c[0],c[1],field),c[2],ink),at=(y*w+x)*4,micro=(grain-.5)*.025+(n-.5)*.018;
  for(let k=0;k<3;k++){buffers[0][at+k]=clamp(base[k]*(.985+micro),0,255);buffers[1][at+k]=128+relief*20+(n-.5)*2;buffers[3][at+k]=c[2][k]*ink;}
  buffers[2][at]=255;buffers[2][at+1]=clamp((spec.rough+micro-ink*.08)*255,32,200);buffers[2][at+2]=clamp((spec.metal+(1-spec.metal)*ink*.85)*255,0,255);
  for(const data of buffers)data[at+3]=255;
 }
 const textures=buffers.map((data,i)=>{const t=new THREE.DataTexture(data,w,h);t.name=finish.name+' premium '+['colour','relief','surface','effect mask'][i];t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;});
 textures[0].colorSpace=textures[3].colorSpace=THREE.SRGBColorSpace;
 return{map:textures[0],bump:textures[1],roughness:textures[2],emissive:textures[3],textures};
}
