const {pathToFileURL}=require('node:url'),path=require('node:path');
module.exports=source=>source.replace(/from '\.\.\/\.\.\/\.\.\/lib\/(play-rewards|play-activity|comp-run-cosmetics)\.mjs'/g,(_,name)=>"from '"+pathToFileURL(path.resolve('lib/'+name+'.mjs')).href+"'");
