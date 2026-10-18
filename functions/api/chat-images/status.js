// Public availability only. Never return credentials, image metadata or files.
export function onRequest({request,env}) {
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
 const available=typeof env.WIBS_STORAGE_KEY==='string'&&env.WIBS_STORAGE_KEY.trim().length>0;
 return new Response(request.method==='HEAD'?null:JSON.stringify({available}),{status:available?200:503,headers:{...headers,'Content-Type':'application/json'}});
}
