(() => {
 'use strict';
 const account=window.repoAccount;if(!account)return;
 const cache=new Map(),profiles=new Map();let owner=account.state.user?.id,epoch=0;
 async function request(path,options={}){const e=epoch,id=owner,{data:{session}}=await account.db.auth.getSession();if(!id||session?.user?.id!==id||e!==epoch)throw Error('Account changed.');const r=await fetch('/api/profile-picture'+path,{...options,headers:{...options.headers,Authorization:'Bearer '+session.access_token},cache:'no-store',signal:AbortSignal.timeout(15000)});if(e!==epoch)throw Error('Account changed.');if(!r.ok){const data=await r.json();throw Error(data.error||'Picture unavailable.');}return r;}
 function remove(key){const row=cache.get(key);if(row?.url)URL.revokeObjectURL(row.url);cache.delete(key);}
 async function load(name,version){
  const key=name+':'+version,old=cache.get(key);if(old&&old.until>Date.now())return old.promise;
  if(old)remove(key);if(cache.size>=200)remove(cache.keys().next().value);
  const e=epoch,row={until:Date.now()+60000};cache.set(key,row);
  row.promise=(async()=>{const r=await request('?'+new URLSearchParams({username:name,v:version})),blob=await r.blob();if(e!==epoch||cache.get(key)!==row)throw Error('Account changed.');return row.url=URL.createObjectURL(blob);})();row.promise.catch(()=>{});return row.promise;
 }
 async function paint(node,name,version){
  if(!name)return;name=name.toLowerCase();node.dataset.wibsPhotoName=name;const e=epoch;
  if(version===undefined){let info=profiles.get(name);if(!info||info.until<Date.now()){info={until:Date.now()+60000};profiles.set(name,info);info.promise=request('?metadata=1&username='+encodeURIComponent(name)).then(r=>r.json()).then(p=>info.version=p.photo_version||null).catch(()=>null);}version=info.promise?await info.promise:info.version;}
  if(e!==epoch||node.dataset.wibsPhotoName!==name)return;
  const key=name+':'+version;node.dataset.wibsPhotoKey=key;if(!version){node.querySelector(':scope > .repo-profile-photo')?.remove();return;}
  try{const url=await load(name,version);if(e!==epoch||node.dataset.wibsPhotoKey!==key||!node.isConnected)return;const img=document.createElement('img');img.className='repo-profile-photo';img.alt='';img.src=url;node.querySelector(':scope > .repo-profile-photo')?.remove();node.append(img);}catch{}
 }
 function sync(rows){for(const p of rows)if(p.username)profiles.set(p.username.toLowerCase(),{version:p.photo_version||null,until:Date.now()+60000});for(const n of document.querySelectorAll('[data-wibs-photo-name]')){const info=profiles.get(n.dataset.wibsPhotoName);if(info&&!n.closest('.repo-picture-editor'))paint(n,n.dataset.wibsPhotoName,info.version);}}
 function markup(name,version){if(!name||!version)return '';return '<span class="repo-profile-photo-slot" data-profile-picture="'+encodeURIComponent(name.toLowerCase())+'" data-photo-version="'+encodeURIComponent(version)+'"></span>';}
 function hydrate(root=document){for(const node of root.querySelectorAll('[data-profile-picture]'))paint(node,decodeURIComponent(node.dataset.profilePicture),decodeURIComponent(node.dataset.photoVersion));}
 function editor(form,profile,feedback){
  const editorOwner=owner,editorEpoch=epoch;
  const section=document.createElement('section');section.className='repo-picture-editor';const label=document.createElement('label');label.textContent='Upload picture';const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.setAttribute('aria-label','Upload profile picture');label.append(input);
  const preview=document.createElement('span');preview.className='repo-picture-preview';preview.textContent=profile.display.slice(0,2).toUpperCase();section.append(preview,label);form.prepend(section);
  const note=document.createElement('small');note.textContent='JPG, PNG or WebP · cropped to a square · 5 changes per day';section.append(note);
  let pending,busy=false,revision=0,mode=profile.photo_version?'photo':'avatar',stored=profile.photo_version,changed=false,ready=false;
  const heading=document.createElement('h3');heading.textContent='Repo Company profile picture';section.prepend(heading);
  const help=document.createElement('p');help.textContent='Used on your profile, in Friends, Wibs and Reparty. Switching keeps your avatar and uploaded picture.';heading.after(help);
  const choices=document.createElement('div');choices.className='repo-picture-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Profile picture style');help.after(choices);
  const buttons={};for(const [value,title]of [['avatar','Use avatar'],['photo','Use uploaded picture']]){const b=document.createElement('button');b.type='button';b.textContent=title;b.onclick=()=>{revision++;busy=false;mode=value;changed=true;render();};choices.append(b);buttons[value]=b;}
  function render(){preview.dataset.wibsPhotoKey='preview-'+crypto.randomUUID();preview.replaceChildren();preview.textContent=(profile.display||profile.username).slice(0,2).toUpperCase();if(mode==='avatar'&&profile.avatar&&window.repoAvatar){preview.insertAdjacentHTML('beforeend',window.repoAvatar.markup(profile.avatar,profile.display));window.repoAvatar.hydrate(preview);}else if(mode==='photo'){if(typeof pending==='string'){const img=document.createElement('img');img.className='repo-profile-photo';img.alt='Profile picture preview';img.src='data:image/jpeg;base64,'+pending;preview.append(img);}else if(stored&&pending!==null)paint(preview,profile.username,stored);}label.hidden=mode!=='photo';for(const [value,b]of Object.entries(buttons))b.setAttribute('aria-pressed',String(mode===value));}
  const initial=request('?metadata=1').then(r=>r.json()).then(p=>{stored=p.stored_photo_version;if(!changed)mode=p.photo_version?'photo':'avatar';ready=true;render();}).catch(e=>{feedback.textContent=e.message;});render();
  input.addEventListener('cancel',e=>e.stopPropagation());
  input.onchange=async()=>{const file=input.files[0],r=++revision;if(!file)return;busy=true;changed=true;feedback.textContent='Preparing profile picture…';try{
   if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>20*1048576)throw Error('Choose a JPG, PNG or WebP up to 20 MB.');
   const bitmap=await createImageBitmap(file);let blob;try{if(bitmap.width*bitmap.height>40000000)throw Error('Choose an image below 40 megapixels.');const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),side=Math.min(bitmap.width,bitmap.height);ctx.fillStyle='#fff';ctx.fillRect(0,0,256,256);ctx.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);for(const q of [.85,.65,.45]){blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',q));if(blob?.size<=65536)break;}}finally{bitmap.close();}
   if(!blob||blob.size>65536)throw Error('Choose a smaller picture.');const raw=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});if(r!==revision||!section.isConnected)return;pending=raw.split(',')[1];mode='photo';busy=false;render();feedback.textContent='Picture ready. Save to publish it.';
  }catch(e){if(r===revision)feedback.textContent=e.message;}finally{if(r===revision)busy=false;}};
  const remove=document.createElement('button');remove.type='button';remove.textContent='Delete uploaded picture';remove.onclick=()=>{revision++;busy=false;pending=null;stored=null;mode='avatar';changed=true;input.value='';render();};section.append(remove);
  return {async save(){await initial;if(editorOwner!==owner||editorEpoch!==epoch)throw Error('Your account changed. Reopen your profile.');if(!ready)throw Error('Your picture settings could not load. Reopen the editor to try again.');if(busy)throw Error('Wait for your picture to finish preparing.');if(!changed)return;if(mode==='photo'&&typeof pending!=='string'&&!stored)throw Error('Choose a picture to upload first.');const controls=[...section.querySelectorAll('button,input')];controls.forEach(n=>n.disabled=true);try{
   let result;if(pending!==undefined){result=await (await request('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:pending})})).json();stored=result.photo_version;}
   if(pending===undefined||mode==='avatar'&&pending!==null)result=await (await request('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode})})).json();
   pending=undefined;changed=false;sync([{username:profile.username,photo_version:result.photo_version}]);if(account.state.social?.profile)account.state.social.profile.photo_version=result.photo_version;dispatchEvent(new Event('repo-account-state'));dispatchEvent(new Event('repo-profile-picture'));render();
  }finally{controls.forEach(n=>n.disabled=false);}}};
 }
 addEventListener('repo-account-state',()=>{if(owner!==account.state.user?.id){owner=account.state.user?.id;epoch++;profiles.clear();for(const k of cache.keys())remove(k);for(const n of document.querySelectorAll('.repo-profile-photo'))n.remove();}else if(account.state.social){sync([{username:account.state.social.username,...account.state.social.profile},...(account.state.social.friends||[])]);}});
 window.repoProfilePhotos=Object.freeze({paint,sync,editor,markup,hydrate});
})();
