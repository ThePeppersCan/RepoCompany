// The call lives above the conversation. Collapsing it never tears down media.
(() => {
  'use strict';
  const icons={mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',sound:'<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v9H5a2 2 0 0 1-2-2v-7Zm18 0h-4v9h2a2 2 0 0 0 2-2v-7Z"/>',leave:'<path d="M3 15c4-5 14-5 18 0l-2 4-4-2v-3M3 15l2 4 4-2v-3"/>',collapse:'<path d="m6 14 6-6 6 6"/>'};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const label=(node,text)=>{node.setAttribute('aria-label',text);node.title=text;};
  const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  function button(name,kind,fn){const b=el('button','repo-call-stage-button');b.type='button';label(b,name);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[kind]+'</svg>';b.onclick=fn;return b;}
  window.createRepoCallStage=({screens,cameras,actions,portrait})=>{
    let collapsed=false,roomKey='',rosterKey='';
    const element=el('section','repo-call-stage');element.hidden=true;element.setAttribute('aria-label','Current voice call');
    const head=el('header','repo-call-stage-head'),heading=el('div','repo-call-stage-heading'),dot=el('span','repo-voice-signal'),title=el('strong'),status=el('span','repo-call-stage-status');dot.setAttribute('aria-hidden','true');heading.append(dot,title,status);
    const toggle=button('Collapse call','collapse',()=>{collapsed=!collapsed;sync();});toggle.classList.add('repo-call-stage-toggle');toggle.setAttribute('aria-controls','repo-call-stage-body');head.append(heading,toggle);
    const body=el('div','repo-call-stage-body');body.id='repo-call-stage-body';
    const media=el('div','repo-call-stage-media');media.hidden=true;
    const cameraMedia=el('div','repo-camera-grid'),cameraControls=el('div','repo-call-stage-cameras'),cameraNotice=el('div','repo-call-stage-notice');cameraMedia.hidden=cameraNotice.hidden=true;
    const roster=el('div','repo-call-stage-roster');roster.setAttribute('role','list');roster.setAttribute('aria-label','People in this call');
    const controls=el('div','repo-call-stage-controls');controls.setAttribute('role','group');controls.setAttribute('aria-label','Call controls');
    const mic=button('Mute','mic',actions.toggleMute),sound=button('Deafen','sound',actions.toggleDeafen),screenControls=el('div','repo-call-stage-sharing'),leave=button('Leave call','leave',actions.leave);leave.classList.add('repo-call-stage-leave');controls.append(mic,sound,cameraControls,screenControls,leave);
    const screenNotice=el('div','repo-call-stage-notice');screenNotice.hidden=true;
    const content=el('div','repo-call-stage-content');content.append(media,cameraMedia,roster);
    body.append(content,controls,screenNotice,cameraNotice);element.append(head,body);
    function sync(){body.hidden=collapsed;toggle.setAttribute('aria-expanded',String(!collapsed));label(toggle,collapsed?'Expand call':'Collapse call');element.classList.toggle('is-collapsed',collapsed);}
    function show(){collapsed=false;sync();}
    screens?.mount(media,show);cameras?.mount(cameraMedia,show);
    function paintSpeaking(names=[]){for(const row of roster.querySelectorAll('[data-voice-name]'))row.classList.toggle('is-speaking',names.includes(row.dataset.voiceName));}
    function update(s){
      element.hidden=!s.callActive;
      if(!s.callActive){roomKey=rosterKey='';roster.replaceChildren();return;}
      const key=s.room?.id||'joining';if(roomKey!==key){roomKey=key;collapsed=false;}
      text(title,s.title);text(status,s.connected?'Connected':'Connecting…');dot.classList.toggle('is-connected',s.connected);
      label(mic,s.serverMuted||s.serverDeafened?'Server muted':s.muted?'Unmute':'Mute');mic.setAttribute('aria-pressed',String(s.muted));mic.disabled=!s.canMute;
      label(sound,s.serverDeafened?'Server deafened':s.deafened?'Undeafen':'Deafen');sound.setAttribute('aria-pressed',String(s.deafened));sound.disabled=!s.canDeafen;
      label(leave,s.leaveLabel||'Leave call');
      const people=s.room?.members.filter(m=>m.status==='active'||m.status==='invited')||[];
      const next=JSON.stringify(people.map(m=>[m.id,m.name,m.display,m.status,m.muted,m.serverMuted,m.serverDeafened,s.room?.cameras?.active.some(t=>t.owner===m.id),cameras?.hidden(m.id)]));
      if(next!==rosterKey){
        rosterKey=next;roster.replaceChildren();
        for(const m of people){const row=el('div','repo-call-stage-person');row.dataset.voiceName=m.name;row.tabIndex=0;row.setAttribute('role','listitem');const avatar=portrait(m);avatar.classList.add('repo-call-stage-avatar');const name=el('span','repo-call-stage-name',m.display),note=el('small','repo-call-stage-person-status',m.status==='invited'?'Invited':m.serverDeafened?'Deafened':m.serverMuted||m.muted?'Muted':'');row.append(avatar,name,note);cameras?.person(row,m.id,m.display);roster.append(row);}
      }
      screens?.render(screenControls,s.room,s.connected&&s.budget?.available!==false&&!s.serverDeafened,screenNotice);
      cameras?.render(cameraControls,s.room,s.connected&&s.budget?.available!==false&&!s.serverDeafened,cameraNotice);
      paintSpeaking(s.speaking);sync();
    }
    return Object.freeze({element,update,show,paintSpeaking});
  };
})();
