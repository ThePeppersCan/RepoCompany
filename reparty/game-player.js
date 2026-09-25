// Keep the existing YouTube iframe and playlist in place: mode changes never reload media.
export function createGamePlayer() {
  const $ = id => document.getElementById(id);
  const layout = document.querySelector('.watch-layout');
  const header = document.createElement('div'); header.className = 'mini-player-header';
  header.innerHTML = '<strong>♫ Watch & listen</strong><button id="miniQueue" aria-expanded="false" aria-controls="playlistPanel">Queue</button><button id="miniSide" aria-label="Move player to bottom left" title="Move to other corner">⇄</button><button id="miniHide" aria-label="Hide player, keep audio playing">Hide</button>';
  layout.prepend(header);
  const form = document.createElement('form');form.className='mini-add-video';form.id='miniAddVideo';
  form.innerHTML='<label class="sr-only" for="miniVideoUrl">Queue a YouTube video</label><input id="miniVideoUrl" placeholder="Paste a YouTube link…" maxlength="2048" autocomplete="off" required><button id="miniAddButton">+ Queue</button>';
  document.querySelector('.sidebar').prepend(form);
  const launcher=document.createElement('div');launcher.className='mini-player-launcher';
  launcher.innerHTML='<button id="miniShow" aria-label="Show video player and queue">♫ Player</button><button id="miniMute" aria-label="Mute my audio">Mute</button>';
  document.body.append(launcher);
  let active=false, hidden=false, left=false, queue=false;
  try { hidden=localStorage.getItem('reparty-mini-hidden')==='true';left=localStorage.getItem('reparty-mini-left')==='true'; } catch {}
  function draw(){
    document.documentElement.classList.toggle('mini-hidden',active&&hidden);
    document.documentElement.classList.toggle('mini-left',left);
    document.documentElement.classList.toggle('mini-queue',queue);
    layout.inert=active&&hidden;
    $('miniQueue').setAttribute('aria-expanded',String(queue));
    $('miniSide').setAttribute('aria-label',left?'Move player to bottom right':'Move player to bottom left');
  }
  function save(){try{localStorage.setItem('reparty-mini-hidden',String(hidden));localStorage.setItem('reparty-mini-left',String(left));}catch{}draw();}
  $('miniHide').onclick=()=>{hidden=true;save();$('miniShow').focus();};
  $('miniShow').onclick=()=>{hidden=false;save();$('miniHide').focus();};
  $('miniSide').onclick=()=>{left=!left;save();};
  $('miniQueue').onclick=()=>{queue=!queue;draw();if(queue){$('playlistPanel').hidden=false;$('miniVideoUrl').focus();}};
  $('miniMute').onclick=()=>{$('mute').click();};
  const syncMute=()=>{const muted=$('mute').getAttribute('aria-label')==='Unmute my audio';$('miniMute').textContent=muted?'Unmute':'Mute';$('miniMute').setAttribute('aria-label',muted?'Unmute my audio':'Mute my audio');$('miniMute').disabled=$('mute').disabled;};
  new MutationObserver(syncMute).observe($('mute'),{attributes:true,attributeFilter:['aria-label','disabled']});syncMute();
  new MutationObserver(()=>{$('miniAddButton').disabled=$('addButton').disabled;}).observe($('addButton'),{attributes:true,attributeFilter:['disabled']});
  form.onsubmit=e=>{e.preventDefault();$('videoUrl').value=$('miniVideoUrl').value;$('addVideo').requestSubmit();};
  return {update(value){active=value;draw();}, connected(value){$('miniAddButton').disabled=!value;$('miniVideoUrl').disabled=!value;}};
}
