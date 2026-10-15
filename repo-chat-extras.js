(() => {
  'use strict';
  const games = [['morogue','Morogue'],['moratales','Moratales'],['manager','Velmora Manager']];
  const emotions = [['up','Thumbs up'],['down','Thumbs down'],['laugh','Laughing'],['angry','Angry'],['love','Love']];
  const columns = [0,350,684,984,1308,1619], rows = [0,358,640,971];
  const ns = 'http://www.w3.org/2000/svg';
  function emote(id) {
    const [game, emotion] = id.split('-'), r = games.findIndex(g => g[0] === game), c = emotions.findIndex(e => e[0] === emotion);
    if (r < 0 || c < 0) return document.createTextNode('');
    const svg = document.createElementNS(ns,'svg'), image = document.createElementNS(ns,'image');
    svg.classList.add('repo-emote'); svg.setAttribute('aria-hidden','true');
    svg.setAttribute('viewBox',`${columns[c]} ${rows[r]} ${columns[c+1]-columns[c]} ${rows[r+1]-rows[r]}`);
    image.setAttribute('href','/assets/chat-reactions-v1.png'); image.setAttribute('width','1619'); image.setAttribute('height','971'); svg.append(image); return svg;
  }
  function node(tag,cls,text) { const n=document.createElement(tag); n.className=cls; if(text)n.textContent=text; return n; }
  function button(label,cls,action) { const n=node('button',cls);n.type='button';n.title=label;n.setAttribute('aria-label',label);n.onclick=action;return n; }
  window.repoChatExtras = Object.freeze({mount({drawer,history,feedback,api,replaceMessage}) {
    let revision=0, reactionBusy=false;
    const picker=node('div','repo-reaction-picker'); picker.setAttribute('popover','auto');picker.setAttribute('aria-label','Choose a reaction');drawer.append(picker);
    function clear() { revision++;try{picker.hidePopover();}catch{}; }
    function dismissPicker(){try{picker.hidePopover();}catch{}}
    async function react(message, value, trigger) {
      if(reactionBusy)return;const rev=revision;reactionBusy=true;dismissPicker();
      try { const result=await api('reactions',{messageId:message.id,emote:value},()=>rev===revision);if(rev===revision){replaceMessage(result.message);history.querySelector(`[data-reaction-for="${message.id}"]`)?.focus({preventScroll:true});} }
      catch(error){if(rev===revision)feedback.textContent=error.message;}
      finally{reactionBusy=false;}
    }
    function choose(message,trigger){
      picker.replaceChildren();
      for(const [game,label] of games){
        const group=node('div','repo-reaction-group'), heading=node('span','',label), choices=node('div','repo-reaction-choices');group.append(heading,choices);
        for(const [emotion,title] of emotions){const id=game+'-'+emotion,mine=message.reactions?.some(r=>r.emote===id&&r.mine);const b=button(label+' · '+title,'repo-reaction-choice',()=>react(message,mine?null:id,trigger));b.setAttribute('aria-pressed',String(!!mine));b.append(emote(id));choices.append(b);}
        picker.append(group);
      }
      const rect=trigger.getBoundingClientRect();picker.style.left=Math.max(12,Math.min(innerWidth-284,rect.right-268))+'px';picker.style.top=Math.max(12,Math.min(innerHeight-260,rect.top-250))+'px';picker.showPopover();picker.querySelector('button').focus({preventScroll:true});
    }
    function decorate(row,message){
      const controls=node('div','repo-message-reactions');
      for(const reaction of message.reactions||[]){const title=reaction.emote.replace('-',' · ');const b=button(title+' · '+reaction.count,'repo-reaction-chip',()=>react(message,reaction.mine?null:reaction.emote,b));b.setAttribute('aria-pressed',String(reaction.mine));b.append(emote(reaction.emote),node('span','',String(reaction.count)));controls.append(b);}
      const add=button('React to message','repo-reaction-add',()=>choose(message,add));
      const smile=document.createElementNS(ns,'svg');smile.setAttribute('viewBox','0 0 24 24');smile.setAttribute('aria-hidden','true');smile.innerHTML='<circle cx="12" cy="12" r="8.5"/><path d="M8 14.5c2 3 6 3 8 0M8.5 9h.01M15.5 9h.01"/>';
      add.append(smile);add.dataset.reactionFor=message.id;add.setAttribute('aria-haspopup','true');controls.append(add);row.append(controls);
    }
    drawer.addEventListener('close',dismissPicker);
    return {decorate,clear};
  }});
})();
