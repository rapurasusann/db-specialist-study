// CS-03 deployment CANDIDATE: review/test-only module, NOT an executable Worker entrypoint.
// Do not add a wrangler production config or enable routing without explicit approval.
// All values are server-side bindings. No public or local test signing keys are embedded.
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03TrustedEdgeGateway} from './cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from './cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from './cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from './cs03-cloudflare-do-handler.mjs';

const ERROR=()=>Response.json({error:'Service Unavailable'},{status:503,headers:{'cache-control':'no-store'}});
// Header-only client IP values are not accepted without Cloudflare request context.
// Note: request.cf is a defensive signal, not a cryptographic trust proof;
// live ingress isolation is still a release blocker.
export function extractCs03CloudflareClientIp(request){
 if(!request?.cf||typeof request.cf!=='object')return '';
 const raw=request.headers?.get('cf-connecting-ip');
 if(typeof raw!=='string'||raw.length<2||raw.length>64||raw!==raw.trim())return '';
 try{
  if(raw.includes(':')){
   const hostname=new URL('http://['+raw+']/').hostname;
   if(!hostname.startsWith('[')||!hostname.endsWith(']'))return '';
   return hostname.slice(1,-1).toLowerCase();
  }
  if(!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(raw))return '';
  const octets=raw.split('.');
  if(octets.some(n=>Number(n)>255||(n.length>1&&n.startsWith('0'))))return '';
  return octets.join('.');
 }catch{return '';}
}

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
  getClientIp:extractCs03CloudflareClientIp
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
