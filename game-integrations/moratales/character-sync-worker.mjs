// Narrow rollout: retain the live Worker, assets, game rules and multiplayer
// state. These responses contain only the reviewed character connection code.
export function characterAsset(request, assets) {
 const url=new URL(request.url);
 if(url.hostname!=='moratales.repocompany.uk'||!Object.hasOwn(assets,url.pathname))return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const html=url.pathname.endsWith('.html');
 const headers={'Content-Type':html?'text/html; charset=utf-8':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(html)headers['Content-Security-Policy']="default-src 'none'; script-src 'self'; frame-ancestors https://morogue.repocompany.uk https://repocompany.uk https://www.repocompany.uk; base-uri 'none'; form-action 'none'";
 return new Response(request.method==='HEAD'?null:assets[url.pathname],{headers});
}
export function withCharacterSync(response,request){
 const url=new URL(request.url);
 if(url.hostname!=='moratales.repocompany.uk'||!['/','/preview.html'].includes(url.pathname)||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 let present=false;
 const result=new HTMLRewriter().on('script[src]',{element(el){if(el.getAttribute('src').includes('moratales-account-characters.js'))present=true;}}).on('body',{element(el){el.onEndTag(tag=>{if(!present)tag.before('<script src="/interface/vampire-survivor/characters.js"></script><script src="/interface/moratales-character-link.js"></script><script src="/interface/moratales-character-status.js"></script><script src="/interface/moratales-account-characters.js"></script>',{html:true});});}}).transform(response);
 const headers=new Headers(result.headers);headers.set('Cache-Control','no-store');headers.set('X-Repo-Character-Sync','1');headers.delete('Content-Length');headers.delete('ETag');
 return new Response(result.body,{status:result.status,statusText:result.statusText,headers});
}
