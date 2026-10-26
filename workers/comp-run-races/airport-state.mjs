export const AIRPORT_CAPACITY=12,PARTY_CAPACITY=8;
export function createAirportState(code,privateRoom=false){return{code,privateRoom,players:[],parties:[],invites:[],revision:0};}
const fail=message=>({ok:false,error:message});
export function airportCommand(state,id,m,now=Date.now()){
 const me=state.players.find(p=>p.id===id);if(!me)return fail('Reconnect to the airport.');
 state.invites=state.invites.filter(i=>i.expires>now);let party=state.parties.find(p=>p.members.includes(id));
 const readyReset=p=>{p.ready=[];p.preparing=false;};
 if(m.type==='invite'){
  const target=state.players.find(p=>p.id===m.target);if(!target||target.id===id)return fail('That player has left.');
  if(now-(me.lastInvite||0)<4000)return fail('Please wait before sending another invitation.');
  if(!me.pose||!target.pose||Math.hypot(me.pose[0]-target.pose[0],me.pose[1]-target.pose[1],me.pose[2]-target.pose[2])>4)return fail('Move closer to invite this player.');
  if(state.parties.some(p=>p.members.includes(target.id)))return fail('That player is already in a party.');
  if(party&&party.leader!==id)return fail('Only the party leader can invite players.');
  if(party?.members.length>=PARTY_CAPACITY)return fail('Your party is full.');
  if(!party){party={id:crypto.randomUUID(),leader:id,members:[id],course:'higher-ground',mode:'normal',rules:'race',ready:[],preparing:false};state.parties.push(party);}
  me.lastInvite=now;state.invites=state.invites.filter(i=>i.target!==target.id||i.party!==party.id);const invite={id:crypto.randomUUID(),party:party.id,from:id,target:target.id,expires:now+30000};state.invites.push(invite);state.revision++;return{ok:true,invite};
 }
 if(m.type==='accept'||m.type==='decline'){
  const invite=state.invites.find(i=>i.id===m.invite&&i.target===id);if(!invite)return fail('This invitation has expired.');state.invites=state.invites.filter(i=>i.id!==invite.id);if(m.type==='decline'){state.revision++;return{ok:true};}
  const next=state.parties.find(p=>p.id===invite.party);if(party||!next||next.members.length>=PARTY_CAPACITY||next.preparing)return fail('That party is no longer available.');next.members.push(id);readyReset(next);state.invites=state.invites.filter(i=>i.target!==id);state.revision++;return{ok:true};
 }
 if(m.type==='party-create'){if(party)return fail('You already have a party.');state.parties.push({id:crypto.randomUUID(),leader:id,members:[id],course:'higher-ground',mode:'normal',rules:'race',ready:[],preparing:false});state.revision++;return{ok:true};}
 if(m.type==='party-leave'){
  if(!party)return{ok:true};party.members=party.members.filter(p=>p!==id);readyReset(party);state.invites=state.invites.filter(i=>i.party!==party.id||i.from!==id);if(!party.members.length)state.parties=state.parties.filter(p=>p!==party);else if(party.leader===id)party.leader=party.members[0];state.revision++;return{ok:true};
 }
 if(!party)return fail('Create or join a party first.');
 if(m.type==='party-configure'){
  if(party.leader!==id)return fail('The party leader chooses the flight.');if(!['sanctuary','hollow','undertow','playdate','small-hours','final-curtain','last-bloom','rupture','uncrowned','last-draft','rep-orca','on-the-menu','higher-ground','castaway'].includes(m.course)||!['normal','nightmare'].includes(m.mode)||!['race','one-life'].includes(m.rules))return fail('Choose a valid flight.');Object.assign(party,{course:m.course,mode:m.mode,rules:m.rules});readyReset(party);state.revision++;return{ok:true};
 }
 if(m.type==='party-ready'){if(party.preparing)return fail('The flight is preparing.');party.ready=party.ready.filter(p=>p!==id);if(m.ready===true)party.ready.push(id);state.revision++;return{ok:true};}
 if(m.type==='party-depart'){
  if(party.leader!==id)return fail('The party leader starts boarding.');if(party.preparing)return fail('This flight is already preparing.');if(party.members.some(p=>!party.ready.includes(p)))return fail('Everyone must confirm ready.');party.preparing=true;state.revision++;return{ok:true,depart:{...party,members:[...party.members]}};
 }
 return fail('Unknown airport action.');
}
export function removeAirportPlayer(state,id){const party=state.parties.find(p=>p.members.includes(id));if(party){party.members=party.members.filter(p=>p!==id);party.ready=[];party.preparing=false;if(party.leader===id)party.leader=party.members[0];if(!party.members.length)state.parties=state.parties.filter(p=>p!==party);}state.players=state.players.filter(p=>p.id!==id);state.invites=state.invites.filter(i=>i.target!==id&&i.from!==id);state.revision++;}
export function airportPublicState(state,recipient){return{type:'airport-state',code:state.privateRoom?state.code:null,privateRoom:state.privateRoom,revision:state.revision,capacity:AIRPORT_CAPACITY,players:state.players.map(({id,name,runner,knife})=>({id,name,runner,knife})),party:state.parties.find(p=>p.members.includes(recipient))||null,invites:state.invites.filter(i=>i.target===recipient)};}
