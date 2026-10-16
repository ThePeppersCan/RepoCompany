(async()=>{
 const root=document.querySelector('#avatar-studio-root');let value;
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!window.repoAvatarStudio.busy){event.preventDefault();location.assign('/Account');}});
 try{value=JSON.parse(localStorage.getItem('repo-avatar-studio-preview-v2'));}catch{}
 try{await window.repoAvatarStudio.mount(root,{value,name:'Your portrait',saveLabel:'Save preview',onCancel:()=>location.assign('/Account'),onSave:async avatar=>{localStorage.setItem('repo-avatar-studio-preview-v2',JSON.stringify(avatar));}});}catch(error){root.textContent=error.message;}
})();
