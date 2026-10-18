(() => {
 'use strict';
 const layout=document.querySelector('.watch-layout');
 const $=id=>document.getElementById(id),node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
 window.repoPaneResize?.mount({host:layout,edge:'right',key:'repo-reparty-right-v1',label:'Resize queue and room chat',initial:()=>innerWidth>1300?310:innerWidth>840?274:226,min:210,max:520,available:()=>layout.clientWidth-340,apply:n=>layout.style.setProperty('--rp-right',n+'px')});
 const column=document.querySelector('.watch-column'),content=node('div','ws-player-content');
 content.append(...column.childNodes);column.append(document.querySelector('.ws-room-bar'),content);
 const media=node('div','ws-player-media'),people=node('div','ws-people-pane');
 media.append($('television'),document.querySelector('.now-playing'));people.append(document.querySelector('.participants'),document.querySelector('.room-footnote'));content.append(media,people);
 window.repoPaneResize?.mount({host:content,edge:'bottom',key:'repo-reparty-people-v1',label:'Resize people in this room',initial:()=>144,min:100,max:420,available:()=>matchMedia('(max-width:700px)').matches?420:content.clientHeight-330,inset:()=>parseFloat(getComputedStyle(content).paddingBottom)||0,apply:n=>content.style.setProperty('--rp-people-height',n+'px')});
 const controls=document.querySelector('.playback-controls');
 $('shuffleMode').textContent='';$('shuffleMode').setAttribute('aria-label','Shuffle for everyone');$('shuffleMode').innerHTML='<svg viewBox="0 0 24 24"><path d="m4 5 14 14M4 19 18 5m-5 0h5v5m-5 9h5v-5"/></svg>';
 $('repeatMode').textContent='';$('repeatMode').setAttribute('aria-label','Repeat playlist');$('repeatMode').innerHTML='<svg viewBox="0 0 24 24"><path d="M4 10V6h15m-4-4 4 4-4 4M20 14v4H5m4-4-4 4 4 4"/></svg>';
 controls.prepend($('shuffleMode'));$('nextVideo').after($('repeatMode'));$('screen').append($('fullscreen'));
 const panel=$('playlistPanel'),heading=node('div','ws-queue-heading');heading.append(node('span','','UP NEXT'));
 const search=node('button','ws-search-toggle');search.setAttribute('aria-label','Search queue');search.innerHTML='<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>';heading.append(search,document.querySelector('.playlist-options'));panel.prepend(heading);
 const searchBox=document.querySelector('.queue-search');searchBox.hidden=true;heading.after(searchBox);search.onclick=()=>{searchBox.hidden=!searchBox.hidden;search.setAttribute('aria-expanded',String(!searchBox.hidden));if(!searchBox.hidden)$('queueSearch').focus();};
 document.addEventListener('keydown',event=>{if(event.key==='/'&&!event.target.closest('input,textarea,select,[contenteditable=true]')&&!document.querySelector('dialog[open]')){searchBox.hidden=false;search.setAttribute('aria-expanded','true');}},true);
 const add=$('focusAdd'),form=$('addVideo');add.textContent='+  Add a YouTube or Suno link';form.hidden=true;add.hidden=false;
 add.addEventListener('click',()=>{form.hidden=false;$('videoUrl').focus();});
 const dismiss=node('button','ws-dismiss-add','Cancel');dismiss.type='button';dismiss.onclick=()=>{form.hidden=true;add.focus();};form.querySelector('.queue-buttons').append(dismiss);
 const playlists=node('section','ws-playlists'),playlistHead=node('div','ws-queue-heading');playlistHead.append(node('span','','YOUR PLAYLISTS'),$('newPlaylist'));const choices=node('div','ws-playlist-choices');playlists.append(playlistHead,choices);panel.append(playlists);
 document.querySelector('.playlist-picker').hidden=true;
 function paintPlaylists(){choices.replaceChildren();for(const option of $('playlistSelect').options){if(!option.value||option.value==='Our playlist'&&$('playlistSelect').disabled)continue;const b=node('button','ws-playlist-choice');b.type='button';b.setAttribute('aria-pressed',String(option.value===$('playlistSelect').value));const glyph=node('span','ws-playlist-glyph','♫'),copy=node('span','',option.textContent);b.append(glyph,copy);b.disabled=$('playlistSelect').disabled;b.onclick=()=>{$('playlistSelect').value=option.value;$('playlistSelect').dispatchEvent(new Event('change'));paintPlaylists();};choices.append(b);}}
 new MutationObserver(paintPlaylists).observe($('playlistSelect'),{childList:true,attributes:true});paintPlaylists();
 const names={bg:'bg',surface:'panel',raised:'raised',ink:'ink',muted:'muted',accent:'accent',line:'line','on-accent':'on-accent'};
 addEventListener('message',event=>{
  if(parent===window||event.source!==parent||event.origin!==location.origin||event.data?.type!=='repo-workspace-theme')return;
  const values=event.data.vars;if(!values||typeof values!=='object')return;
  for(const [key,css] of Object.entries(names)){const value=values[key];if(typeof value==='string'&&value.length<200&&CSS.supports('color',value))document.documentElement.style.setProperty('--'+css,value);}
  document.documentElement.style.colorScheme=event.data.light?'light':'dark';
 });
})();
