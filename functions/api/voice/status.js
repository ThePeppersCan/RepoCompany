export async function onRequest({request,env}){
 if(request.method!=='GET')return new Response(null,{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
 if(!env.REPO_VOICE)return Response.json({enabled:false},{status:503,headers:{'Cache-Control':'no-store'}});
 return env.REPO_VOICE.fetch('https://voice.internal/status',{method:'GET'});
}
