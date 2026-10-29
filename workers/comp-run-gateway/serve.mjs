// All routes are an exact build-time allowlist. No user-controlled upstream URLs.
function sliceStream(body,start,end){
  const reader=body.getReader();let offset=0;
  return new ReadableStream({async pull(controller){
    try{while(true){const {done,value}=await reader.read();if(done){controller.close();return;}
      const from=Math.max(0,start-offset),to=Math.min(value.byteLength,end+1-offset);offset+=value.byteLength;
      if(to>from)controller.enqueue(value.subarray(from,to));
      if(offset>end){controller.close();await reader.cancel();return;}
      if(to>from)return;
    }}catch(error){controller.error(error);await reader.cancel();}
  },cancel(reason){return reader.cancel(reason);}});
}
export function createHandler(files, fetchAsset = fetch) {
  const aliases = {'/':'/index.html','/knife-preview':'/knife-preview.html','/runner-preview':'/runner-preview.html'};
  return async request => {
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    let pathname; try { pathname=decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Bad path',{status:400}); }
    const file=files[aliases[pathname]||pathname];
    if (!file || !Object.hasOwn(files,aliases[pathname]||pathname)) return new Response('Not found',{status:404});
    const etag='"'+file.sha256+'"';
    const headers=new Headers({'Content-Type':file.type,'ETag':etag,'Accept-Ranges':'bytes','Cache-Control':file.type.startsWith('text/html')?'no-cache':'public, max-age=300','X-Content-Type-Options':'nosniff','X-Comp-Run-Build':'2.27.2'});
    if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});
    let start=0,end=file.size-1,status=200;
    const range=request.headers.get('Range');
    if(range && (!request.headers.has('If-Range') || request.headers.get('If-Range')===etag)){
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(match&&(match[1]||match[2])){
        start=match[1]?Number(match[1]):Math.max(0,file.size-Number(match[2]));
        end=match[1]&&match[2]?Math.min(file.size-1,Number(match[2])):file.size-1;
        if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=file.size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${file.size}`}});
        status=206;headers.set('Content-Range',`bytes ${start}-${end}/${file.size}`);
      }
    }
    headers.set('Content-Length',String(end-start+1));
    if(request.method==='HEAD')return new Response(null,{status,headers});
    if(file.url){
      try{
        const upstream=await fetchAsset(file.url,{headers:status===206?{Range:`bytes=${start}-${end}`}:{},redirect:'manual'});
        if(upstream.status!==status&&!(status===206&&upstream.status===200)){console.error('Asset upstream status',upstream.status,file.url);await upstream.body?.cancel();return new Response('Asset temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store'}});}
        return new Response(status===206&&upstream.status===200?sliceStream(upstream.body,start,end):upstream.body,{status,headers});
      }catch(error){console.error('Asset fetch failed',String(error));return new Response('Asset temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store'}});}
    }
    const bytes=Uint8Array.from(atob(file.body),char=>char.charCodeAt(0));
    return new Response(status===206?bytes.subarray(start,end+1):bytes,{status,headers});
  };
}
