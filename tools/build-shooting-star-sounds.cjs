// Original, deterministic shooting-star cues: a falling shimmer and a soft starburst.
// Rendered once as PCM so playback uses the game's existing voice/mute/volume limits.
const fs=require('node:fs'),path=require('node:path');
const rate=32000,tau=Math.PI*2;
function render(kind,seconds){
 const samples=new Float64Array(Math.ceil(rate*seconds));let seed=7419,low=0,phase=0;
 for(let i=0;i<samples.length;i++){
  const t=i/rate,u=t/seconds;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const noise=seed/2147483648-1;low+=.12*(noise-low);
  const edge=Math.min(1,t/.018)*Math.min(1,(seconds-t)/.09);
  if(kind==='cast'){
   const envelope=Math.sin(Math.PI*u)**1.3;
   phase+=tau*(1250*Math.exp(-2.9*u)+210)/rate;
   samples[i]=edge*envelope*(.15*(noise-low)+.26*Math.sin(phase)+.08*Math.sin(phase*2.003));
  }else{
   phase+=tau*(115*Math.exp(-12*t)+52)/rate;
   let sparkle=0;
   for(const [j,f]of [1174.66,1567.98,2349.32].entries()){
    const q=t-j*.028;
    if(q>=0)sparkle+=.07*Math.sin(tau*f*q)*Math.min(1,q/.008)*Math.exp(-q*8);
   }
   samples[i]=edge*(.35*Math.sin(phase)*Math.exp(-t*15)+.19*low*Math.exp(-t*18)+sparkle);
  }
 }
 const peak=Math.max(...samples.map(Math.abs)),pcm=Buffer.alloc(samples.length*2);
 for(let i=0;i<samples.length;i++)pcm.writeInt16LE(Math.round(samples[i]/peak*.48*32767),i*2);
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 const out=path.join(__dirname,'../game-integrations/morogue/shooting-star-'+kind+'.wav');fs.writeFileSync(out,Buffer.concat([header,pcm]));console.log(path.basename(out),seconds+'s');
}
render('cast',.64);render('impact',.7);
