export async function onRequest({request,env}) {
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  try {
    // The button and native updater follow the same atomically promoted release.
    // ASSETS reads this deployment's immutable static files without another Function.
    const feed=await env.ASSETS.fetch(new Request(new URL('/releases/launcher/latest.json',request.url),{method:'GET'}));
    if(!feed.ok)throw Error('Release unavailable');
    const envelope=await feed.json();
    if(envelope.schemaVersion!==1||envelope.keyId!=='repo-launcher-2026-01'||typeof envelope.payload!=='string'||envelope.payload.length>45000)throw Error('Invalid release');
    const release=JSON.parse(atob(envelope.payload));
    if(!/^(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})\.(0|[1-9]\d{0,6})$/.test(release.version)||release.appId!=='uk.repocompany.launcher'||release.channel!=='stable'||release.platform!=='win32'||release.arch!=='x64')throw Error('Invalid release');
    const installer=`https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v${release.version}/Repo-Company-${release.version}-Windows-x64.exe`;
    if(release.installer?.url!==installer)throw Error('Invalid installer');
    return new Response(null,{status:302,headers:{...headers,Location:installer}});
  }catch{
    return new Response('The Windows download is temporarily unavailable. Please try again shortly.',{status:503,headers:{...headers,'Retry-After':'60','Content-Type':'text/plain; charset=utf-8'}});
  }
}
