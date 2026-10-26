// Original cosmetic collection. Knife and finish selection never changes play.
import {PREMIUM_FINISHES} from './premium-catalog.js?v=2.17.0';
export const KNIVES=Object.freeze([
 {id:'wake',name:'Wake',family:'Field knife',animationProfile:'fixed',description:'A broad drop point, ribbed grip and exposed steel tang.',iconPath:'M5 15 L32 15 L36 12 L40 12 L40 15 L92 13 L114 20 L91 28 L40 25 L40 28 L36 28 L32 25 L5 25 Z'},
 {id:'needle',name:'Needle',family:'Stiletto',animationProfile:'stiletto',description:'A narrow diamond blade with polished bolsters and a long grip.',iconPath:'M6 15 L34 15 L37 10 L41 10 L41 17 L112 20 L41 23 L41 30 L37 30 L34 25 L6 25 Z'},
 {id:'crescent',name:'Crescent',family:'Ring blade',animationProfile:'ring',description:'A swept claw, sculpted scales and a rounded finger ring.',spinPivot:{x:0,y:0,z:.133},spinAxis:{x:0,y:1,z:0},iconPath:'M4 20 A9 9 0 1 1 22 20 A9 9 0 1 1 4 20 M10 20 A3 3 0 1 0 16 20 A3 3 0 1 0 10 20 M21 15 Q42 10 55 17 Q78 30 110 8 Q95 39 67 33 Q50 29 43 25 L22 26 Z'},
 {id:'sentry',name:'Sentry',family:'Bayonet',animationProfile:'bayonet',description:'A long fuller, pierced guard and checkered field grip.',iconPath:'M4 15 L30 15 L32 11 L37 11 L37 4 L41 4 L41 15 L99 15 L116 20 L101 26 L41 25 L41 31 L37 31 L37 25 L4 25 Z'},
 {id:'rift',name:'Rift',family:'Tanto',animationProfile:'tanto',description:'An angular secondary edge, wide flats and inset grip panels.',iconPath:'M6 15 L34 15 L39 13 L41 15 L113 15 L101 29 L41 26 L36 25 L6 25 Z'},
 {id:'drift',name:'Drift',family:'Clip point',animationProfile:'bowie',description:'A deep belly, clipped spine and gently curved handle.',iconPath:'M6 14 Q19 11 33 15 L36 11 L40 11 L40 14 L87 14 Q99 19 116 10 L108 24 Q91 34 57 29 L40 25 L40 29 L36 29 L33 25 Q19 28 6 25 Z'},
 {id:'latch',name:'Latch',family:'Folding knife',animationProfile:'folder',description:'A working blade pivot, machined liner and contoured scales.',iconPath:'M5 16 Q16 9 34 14 L43 17 L95 12 L113 17 Q106 28 76 28 L43 25 Q25 31 7 25 Z'},
 {id:'vesper',name:'Vesper',family:'Butterfly',animationProfile:'butterfly',description:'Twin skeleton handles on independent polished hinge pins.',iconPath:'M5 12 L34 12 L40 16 L99 14 L115 20 L99 26 L40 24 L34 28 L5 28 L5 22 L34 21 L34 19 L5 18 Z'},
]);

