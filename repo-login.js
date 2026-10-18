(() => {
 'use strict';
 const host=document.getElementById('repo-login'),html=document.documentElement,service=window.repoAccount;
 if(!host||!service)return;
 const native=()=>html.dataset.repoLauncher==='true';
 let busy=false,create=false,error='',wasLocked=true;
 const presentation=document.createElement('div');host.append(presentation);
 const publicInfo=document.getElementById('repo-public-info');
 if(publicInfo){publicInfo.dataset.loginMounted='true';presentation.append(publicInfo);}
 window.mountRepoLogin(presentation);
 const root=presentation.shadowRoot,$=id=>root.getElementById(id),screen=root.querySelector('.website-fallback');
 const form=$('sign-in-form'),username=$('sign-in-username'),password=$('sign-in-password');
 function render(){
  const state=service.state,locked=!native()&&(busy||!state.ready||!state.user);
  html.dataset.repoAuth=locked?'locked':'ready';
  if(!locked){if(host.open)host.close();window.repoBrandMotion.setActive(false);password.value='';wasLocked=false;return;}
  const loading=busy||!state.ready;
  screen.dataset.phase=busy?'signing-in':loading?'loading':'sign-in';
  form.hidden=loading;
  $('sign-in-error').hidden=!error;$('sign-in-error').textContent=error;
  $('sign-in-submit').disabled=busy;$('sign-in-submit').textContent=create?'Create account':'Log in';
  $('sign-in-mode').textContent=create?'Back to log in':'Request an account';password.autocomplete=create?'new-password':'current-password';
  if(!host.open){window.accountMenu?.close({route:false});host.showModal();}
  window.repoBrandMotion.setActive(loading);
  if(!loading&&(wasLocked||root.activeElement===null)){username.focus({preventScroll:true});wasLocked=false;}
 }
 host.addEventListener('cancel',event=>event.preventDefault());
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;error='';render();
  try{await service.signIn(username.value.trim(),password.value,create);}
  catch(e){error=e.message||'Unable to sign in. Please try again.';}
  finally{busy=false;password.value='';password.type='password';$('password-visibility').setAttribute('aria-pressed','false');$('password-visibility').setAttribute('aria-label','Show password');wasLocked=true;render();}
 });
 $('sign-in-mode').addEventListener('click',()=>{location.href='/account-access/?mode=request';});
 const reset=document.createElement('button');reset.type='button';reset.className=$('sign-in-mode').className;reset.textContent='Forgot password?';reset.onclick=()=>{location.href='/account-access/?mode=recover';};$('sign-in-mode').after(reset);
 const phone=document.createElement('a');phone.href='/app/';phone.textContent='Get the phone app';phone.style.cssText='display:block;text-align:center;color:inherit;font-size:12px;margin-top:12px';if(html.dataset.repoCompanion!=='true')form.append(phone);
 $('password-visibility').addEventListener('click',()=>{const visible=password.type==='password';password.type=visible?'text':'password';$('password-visibility').setAttribute('aria-pressed',String(visible));$('password-visibility').setAttribute('aria-label',visible?'Hide password':'Show password');});
 addEventListener('repo-account-state',render);
 // Native sign-in is owned by the launcher; its hidden portal must stay usable.
 new MutationObserver(render).observe(html,{attributes:true,attributeFilter:['data-repo-launcher']});
 // A deep link must not place an account dialog above the login gate.
 new MutationObserver(records=>{if(!host.open)return;if(records.some(r=>r.target!==host&&r.target.matches('dialog[open]'))){host.close();host.showModal();}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 render();
})();
