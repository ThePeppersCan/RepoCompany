const {ipcRenderer}=require('electron');
addEventListener('DOMContentLoaded',()=>document.getElementById('stop').addEventListener('click',e=>{if(e.isTrusted)ipcRenderer.send('launcher:mouse-stop');}));
