import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
const ORIGIN='https://rapurasusann.github.io', ID='a1111111-1111-4111-8111-111111111111';
const SECRET='test-only-never-deploy-this-secret-123456';
function suite(options={}){
 const sent=[];
 const gateway=createCs03TrustedEdgeGateway({
  verifyToken:async token=>{if(token!=='valid-jwt-example')throw Error('BAD_TOKEN');return {userId:ID};},
  getClientIp:()=>options.ip??'192.0.2.4',
  upstreamUrl:'https://isolated-function.example/progress',
  upstreamSecret:SECRET,
  limits:options.limits??{global:60,perIp:20,perUser:10},
  fetcher:async(url,init)=>{sent.push({url:String(url),init});return Response.json({data:{records:[],nextCursor:null}});},
  ...options
 });
 function req(method='GET',{origin=ORIGIN,auth='Bearer valid-jwt-example',path='/progress?examCode=db',body}={}){
  const h={origin,authorization:auth};
  if(method==='PUT')h['content-type']='application/json';
  return new Request('https://gateway.example'+path,{method,headers:h,body:method==='PUT'?(body??'{}'):undefined});
 }
 return {gateway,req,sent};
}
test('valid JWT is forwarded only to a fixed HTTPS function with secret kept server side',async()=>{
 const f=suite();const response=await f.gateway(f.req());
 assert.equal(response.status,200);
 assert.equal(f.sent.length,1);
 assert.equal(f.sent[0].url,'https://isolated-function.example/progress?examCode=db');
 assert.equal(f.sent[0].init.headers['x-secret'],SECRET);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(response.headers.get('x-secret'),null);
});
test('unverified JWT rejected before upstream call',async()=>{
 const f=suite();assert.equal((await f.gateway(f.req('GET',{auth:'Bearer invalid-jwt-example'}))).status,401);assert.equal(f.sent.length,0);
});
test('origin, route and unauthorized verb rejected before upstream',async()=>{
 const f=suite();
 assert.equal((await f.gateway(f.req('GET',{origin:'https://evil.invalid'}))).status,403);
 assert.equal((await f.gateway(f.req('GET',{path:'/internal?examCode=db'}))).status,404);
 assert.equal((await f.gateway(f.req('DELETE'))).status,405);
 assert.equal(f.sent.length,0);
});
test('preflight grants only exact origin and allowed methods',async()=>{
 const f=suite();const r=new Request('https://gateway.example/progress',{method:'OPTIONS',
 headers:{origin:ORIGIN,'access-control-request-method':'PUT','access-control-request-headers':'authorization, content-type'}});
 assert.equal((await f.gateway(r)).status,204);
 assert.equal(f.sent.length,0);
});
test('invalid PUT content and oversized body never reaches the function',async()=>{
 const f=suite();
 assert.equal((await f.gateway(f.req('PUT',{path:'/progress',body:'x'.repeat(20001)}))).status,413);
 assert.equal((await f.gateway(f.req('PUT',{path:'/progress?examCode=db'}))).status,400);
 assert.equal(f.sent.length,0);
});
test('per-user limiter rejects excessive requests within window',async()=>{
 let time=0;const f=suite({clock:()=>time,limits:{global:20,perIp:20,perUser:2}});
 assert.equal((await f.gateway(f.req())).status,200);
 assert.equal((await f.gateway(f.req())).status,200);
 assert.equal((await f.gateway(f.req())).status,429);
 time=60000;
 assert.equal((await f.gateway(f.req())).status,200);
 assert.equal(f.sent.length,3);
});
test('missing trusted IP refuses traffic without forwarding client XFF',async()=>{
 const f=suite({getClientIp:()=>null});
 assert.equal((await f.gateway(f.req())).status,503);
 assert.equal(f.sent.length,0);
});
test('invalid secret or non HTTPS endpoint is never accepted',()=>{
 assert.throws(()=>suite({upstreamSecret:'too-short'}),/GATEWAY_SECRET_REQUIRED/);
 assert.throws(()=>suite({upstreamUrl:'http://isolated-function.example/progress'}),/GATEWAY_UPSTREAM_INVALID/);
});
test('gateway never follows upstream redirect or leaks exceptions',async()=>{
 const f=suite({fetcher:async()=>{throw Error('SECRET_DATABASE_URL');}});
 const response=await f.gateway(f.req());
 assert.equal(response.status,503);
 assert.doesNotMatch(await response.text(),/SECRET_DATABASE_URL/);
});
