const portal='https://repocompany.uk';
const marker='kure.saves.1.legacyImported';
const inCloud=k=>/^(?:kure\.saves\.1\.(?:legacyImported|slot\.[123]|courier\.[\w.-]{1,160})|kure\.crew-campaign\.1\.online\.[A-Z2-9]{6})$/.test(k);
let status='Device saves',choices=[];
function report(text,actions=[]){if(text===status&&!actions.length&&!choices.length)return;status=text;choices=actions;render();}
function render(){
  const doc=document.getElementById('cabUi')?.contentDocument;
  const parent=doc?.querySelector('#save-book header');if(!parent)return;
  let el=doc.getElementById('kure-sync-state');
  if(!el){el=doc.createElement('small');el.id='kure-sync-state';parent.append(el);}
  el.replaceChildren(doc.createTextNode(status+' '));
  for(const [label,fn] of choices){const b=doc.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;el.append(b);}
}
function connect(){
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='Repo Company save connection';
  const pending=new Map();
  addEventListener('message',e=>{
    if(e.source!==frame.contentWindow||e.origin!==portal)return;
    if(e.data?.type==='kure-account-changed'){location.reload();return;}
    if(e.data?.type==='kure-account-reply')pending.get(e.data.id)?.(e.data);
  });
  const loaded=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Account offline')),6000);frame.onload=()=>{clearTimeout(timeout);resolve();};});
  frame.src=portal+'/kure-save-bridge.html';document.body.append(frame);
  return async(op,owner,doc)=>{
    await loaded;const id=crypto.randomUUID();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(Error('Account offline'));},6000);
      pending.set(id,data=>{clearTimeout(timer);pending.delete(id);resolve(data);});
      frame.contentWindow.postMessage({type:'kure-account-save',id,op,owner,doc},portal);
    });
  };
}
async function open(){
  const local=window.localStorage;
  if(location.origin!=='https://kure.repocompany.uk')return local;
  const cab=document.getElementById('cabUi');
  cab?.addEventListener('load',render);
  const call=connect();let owner;
  try{owner=(await call('owner')).owner;}catch{report('Account unavailable · device saves');return local;}
  if(!owner){report('Device saves',[['Sign in to Repo Company',()=>window.open(portal+'/Account','_blank','noopener')]]);return local;}
  activeOwner=owner;
  const cache='kure.account-cache.v1.'+owner;
  let previousText,previousState;
  const read=()=>{const text=local.getItem(cache)||'{"revision":0,"values":{},"dirty":false}';if(text!==previousText){previousState=JSON.parse(text);previousText=text;}return previousState;};
  const write=s=>local.setItem(cache,JSON.stringify(s));
  let timer,flushing=false,blocked=false;
  const schedule=(delay=1200)=>{clearTimeout(timer);timer=setTimeout(()=>{timer=0;void sync();},delay);};
  function conflict(remote){
    blocked=true;
    report('Save conflict · choose a copy',[
      ['Keep this device',()=>{const s=read();write({...s,revision:remote.revision,dirty:true});blocked=false;schedule(0);}],
      ['Load account copy',()=>{local.setItem(cache+'.recovery',JSON.stringify(read()));write({...remote,dirty:false});location.reload();}]
    ]);
  }
  async function sync(){
    if(flushing||blocked)return;flushing=true;
    try{
      const sent=read();if(!sent.dirty)return;
      const response=await call('put',owner,{revision:sent.revision,values:sent.values});
      if(response.status===409){conflict(response.doc);return;}
      if(response.status===413){report('Saved on device · account save is too large');return;}
      if(response.status!==200)throw Error('Account save pending');
      const latest=read(),dirty=JSON.stringify(latest.values)!==JSON.stringify(sent.values);
      write({...latest,revision:response.doc.revision,dirty});report(dirty?'Saving to account…':'Saved to Repo Company');
      if(dirty)schedule();
    }catch{report('Saved on device · account sync pending');schedule(15000);}finally{flushing=false;}
  }
  const signalled=()=>{if(read().dirty)schedule(0);};
  addEventListener('online',signalled);document.addEventListener('visibilitychange',signalled);
  let state=read();
  try{
    const response=await call('get',owner);if(response.status!==200)throw Error();
    const remote=response.doc;
    if(!state.dirty){state={...remote,dirty:false};write(state);report('Repo Company account saves');}
    else if(state.revision!==remote.revision)conflict(remote);else schedule(0);
    if(!state.revision&&!state.dirty&&!blocked&&!local.getItem('kure.account-import.v1')){
      const legacy=Object.fromEntries(Object.keys(local).filter(inCloud).map(k=>[k,local.getItem(k)]));
      if(Object.keys(legacy).some(k=>k!==marker)&&confirm('Copy the KURE saves on this device into your signed-in Repo Company account?')){
        write({...state,values:legacy,dirty:true});local.setItem('kure.account-import.v1',owner);schedule();
      }
    }
  }catch{report('Account offline · saves stay on this device');}
  const devicePrefix=cache+'.local.';
  const keys=()=>[...Object.keys(read().values),...Object.keys(local).filter(k=>k.startsWith(devicePrefix)).map(k=>k.slice(devicePrefix.length))];
  function change(key,value){
    if(!inCloud(key)){const name=cache+'.local.'+key;if(value===null)local.removeItem(name);else local.setItem(name,value);return;}
    const s=read(),values={...s.values};if(value===null)delete values[key];else values[key]=String(value);
    write({...s,values,dirty:true});if(!blocked){report('Saving to account…');if(!timer)schedule();}
  }
  return {get length(){return keys().length;},key:i=>keys()[i]??null,
    getItem:k=>inCloud(k)?(read().values[k]??(k===marker?'done':null)):local.getItem(cache+'.local.'+k),
    setItem:(k,v)=>change(k,v),removeItem:k=>change(k,null)};
}
let activeOwner;
export const accountStorage=await open();
if(location.origin==='https://kure.repocompany.uk'){
  const tracker=document.createElement('script');tracker.src=portal+'/game-playtime-client.js';tracker.dataset.game='kure';document.head.append(tracker);
}
const sessionPrefix='kure.account-session.'+activeOwner+'.';
function sessionKeys(){return Object.keys(sessionStorage).filter(k=>k.startsWith(sessionPrefix));}
export const accountSession=activeOwner?{get length(){return sessionKeys().length;},key:i=>sessionKeys()[i]?.slice(sessionPrefix.length)??null,getItem:k=>sessionStorage.getItem(sessionPrefix+k),setItem:(k,v)=>sessionStorage.setItem(sessionPrefix+k,v),removeItem:k=>sessionStorage.removeItem(sessionPrefix+k)}:sessionStorage;
