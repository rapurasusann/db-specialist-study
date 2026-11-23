// Offline regression: never buffer an unbounded Neon upstream response.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';

const ORIGIN='https://rapurasusann.github.io';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function gateway(fetcher){
 return createCs03TrustedEdgeGateway({
  verifyToken:async()=>({userId:USER}),
  fetcher,
  upstreamUrl:'https://isolated-neon.invalid/progress',
  upstreamSecret:'TEST-ONLY-UPSTREAM-SECRET-1234567890',
  getClientIp:()=> '192.0.2.1',
  sharedQuota:{consume:async()=>true}
 });
}
function request(){
 return new Request('https://browser-api.invalid/progress?examCode=db',{
  headers:{origin:ORIGIN,authorization:'Bearer valid-test-token'}
 });
}
test('oversized streamed upstream body stops early and returns 503',async()=>{
 let produced=0;
 const stream=new ReadableStream({pull(controller){
  produced++;
  controller.enqueue(new Uint8Array(8192).fill(65));
  if(produced===50)controller.close();
 }});
 const g=gateway(async()=>new Response(stream,{status:200}));
 const response=await g(request());
 assert.equal(response.status,503);
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.ok(produced<50,'gateway must not read the full oversized stream');
 assert.deepEqual(await response.json(),{error:'Service Unavailable'});
});
test('invalid UTF-8 from upstream is rejected with 503',async()=>{
 const g=gateway(async()=>new Response(new Uint8Array([0xc3,0x28]),{status:200}));
 const response=await g(request());
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'Service Unavailable'});
});
test('bounded valid JSON response is still returned',async()=>{
 const g=gateway(async()=>Response.json({data:{revision:1}}));
 const response=await g(request());
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{data:{revision:1}});
 assert.equal(response.headers.get('access-control-allow-origin'),ORIGIN);
});
