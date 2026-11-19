(() => {
  const origin='https://kure.repocompany.uk';
  if(parent===window)return;
  const auth=supabase.createClient(repoDashboardConfig.url,repoDashboardConfig.key).auth;
  let previous,connected=false;
  auth.onAuthStateChange((_event,session)=>{
    const id=session?.user?.id||null;
    if(connected&&id!==previous)parent.postMessage({type:'kure-account-changed'},origin);
    previous=id;
  });
  addEventListener('message',async event=>{
    if(event.origin!==origin||event.source!==parent)return;
    const m=event.data;
    if(m?.type!=='kure-account-save'||typeof m.id!=='string'||!['owner','get','put'].includes(m.op))return;
    const send=(data)=>parent.postMessage({type:'kure-account-reply',id:m.id,...data},origin);
    try{
      const {data:{session}}=await auth.getSession();
      const owner=session?.user?.id||null;
      if(m.op==='owner'){previous=owner;connected=true;send({owner});return;}
      if(!owner||owner!==m.owner){send({status:403});return;}
      const response=await fetch('/api/kure-saves',{method:m.op==='get'?'GET':'PUT',headers:{Authorization:'Bearer '+session.access_token,'X-Kure-Owner':owner,'Content-Type':'application/json'},body:m.op==='get'?undefined:JSON.stringify(m.doc)});
      send({status:response.status,doc:await response.json()});
    }catch{send({status:503});}
  });
})();
