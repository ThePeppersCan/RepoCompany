'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const {scanPublicTree}=require('./security-preflight.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'repo-security-fixture-'));
const jwt=role=>Buffer.from('{"alg":"HS256"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.fixture';
function check(name,content,expected){const file=path.join(root,name);fs.writeFileSync(file,content);try{if(expected)assert.throws(()=>scanPublicTree(root),expected);else assert.equal(scanPublicTree(root).files,1);}finally{fs.unlinkSync(file);}}
try{
 check('config.js','const key='+JSON.stringify(jwt('anon'))+';',null);
 check('config.json',JSON.stringify({key:jwt('service_role')}),/privileged JWT/);
 check('runtime.js.br',zlib.brotliCompressSync(Buffer.from('const key='+JSON.stringify(jwt('service_role')))),/privileged JWT/);
 check('.env.production','EXAMPLE=value',/private path/);
 check('mail-secrets.json','{}',/private path/);
 check('keys.js','const k="'+['re_', 'A'.repeat(32)].join('')+'";',/provider secret/);
 check('certificate.txt',['-----BEGIN ','PRIVATE KEY-----'].join(''),/private key/);
 check('old-backup.sql','SELECT 1;',/private path/);
 console.log('PASS: public client keys allowed; privileged keys, compressed secrets, private files and stale backups block publication without printing values.');
}finally{fs.rmdirSync(root);}
