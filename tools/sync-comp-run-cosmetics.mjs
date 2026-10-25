import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]||path.join(root,'../comp-run-premium/dist'));
const {KNIVES,KNIFE_FINISHES}=await import(pathToFileURL(path.join(source,'knife-catalog.js')));
const {RUNNERS}=await import(pathToFileURL(path.join(source,'runner-catalog.js')));
const target=path.join(root,'comp-run-preview'),seen=new Set();
function copy(name){
 if(seen.has(name))return;seen.add(name);
 const absolute=path.resolve(source,name);if(!absolute.startsWith(source+path.sep))throw Error('Preview dependency outside game');
 const content=fs.readFileSync(absolute,'utf8');
 fs.mkdirSync(path.dirname(path.join(target,name)),{recursive:true});fs.writeFileSync(path.join(target,name),content);
 for(const match of content.matchAll(/(?:from\s*|import\s*|src=)["'](\.[^"'?]+)(?:\?[^"']*)?["']/g))copy(path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1])));
}
copy('knife-preview.html');
copy('runner-preview.html');
copy('runner-portraits.js');
const data={knives:KNIVES.map(({id,name,family,iconPath})=>({id,name,family,iconPath})),finishes:KNIFE_FINISHES.filter(f=>f.premium),runners:RUNNERS.filter(r=>r.paid)};
fs.writeFileSync(path.join(root,'comp-run-cosmetics.js'),'// Generated from the released game catalogue. Run tools/sync-comp-run-cosmetics.mjs after game changes.\nwindow.repoCompRunCosmetics=Object.freeze('+JSON.stringify(data)+');\n');
const server={knives:KNIVES.map(({id,name,family})=>({id,name,family})),finishes:KNIFE_FINISHES.map(({id,name,price=0,premium=false})=>({id,name,price,premium})),runners:RUNNERS.map(({id,name,price=0,paid=false})=>({id,name,price,paid}))};
fs.writeFileSync(path.join(root,'lib/comp-run-cosmetic-catalog.mjs'),'// Generated from the game catalogue. Cosmetic display metadata only.\nexport const COMP_RUN_COSMETICS=Object.freeze('+JSON.stringify(server)+');\nexport function cleanCompRunKnife(value){return {knifeId:COMP_RUN_COSMETICS.knives.some(k=>k.id===value?.knifeId)?value.knifeId:"wake",finishId:COMP_RUN_COSMETICS.finishes.some(f=>f.id===value?.finishId)?value.finishId:"brushed"};}\n');
console.log(`Synced ${data.finishes.length} finishes, ${data.runners.length} paid runners, ${data.knives.length} shapes and ${seen.size} shared preview files.`);
