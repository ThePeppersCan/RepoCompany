const CACHE='repo-phone-shell-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/app/offline.html','/assets/brand/repo-company-mark.png']))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('repo-phone-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 // Never cache account/API responses, authentication redirects or conversations.
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname.startsWith('/app/'))event.respondWith(fetch(event.request).catch(()=>caches.match('/app/offline.html')));
 else if(url.pathname==='/assets/brand/repo-company-mark.png')event.respondWith(fetch(event.request).catch(()=>caches.match(url.pathname)));
});
