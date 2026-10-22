const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const requested=process.argv.find(a=>a.startsWith('--game='))?.slice(7);
const selected=requested?[requested]:['moratales','manager','morogue','comp-run'];
if(selected.some(g=>!['moratales','manager','morogue','comp-run'].includes(g)))throw Error('Unknown game');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex').slice(0,12);
// Hash dependencies in loading order so a release never mixes cached game code.
if(selected.includes('manager'))for(const [parent,child]of [['app.js','velmora-quidditch-engine.js'],['career-bootstrap.js','app.js']]){
 const file=path.join(root,'game-integrations/manager',parent),prefix='https://repocompany.uk/game-integrations/manager/'+child;
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[^\x27\x22`]+'),prefix+'?v='+hash('game-integrations/manager/'+child)));
}
for(const game of selected){
 const source=[game==='comp-run'?'achievement-client-comp-run.js':'game-achievements-client.js',game==='comp-run'?'achievement-notifications-comp-run.js':'achievement-notifications.js',`achievement-adapter-${game}.js`].map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n')).join('\n;\n');
 fs.mkdirSync(path.join(root,'game-integrations',game),{recursive:true});
 fs.writeFileSync(path.join(root,'game-integrations',game,'achievement-runtime.js'),source);
}
const hashes=requested?JSON.parse(fs.readFileSync(path.join(root,'game-integrations/manifest.json'))).hashes:{};
// Versioned game releases and their styles/audio also need manifest entries.
// Walk each published game folder so rebuilding cannot drop nested release hashes.
function collect(relative){
 for(const entry of fs.readdirSync(path.join(root,relative),{withFileTypes:true})){
  const child=relative+'/'+entry.name;
  if(entry.isDirectory())collect(child);
  else if(entry.isFile())hashes[child]=hash(child);
 }
}
for(const game of selected)collect(`game-integrations/${game}`);
fs.writeFileSync(path.join(root,'game-integrations','manifest.json'),JSON.stringify({version:1,hashes},null,2)+'\n');
