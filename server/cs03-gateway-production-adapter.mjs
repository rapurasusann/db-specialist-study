// CS-03 Worker entrypoint CANDIDATE — NOT APPROVED FOR DEPLOYMENT.
// No routes or Wrangler production config may point here until isolated security,
// cost, route fail-closed, and operator-approval checks are complete.
// Intentionally keeps the independent predeploy guard's NO-GO blockers active.
import {createCs03WorkerCandidate,Cs03QuotaNotDeployed} from './cs03-worker-candidate.mjs';

const unavailable=()=>Response.json({error:'Service Unavailable'},{status:503,
 headers:{'cache-control':'no-store'}});

// This adapter deliberately fails closed until explicitly configured for an
// approved isolated environment. This flag does not constitute deployment approval.
// Test seam accepts a local-only gateway factory; the exported Worker default
// always uses the real candidate factory. Never read a factory from env/request.
export function createCs03Entrypoint({createGateway=createCs03WorkerCandidate}={}){
 if(typeof createGateway!=='function')throw Error('CS03_ENTRYPOINT_FACTORY_INVALID');
 return Object.freeze({
  async fetch(request,env){
   if(env?.CS03_ISOLATED_GATEWAY_MODE!=='isolated-review-only')return unavailable();
   if(!request?.cf||typeof request.cf!=='object')return unavailable();
   try{
    const handle=createGateway({env});
    if(typeof handle!=='function')return unavailable();
    return await handle(request);
   }catch{return unavailable();}
  }
 });
}
export default createCs03Entrypoint();

// Class name must match the review-only SQLite Durable Object migration binding.
export {Cs03QuotaNotDeployed};
