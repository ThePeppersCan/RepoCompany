const installer='https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v0.1.4/Repo-Company-0.1.4-Windows-x64.exe';

export function onRequest({request}) {
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  return new Response(null,{status:302,headers:{...headers,Location:installer}});
}
