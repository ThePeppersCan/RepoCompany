(() => {
 'use strict';
 const dialog=document.createElement('dialog');
 dialog.id='repo-downloads';dialog.className='repo-downloads';dialog.setAttribute('aria-labelledby','repo-download-title');
 dialog.innerHTML=`<button class="repo-download-close" type="button" aria-label="Close downloads">×</button><img class="repo-download-brand" src="/assets/brand/repo-company-mark.png" alt=""><h2 id="repo-download-title">Get Repo Company</h2><p class="repo-download-intro">Choose the app for your device.</p><div class="repo-download-options"><a class="repo-download-option" href="/app/?install=1"><span class="repo-download-device" aria-hidden="true"><svg viewBox="0 0 24 32"><rect x="4" y="2" width="16" height="28" rx="3"/><path d="M9 5h6M10 26h4"/></svg></span><span><strong>Phone app</strong><small>iPhone &amp; Android</small><span>Wibs, Wibsworth, your profile and achievements.</span></span><b aria-hidden="true">↗</b></a><a class="repo-download-option" href="/download/windows"><span class="repo-download-device" aria-hidden="true"><svg viewBox="0 0 32 32"><rect x="2" y="4" width="28" height="19" rx="2"/><path d="M16 23v5M10 29h12"/></svg></span><span><strong>Desktop app</strong><small>Windows</small><span>Games, Wibs, your profile and achievements.</span></span><b aria-hidden="true">↓</b></a></div><p class="repo-download-note">Free to install. On iPhone, open the phone app in Safari and choose Share → Add to Home Screen.</p>`;
 document.body.append(dialog);
 const close=()=>dialog.close();dialog.querySelector('.repo-download-close').onclick=close;
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
 const open=()=>{if(!dialog.open)dialog.showModal();};
 document.getElementById('download-client')?.addEventListener('click',event=>{event.preventDefault();open();});
 window.repoDownloads=Object.freeze({open});
})();
