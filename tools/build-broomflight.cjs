const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
module.exports=function(root){
 const project=path.join(root,'game-projects','broomflight');
 const npm=process.env.npm_execpath;
 if(!fs.existsSync(path.join(project,'node_modules','vite'))){
  if(npm)execFileSync(process.execPath,[npm,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:project,stdio:'inherit',windowsHide:true});
  else execFileSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:project,stdio:'inherit',windowsHide:true,shell:process.platform==='win32'});
 }
 for(const [script,args] of [['typescript/bin/tsc',['--noEmit']],['vite/bin/vite.js',['build']]])execFileSync(process.execPath,[path.join(project,'node_modules',script),...args],{cwd:project,stdio:'inherit',windowsHide:true});
};
