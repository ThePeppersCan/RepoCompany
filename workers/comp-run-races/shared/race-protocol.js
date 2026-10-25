// Exact, compact input frames. No position, speed or finish time is trusted.
export const RACE_PROTOCOL=3,TICK_RATE=120,TICK_SECONDS=1/TICK_RATE,FRAME_BYTES=11,MAX_RACE_TICKS=30*60*TICK_RATE;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function normalizeRaceInput(input){return{...input,moveX:Math.sign(Number(input.moveX)||0),moveZ:Math.sign(Number(input.moveZ)||0),yaw:Math.fround(Math.atan2(Math.sin(input.yaw||0),Math.cos(input.yaw||0))),pitch:Math.fround(clamp(Number(input.pitch)||0,-1.45,1.45)),sprint:!!input.sprint,crouch:!!input.crouch,crouchOnly:false};}
export function encodeRaceFrame(input,previous={}){
 const f=normalizeRaceInput(input),bytes=new Uint8Array(FRAME_BYTES),view=new DataView(bytes.buffer);view.setFloat32(0,f.yaw,true);view.setFloat32(4,f.pitch,true);view.setInt8(8,f.moveX);view.setInt8(9,f.moveZ);
 bytes[10]=(f.sprint?1:0)|(f.crouch?2:0)|(f.jumpSeq>(previous.jumpSeq||0)?4:0)|(f.slideSeq>(previous.slideSeq||0)?8:0)|(f.interactSeq>(previous.interactSeq||0)?16:0)|(f.jumpHeld?32:0)|(f.interactHeld?64:0)|(f.restart?128:0);
 for(const k of['jumpSeq','slideSeq','interactSeq'])previous[k]=f[k]||0;return bytes;
}
export function decodeRaceFrame(bytes,offset,sequences){
 if(offset<0||offset+FRAME_BYTES>bytes.length)throw Error('Incomplete input frame');const v=new DataView(bytes.buffer,bytes.byteOffset+offset,FRAME_BYTES),yaw=v.getFloat32(0,true),pitch=v.getFloat32(4,true),moveX=v.getInt8(8),moveZ=v.getInt8(9),flags=v.getUint8(10);
 if(!Number.isFinite(yaw)||!Number.isFinite(pitch)||Math.abs(yaw)>Math.PI+.000001||Math.abs(pitch)>1.450001||Math.abs(moveX)>1||Math.abs(moveZ)>1)throw Error('Invalid input frame');
 for(const[k,bit]of[['jumpSeq',4],['slideSeq',8],['interactSeq',16]])if(flags&bit)sequences[k]=(sequences[k]||0)+1;
 return{yaw,pitch,moveX,moveZ,sprint:!!(flags&1),crouch:!!(flags&2),crouchOnly:false,...sequences,jumpHeld:!!(flags&32),interactHeld:!!(flags&64),restart:!!(flags&128)};
}
export function bytesToBase64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);}
export function base64ToBytes(s){if(typeof s!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid input encoding');return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
export class RaceClock{
 constructor(){this.samples=[];this.anchor=null;this.rtt=null;}
 sample(sent,received,serverTime){const rtt=received-sent;if(![sent,received,serverTime].every(Number.isFinite)||rtt<0||rtt>3000)return false;const sample={rtt,offset:serverTime-(sent+received)/2};this.samples.push(sample);if(this.samples.length>12)this.samples.shift();const best=[...this.samples].sort((a,b)=>a.rtt-b.rtt).slice(0,3),offset=best.reduce((a,b)=>a+b.offset,0)/best.length;this.anchor={local:received,server:received+offset};this.rtt=Math.round(best[0].rtt);return true;}
 now(monotonic){return this.anchor?this.anchor.server+monotonic-this.anchor.local:null;}
 get ready(){return this.samples.length>=3;}
}
export class PeerTimeline{
 constructor(){this.frames=[];this.jitter=0;this.lastArrival=null;this.lastStamp=null;}
 reset(){this.frames=[];this.lastArrival=this.lastStamp=null;this.jitter=0;}
 push(stamp,pose,arrival){if(!Number.isFinite(stamp)||!Array.isArray(pose)||pose.length!==7||!pose.every(Number.isFinite)||this.lastStamp!==null&&stamp<=this.lastStamp)return false;if(this.lastArrival!==null){const delta=Math.abs(arrival-this.lastArrival-(stamp-this.lastStamp));this.jitter+=.12*(Math.min(150,delta)-this.jitter);}if(this.frames.length&&Math.hypot(pose[0]-this.frames.at(-1).pose[0],pose[1]-this.frames.at(-1).pose[1],pose[2]-this.frames.at(-1).pose[2])>18)this.frames=[];this.frames.push({stamp,pose:[...pose]});if(this.frames.length>24)this.frames.shift();this.lastArrival=arrival;this.lastStamp=stamp;return true;}
 sample(serverNow){if(!this.frames.length)return null;const t=serverNow-clamp(80+this.jitter*2,80,180),first=this.frames[0],last=this.frames.at(-1);if(t<=first.stamp)return[...first.pose];for(let i=1;i<this.frames.length;i++){const a=this.frames[i-1],b=this.frames[i];if(t<=b.stamp){const f=(t-a.stamp)/(b.stamp-a.stamp),out=a.pose.map((v,j)=>v+(b.pose[j]-v)*f);out[3]=a.pose[3]+Math.atan2(Math.sin(b.pose[3]-a.pose[3]),Math.cos(b.pose[3]-a.pose[3]))*f;out[6]=f<.5?a.pose[6]:b.pose[6];return out;}}
  const out=[...last.pose],prev=this.frames.at(-2);if(prev){const extra=Math.min(70,Math.max(0,t-last.stamp)),span=Math.max(1,last.stamp-prev.stamp);for(let i=0;i<3;i++)out[i]+=clamp((last.pose[i]-prev.pose[i])/span,-.06,.06)*extra;}return out;
 }
}
