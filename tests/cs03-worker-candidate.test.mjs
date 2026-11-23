import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03WorkerCandidate} from '../server/cs03-worker-candidate.mjs';

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
