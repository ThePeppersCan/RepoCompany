(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.MORATALES_SURVIVOR_SAVES=factory();
})(globalThis,function(){
  'use strict';
  // Keep the existing key so the Morogue rename preserves every player record.
  const KEY='moratales-vampire-survivor-v1',SLOTS='moratales-save-slots-v1';
  const APPEARANCES=['hearthfolk-appearance-v7','hearthfolk-appearance-v6','hearthfolk-appearance-v4'];
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const LOOK_KEYS=['skin','hair','hair_colour','face','eyes','nose','mouth','eye_colour','shirt','trousers','shoes','hat','shirt_colour','trousers_colour','shoes_colour','hat_colour'];
  function cafeCharacters(value){
    if(!Array.isArray(value)||value.length>4)throw Error('Invalid character list.');
    const ids=new Set();return value.map(c=>{
      if(!object(c)||!/^slot-[0-2]$|^current$|^survivor$/.test(c.id)||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||!object(c.look)||typeof c.look.skin!=='string'||typeof c.look.hair!=='string')throw Error('Invalid character.');
      ids.add(c.id);const name=c.name.trim().slice(0,32),look={name};for(const k of LOOK_KEYS)if(typeof c.look[k]==='string'&&c.look[k].length<=80)look[k]=c.look[k];
      return {id:c.id,name,look};
    });
  }
  function importCharacters(storage,value){const characters=cafeCharacters(value);write(storage,{cafeCharacters:characters});return characters;}
  function exportCharacters(storage){const saved=read(storage);if(saved.warnings.length&&!saved.characters.length)throw Error('Characters could not be read.');return cafeCharacters(saved.characters.filter(c=>!c.id.startsWith('cafe-')));}
  function parse(value){try{return JSON.parse(value);}catch{return null;}}
  function appearance(entries){
    for(const key of APPEARANCES){const data=parse(entries?.[key]);if(object(data)&&typeof data.name==='string'&&data.name.trim()&&typeof data.skin==='string'&&typeof data.hair==='string')return {...data,name:data.name.trim().slice(0,32)};}
    return null;
  }
  function read(storage){
    const characters=[],warnings=[];let data={};
    try{
      const raw=storage.getItem(KEY),own=parse(raw);if(object(own))data=own;else if(raw)warnings.push('The separate survivor record could not be read.');
      const live=Object.fromEntries(APPEARANCES.map(k=>[k,storage.getItem(k)]));
      const slotRaw=storage.getItem(SLOTS),book=parse(slotRaw);
      if(object(book)&&book.version===1&&Array.isArray(book.slots)&&book.slots.length===3){
        for(let i=0;i<3;i++){
          const look=(book.active===i?appearance(live):null)||appearance(book.slots[i]?.entries);
          if(look)characters.push({id:'slot-'+i,name:look.name,look,source:'Adventure slot '+(i+1)});
        }
        if(!characters.length){const look=appearance(live);if(look)characters.push({id:'current',name:look.name,look,source:'Current character'});}
      }else{
        if(slotRaw)warnings.push('Some adventure slots could not be read. They have been left untouched.');
        const look=appearance(live);if(look)characters.push({id:'current',name:look.name,look,source:'Current character'});
      }
      if(object(data.character)&&typeof data.character.name==='string'&&data.character.name.trim()&&object(data.character.look))characters.push({id:'survivor',name:data.character.name.slice(0,32),look:data.character.look,source:'Morogue character'});
      if(data.cafeCharacters){try{for(const c of cafeCharacters(data.cafeCharacters))characters.push({...c,id:'cafe-'+c.id,source:c.id==='survivor'?'Previous Morogue character':'MoraTales · '+(c.id.startsWith('slot-')?'Café slot '+(Number(c.id.slice(-1))+1):'Café character')});}catch{warnings.push('The copied café characters could not be read. Your original saves are unchanged.');}}
    }catch{warnings.push('Browser storage is unavailable. You can create a character for this session.');}
    return {characters,warnings,data};
  }
  function write(storage,update){
    // This is the only key this mode may write. Adventure and co-op keys are read-only.
    const previous=parse(storage.getItem(KEY));const next={...(object(previous)?previous:{}),...update,version:1};
    storage.setItem(KEY,JSON.stringify(next));return next;
  }
  function backup(storage,character){
    const own=read(storage).data,data={...own,version:1};
    // Carry the selected appearance, never the separate MoraTales save slots.
    if(character?.name&&object(character.look)){data.character={name:character.name,look:character.look};data.selectedCharacter='survivor';}
    return JSON.stringify({game:'Morogue',format:1,exportedAt:new Date().toISOString(),data},null,2);
  }
  function parseBackup(text){
    if(typeof text!=='string'||text.length>524288)throw Error('Choose a Morogue progress file smaller than 512 KB.');
    const value=parse(text);if(!object(value)||value.game!=='Morogue'||value.format!==1||!object(value.data)||value.data.version!==1)throw Error('This is not a supported Morogue progress file.');
    function valid(v,depth=0){if(depth>12)return false;if(v===null||typeof v==='boolean')return true;if(typeof v==='string')return v.length<=10000;if(typeof v==='number')return Number.isFinite(v);if(typeof v!=='object')return false;return Object.entries(v).every(([key,item])=>!['__proto__','prototype','constructor'].includes(key)&&valid(item,depth+1));}
    if(!valid(value.data)||value.data.character&&(!object(value.data.character)||typeof value.data.character.name!=='string'||!object(value.data.character.look)))throw Error('This progress file is damaged. Your current progress has not changed.');
    return value.data;
  }
  function restore(storage,text){const data=parseBackup(text);storage.setItem(KEY,JSON.stringify(data));return data;}
  return {KEY,read,write,backup,parseBackup,restore,importCharacters,exportCharacters};
});
