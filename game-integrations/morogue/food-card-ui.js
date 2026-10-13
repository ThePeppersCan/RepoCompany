(function(root){
 'use strict';
 const Cards=root.MOROGUE_FOOD_CARDS;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 function flourish(b,host){
  b.querySelector('.mr-food-fx')?.remove();
  if(host.classList.contains('vs-reduced')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const fx=el('span','mr-food-fx');fx.setAttribute('aria-hidden','true');
  // A single, bounded burst follows the paper edges; it never covers the copy.
  for(let i=0;i<10;i++){const p=el('i','mr-food-mote'),side=i%2?-1:1;p.style.setProperty('--mote-x',side*(16+(i%4)*7)+'px');p.style.setProperty('--mote-y',(-25-(i%5)*12)+'px');p.style.setProperty('--mote-delay',(80+(i%5)*24)+'ms');p.style.left=side<0?'3%':'97%';p.style.top=(18+(i%5)*16)+'%';p.style.setProperty('--mote-size',(i%3===0?4:3)+'px');fx.append(p);}
  b.append(fx);fx.lastElementChild.addEventListener('animationend',()=>fx.remove(),{once:true});
 }
 function draft({host,choices,state,ready,choose,turn=()=>{}}){
  const hand=el('div','vs-upgrades mr-food-hand'),take=el('button','mr-food-take','Inspect a card'),buttons=[];let inspected=null;
  hand.setAttribute('aria-label','Three food cards');take.type='button';take.dataset.draftTake='';take.setAttribute('aria-disabled','true');
  const inspect=(choice,b)=>{if(host.classList.contains('vs-draft-closing'))return;const changed=!b.classList.contains('is-inspected');inspected=choice;for(const n of buttons){n.classList.toggle('is-inspected',n===b);n.setAttribute('aria-expanded',String(n===b));}take.textContent='Take '+Cards.present(choice,state).name;if(changed){b.inspectedAt=Date.now();flourish(b,host);turn();}};
  choices.forEach((raw,i)=>{
   const choice=Cards.present(raw,state),card=choice.food;if(!card)throw Error('Missing food card: '+Cards.keyFor(raw,state));
   const b=Cards.theme(el('button','vs-upgrade mr-food-choice'),card),lift=el('span','mr-food-lift'),inner=el('span','mr-food-turn'),front=Cards.face(card,choice.level),back=el('span','mr-food-back'),stock=Cards.face(card,choice.level),copy=el('span','mr-food-back-copy'),shortcut=el('span','vs-shortcut',String(i+1));
   b.style.setProperty('--rest-angle',(i-1)*3+'deg');b.style.setProperty('--deal-x',(i-1)*-36+'px');b.pointerIntent=false;
   if(raw.rarity==='rare'){front.querySelector('.mr-food-number').textContent='RARE';b.dataset.rarity='rare';}
   b.type='button';b.dataset.upgrade=raw.id;b.dataset.kind=raw.kind;b.dataset.foodKey=card.key;b.style.setProperty('--card-order',i);b.style.setProperty('--food-ink',Cards.families[card.family].colour);b.setAttribute('aria-label',(raw.rarity==='rare'?'Rare transformation. ':'')+choice.name+'. '+choice.description+(choice.detail?' '+choice.detail:''));b.setAttribute('aria-keyshortcuts',String(i+1));b.setAttribute('aria-expanded','false');b.setAttribute('aria-disabled','true');b.tabIndex=-1;
   front.classList.add('mr-food-front');front.setAttribute('aria-hidden','true');shortcut.setAttribute('aria-hidden','true');
   stock.classList.add('mr-food-back-stock');stock.setAttribute('aria-hidden','true');stock.removeAttribute('data-food-card');
   copy.append(el('small','mr-food-kind',raw.rarity==='rare'?'Rare transformation':Cards.label(card)),el('strong','mr-food-back-title',card.name),el('span','vs-draft-description',choice.description));
   if(choice.detail)copy.append(el('span','vs-draft-detail',choice.detail));
   const evo=raw.kind==='weapon'?state.mainWeapon===raw.id&&root.MORATALES_SURVIVOR.EVOLUTIONS[raw.id]:raw.kind==='passive'?Object.values(root.MORATALES_SURVIVOR.EVOLUTIONS).find(e=>e.passive===raw.id):null;
   if(evo)copy.append(el('span','vs-draft-pair',raw.kind==='weapon'?'Recipe: '+root.MORATALES_SURVIVOR.PASSIVES[evo.passive].name+' II':'Recipe: '+evo.name));
   copy.append(el('span','mr-food-choice-hint','Choose · '+(i+1)));back.append(stock,copy);inner.append(front,back);lift.append(inner);b.append(lift,shortcut);
   /* Animated faces must not steal keyboard focus by re-entering a stationary pointer. */ b.onfocus=()=>inspect(raw,b);
   b.onpointerdown=e=>{b.pointerArmed=ready()&&(e.pointerType==='touch'||b.pointerIntent&&b.classList.contains('is-inspected')&&Date.now()-b.inspectedAt>=160);b.pointerKind=e.pointerType;b.pointerStart={x:e.clientX,y:e.clientY};};
   b.onpointermove=e=>{if(!e.buttons&&e.pointerType==='mouse'&&ready()){b.pointerIntent=true;inspect(raw,b);}if(e.buttons&&b.pointerStart&&Math.hypot(e.clientX-b.pointerStart.x,e.clientY-b.pointerStart.y)>8)b.pointerArmed=false;};b.onpointercancel=()=>{b.pointerArmed=false;};
   b.onclick=e=>{if(e.detail>0&&!b.pointerArmed)return;b.pointerArmed=false;if(e.detail>0&&b.pointerKind==='touch'){inspect(raw,b);return;}if(ready())choose(raw.id);};buttons.push(b);hand.append(b);
  });
  take.onclick=()=>{if(ready()&&inspected)choose(inspected.id);};
  host.onkeydown=e=>{if(!host.classList.contains('mr-food-draft')||!ready()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();e.stopPropagation();const at=buttons.indexOf(document.activeElement),next=at<0?0:(at+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+buttons.length)%buttons.length;buttons[next].focus({preventScroll:true});};
  const glossary=el('details','vs-fineprint mr-food-glossary'),summary=el('summary','','Combat terms');glossary.append(summary,el('p','','Main attack: your sword or coffee attack. Special: E / right-click. Finisher: the third attack of a combo. Clean hit: tap your next attack as the previous one recovers. Perfect dodge: dash through a damaging attack. Mark: the target takes 15% more main-attack damage; marks do not stack. Steps measure distance on the arena floor. Healing is reduced to 57.5% during great-adversary fights and increased by 15% during other boss fights.'));
  host.append(hand,take,glossary);return {hand,take,buttons};
 }
 root.MOROGUE_FOOD_UI={draft};
})(globalThis);
