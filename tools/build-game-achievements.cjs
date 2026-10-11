const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex').slice(0,12);
// Hash dependencies in loading order so a release never mixes cached game code.
for(const [parent,child]of [['app.js','velmora-quidditch-engine.js'],['career-bootstrap.js','app.js']]){
 const file=path.join(root,'game-integrations/manager',parent),prefix='https://repocompany.uk/game-integrations/manager/'+child;
 fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\?v=[^\x27\x22`]+'),prefix+'?v='+hash('game-integrations/manager/'+child)));
}
for(const game of ['moratales','manager','morogue']){
 const source=['game-achievements-client.js','achievement-notifications.js',`achievement-adapter-${game}.js`].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n');
 fs.mkdirSync(path.join(root,'game-integrations',game),{recursive:true});
 fs.writeFileSync(path.join(root,'game-integrations',game,'achievement-runtime.js'),source);
}
const hashes={};
for(const game of ['moratales','manager','morogue'])for(const file of fs.readdirSync(path.join(root,'game-integrations',game)).filter(f=>f.endsWith('.js'))){
 const relative=`game-integrations/${game}/${file}`;
 hashes[relative]=hash(relative);
}
fs.writeFileSync(path.join(root,'game-integrations','manifest.json'),JSON.stringify({version:1,hashes},null,2)+'\n');
