(() => {
 'use strict';
 const account=window.repoAccount;if(!account)return;
 const pattern=/\[\[wibs-image:([a-f0-9-]{36})\]\]/,cache=new Map();let owner=account.state.user?.id,epoch=0;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 async function request(path,options={}){
  const revision=epoch,user=owner,{data:{session}}=await account.db.auth.getSession();
  if(!user||session?.user?.id!==user||revision!==epoch)throw Error('Sign in to share images.');
  const response=await fetch('/api/chat-images/'+path,{...options,cache:'no-store',headers:{...options.headers,Authorization:'Bearer '+session.access_token},signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(25000)]):AbortSignal.timeout(25000)});
  if(revision!==epoch)throw Object.assign(Error('Account changed.'),{stale:true});
  if(!response.ok){const data=await response.json();throw Object.assign(Error(data.error||'Image unavailable.'),{status:response.status});}return response;
 }
 async function compress(file){
  if(!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)||file.size>20*1024*1024)throw Error('Choose a JPG, PNG, WebP or GIF up to 20 MB. Animated GIFs must be 1 MB or smaller.');
  if(file.type==='image/gif'){if(file.size>1048576)throw Error('Choose an animated GIF up to 1 MB.');const bitmap=await createImageBitmap(file);try{if(bitmap.width>1600||bitmap.height>1600)throw Error('Choose a GIF at most 1,600 pixels wide and tall.');return file;}finally{bitmap.close();}}
  const bitmap=await createImageBitmap(file);
  try{
   if(bitmap.width*bitmap.height>40000000)throw Error('Choose an image smaller than 40 megapixels.');
   const scale=Math.min(1,1600/bitmap.width,1600/bitmap.height),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.82,.68,.5,.35]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=1048576)return blob;}
   throw Error('This image is too detailed to fit in 1 MB. Try a smaller image.');
  }finally{bitmap.close();}
 }
 function mount({form,input,send,context,feedback,onChange}){
  let pending=null,revision=0,controller=null,busy=false;
  const choose=node('button','repo-image-attach');choose.type='button';choose.title='Attach an image · expires after 7 days';choose.setAttribute('aria-label','Attach image');
  choose.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m4 18 5-5 4 3 4-6 4 8"/></svg>';
  const file=node('input','');file.type='file';file.accept='image/png,image/jpeg,image/webp,image/gif';file.hidden=true;file.setAttribute('aria-label','Choose chat image');
  const preview=node('div','repo-image-draft');preview.hidden=true;preview.setAttribute('aria-live','polite');form.before(preview);form.insertBefore(choose,send);form.append(file);
  function clear(){revision++;controller?.abort();controller=null;if(pending?.url)URL.revokeObjectURL(pending.url);pending=null;busy=false;preview.hidden=true;preview.replaceChildren();file.value='';choose.disabled=false;}
  async function select(selected){
   if(!selected||input.disabled||busy)return;clear();const version=revision,where=JSON.stringify(context());busy=true;choose.disabled=true;feedback.textContent='Preparing image…';
   try{const blob=await compress(selected);if(version!==revision||where!==JSON.stringify(context()))return;pending={blob,url:URL.createObjectURL(blob),context:where,owner,uploaded:null};
    const img=node('img','');img.src=pending.url;img.alt='Image ready to send';
    const copy=node('span','',(blob.type==='image/gif'?'Animated GIF · ':'Image · ')+Math.ceil(blob.size/1024)+' KB');copy.append(node('small','','Disappears after 7 days · 20 images per 24 hours'));
    const remove=node('button','','Remove');remove.type='button';remove.setAttribute('aria-label','Remove attached image');remove.onclick=()=>{clear();onChange?.();input.focus();};
    preview.replaceChildren(img,copy,remove);preview.hidden=false;feedback.textContent='';onChange?.();input.focus();
   }catch(e){if(version===revision)feedback.textContent=e.message;}finally{if(version===revision){busy=false;choose.disabled=false;}}
  }
  choose.onclick=()=>{if(!input.disabled&&!busy)file.click();};file.onchange=()=>select(file.files[0]);
  // File inputs emit a bubbling cancel event when the native picker is dismissed.
  // It must never reach the enclosing Wibs dialog's Escape handler.
  file.addEventListener('cancel',event=>{event.stopPropagation();input.focus();});
  input.addEventListener('paste',e=>{const image=[...(e.clipboardData?.items||[])].find(i=>i.kind==='file'&&i.type.startsWith('image/'));if(image){e.preventDefault();select(image.getAsFile());}});
  form.addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();form.classList.add('is-image-drop');}});
  form.addEventListener('dragleave',()=>form.classList.remove('is-image-drop'));
  form.addEventListener('drop',e=>{if(e.dataTransfer?.files.length){e.preventDefault();form.classList.remove('is-image-drop');select(e.dataTransfer.files[0]);}});
  addEventListener('repo-account-state',()=>{if(!pending||pending.owner!==account.state.user?.id||pending.context!==JSON.stringify(context()))clear();});
  return {clear,preview,has:()=>!!pending,async prepare(text,clientId){
   if(busy)throw Error('Wait for the image to finish preparing.');if(!pending)return text;
   const current=pending,version=revision,where=context();if(current.context!==JSON.stringify(where)){clear();throw Error('The conversation changed. Attach the image again.');}
   if(text.length>3940)throw Error('Shorten the caption to 3,940 characters.');
   if(!current.uploaded){controller=new AbortController();const response=await request('upload?scope='+encodeURIComponent(where.scope)+'&target='+encodeURIComponent(where.target)+'&clientId='+clientId,{method:'POST',headers:{'Content-Type':current.blob.type},body:current.blob,signal:controller.signal});const data=await response.json();if(version!==revision||current.context!==JSON.stringify(context()))throw Object.assign(Error('Conversation changed.'),{stale:true});current.uploaded={...data,clientId};}
   // After a failed send, keep the upload tied to the same idempotency key.
   if(current.uploaded.clientId!==clientId)throw Error('Remove and reattach this image before changing the failed message.');
   return (text?text+'\n':'')+'[[wibs-image:'+current.uploaded.id+']]';
  }};
 }
 function evict(id){const row=cache.get(id);if(row?.url)URL.revokeObjectURL(row.url);cache.delete(id);}
 async function load(id){
  const existing=cache.get(id);if(existing)return existing.promise||existing;
  if(cache.size>=50)evict(cache.keys().next().value);
  const record={expires:Infinity},revision=epoch;cache.set(id,record);
  record.promise=(async()=>{try{const response=await request(id),blob=await response.blob();if(revision!==epoch||cache.get(id)!==record)return {error:'Image unavailable.'};record.expires=Number(response.headers.get('X-Image-Expires'));record.url=URL.createObjectURL(blob);}
   catch(e){record.error=e.status===410?'Image expired':e.message;record.expires=e.status===410?0:Date.now()+60000;}
   finally{delete record.promise;}return record;})();return record.promise;
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);show(entry.target);}});
 async function show(box){
  const revision=epoch,id=box.dataset.wibsImage,row=await load(id);if(revision!==epoch||!box.isConnected)return;
  if(row.error||row.expires<=Date.now()){box.textContent=row.error||'Image expired';return;}
  const img=node('img','repo-shared-image');img.alt='Shared chat image';img.loading='lazy';img.decoding='async';img.src=row.url;img.tabIndex=0;img.setAttribute('role','button');img.setAttribute('aria-label','View shared image');
  img.onclick=()=>{if(row.expires<=Date.now())return;const dialog=node('dialog','repo-image-viewer'),full=node('img',''),close=node('button','','Close');full.src=row.url;full.alt='Shared chat image at full size';close.type='button';close.onclick=()=>dialog.close();dialog.dataset.expires=row.expires;dialog.setAttribute('aria-label','Shared image');dialog.append(close,full);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.addEventListener('cancel',e=>e.stopPropagation());dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.showModal();};
  img.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();img.click();}};
  const note=node('small','','Disappears '+new Date(row.expires).toLocaleDateString());box.replaceChildren(img,note);box.dataset.expires=String(row.expires);
 }
 function render(container,id){const box=node('span','repo-image-message','Loading image…');box.dataset.wibsImage=id;container.append(box);observer.observe(box);}
 setInterval(()=>{const now=Date.now();for(const dialog of document.querySelectorAll('.repo-image-viewer'))if(Number(dialog.dataset.expires)<=now)dialog.close();for(const box of document.querySelectorAll('[data-wibs-image][data-expires]'))if(Number(box.dataset.expires)<=now){box.textContent='Image expired';evict(box.dataset.wibsImage);delete box.dataset.expires;}for(const [id,row]of cache)if(row.expires<=now&&!row.promise)evict(id);},30000);
 addEventListener('repo-account-state',()=>{const next=account.state.user?.id;if(next!==owner){owner=next;epoch++;for(const dialog of document.querySelectorAll('.repo-image-viewer'))dialog.close();for(const id of cache.keys())evict(id);observer.disconnect();}});
 window.repoChatImages=Object.freeze({mount,render,idFrom:text=>String(text).match(pattern)?.[1],withoutToken:text=>String(text).replace(pattern,'').trim(),preview:text=>String(text).replace(pattern,'[Image]')});
})();
