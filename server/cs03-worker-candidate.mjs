// CS-03 deployment CANDIDATE: review/test-only module, NOT an executable Worker entrypoint.
// Do not add a wrangler production config or enable routing without explicit approval.
// All values are server-side bindings. No public or local test signing keys are embedded.
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03TrustedEdgeGateway} from './cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from './cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from './cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from './cs03-cloudflare-do-handler.mjs';

const ERROR=()=>Response.json({error:'Service Unavailable'},{status:503,headers:{'cache-control':'no-store'}});
const ipPattern=/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[0-9a-fA-F:]{2,64}$/;

// Call only from a Cloudflare-authenticated incoming request context.
// An arbitrary reverse proxy or directly callable local wrapper must NOT be trusted
// to supply CF-Connecting-IP: that trust is a deployment-level prerequisite.
export function createCs03WorkerCandidate({env,fetcher=fetch}={}){
 if(typeof fetcher!=='function'||!env||typeof env!=='object')throw Error('CANDIDATE_CONFIG_INVALID');
 const {CS03_JWKS_URL:jwksUrl,CS03_JWT_ISSUER:issuer,CS03_JWT_AUDIENCE:audience,
  CS03_NEON_FUNCTION_URL:upstreamUrl,CS03_GATEWAY_SECRET:upstreamSecret,
  CS03_QUOTA:namespace}=env;
 if(typeof upstreamUrl!=='string'||typeof upstreamSecret!=='string'||
    !namespace||typeof namespace.idFromName!=='function'||typeof namespace.get!=='function')
  throw Error('CANDIDATE_CONFIG_INVALID');
 // All upstream/JWKS hostnames and issuer/audience must be verified separately
 // against the actual isolated Neon account before deployment approval.
 const verifyToken=createNeonJwtVerifier({jwksUrl,issuer,audience});
 const sharedQuota=createCs03SharedQuota({
  atomicConsume:createCs03DurableObjectQuotaTransport({namespace})
 });
 const gateway=createCs03TrustedEdgeGateway({
  verifyToken,sharedQuota,fetcher,upstreamUrl,upstreamSecret,
  getClientIp:request=>{
   // Reject missing/malformed IP rather than accepting X-Forwarded-For supplied by clients.
   const ip=request.headers.get('cf-connecting-ip');
   if(!ip||ip.length>64||!ipPattern.test(ip))return '';
   if(ip.includes('.')){
    const octets=ip.split('.').map(Number);
    if(octets.some(n=>!Number.isInteger(n)||n>255))return '';
   }
   return ip.toLowerCase();
  }
 });
 return async request=>{
  try{return await gateway(request);}catch{return ERROR();}
 };
}

// Matches the review-only SQLite DO class_name; intentionally no Worker default export.
// This class is NOT public routing approval and MUST remain off live traffic.
export class Cs03QuotaNotDeployed {
 constructor(ctx){
  if(!ctx?.storage)throw Error('CS03_QUOTA_STORAGE_REQUIRED');
  this.handle=createCs03QuotaObjectHandler({storage:ctx.storage});
 }
 fetch(request){return this.handle(request);}
}
