// Pages' static _headers rules do not apply to Functions responses.
export async function onRequest({next}){
 const response=await next(),headers=new Headers(response.headers);
 headers.set('Strict-Transport-Security','max-age=31536000');
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
