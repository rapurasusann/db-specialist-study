import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03WorkerCandidate,Cs03QuotaNotDeployed,extractCs03CloudflareClientIp} from '../server/cs03-worker-candidate.mjs';

const ORIGIN='https://rapurasusann.github.io';
function bindings(){
 return {
  CS03_JWKS_URL:'https://isolated-auth.invalid/.well-known/jwks.json',
  CS03_JWT_ISSUER:'https://isolated-auth.invalid/issuer',
  CS03_JWT_AUDIENCE:'cs03-isolated',
  CS03_NEON_FUNCTION_URL:'https://isolated-neon.invalid/progress',
  CS03_GATEWAY_SECRET:'isolated-credential-never-deploy-1234567890',
  CS03_QUOTA:{
   idFromName:()=>{throw Error('QUOTA_SHOULD_NOT_BE_CALLED');},
   get:()=>{throw Error('QUOTA_SHOULD_NOT_BE_CALLED');}
  }
 };
}
test('candidate fails closed without server-side bindings, URL or secret',()=>{
 assert.throws(()=>createCs03WorkerCandidate({env:{}}),/CANDIDATE_CONFIG_INVALID/);
 const env=bindings();delete env.CS03_GATEWAY_SECRET;
 assert.throws(()=>createCs03WorkerCandidate({env}),/CANDIDATE_CONFIG_INVALID/);
 assert.throws(()=>createCs03WorkerCandidate({env:{...bindings(),CS03_NEON_FUNCTION_URL:'http://unsafe.invalid/progress'}}),/GATEWAY_UPSTREAM_INVALID/);
 assert.throws(()=>createCs03WorkerCandidate({env:{...bindings(),CS03_GATEWAY_SECRET:'short'}}),/GATEWAY_SECRET_REQUIRED/);
});
test('candidate supports strict browser preflight but forwards nothing upstream',async()=>{
 let count=0;
 const candidate=createCs03WorkerCandidate({env:bindings(),fetcher:async()=>{count++;throw Error('UNEXPECTED_UPSTREAM');}});
 const request=new Request('https://candidate.invalid/progress',{method:'OPTIONS',headers:{
  origin:ORIGIN,'access-control-request-method':'GET','access-control-request-headers':'authorization, content-type'
 }});
 const response=await candidate(request);
 assert.equal(response.status,204);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(count,0);
});
test('unauthenticated and wrong-origin requests never call quota or upstream',async()=>{
 let count=0;
 const candidate=createCs03WorkerCandidate({env:bindings(),fetcher:async()=>{count++;throw Error('UNEXPECTED_UPSTREAM');}});
 const validOrigin=new Request('https://candidate.invalid/progress?examCode=db',{headers:{
  origin:ORIGIN,'cf-connecting-ip':'192.0.2.250'
 }});
 assert.equal((await candidate(validOrigin)).status,401);
 const badOrigin=new Request('https://candidate.invalid/progress?examCode=db',{headers:{
  origin:'https://evil.example','cf-connecting-ip':'192.0.2.250',
  authorization:'Bearer not-a-valid-jwt'
 }});
 assert.equal((await candidate(badOrigin)).status,403);
 assert.equal(count,0);
});

test('review DO class matches binding and rejects invalid internal request without storage access',async()=>{
 assert.throws(()=>new Cs03QuotaNotDeployed({}),/CS03_QUOTA_STORAGE_REQUIRED/);
 let calls=0;
 const ctx={storage:{transactionSync:()=>{calls++;throw Error('UNEXPECTED_STORAGE');},sql:{exec:()=>{calls++;throw Error('UNEXPECTED_SQL');}}}};
 const quota=new Cs03QuotaNotDeployed(ctx);
 const reply=await quota.fetch(new Request('https://cs03-quota.internal/wrong',{method:'POST',
  headers:{'content-type':'application/json'},body:'{}'}));
 assert.equal(reply.status,400);
 assert.equal(calls,0);
});
test('review DO class fails closed for unavailable SQLite storage',async()=>{
 const quota=new Cs03QuotaNotDeployed({storage:{transactionSync:()=>{throw Error('DB_DOWN')},sql:{exec:()=>{throw Error('DB_DOWN')}}}});
 const now=Date.now();
 const reply=await quota.fetch(new Request('https://cs03-quota.internal/consume',{method:'POST',
  headers:{'content-type':'application/json'},body:JSON.stringify({now,windowMs:60000,keys:[
   {key:'cs03:global',limit:60},{key:'cs03:ip:192.0.2.1',limit:20},
   {key:'cs03:user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',limit:10}
  ]})}));
 assert.equal(reply.status,503);
 assert.deepEqual(await reply.json(),{error:'Service Unavailable'});
});

test('client IP extraction rejects spoofed headers without Cloudflare request metadata',()=>{
 const request=new Request('https://candidate.invalid/progress',{headers:{
  'cf-connecting-ip':'198.51.100.23','x-forwarded-for':'203.0.113.5'
 }});
 assert.equal(extractCs03CloudflareClientIp(request),'');
 Object.defineProperty(request,'cf',{value:{colo:'NRT'},configurable:true});
 assert.equal(extractCs03CloudflareClientIp(request),'198.51.100.23');
});
test('client IP extraction rejects malformed IPv4 and IPv6, accepts valid IPv6',()=>{
 for(const ip of ['999.0.0.1','192.0.2.01','1.2.3.4,5.6.7.8','fe80:::1','::ffff:999.1.1.1']){
  const req=new Request('https://candidate.invalid/progress',{headers:{'cf-connecting-ip':ip}});
  Object.defineProperty(req,'cf',{value:{colo:'NRT'}});
  assert.equal(extractCs03CloudflareClientIp(req),'',ip);
 }
 const v6=new Request('https://candidate.invalid/progress',{headers:{'cf-connecting-ip':'2001:DB8::1234'}});
 Object.defineProperty(v6,'cf',{value:{colo:'NRT'}});
 assert.equal(extractCs03CloudflareClientIp(v6),'2001:db8::1234');
});
