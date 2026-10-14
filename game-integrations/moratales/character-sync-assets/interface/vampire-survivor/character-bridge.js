(() => {
 'use strict';
 if(parent===window||location.origin!=='https://moratales.repocompany.uk')return;
 const allowed=new Set(['https://morogue.repocompany.uk','https://repocompany.uk','https://www.repocompany.uk']),channel='morogue-characters-v1';let nonce=null,origin=null,plan=null,planId=null;
 addEventListener('message',e=>{
  const m=e.data;if(e.source!==parent||!allowed.has(e.origin)||m?.channel!==channel||typeof m.nonce!=='string'||!/^[a-f0-9-]{36}$/.test(m.nonce)||typeof m.id!=='string'||m.id.length>64||nonce&&(nonce!==m.nonce||origin!==e.origin))return;
  nonce=m.nonce;origin=e.origin;const response={channel,nonce,id:m.id};
  if(m.action==='hello')response.result=true;
  else if(m.action==='characters'){
   try{response.result=origin==='https://morogue.repocompany.uk'?MORATALES_SURVIVOR_SAVES.exportCharacters(localStorage):MORATALES_CHARACTER_LINK.local(localStorage);}
   catch{response.error='Your MoraTales characters could not be read.';}
  }else if(m.action==='sync-plan'&&origin!=='https://morogue.repocompany.uk'){
   try{plan=MORATALES_CHARACTER_LINK.prepare(localStorage,m.payload);planId=m.id;response.result=plan.status==='ready'?{status:plan.status,planId,characters:plan.characters,revision:plan.revision,userId:plan.userId,changed:plan.changed,conflict:plan.conflicts.length>0}:{status:plan.status};}
   catch(error){plan=null;planId=null;response.error=error.message;}
  }else if(m.action==='sync-commit'&&origin!=='https://morogue.repocompany.uk'){
   try{if(!plan||m.payload?.planId!==planId)throw Error('The character sync changed.');MORATALES_CHARACTER_LINK.acknowledge(localStorage,plan,m.payload.snapshot);plan=null;planId=null;response.result=true;}
   catch(error){response.error=error.message;}
  }else if(m.action==='link'&&origin!=='https://morogue.repocompany.uk'){
   try{MORATALES_CHARACTER_LINK.link(localStorage,m.payload);response.result=true;}
   catch(error){response.error=error.message;}
  }else return;
  parent.postMessage(response,origin);
 });
 addEventListener('storage',e=>{if(nonce&&(!e.key||e.key==='moratales-save-slots-v1'||e.key===MORATALES_CHARACTER_LINK.KEY||e.key.startsWith('hearthfolk-appearance-')))parent.postMessage({channel,nonce,event:'changed'},origin);});
})();
