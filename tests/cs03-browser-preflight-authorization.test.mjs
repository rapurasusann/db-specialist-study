// Offline browser CORS contract: no Access cookies or service tokens.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';

const origin='https://rapurasusann.github.io';
let upstreamCalls=0,quotaCalls=0,verificationCalls=0;
const gateway=createCs03TrustedEdgeGateway({
 verifyToken:async()=>{verificationCalls++;return {userId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};},
 fetcher:async()=>{upstreamCalls++;throw Error('UPSTREAM_MUST_NOT_RUN');},
 getClientIp:()=> '192.0.2.1',
 upstreamUrl:'https://isolated-neon.invalid/progress',
 upstreamSecret:'TEST-ONLY-NEON-GATEWAY-SECRET-1234567890',
 sharedQuota:{consume:async()=>{quotaCalls++;return true;}}
});
function preflight(method,headers,requestOrigin=origin){
 return new Request('https://candidate.invalid/progress',{method:'OPTIONS',headers:{
  origin:requestOrigin,'access-control-request-method':method,
  'access-control-request-headers':headers
 }});
}
test('browser JWT preflight only allows explicit Authorization and known headers',async()=>{
 const allowed=[
  ['GET','authorization'],['PUT','authorization, content-type']
 ];
 const denied=[
  ['GET',''],['GET','content-type'],['PUT','content-type'],
  ['GET','authorization, x-secret'],['PUT','authorization, authorization'],
  ['GET','authorization, '],['DELETE','authorization']
 ];
 for(const [method,headers] of allowed){
  const response=await gateway(preflight(method,headers));
  assert.equal(response.status,204,`${method}: ${headers}`);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);
 }
 for(const [method,headers] of denied){
  const response=await gateway(preflight(method,headers));
  assert.equal(response.status,405,`${method}: ${headers}`);
 }
 assert.equal((await gateway(preflight('GET','authorization','https://evil.invalid'))).status,403);
 assert.equal(upstreamCalls,0);
 assert.equal(quotaCalls,0);
 assert.equal(verificationCalls,0);
});
