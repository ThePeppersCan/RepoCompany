(function(root){
 'use strict';
 const maps=['sanctuary','hollow','undertow','playdate','small-hours','final-curtain','last-bloom','rupture'];
 const metric=(id,mode)=>'completed_'+id.replaceAll('-','_')+'_'+mode;
 function completionFacts(records){
  const facts={};let runners=0;
  for(const id of maps){let earned=false;for(const mode of ['normal','nightmare']){const r=records?.[id+':'+mode];if(Number.isFinite(r?.time)&&r.time>0){facts[metric(id,mode)]=1;earned=true;}}if(earned)runners++;}
  facts.runners_unlocked=runners;return facts;
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={completionFacts};return;}
 const client=root.repoGameAchievements;if(!client)return;
 let owner=null,records={},queue={},run=null,sending=false,nextSend=0;
 const key=()=>`comp-run.account-results.v1:${owner}`;
 function save(){if(owner)try{localStorage.setItem(key(),JSON.stringify({records,queue}));}catch{}}
 function read(k){try{const value=JSON.parse(localStorage.getItem(k)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function bind(){
  const id=client.identity;if(!id||!client.active&&owner&&id!==owner)return false;
  if(owner&&owner!==id)return false;
  if(!owner){owner=id;const saved=read(key());records=saved.records||{};queue=saved.queue||{};
   // Installed storage is scoped by the launcher before game scripts execute.
   // Ordinary browser saves may belong to a guest or another account.
   if(root.REPO_LAUNCHER_STORAGE?.accountId===id){
    const keys=[...Array.from({length:5},(_,i)=>`comp-run.records.v${i+1}`),...Array.from({length:3},(_,i)=>`comp-run.records.small-hours.v${i+1}`),...Array.from({length:2},(_,i)=>`comp-run.records.final-curtain.v${i+1}`),'comp-run.records.last-bloom.v1','comp-run.records.last-bloom.v2','comp-run.records.rupture.v2'];
    for(const k of keys)for(const [name,r]of Object.entries(read(k))){if(Number.isFinite(r?.time)&&r.time>0&&(!records[name]||r.time<records[name].time))records[name]=r;}
    save();
   }
  }return true;
 }
 async function flush(){
  if(sending||Date.now()<nextSend||!bind())return;sending=true;
  try{for(const [id,payload]of Object.entries(queue)){
   if(Date.now()-payload.queuedAt>86400000){delete queue[id];save();continue;}
   try{await client.request('run-finish',payload);if(client.identity!==owner)return;delete queue[id];save();root.dispatchEvent(new CustomEvent('comp-run-record-synced'));}
   catch{nextSend=Date.now()+30000;break;}
  }}finally{sending=false;}
 }
 root.addEventListener('comp-run-started',event=>{
  run=null;const d=event.detail;if(!maps.includes(d?.courseId)||!['normal','nightmare'].includes(d.mode)||!bind())return;
  const active={owner,courseId:d.courseId,mode:d.mode};run=active;
  active.pending=(async()=>{for(const delay of [0,400,1000,2000]){if(delay)await new Promise(resolve=>setTimeout(resolve,delay));if(run!==active||client.identity!==active.owner)return null;try{const result=await client.request('run-start',d);active.id=result.run;return result;}catch{}}return null;})();
 });
 root.addEventListener('comp-run-completed',async event=>{
  const d=event.detail;if(!maps.includes(d?.courseId)||!['normal','nightmare'].includes(d.mode)||!Number.isFinite(d.time)||d.time<=0||!bind())return;
  const name=d.courseId+':'+d.mode;if(!records[name]||d.time<records[name].time)records[name]={time:d.time};save();client.observe(completionFacts(records));
  const active=run;run=null;if(!active||active.owner!==owner||active.courseId!==d.courseId||active.mode!==d.mode)return;
  await active.pending;if(!active.id||client.identity!==owner)return;
  // One queued best per board, always tied to the account that started the run.
  const payload={run:active.id,courseId:d.courseId,mode:d.mode,version:d.version,timeMs:Math.round(d.time*1000),splits:d.splits.map(v=>Math.round(v*1000)),queuedAt:Date.now()};
  if(!queue[name]||payload.timeMs<queue[name].timeMs)queue[name]=payload;save();void flush();
 });
 client.register({sample(){if(bind()){client.observe(completionFacts(records));void flush();}},muted(){return root.document?.hidden;}});
})(globalThis);
