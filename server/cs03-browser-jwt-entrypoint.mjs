// CS-03 browser JWT API candidate — NOT APPROVED FOR DEPLOYMENT.
// This is deliberately separate from the operator-only Cloudflare Access entrypoint.
// Never deploy or enable routes before security, cost and operator approval.
import {createCs03WorkerCandidate,Cs03QuotaNotDeployed} from './cs03-worker-candidate.mjs';

const unavailable=()=>Response.json({error:'Service Unavailable'},{status:503,
 headers:{'cache-control':'no-store'}});
// Only a fixed, server-side review mode enables the browser path. This is NOT
// authentication: the candidate still verifies the signed Neon JWT and shared
// Durable Object quota on every real API request.
export function createCs03BrowserJwtEntrypoint({createGateway=createCs03WorkerCandidate}={}){
 if(typeof createGateway!=='function')throw Error('CS03_BROWSER_FACTORY_INVALID');
 return Object.freeze({
  async fetch(request,env){
   if(env?.CS03_BROWSER_JWT_MODE!=='isolated-review-only')return unavailable();
   if(!request?.cf||typeof request.cf!=='object')return unavailable();
   // A browser request never supplies Cloudflare Access context. No cookies,
   // Access bypass or service tokens are used as an authentication shortcut.
   try{
    const gateway=createGateway({env});
    if(typeof gateway!=='function')return unavailable();
    return await gateway(request);
   }catch{return unavailable();}
  }
 });
}
export default createCs03BrowserJwtEntrypoint();
export {Cs03QuotaNotDeployed};
