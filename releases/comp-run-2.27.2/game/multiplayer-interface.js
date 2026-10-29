const node=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export function partyState(airport,id){
 const party=airport?.party,leader=party?.leader===id,ready=party?.ready.includes(id)||false;
 const count=party?.members.length||0,readyCount=party?.members.filter(p=>party.ready.includes(p)).length||0;
 return {party,leader,ready,count,readyCount,canDepart:!!party&&leader&&!party.preparing&&count>0&&count===readyCount,
  status:!party?'Not in a party':party.preparing?'In race':leader?'Party leader':'Party member',
  note:!party?'Create a party to choose a race, or accept an invitation.':party.preparing?'Your party is boarding.':!leader?'Your party leader chooses the race and starts boarding.':count===readyCount?'Everyone is ready. You can start the race.':`Waiting for ${count-readyCount} ${count-readyCount===1?'runner':'runners'} to get ready.`};
}
export function raceStandings({room,id,progress=0,total=0,peers=new Map(),now=0}){
 const results=new Map((room?.results||[]).map(r=>[r.id,r]));
 return (room?.players||[]).map((p,index)=>{
  const result=results.get(p.id),sample=peers.get(p.id),self=p.id===id;
  const ratio=clamp((self?progress:sample?.progress||0)/Math.max(1,total));
  const stale=!self&&room.state==='racing'&&(!sample||now-sample.at>3000);
  const done=result?.verified===true,checking=!result&&p.finished,out=!!result&&!done;
  return {id:p.id,name:p.name,self,index,progress:done||checking?1:ratio,time:done?result.time:null,
   status:done?'FINISHED':out?'OUT':checking?'VERIFYING':room.state==='loading'?(p.ready?'READY':p.joined===false?'JOINING':'LOADING'):stale?'—':`${Math.floor(ratio*100)}%`,
   group:done?0:checking?1:out?3:2,stale};
 }).sort((a,b)=>a.group-b.group||(a.group===0?a.time-b.time:b.progress-a.progress)||a.index-b.index).map((r,i)=>({...r,place:i+1}));
}
// Keep the leader and the local runner in view without covering the course.
export function compactStandings(rows,id,limit=5){
 if(rows.length<=limit)return rows;
 const mine=rows.findIndex(r=>r.id===id);if(mine<limit)return rows.slice(0,limit);
 const start=Math.min(rows.length-(limit-1),Math.max(1,mine-1));return [rows[0],...rows.slice(start,start+limit-1)];
}
export function createMultiplayerInterface(courses){
 const panel=node('section','','overlay hidden');panel.id='multiplayer';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Party and race');
 panel.innerHTML=`<div class="dialog party-dialog">
 <header class="party-header"><div><img class="party-brand" src="./assets/comp-run-logo.png" alt="COMP-RUN"><h2 data-ui="title">Joining multiplayer</h2></div><button data-action="close" class="party-close" aria-label="Close party menu">×</button></header>
 <p data-ui="message" class="party-message" role="status" aria-live="polite"></p>
 <div data-ui="connect"><p data-ui="connect-note">Finding a public lobby.</p><div data-ui="joining" class="party-loading" aria-label="Joining lobby"></div><button data-action="public" class="primary">TRY AGAIN</button><button data-action="account" class="secondary">CONNECT ACCOUNT</button></div>
 <div data-ui="airport" class="hidden"><div class="party-meta"><span data-ui="airport-status"></span><span data-ui="party-role"></span></div>
 <div data-ui="invites" class="party-invites"></div>
 <div class="party-columns"><div class="party-roster"><div class="party-section-heading"><h3>RUNNERS</h3><span data-ui="party-count"></span></div><ol data-ui="members" class="party-members"></ol><p data-ui="party-note" class="party-note"></p><button data-action="party-create" class="primary">CREATE PARTY</button><button data-action="party-leave" class="text-button">LEAVE PARTY</button>
 <div class="party-nearby"><button data-action="invite-options" class="party-change">INVITE RUNNERS <span data-ui="nearby-count"></span><span>＋</span></button><ul data-ui="nearby" class="party-members hidden"></ul></div></div>
 <div class="party-flight"><div class="party-section-heading"><h3>NEXT RACE</h3><span data-ui="ready-count"></span></div><div data-ui="solo-flight"><p>Create or join a party to choose where you race.</p></div><div data-ui="party" class="hidden">
 <h3 data-ui="destination" class="party-destination"></h3><p data-ui="race-summary" class="party-race-summary"></p><button data-action="race-options" class="party-change">CHANGE RACE <span>→</span></button><div data-ui="race-options" class="party-race-options hidden"><label>Destination<select data-ui="map"></select></label><div class="party-rules"><label>Difficulty<select data-ui="mode"><option value="normal">Normal</option><option value="nightmare">Nightmare</option></select></label><label>Rules<select data-ui="rules"><option value="race">Race</option><option value="one-life">One life</option></select></label></div><p data-ui="rules-note" class="party-note"></p></div><button data-action="ready" class="primary">READY UP</button><button data-action="depart" class="secondary">START RACE</button><p data-ui="boarding-note" class="party-note"></p>
 </div></div></div><button data-action="explore" class="party-return">← BACK TO LOBBY</button></div>
 <div data-ui="results" class="hidden"><p data-ui="race-status"></p><ol data-ui="standings" class="party-members"></ol><p data-ui="group-note" class="party-note"></p><div class="party-group-actions"><button data-action="restart" class="secondary">RESTART TOGETHER</button><button data-action="return" class="primary">RETURN TOGETHER</button></div></div>
 <footer class="party-footer"><button data-action="private-options">PLAY WITH FRIENDS</button><button data-action="loadout-options">LOADOUT</button><button data-action="leave" class="hidden">LEAVE MULTIPLAYER</button></footer>
 <div data-ui="private-options" class="party-extra hidden"><h3>Play with friends</h3><p data-ui="private-note"></p><button data-action="copy-code" class="secondary hidden">COPY LOBBY CODE</button><button data-action="private" class="secondary">CREATE PRIVATE LOBBY</button><form data-ui="join-form" class="party-join"><input data-ui="code" maxlength="8" autocomplete="off" placeholder="LOBBY CODE" aria-label="Private lobby code"><button data-action="join" type="submit" class="secondary">JOIN</button></form></div>
 <div data-ui="loadout-options" class="party-extra hidden"><h3>Your loadout</h3><p data-ui="loadout"></p><div class="party-rules"><button data-action="runner" class="secondary">CHANGE RUNNER</button><button data-action="knife" class="secondary">CHANGE KNIFE</button></div></div>
 </div>`;
 const chip=node('button','','party-chip hidden');chip.type='button';chip.setAttribute('aria-label','Open party and race menu');chip.innerHTML='<span class="party-chip-label"></span><strong></strong><span class="party-chip-detail"></span>';
 const hud=node('aside','','race-standings hidden');hud.setAttribute('aria-label','Current race standings');hud.innerHTML='<div class="race-standing-heading"><span>RACE</span><span data-race-count></span></div><ol></ol>';
 document.body.append(panel,chip,hud);
 const $=s=>panel.querySelector(`[data-ui="${s}"]`),button=s=>panel.querySelector(`[data-action="${s}"]`),show=(s,v)=>$(s).classList.toggle('hidden',!v);
 for(const c of courses){const option=node('option',c.title);option.value=c.id;$('map').append(option);}
 button('race-options').onclick=()=>{const visible=$('race-options').classList.contains('hidden');show('race-options',visible);button('race-options').setAttribute('aria-expanded',String(visible));};
 button('invite-options').onclick=()=>{const visible=$('nearby').classList.contains('hidden');show('nearby',visible);button('invite-options').setAttribute('aria-expanded',String(visible));};
 for(const key of ['private-options','loadout-options'])button(key).onclick=()=>{const visible=$(key).classList.contains('hidden');show(key,visible);button(key).setAttribute('aria-expanded',String(visible));show(key==='private-options'?'loadout-options':'private-options',false);};
 const memberRows=new Map(),raceRows=new Map();let rosterKey='',inviteKey='',nearbyKey='';
 function render({airport,room,id,busy,pending,connected,loadout,nearby=[],now=Date.now(),onCommand}){
  const state=partyState(airport,id),party=state.party,joined=!!airport||!!room;
  show('connect',!joined);show('airport',!!airport&&!room);show('results',!!room);show('joining',busy);
  $('title').textContent=room?'Race room':airport?'Party':busy?'Joining multiplayer':connected?'Connection interrupted':'Join multiplayer';
  $('connect-note').textContent=busy?'Finding a public lobby.':connected?'Reconnect to enter the lobby.':'Connect your Repo Company account to join the lobby.';
  button('public').classList.toggle('hidden',busy||!connected);button('account').classList.toggle('hidden',connected);
  button('leave').classList.toggle('hidden',!joined);$('loadout').textContent=loadout;
  button('copy-code').classList.toggle('hidden',!airport?.code);$('private-note').textContent=airport?.code?`LOBBY CODE  ${airport.code} · Share this with your friends.`:joined?'Leave this session before switching to a private lobby.':'Create a lobby for friends, or join with their code.';
  for(const action of ['public','private','join'])button(action).disabled=busy||joined;
  button('private-options').classList.toggle('hidden',!!room);button('loadout-options').classList.toggle('hidden',joined);
  // Changing cosmetics currently leaves the 3D scene; keep it outside an active session.
  for(const action of ['runner','knife'])button(action).disabled=joined||busy;
  chip.classList.toggle('hidden',!airport||!!room||!panel.classList.contains('hidden'));
  if(airport){
   const invites=(airport.invites||[]).filter(i=>!i.expires||i.expires>now);
   chip.querySelector('.party-chip-label').textContent=invites.length?`${invites.length} PARTY INVITATION${invites.length===1?'':'S'}`:party?'YOUR PARTY':'MULTIPLAYER';
   chip.querySelector('strong').textContent=party?`${state.count} / 8 · ${state.status.toUpperCase()}`:'SOLO · NOT IN A PARTY';
   chip.querySelector('.party-chip-detail').textContent=party?party.members.map(pid=>{const p=airport.players.find(p=>p.id===pid);return (p?.name||'Runner')+' · '+(p?.connected===false?'RECONNECTING':party.ready.includes(pid)?'READY':'EXPLORING');}).join('  /  '):'P / PARTY & RACE';chip.dataset.party=String(!!party);
   $('airport-status').textContent=`${airport.privateRoom?'PRIVATE LOBBY':'PUBLIC LOBBY'} · ${airport.players.length} / ${airport.capacity||12}`;
   $('party-role').textContent=state.status.toUpperCase();$('party-count').textContent=party?`${state.count} / 8`:'SOLO';$('party-note').textContent=!party?'You are not in a party.':state.leader?'':`Leader · ${airport.players.find(p=>p.id===party.leader)?.name||'Runner'}`;
   $('ready-count').textContent=party?`${state.readyCount} / ${state.count} READY`:'';button('race-options').classList.toggle('hidden',!state.leader);if(!state.leader)show('race-options',false);show('party',!!party);show('solo-flight',!party);
   button('party-create').classList.toggle('hidden',!!party);button('party-leave').classList.toggle('hidden',!party);
   const members=party?.members||[id],key=members.join('|');if(key!==rosterKey){rosterKey=key;memberRows.clear();$('members').replaceChildren();for(const pid of members){const row=node('li','','party-member');row.innerHTML='<span class="party-member-name"></span><span class="party-member-role"></span><span class="party-member-state"></span>';memberRows.set(pid,row);$('members').append(row);}}
   for(const pid of members){const p=airport.players.find(p=>p.id===pid),row=memberRows.get(pid),ready=party?.ready.includes(pid);row.querySelector('.party-member-name').textContent=(p?.name||'Runner')+(pid===id?' · YOU':'');row.querySelector('.party-member-role').textContent=pid===party?.leader?'LEADER':party?'MEMBER':'NO PARTY';row.querySelector('.party-member-state').textContent=p?.connected===false?'RECONNECTING':p?.phase&&p.phase!=='lobby'?p.phase.toUpperCase():ready?'READY':party?'EXPLORING':'—';row.dataset.ready=String(!!ready);}
   const ik=invites.map(i=>i.id).join('|')+':'+!!party;if(ik!==inviteKey){inviteKey=ik;$('invites').replaceChildren();for(const invite of invites){const row=node('div','','party-invitation'),copy=node('span',(airport.players.find(p=>p.id===invite.from)?.name||'A runner')+' invited you'),accept=node('button',party?'LEAVE PARTY TO JOIN':'ACCEPT','secondary'),decline=node('button','DECLINE','text-button');accept.disabled=!!party;accept.onclick=()=>onCommand({type:'accept',invite:invite.id});decline.onclick=()=>onCommand({type:'decline',invite:invite.id});row.append(copy,accept,decline);$('invites').append(row);}}
   const available=nearby.filter(p=>!members.includes(p.id)),nk=JSON.stringify(available.map(p=>[p.id,p.near,p.invited,p.name,p.phase,p.connected]))+':'+!!pending+':'+state.leader+':'+state.count;
   if(nk!==nearbyKey){nearbyKey=nk;$('nearby').replaceChildren();for(const p of available){const row=node('li','','party-nearby-row'),name=node('span',p.name),invite=node('button',p.invited?'INVITED':p.connected===false?'RECONNECTING':p.phase&&p.phase!=='lobby'?'IN RACE':'INVITE','text-button');invite.disabled=!!pending||p.invited||p.connected===false||!!p.phase&&p.phase!=="lobby"||!!party?.preparing||!!party&&!state.leader||state.count>=8;invite.onclick=()=>onCommand({type:'invite',target:p.id});row.append(name,invite);$('nearby').append(row);}if(!available.length)$('nearby').append(node('li','No other runners in this lobby. Share your lobby code to bring a friend.','party-empty'));}
   $('nearby-count').textContent=String(available.length);
   if(party){$('destination').textContent=courses.find(c=>c.id===party.course)?.title||party.course;$('race-summary').textContent=(party.rules==='race'?'RACE':'ONE LIFE')+' / '+(party.mode==='nightmare'?'NIGHTMARE':'NORMAL');for(const [key,value]of Object.entries({map:party.course,mode:party.mode,rules:party.rules})){$(key).value=value;$(key).disabled=!state.leader||party.preparing||!!pending;}
    $('rules-note').textContent=party.rules==='race'?'No pursuer. Restart and keep racing.':'One life. Stay ahead of the pursuer.';
    button('ready').textContent=pending==='party-ready'?'UPDATING…':state.ready?'READY ✓ · CANCEL':'READY UP';button('ready').setAttribute('aria-pressed',String(state.ready));button('ready').disabled=party.preparing||!!pending;
    button('depart').textContent=party.preparing?'BOARDING…':'START RACE';button('depart').classList.toggle('hidden',!state.leader||!state.canDepart&&!party.preparing);button('depart').classList.toggle('primary',state.canDepart);button('depart').classList.toggle('secondary',!state.canDepart);button('ready').classList.toggle('primary',!state.ready);button('ready').classList.toggle('secondary',state.ready);button('depart').disabled=!state.canDepart||!!pending;$('boarding-note').textContent=party.preparing?'BOARDING…':state.canDepart?'':!state.leader&&state.count===state.readyCount?'Waiting for the party leader.':'Waiting for '+party.members.filter(p=>!party.ready.includes(p)).map(pid=>airport.players.find(p=>p.id===pid)?.name||'Runner').join(', ');
   }
   for(const action of ['party-create','party-leave'])button(action).disabled=!!pending||!!party?.preparing;
  }
  if(room){$('race-status').textContent=room.state==='loading'?'Waiting for every runner to load.':room.state==='results'?'Final results':'Race in progress';$('standings').replaceChildren();for(const row of raceStandings({room,id})){const li=node('li','','party-result-row');li.append(node('span',row.name+(row.self?' · YOU':'')),node('span',row.time!==null?row.time.toFixed(3)+'s':row.status));$('standings').append(li);}$('group-note').textContent=state.leader?'You lead the party. Restart this map or bring everyone back to the same lobby.':'Your leader chooses when to restart or return. You stay in the party.';for(const action of ['return','restart']){button(action).disabled=!state.leader||!!pending||!party?.activeFlight;button(action).classList.toggle('hidden',!state.leader);}button('restart').textContent=pending==='party-restart'?'RESTARTING…':'RESTART TOGETHER';button('return').textContent=pending==='party-return'?'RETURNING…':'RETURN TOGETHER';}
 }
 function standings(rows,id){
  const visible=compactStandings(rows,id),keep=new Set(visible.map(r=>r.id)),list=hud.querySelector('ol');
  for(const [pid,row]of raceRows)if(!keep.has(pid)){row.remove();raceRows.delete(pid);}
  for(const r of visible){let row=raceRows.get(r.id);if(!row){row=node('li','','race-standing-row');row.innerHTML='<span class="race-place"></span><span class="race-name"></span><span class="race-distance"></span>';raceRows.set(r.id,row);}
   row.querySelector('.race-place').textContent=String(r.place).padStart(2,'0');row.querySelector('.race-name').textContent=r.name+(r.self?' · YOU':'');row.querySelector('.race-distance').textContent=r.status;row.dataset.self=String(r.self);row.dataset.stale=String(r.stale);row.style.setProperty('--progress-ratio',String(r.progress));list.append(row);
  }
  hud.querySelector('[data-race-count]').textContent=rows.length+' RUNNERS';hud.classList.remove('hidden');
 }
 return {panel,chip,hud,$,button,show,render,standings};
}
