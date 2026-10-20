const STUN = [{urls:'stun:stun.cloudflare.com:3478'}];
const cache = new WeakMap();

// Called only after the hub has verified room membership, device and allowance.
// Credentials stay out of persisted room snapshots, logs and the public status API.
export async function voiceIce(env, room, member, now=Date.now()) {
  if(env.TURN_ENABLED!=='true'||!env.TURN_KEY_ID||!env.TURN_KEY_API_TOKEN)
    return {iceServers:STUN,turn:false};
  const previous=cache.get(member);
  if(previous?.until>now&&previous.client===member.client&&previous.key===env.TURN_KEY_ID)return previous.result;
  try {
    // Cloudflare recommends credentials covering the maximum call duration.
    // This call already has a fixed eight-hour expiry; reconnects cannot extend it.
    const ttl=Math.max(1,Math.min(28800,Math.ceil((room.expires-now)/1000)));
    const response=await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`,{
      method:'POST',headers:{Authorization:'Bearer '+env.TURN_KEY_API_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify({ttl}),signal:AbortSignal.timeout(4000)
    });
    if(!response.ok)throw Error('TURN unavailable');
    const data=await response.json(),relays=[];
    for(const server of Array.isArray(data.iceServers)?data.iceServers:[]){
      const urls=(Array.isArray(server.urls)?server.urls:[server.urls]).filter(url=>typeof url==='string'&&/^turns?:turn\.cloudflare\.com:(3478|443|5349|80)\?transport=(udp|tcp)$/.test(url));
      if(urls.length&&typeof server.username==='string'&&server.username.length>0&&server.username.length<=2048&&typeof server.credential==='string'&&server.credential.length>0&&server.credential.length<=2048)
        relays.push({urls,username:server.username,credential:server.credential});
    }
    if(!relays.length)throw Error('No TURN endpoints');
    const result={iceServers:[...STUN,...relays],turn:true,expiresAt:now+ttl*1000};
    cache.set(member,{client:member.client,key:env.TURN_KEY_ID,until:result.expiresAt-60000,result});
    return result;
  }catch{
    // A relay provisioning outage must not prevent a working direct SFU call.
    const result={iceServers:STUN,turn:false};
    cache.set(member,{client:member.client,key:env.TURN_KEY_ID,until:now+30000,result});
    console.warn(JSON.stringify({event:'voice-turn-unavailable'}));
    return result;
  }
}
