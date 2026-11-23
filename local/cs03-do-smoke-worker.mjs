// Local-only Cloudflare workerd smoke harness. DO NOT DEPLOY.
// Does not expose gateway, Neon functions, auth or any user records.
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';
export class Cs03LocalQuota {
 constructor(ctx){this.handler=createCs03QuotaObjectHandler({storage:ctx.storage});}
 fetch(request){return this.handler(request);}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  // Do not make this diagnostic endpoint usable on a public Worker deployment.
  if(!['127.0.0.1','localhost'].includes(url.hostname))return new Response('Not Found',{status:404});
  if(request.method!=='POST'||url.pathname!=='/__local/cs03/quota')return new Response('Not Found',{status:404});
  if(!env.CS03_LOCAL_QUOTA)return new Response('Service Unavailable',{status:503});
  // Demo traffic is independent of real users; never forward tokens or secrets.
  const id=env.CS03_LOCAL_QUOTA.idFromName('cs03-global-v1');
  return env.CS03_LOCAL_QUOTA.get(id).fetch('https://cs03-quota.internal/consume',{method:'POST',
   headers:{'content-type':'application/json'},body:await request.text()});
 }
};
