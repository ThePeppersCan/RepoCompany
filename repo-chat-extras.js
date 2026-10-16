(() => {
  'use strict';
  const catalog=Object.freeze([['wave','Wave'],['love','Love'],['laugh','Laugh'],['hype','Hype'],['wow','Wow'],['sad','Sad'],['angry','Angry'],['sleepy','Sleepy']].map(([id,label])=>Object.freeze({id:'wibs-'+id,label:'Wibs · '+label})));
  const legacy={'👍':'wibs-wave','❤️':'wibs-love','😂':'wibs-laugh','🎉':'wibs-hype','👀':'wibs-wow','🌿':'wibs-sleepy'};
  function resolve(id){if(catalog.some(e=>e.id===id))return id;if(Object.hasOwn(legacy,id))return legacy[id];const m=String(id).match(/^(?:morogue|moratales|manager)-(up|down|laugh|angry|love)$/);return m?'wibs-'+({up:'wave',down:'sad'}[m[1]]||m[1]):null;}
  const label=id=>catalog.find(e=>e.id===resolve(id))?.label||'Wibs reaction';
  function emote(id) {
    const key=resolve(id);if(!key)return document.createTextNode('');
    const image=document.createElement('img');image.className='repo-emote wibs-emote';image.alt='';image.setAttribute('aria-hidden','true');image.draggable=false;image.src='/assets/wibs-emotes/'+key.slice(5)+'.svg';return image;
  }
  function node(tag,cls,text) { const n=document.createElement(tag); n.className=cls; if(text)n.textContent=text; return n; }
  function button(label,cls,action) { const n=node('button',cls);n.type='button';n.title=label;n.setAttribute('aria-label',label);n.onclick=action;return n; }
  function createPicker(drawer,onSelect){
    const picker=node('div','repo-reaction-picker');picker.setAttribute('popover','auto');picker.setAttribute('role','dialog');picker.setAttribute('aria-label','Wibs emotes');drawer.append(picker);
    const clear=()=>{try{picker.hidePopover();}catch{}};
    function choose(message,trigger){
      // Wibs rebuilds the drawer after the DM module mounts.
      if(!picker.isConnected)drawer.append(picker);
      picker.replaceChildren(node('strong','repo-reaction-heading','Wibs emotes'));const choices=node('div','repo-reaction-choices');
      for(const item of catalog){const mine=message.reactions?.some(r=>resolve(r.emote||r.emoji)===item.id&&r.mine),b=button(item.label,'repo-reaction-choice',()=>{clear();if(trigger.isConnected)trigger.focus({preventScroll:true});onSelect(message,mine?null:item.id,trigger);});b.setAttribute('aria-pressed',String(!!mine));b.append(emote(item.id));choices.append(b);}
      picker.append(choices);picker.showPopover();const rect=trigger.getBoundingClientRect(),box=picker.getBoundingClientRect(),gap=8;
      picker.style.left=Math.max(gap,Math.min(innerWidth-box.width-gap,rect.right-box.width))+'px';picker.style.top=Math.max(gap,Math.min(innerHeight-box.height-gap,rect.top>=box.height+gap?rect.top-box.height-gap:rect.bottom+gap))+'px';picker.querySelector('button').focus({preventScroll:true});
    }
    drawer.addEventListener('close',clear);addEventListener('resize',clear);return {choose,clear};
  }
  window.repoChatExtras = Object.freeze({catalog,emote,label,createPicker,mount({drawer,history,feedback,api,replaceMessage}) {
    let revision=0, reactionBusy=false;
    const picker=createPicker(drawer,react);
    function clear() { revision++;picker.clear(); }
    async function react(message, value, trigger) {
      if(reactionBusy)return;const rev=revision;reactionBusy=true;picker.clear();
      try { const result=await api('reactions',{messageId:message.id,emote:value},()=>rev===revision);if(rev===revision){replaceMessage(result.message);history.querySelector(`[data-reaction-for="${message.id}"]`)?.focus({preventScroll:true});} }
      catch(error){if(rev===revision)feedback.textContent=error.message;}
      finally{reactionBusy=false;}
    }
    function decorate(row,message){
      const controls=node('div','repo-message-reactions');
      for(const reaction of message.reactions||[]){const b=button(label(reaction.emote)+' · '+reaction.count,'repo-reaction-chip',()=>react(message,reaction.mine?null:reaction.emote,b));b.setAttribute('aria-pressed',String(reaction.mine));b.append(emote(reaction.emote),node('span','',String(reaction.count)));controls.append(b);}
      const add=button('React to message','repo-reaction-add',()=>picker.choose(message,add));
      add.append(emote('wibs-wave'));add.dataset.reactionFor=message.id;add.setAttribute('aria-haspopup','dialog');controls.append(add);row.append(controls);
    }
    return {decorate,clear};
  }});
})();
