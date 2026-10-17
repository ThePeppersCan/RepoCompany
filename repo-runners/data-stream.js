/* Feed Unity one continuous archive while keeping each hosted file below 25 MiB. */
(function(root){
 'use strict';
 function dataResponse(data,fetchPart,signal){
  let index=0,reader=null,partBytes=0,total=0,finished=false;
  const controller=new AbortController();
  const abort=()=>controller.abort(signal?.reason);
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const cleanup=()=>signal?.removeEventListener('abort',abort);
  const stream=new ReadableStream({
   async pull(out){
    try{
     while(!finished){
      if(controller.signal.aborted)throw controller.signal.reason||new Error('Download cancelled.');
      if(!reader){
       if(index===data.parts.length){
        if(total!==data.size)throw Error('Incomplete game download.');
        finished=true;cleanup();out.close();return;
       }
       const response=await fetchPart(data.parts[index].url,{signal:controller.signal});
       if(!response.ok||!response.body)throw Error('Could not download the game. Please try again.');
       reader=response.body.getReader();partBytes=0;
      }
      const {done,value}=await reader.read();
      if(done){
       reader.releaseLock();reader=null;
       if(partBytes!==data.parts[index].size)throw Error('Incomplete game download. Please try again.');
       index++;continue;
      }
      partBytes+=value.byteLength;total+=value.byteLength;
      if(partBytes>data.parts[index].size||total>data.size)throw Error('Invalid game download.');
      out.enqueue(value);return;
     }
    }catch(error){finished=true;cleanup();controller.abort();reader?.cancel().catch(()=>{});out.error(error);}
   },
   cancel(reason){finished=true;cleanup();controller.abort(reason);return reader?.cancel(reason);}
  });
  return new Response(stream,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(data.size)}});
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={dataResponse};
 else root.repoRunnerData={dataResponse};
})(typeof window==='undefined'?globalThis:window);
