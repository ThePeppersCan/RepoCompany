// This is a deliberately conservative traffic allowance, not a Cloudflare invoice
// meter. Every possible delivered audio stream is charged at 1 Mbit/s (including
// muted/connecting peers), well above the client's 64 kbit/s Opus target.
export const LIMIT = 800_000_000_000;
export const BYTES_PER_SECOND = 125_000;
// Screens target 2 Mbit/s. Reserve 10 Mbit/s per viewer, including failed or
// retiring receiver sessions, to cover retransmission and protocol overhead.
export const SCREEN_BYTES_PER_SECOND = 1_250_000;
export const RESERVE_SECONDS = 120;
const DAY = 86400000;
function start(year, index, day) {
  return Date.UTC(year,index,Math.min(day,new Date(Date.UTC(year,index+1,0)).getUTCDate()));
}
function periodStart(now, day = 1) {
  const d=new Date(now), y=d.getUTCFullYear(), m=d.getUTCMonth();
  const current=start(y,m,day);return current>now?start(y,m-1,day):current;
}
export const month = (now, day = 1) => new Date(periodStart(now,day)).toISOString().slice(0, 7);
export function nextMonth(now, day = 1) {
  const d = new Date(periodStart(now,day));
  return start(d.getUTCFullYear(),d.getUTCMonth()+1,day);
}
export function flows(rooms) {
  return rooms.reduce((sum, room) => {
    // Keep retired sessions in the budget until upstream closure is confirmed.
    const n = Object.values(room.members).filter(m => m.client || m.pub || m.recv).length;
    return sum + n * Math.max(0, n - 1);
  }, 0);
}
export const screenFlows=rooms=>rooms.reduce((sum,room)=>sum+Object.values(room.members).filter(m=>m.screenRecv).length,0);
export const byteRate=rooms=>flows(rooms)*BYTES_PER_SECOND+screenFlows(rooms)*SCREEN_BYTES_PER_SECOND;
export function settle(state, now) {
  if (now <= state.at) return;
  state.daily ||= {};
  const rate = byteRate(state.rooms);
  let cursor = state.at;
  while (cursor < now) {
    const bucket=Math.floor(cursor/DAY),end = Math.min(now, nextMonth(cursor,state.billingDay), (bucket+1)*DAY);
    const key = month(cursor,state.billingDay),bytes=(end-cursor)/1000*rate;
    state.usage[key] = (state.usage[key] || 0) + bytes;
    if(bytes)state.daily[bucket]=(state.daily[bucket]||0)+bytes;
    cursor = end;
  }
  state.at = now;
  // Never discard the current period during a restart/deployment.
  for (const key of Object.keys(state.usage).sort().slice(0, -14)) delete state.usage[key];
  for (const key of Object.keys(state.daily)) if(Number(key)<Math.floor(now/DAY)-32)delete state.daily[key];
}
export function rollingUsage(state,now){return Object.entries(state.daily||{}).reduce((sum,[day,bytes])=>sum+(Number(day)>=Math.floor(now/DAY)-32?bytes:0),0);}
export function monthlyBudget(state,now,additionalFlows=0,additionalScreens=0){return state.stopped!==month(now,state.billingDay)&&(state.usage[month(now,state.billingDay)]||0)+(byteRate(state.rooms)+additionalFlows*BYTES_PER_SECOND+additionalScreens*SCREEN_BYTES_PER_SECOND)*RESERVE_SECONDS<LIMIT;}
export function hasBudget(state, now, additionalFlows = 0, additionalScreens = 0) {
  return monthlyBudget(state,now,additionalFlows,additionalScreens) && rollingUsage(state,now)+(byteRate(state.rooms)+additionalFlows*BYTES_PER_SECOND+additionalScreens*SCREEN_BYTES_PER_SECOND)*RESERVE_SECONDS<LIMIT;
}
export function audioDescription(value, type, maximum = 8) {
  if (!value || value.type !== type || typeof value.sdp !== 'string' || value.sdp.length > 48000 || !value.sdp.startsWith('v=0')) throw new Error('Invalid audio connection.');
  const sections = value.sdp.split(/\r?\nm=/).slice(1);
  if (!sections.length || sections.length > maximum || sections.some(s => !s.startsWith('audio ') || !/a=rtpmap:\d+ opus\/48000/i.test(s))) throw new Error('Only Opus voice is supported.');
  if (/a=simulcast:|a=rid:/i.test(value.sdp)) throw new Error('Only one microphone stream is supported.');
  return {type, sdp:value.sdp};
}
