// Pages' static _headers rules do not apply to Functions responses.
export async function onRequest({next}){
 const response=await next();
 // A WebSocket upgrade must retain its socket; rebuilding it as an HTTP
 // response drops the upgrade and turns a healthy race connection into a 500.
 if(response.status===101&&response.webSocket)return response;
 const headers=new Headers(response.headers);
 headers.set('Strict-Transport-Security','max-age=31536000');
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
