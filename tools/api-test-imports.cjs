const {pathToFileURL}=require('node:url'),path=require('node:path');
module.exports=source=>source.replace("from '../../../lib/play-rewards.mjs'","from '"+pathToFileURL(path.resolve('lib/play-rewards.mjs')).href+"'");
