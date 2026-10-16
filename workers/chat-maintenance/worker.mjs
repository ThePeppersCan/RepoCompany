import {cleanupImages} from '../../lib/chat-images.mjs';
export default {
 async scheduled(_event,env){
  const removed=await cleanupImages(env.DASHBOARD_DB,env,{url:env.SUPABASE_URL});
  console.log(JSON.stringify({task:'wibs-image-retention',removed}));
 },
 fetch(){return new Response('Wibs image retention',{status:404});}
};
