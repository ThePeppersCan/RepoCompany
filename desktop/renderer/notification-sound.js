'use strict';
const sound=document.querySelector('#sound');
window.notificationSound.onSound(data=>{
  sound.pause();sound.currentTime=0;
  if(data?.volume>0){sound.volume=Math.min(1,data.volume)*.24;sound.play().catch(()=>{});}
});
