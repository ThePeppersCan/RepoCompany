'use strict';
let timer;
document.querySelector('#open').onclick=()=>window.messagePreview.open();
document.querySelector('#dismiss').onclick=()=>window.messagePreview.dismiss();
window.messagePreview.onMessage(data=>{
  document.querySelector('#sender').textContent=data.name;document.querySelector('#text').textContent=data.text;
  const preview=document.querySelector('#preview');preview.classList.remove('leaving');preview.style.animation='none';void preview.offsetWidth;preview.style.animation='';
  clearTimeout(timer);timer=setTimeout(()=>preview.classList.add('leaving'),5600);
  const sound=document.querySelector('#sound');sound.pause();sound.currentTime=0;sound.volume=Math.min(1,data.volume)*.24;if(data.volume>0)sound.play().catch(()=>{});
});
