const {spawnSync}=require('node:child_process');
function git(args){return spawnSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});}
const update=git(['fetch','origin']);
if(update.status!==0){console.error('Deployment stopped: could not verify the latest repository state.');process.exit(1);}
if(git(['merge-base','--is-ancestor','origin/main','HEAD']).status!==0){console.error('Deployment stopped: this checkout is behind origin/main. Integrate the latest published work before deploying.');process.exit(1);}
console.log('Deployment base verified: checkout includes the latest origin/main.');
