(function(root){
 'use strict';
 const F=root.MOROGUE_FOOD_CARDS,R=root.MOROGUE_RELICS;
 const originals={saffron:'clock',sugar:'prism',honeycomb:'beekeeper',salt:'kiln',olives:'oracle'};
 const palette={nutmeg:['#734950','#e1cda1','#f5e4bc'],marmalade:['#9a502f','#ddc095','#fae7bc'],starter:['#686e42','#d7c898','#fff0c4']};
 // Explicit source rectangles avoid neighbouring illustrations bleeding into a card.
 const xs=[0,201,393,579,770,971],ys=[0,324,633,933,1229,1619];
 const frame=i=>{const col=i%5,row=Math.floor(i/5);return [xs[col]+3,ys[row]+3,xs[col+1]-xs[col]-6,ys[row+1]-ys[row]-6];};
 const entries=Object.entries(R.ITEMS).map(([id,spec],i)=>{
  const old=originals[id]&&F.get('relic:'+originals[id]),colors=palette[id]||['#3d3937','#d9c79f','#f5e5bc'];
  return Object.freeze({...old,id,key:'relic:'+id,kind:'relic',family:'provisions',index:80+i,name:spec.name,description:spec.description,detail:spec.detail,risky:spec.risky,...(i>=30?{art:'https://repocompany.uk/game-integrations/morogue/relics-20261015/relic-expansion-25.png',single:true,atlas:i-30,atlasColumns:5,atlasRows:5,sourceFrame:frame(i-30),sourceSize:[971,1619],crop:[0,0,384,640],field:colors[0],paper:colors[1],ink:colors[2]}:!old?{art:i>=8?'assets/morogue/merchant/relic-atlas-v2.png':'assets/morogue/merchant/'+id+'.png',single:true,...(i>=8?{atlas:i-8}:{}),crop:[0,0,384,640],field:colors[0],paper:colors[1],ink:colors[2]}:{})});
 });
 for(let i=F.all.length-1;i>=0;i--)if(F.all[i].kind==='relic'){delete F.cards[F.all[i].key];F.all.splice(i,1);}
 for(const card of entries){F.cards[card.key]=card;F.all.push(card);}
 F.category.relic='Merchant relic';
})(globalThis);