export const KNIFE_FINISHES=Object.freeze([
 {id:'brushed',name:'Brushed Alloy',description:'Satin steel with fine cross-grain etching.',colors:['#c8d1d4','#586970','#edf2ed'],swatch:'linear-gradient(115deg,#e1e8e7,#61747e 48%,#cdd5d6)'},
 {id:'violet',name:'Night Violet',description:'Deep violet coating, graphite scales and bright steel edges.',colors:['#493b67','#101720','#8860ab'],swatch:'linear-gradient(115deg,#111923,#493269,#9873bb)'},
 {id:'crimson',name:'Crimson Vein',description:'Crimson lacquer crossed by dark mineral veins.',colors:['#b53435','#391e2b','#e16b5a'],swatch:'linear-gradient(125deg,#351f29,#ab3035 55%,#dd6654)'},
 {id:'amber',name:'Amber Stripe',description:'Warm anodized metal with broad graphite striping.',colors:['#d5a642','#533e23','#f0d887'],swatch:'repeating-linear-gradient(120deg,#d7a940 0 14%,#634521 15% 23%,#ebca68 24% 38%)'},
 {id:'prism',name:'Prism Temper',description:'A tempered spectrum of midnight blue, violet and pale gold.',colors:['#3b69ab','#795bb0','#d8c27f'],swatch:'linear-gradient(110deg,#244771,#526ec0,#8e5da4,#ddc47f)'},
 {id:'copper',name:'Weathered Copper',description:'Burnished copper with worn edges and muted green patina.',colors:['#a96c45','#426b61','#d7ac79'],swatch:'linear-gradient(125deg,#4f7164,#a96b43 48%,#dbb184)'},
 {id:'obsidian',name:'Obsidian Damascus',description:'Blackened steel with flowing silver layers and a satin edge.',colors:['#151c25','#9aabb7','#3e5163'],swatch:'repeating-radial-gradient(ellipse at 15% 45%,#17212b 0 8%,#7f929f 10% 12%,#334451 15% 22%)'},
 {id:'glacier',name:'Glacier Shard',description:'Pale blue facets, frost-white fracture lines and deep navy scales.',colors:['#9bd9e2','#1e4974','#e8f6f3'],swatch:'conic-gradient(from 35deg,#dff9f6,#6faac8,#163e66,#bfe7ee,#dff9f6)'},
 {id:'jade',name:'Jade Serpent',description:'Emerald lacquer with a fine overlapping scale pattern and gold hardware.',colors:['#24795c','#0e302d','#b6c68a'],swatch:'repeating-radial-gradient(circle at 25% 50%,#78a86a 0 3%,#1d6c50 5% 12%,#0d302c 14% 18%)'},
 {id:'porcelain',name:'Porcelain Bloom',description:'Ivory ceramic coating with cobalt botanical etching and dark blue scales.',colors:['#eee9dc','#25476a','#8da8b7'],swatch:'radial-gradient(ellipse at 70% 45%,#2d5278 0 9%,transparent 10%),linear-gradient(115deg,#c9d6db,#f3eee1 52%,#7391a5)'},
 {id:'ember',name:'Emberglass',description:'Charcoal ceramic with copper-red fracture inlays and a smoked steel edge.',colors:['#211d25','#bd482d','#edb45a'],swatch:'repeating-linear-gradient(135deg,#211c24 0 24%,#b9472c 25% 28%,#edb45a 29% 30%,#2f2024 32% 47%)'},
 {id:'royal',name:'Royal Filigree',description:'Indigo enamel, engraved gold scrollwork and restrained warm fittings.',colors:['#242344','#c6a45c','#69547e'],swatch:'repeating-radial-gradient(ellipse at 20% 40%,#272440 0 13%,#c7aa68 14% 16%,#49405f 17% 28%)'},
 {id:'carbon',name:'Carbon Satin',description:'Charcoal twill under a satin clearcoat, with titanium pins and a clean ground edge.',colors:['#283139','#10161d','#65747d'],swatch:'repeating-conic-gradient(#202932 0 25%,#47535d 0 50%) 0 0 / 12px 12px'},
 {id:'aurora',name:'Aurora Titanium',description:'Anodized titanium ribbons move from petrol green to plum in the light.',colors:['#3d776f','#604b80','#c1b5a4'],swatch:'linear-gradient(120deg,#173b42,#5c9388,#645282,#b1a1a5)'},
 {id:'goldline',name:'Goldline',description:'Black ceramic interrupted by precise gold inlay and warm brushed fittings.',colors:['#171a1f','#b79953','#444951'],swatch:'repeating-linear-gradient(135deg,#171b21 0 29%,#bfa667 30% 31%,#30363e 32% 49%)'},
 {id:'pearl',name:'Pearl Ceramic',description:'Pearlescent ivory ceramic, a cool silver edge and soft grey scales.',colors:['#e7e6df','#aaa9b9','#d5e6de'],swatch:'linear-gradient(115deg,#eae7dd,#c3bacf,#e8eade,#b6cfcc)'},
 {id:'viper',name:'Viper Scale',description:'Olive scales cut into dark steel, with polished ridges and a matte field grip.',colors:['#616a3c','#222e28','#b2ad72'],swatch:'repeating-conic-gradient(from 45deg,#263229 0 25%,#6e7548 0 50%) 0 0 / 16px 16px'},
 {id:'signal',name:'Signal Orange',description:'Safety-orange ceramic panels, worn ivory markings and exposed graphite steel.',colors:['#c16836','#29333c','#dcd8c9'],swatch:'linear-gradient(115deg,#c16a3a 0 52%,#ded9c7 53% 59%,#28323a 60%)'},
 {id:'tidal',name:'Tidal Steel',description:'Deep-blue acid etching flows around pale, polished waterline contours.',colors:['#203c54','#82abb6','#b9ced0'],swatch:'repeating-radial-gradient(ellipse at 10% 100%,#234256 0 14%,#85aeb9 15% 18%,#344e62 19% 28%)'},
 {id:'rose',name:'Rose Guilloche',description:'Engine-turned rose gold with fine interlocking arcs and oxblood scales.',colors:['#bc8d7a','#5e3e42','#e0beaa'],swatch:'repeating-radial-gradient(ellipse at 40% 70%,#b58b7c 0 5%,#e3c7b2 6% 7%,#72504d 8% 10%)'},
 {id:'meteor',name:'Meteorite',description:'Angular nickel-iron crystal bands, subdued silver highlights and dark hardware.',colors:['#737a7b','#313d45','#c5cac7'],swatch:'repeating-linear-gradient(142deg,#38464d 0 12%,#939e9d 13% 17%,#52636a 18% 31%)'},
 {id:'dune',name:'Dune Topography',description:'Bronze terrain contours over sand-coloured steel, with dark desert scales.',colors:['#ac9369','#5c4e36','#d4c29b'],swatch:'repeating-radial-gradient(ellipse at 80% 20%,#9f8760 0 9%,#d0ba8e 10% 12%,#62533b 13% 17%)'},
 {id:'marble',name:'Marble Ink',description:'Warm white ceramic cut with charcoal mineral seams and a satin silver edge.',colors:['#dfdfd6','#333b42','#9babae'],swatch:'repeating-linear-gradient(125deg,#dfe1d8 0 23%,#47535a 24% 26%,#b4bcb7 27% 30%,#ece9df 31% 46%)'},
 {id:'petrol',name:'Petrol Temper',description:'Smoked oil-tempered steel with restrained bronze, violet and blue interference.',colors:['#303c55','#816a71','#a79765'],swatch:'linear-gradient(110deg,#263d47,#69658a,#977a63,#314c59)'},
 {id:'blueprint',name:'Blueprint',description:'Navy enamel with fine ivory drafting lines and brushed silver hardware.',colors:['#244962','#b6c9cb','#101e2d'],swatch:'repeating-linear-gradient(0deg,transparent 0 10px,#9cafb24f 11px 12px),repeating-linear-gradient(90deg,#244962 0 10px,#9cafb24f 11px 12px)'},
 {id:'garnet',name:'Garnet Mosaic',description:'Deep garnet enamel facets separated by dark nickel and fine rose-gold seams.',colors:['#743444','#261c2a','#bd8b71'],swatch:'conic-gradient(from 35deg,#6d2f41,#a25760,#391f32,#b3786b,#6d2f41)'},
 {id:'blackstone',name:'Blackstone',description:'Stonewashed black steel, fine mineral flecks and restrained graphite fittings.',colors:['#343c42','#141e27','#858b87'],swatch:'radial-gradient(ellipse at 30% 30%,#69726e 0 1%,transparent 2%),linear-gradient(130deg,#202b32,#4e575b,#202830)'},
 {id:'scrimshaw',name:'Scrimshaw',description:'Bone-coloured ceramic with fine charcoal scroll engraving and walnut-brown scales.',colors:['#d3c8ad','#594b3e','#a68c64'],swatch:'repeating-radial-gradient(ellipse at 65% 30%,#d6cbb1 0 12%,#655543 13% 14%,#b6a484 15% 26%)'},
 ...PREMIUM_FINISHES,
]);

export function normalizeKnifeSelection(value={},finishId){
 const input=typeof value==='string'?{knifeId:value,finishId}:value||{};
 return{knifeId:KNIVES.some(k=>k.id===input.knifeId)?input.knifeId:'wake',finishId:KNIFE_FINISHES.some(f=>f.id===input.finishId)?input.finishId:'brushed'};
}

export const getKnifeSpec=id=>KNIVES.find(k=>k.id===id)||KNIVES[0];
export const getKnifeFinish=id=>KNIFE_FINISHES.find(f=>f.id===id)||KNIFE_FINISHES[0];
