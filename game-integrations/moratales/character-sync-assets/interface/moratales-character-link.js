(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./vampire-survivor/characters.js'));
 else root.MORATALES_CHARACTER_LINK=factory(root.MORATALES_SURVIVOR_SAVES);
})(globalThis,function(Saves){
 'use strict';
 const KEY='moratales-account-characters-v1';
 const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
 function clean(value){
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const result=Saves.importCharacters(storage,value);
  if(result.some(c=>!/^slot-[0-2]$|^current$/.test(c.id)))throw Error('Choose a Moratales character.');
  return result;
 }
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function local(storage){return clean(Saves.exportCharacters(storage).filter(c=>c.id!=='survivor'));}
 function validate(value){
  const automatic=value?.version===2;
  if(!value||!uuid(value.userId)||!Number.isSafeInteger(value.revision)||value.revision<(automatic?0:1)||!Array.isArray(value.ids)||(!automatic&&!value.ids.length)||value.ids.length>4||new Set(value.ids).size!==value.ids.length)throw Error('Invalid character connection.');
  const characters=clean(value.characters);
  const observed=automatic?clean(value.observed):characters.filter(c=>value.ids.includes(c.id));
  if(value.ids.some(id=>!observed.some(c=>c.id===id)))throw Error('Invalid linked characters.');
  return {version:automatic?2:1,userId:value.userId,revision:value.revision,characters,ids:[...value.ids],...(automatic?{observed}: {})};
 }
 function read(storage){try{const value=JSON.parse(storage.getItem(KEY));return [1,2].includes(value?.version)?validate(value):null;}catch{return null;}}
 function link(storage,payload){
  const value=validate(payload),current=local(storage);
  const owner=read(storage);if(storage.getItem(KEY)&&(!owner||owner.userId!==value.userId))throw Error('These browser characters belong to another account.');
  if(value.ids.some(id=>!equal(current.find(c=>c.id===id),value.characters.find(c=>c.id===id))))throw Error('Your character changed while connecting. Refresh and link again.');
  storage.setItem(KEY,JSON.stringify(value));return value;
 }
 function update(storage,marker){
  const current=local(storage);
  // An empty/replaced save slot cannot silently erase an account character.
  const characters=marker.characters.map(c=>marker.ids.includes(c.id)?current.find(item=>item.id===c.id)||c:c);
  return equal(characters,marker.characters)?null:characters;
 }
 function snapshot(value){
  if(!value||!uuid(value.userId)||!Number.isSafeInteger(value.revision)||value.revision<0)throw Error('Invalid account character response.');
  return {userId:value.userId,revision:value.revision,characters:clean(value.characters)};
 }
 function prepare(storage,value){
  const cloud=snapshot(value),current=local(storage);let marker=read(storage),raw=storage.getItem(KEY);
  if(raw&&!marker)throw Error('The browser character owner could not be verified.');
  if(marker&&marker.userId!==cloud.userId)return {status:'account',cloud};
  if(!current.length)return {status:'empty',cloud};
  // Bind legacy browser characters to the first verified account before any
  // asynchronous upload. A later sign-in cannot claim this same local store.
  if(!marker){marker={version:2,userId:cloud.userId,revision:cloud.revision,characters:cloud.characters,ids:[],observed:[]};storage.setItem(KEY,JSON.stringify(marker));raw=storage.getItem(KEY);}
  const observed=marker.observed||marker.characters.filter(c=>marker.ids.includes(c.id)),merged=new Map(cloud.characters.map(c=>[c.id,c])),conflicts=[];
  for(const character of current){
   const baseline=observed.find(c=>c.id===character.id),previous=marker.characters.find(c=>c.id===character.id),remote=merged.get(character.id);
   if(!marker.ids.includes(character.id)){
    if(remote&&!equal(remote,character)){conflicts.push(character.id);continue;}
    merged.set(character.id,character);continue;
   }
   if(equal(character,baseline))continue;
   if(!equal(remote,previous)&&!equal(remote,character)){conflicts.push(character.id);continue;}
   merged.set(character.id,character);
  }
  const characters=clean([...merged.values()]),observedNext=new Map(observed.map(c=>[c.id,c]));for(const character of current)if(!conflicts.includes(character.id))observedNext.set(character.id,character);
  const ids=[...new Set([...marker.ids,...current.filter(c=>!conflicts.includes(c.id)).map(c=>c.id)])];
  return {status:'ready',userId:cloud.userId,revision:cloud.revision,characters,ids,observed:clean([...observedNext.values()]),raw,changed:!equal(characters,cloud.characters),cloud,conflicts};
 }
 function acknowledge(storage,plan,value){
  const saved=snapshot(value);
  if(plan?.status!=='ready'||saved.userId!==plan.userId||storage.getItem(KEY)!==plan.raw||saved.revision<plan.revision||(plan.changed&&saved.revision<=plan.revision)||!equal(saved.characters,plan.characters))throw Error('The character connection changed during sync.');
  // Keep the previous cloud baseline for conflicting owned slots. Otherwise a
  // second sync could mistake the same unresolved local edit for a safe update.
  const previous=read(storage),baseline=new Map(saved.characters.map(c=>[c.id,c]));
  for(const id of plan.conflicts)if(previous?.ids.includes(id)){const old=previous.characters.find(c=>c.id===id);if(old)baseline.set(id,old);}
  const next=validate({version:2,userId:saved.userId,revision:saved.revision,characters:[...baseline.values()],ids:plan.ids,observed:plan.observed});
  // An edit made during upload stays queued for the next sync.
  storage.setItem(KEY,JSON.stringify(next));return next;
 }
 return {KEY,read,link,update,local,validate,clean,equal,snapshot,prepare,acknowledge};
});
