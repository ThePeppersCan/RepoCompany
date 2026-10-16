// Derive crisp expressions from Wibs's original vector silhouette.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/wibs-icon.svg'),'utf8');
const body=source.match(/<g fill="#f4ecd6" mask="url\(#face\)">([\s\S]*?)<\/g>/)[1];
const ink='#252923',cream='#f4ecd6',pink='#e890a8',blue='#85c9e6';
const pathTag=(d,fill=ink,stroke='',width=14)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const line=d=>pathTag(d,'none',ink);
const oval=(x,y,rx,ry,fill=ink)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
const eyes=oval(517,663,30,47)+oval(734,663,30,47),smile=line('M608 688Q626 709 643 688');
const heart=(x,y,size)=>`<g transform="translate(${x} ${y}) scale(${size})">${pathTag('M0 15C-14 3-31-9-23-22C-17-32-5-28 0-20C5-28 17-32 23-22C31-9 14 3 0 15',pink)}</g>`;
const star=(x,y,size,color)=>`<g transform="translate(${x} ${y}) scale(${size})">${pathTag('M0-27 8-8 28-7 13 7 18 27 0 16-18 27-13 7-28-7-8-8Z',color)}</g>`;
const blush=oval(453,717,27,13,'#e8b39f')+oval(798,717,27,13,'#e8b39f');
const expressions={
 wave:{label:'Wave',face:eyes+smile,body:body.replace(/<path d="M675 837[^>]+\/>/,'')+pathTag('M655 775H800V844H655Z',cream)+`<g transform="translate(110 -170) rotate(-18 730 837)">${pathTag('M675 837C676 811 700 795 730 794C757 795 779 813 779 838C781 858 758 868 728 868C697 869 670 860 675 837Z',cream,'#c6b998',10)}</g>`,extra:pathTag('M919 540Q954 565 952 600M951 514Q994 546 991 595','none','#b5d39c',15)},
 love:{label:'Love',face:heart(517,665,1.5)+heart(734,665,1.5)+smile+blush,extra:heart(819,378,1.1)},
 laugh:{label:'Laugh',face:line('M482 634 532 661 482 684M768 634 718 661 768 684')+pathTag('M579 701Q626 724 674 701Q672 772 626 772Q580 772 579 701Z')+pathTag('M598 754Q626 736 653 754Q641 770 626 770Q610 770 598 754Z',pink)+blush,extra:''},
 hype:{label:'Hype',face:star(517,663,1.45,'#b38b36')+star(734,663,1.45,'#b38b36')+pathTag('M594 713Q626 731 658 713Q655 761 626 761Q597 761 594 713Z'),extra:star(338,449,.8,'#e9c671')+star(907,420,.7,pink)+pathTag('M427 354 442 382M864 342 847 372M300 522 316 511','none','#b5d39c',14)},
 wow:{label:'Wow',face:oval(517,663,35,51)+oval(734,663,35,51)+oval(507,644,9,13,cream)+oval(724,644,9,13,cream)+oval(626,733,23,31),extra:star(886,393,.65,'#a8c6ec')},
 sad:{label:'Sad',face:oval(517,674,29,40)+oval(734,674,29,40)+line('M477 637Q517 620 550 600M701 600Q734 620 774 637M606 740Q626 720 646 740')+pathTag('M766 703Q799 745 790 769Q778 789 760 772Q744 757 766 703Z',blue),extra:''},
 angry:{label:'Angry',face:oval(517,679,28,35)+oval(734,679,28,35)+line('M475 618 554 646M698 646 777 618M601 742Q626 718 650 742')+oval(447,718,24,12,'#e8b39f')+oval(805,718,24,12,'#e8b39f'),extra:pathTag('M817 390V412H797M832 390V412H852M797 427H817V449M832 449V427H852','none','#d08a80',10)},
 sleepy:{label:'Sleepy',face:line('M481 664Q517 692 553 664M698 664Q734 692 770 664')+oval(626,726,16,12),extra:pathTag('M843 402H880L843 438H880M908 335H953L908 379H953','none','#a8c6ec',11)}
};
const out=path.join(root,'assets/wibs-emotes');fs.mkdirSync(out,{recursive:true});
const outline='<defs><filter id="outline" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="4" result="edge"/><feFlood flood-color="#b0a183"/><feComposite in2="edge" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
for(const [id,e]of Object.entries(expressions))fs.writeFileSync(path.join(out,id+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="230 300 800 600" role="img" aria-label="Wibs ${e.label}">${outline}<g fill="${cream}" filter="url(#outline)">${e.body||body}</g>${e.face}${e.extra}</svg>\n`);
console.log('Built eight Wibs expressions from the original silhouette.');
