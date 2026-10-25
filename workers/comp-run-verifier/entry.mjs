import {verifyRaceReplay} from './game/race-verifier.js';
const maps=new Set(['sanctuary','hollow','undertow','playdate','small-hours','final-curtain','last-bloom','rupture','uncrowned','last-draft','rep-orca','on-the-menu','higher-ground']);
export default {async fetch(request){
 const courseId=request.headers.get('X-Course'),mode=request.headers.get('X-Mode'),rules=request.headers.get('X-Rules'),expectedTick=Number(request.headers.get('X-Ticks'));
 if(request.method!=='POST'||!maps.has(courseId)||!['normal','nightmare'].includes(mode)||!['race','one-life'].includes(rules)||!Number.isSafeInteger(expectedTick)||expectedTick<1||expectedTick>216000)return new Response('Invalid replay',{status:400});
 const chunks=[];let total=0;const reader=request.body?.getReader();if(!reader)return new Response('Missing replay',{status:400});
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>2376000){await reader.cancel();return new Response('Replay too large',{status:413});}chunks.push(value);}
 if(total!==expectedTick*11)return new Response('Incomplete replay',{status:400});
 const bytes=new Uint8Array(total);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
 try{return Response.json(verifyRaceReplay({courseId,mode,rules,expectedTick,bytes}));}catch{return Response.json({verified:false,reason:'Replay could not be verified'});}
}};
