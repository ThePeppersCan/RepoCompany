// Only inserts the shared play-time script. Does not build, commit or deploy game projects.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const files=[
 ['C:/Users/Isaac/Documents/velmoragame/preview.html','moratales'],
 ['C:/Users/Isaac/Documents/velmoragame/interface/vampire-survivor/index.html','morogue'],
 ['C:/Users/Isaac/Documents/GitHub/velmora-manager-web/dist/index.html','manager'],
 ['C:/Users/Isaac/Documents/GitHub/velmora-football/index.html','manager'],
 ['C:/Users/Isaac/Documents/GitHub/dragonbound-web/dist/index.html','dragonbound']
];
const records=[];
for(const [file,game] of files){
 const source=fs.readFileSync(file,'utf8');
 if(source.includes('/game-playtime-client.js')){console.log('Already installed: '+game+' '+file);continue;}
 const close=source.lastIndexOf('</body>');if(close<0)throw Error('Missing body: '+file);
 const newline=source.includes('\r\n')?'\r\n':'\n';
 const tag='<script defer src="https://repocompany.uk/game-playtime-client.js" data-game="'+game+'"></script>'+newline;
 fs.writeFileSync(file,source.slice(0,close)+tag+source.slice(close));
 records.push({file,game,originalSha256:crypto.createHash('sha256').update(source).digest('hex'),inserted:tag.trim()});
 console.log('Installed: '+game+' '+file);
}
if(records.length){fs.mkdirSync('QA/dashboard-staging',{recursive:true});fs.writeFileSync('QA/dashboard-staging/game-tracking-integration.json',JSON.stringify(records,null,2));}
