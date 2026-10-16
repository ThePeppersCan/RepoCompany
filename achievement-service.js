(() => {
 'use strict';
 let owner=null,revision=0,busy=false,last=0,mine={},global={},repoScore=null,error='';
 const notify=()=>dispatchEvent(new CustomEvent('repo-achievement-state'));
 async function refresh(force=false){
  const account=window.repoAccount,id=account?.state.user?.id||null;
  if(id!==owner){owner=id;revision++;mine={};repoScore=null;last=0;notify();}
  if(busy||(!force&&Date.now()-last<60000))return;
  busy=true;last=Date.now();const rev=revision;
  try{
   const tasks=[fetch('/api/achievements/global').then(async r=>{if(!r.ok)throw Error('Achievement statistics are temporarily unavailable.');return r.json();})];
   if(id)tasks.push((async()=>{const {data:{session}}=await account.db.auth.getSession();if(session?.user.id!==id)throw Error('Account changed');const r=await fetch('/api/achievements/mine',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});if(!r.ok)throw Error('Your achievement progress is temporarily unavailable.');return r.json();})());
   const results=await Promise.allSettled(tasks);if(rev!==revision||id!==(account?.state.user?.id||null))return;
   error='';if(results[0].status==='fulfilled')global=Object.fromEntries(results[0].value.achievements.map(a=>[a.id,a]));else error=results[0].reason.message;
   if(results[1]?.status==='fulfilled'){const data=results[1].value;mine=Object.fromEntries(data.achievements.map(a=>[a.id,a]));repoScore=data.repoScore;if(account.state.social?.profile)account.state.social.profile.repo_score=repoScore;}else if(results[1])error=results[1].reason.message;
   notify();
  }catch{error='Achievement progress is temporarily unavailable.';notify();}finally{busy=false;}
 }
 window.repoAchievementState=Object.freeze({refresh,get mine(){return mine;},get global(){return global;},get repoScore(){return repoScore;},get error(){return error;},get signedIn(){return !!owner;},summary(game){const list=Object.values(mine).filter(a=>a.game===game);return {loaded:list.length>0,total:list.length,unlocked:list.filter(a=>a.unlocked_at).length,score:list.reduce((n,a)=>n+(a.unlocked_at?a.score:0),0)};}});
 addEventListener('repo-account-state',()=>refresh());addEventListener('focus',()=>refresh());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 setInterval(()=>{if(!document.hidden&&document.querySelector('#account-menu[open]'))refresh();},60000);refresh();
})();
