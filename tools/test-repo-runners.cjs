'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {dataResponse}=require('../repo-runners/data-stream.js'),root=path.resolve(__dirname,'..');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const build=JSON.parse(fs.readFileSync(path.join(root,'repo-runners/build.json'))),digest=crypto.createHash('sha256');let total=0;
 const response=dataResponse(build.data,async url=>{
  const bytes=fs.readFileSync(path.join(root,url));assert(bytes.length<=25*1024*1024);
  const data=zlib.brotliDecompressSync(bytes),part=build.data.parts.find(p=>p.url===url);
  assert.equal(hash(data),part.sha256);return new Response(data);
 });
 assert.equal(Number(response.headers.get('Content-Length')),build.data.size);
 for await(const bytes of response.body){digest.update(bytes);total+=bytes.length;}
 assert.equal(total,build.data.size);assert.equal(digest.digest('hex'),build.data.sha256,'All chunks reconstruct the supplied Unity archive exactly');
 for(const url of [build.loader,build.framework,build.code])assert(fs.statSync(path.join(root,url)).size<=25*1024*1024);
 const tiny={size:3,parts:[{url:'/a',size:3}]};
 await assert.rejects(dataResponse(tiny,async()=>new Response('x')).arrayBuffer(),/Incomplete/);
 await assert.rejects(dataResponse(tiny,async()=>new Response('',{status:404})).arrayBuffer(),/Could not download/);
 await assert.rejects(dataResponse(tiny,async()=>new Response('xxxx')).arrayBuffer(),/Invalid/);
 const abort=new AbortController();abort.abort();await assert.rejects(dataResponse(tiny,async()=>new Response('abc'),abort.signal).arrayBuffer(),/abort/i);
 let downloadSignal;const reader=dataResponse(tiny,async(_url,options)=>{downloadSignal=options.signal;return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array([1]));}}));}).body.getReader();
 await reader.read();await reader.cancel();assert(downloadSignal.aborted);
 console.log('PASS: exact Unity data reconstruction, hosting size limits, partial/failed downloads, and cancellation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
