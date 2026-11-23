import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORIGIN='https://rapurasusann.github.io',SECRET='cs03-test-only-secret-do-not-deploy-123456789';
function sharedBackend(){
 const used=new Map();
 return async ({keys,now,windowMs})=>{
  const records=keys.map(({key,limit})=>({key,limit,r:used.get(key)??{start:now,count:0}}))
   .map(x=>({...x,r:now-x.r.start>=windowMs?{start:now,count:0}:x.r}));
  if(records.some(x=>x.r.count>=x.limit))return false;
  for(const x of records)used.set(x.key,{start:x.r.start,count:x.r.count+1});
  return true;
 };
}
function makeGateway(quota,calls){
 return createCs03TrustedEdgeGateway({
  verifyToken:async()=>({userId:USER}),getClientIp:()=> '192.0.2.1',
  fetcher:async()=>{calls.upstream++;return Response.json({data:null});},
  upstreamUrl:'https://isolated-neon-function.invalid/progress',
  upstreamSecret:SECRET,sharedQuota:quota,
  limits:{global:100,perIp:100,perUser:100}
 });
}
const request=()=>new Request('https://gateway.invalid/progress?examCode=db',{headers:{origin:ORIGIN,authorization:'Bearer valid-a-test-token'}});
test('two gateway instances share the real gateway quota decision before upstream',async()=>{
 const backend=sharedBackend(),calls={upstream:0};
 const config={atomicConsume:backend,clock:()=>10000,limits:{global:2,perIp:2,perUser:2}};
 const g1=makeGateway(createCs03SharedQuota(config),calls),g2=makeGateway(createCs03SharedQuota(config),calls);
 const results=await Promise.all([g1(request()),g2(request()),g1(request()),g2(request())]);
 assert.deepEqual(results.map(x=>x.status).sort(),[200,200,429,429]);
 assert.equal(calls.upstream,2);
});
test('shared quota storage unavailable denies before any upstream traffic',async()=>{
 const calls={upstream:0};
 const quota=createCs03SharedQuota({atomicConsume:async()=>{throw Error('STORE_DOWN')},clock:()=>10000});
 const gateway=makeGateway(quota,calls);
 assert.equal((await gateway(request())).status,503);
 assert.equal(calls.upstream,0);
});
test('invalid shared quota adapter never reaches upstream',async()=>{
 const calls={upstream:0},gateway=makeGateway({consume:async()=>({allowed:true})},calls);
 assert.equal((await gateway(request())).status,503);
 assert.equal(calls.upstream,0);
});

test('invalid PUT payload is rejected before durable quota and upstream are billed',async()=>{
 const calls={upstream:0,quota:0};
 const gateway=makeGateway({consume:async()=>{calls.quota++;return true;}},calls);
 const base='https://gateway.invalid/progress';
 const headers={origin:ORIGIN,authorization:'Bearer valid-a-test-token'};
 const wrongType=new Request(base,{method:'PUT',headers:{...headers,'content-type':'text/plain'},body:'{}'});
 assert.equal((await gateway(wrongType)).status,415);
 const oversized=new Request(base,{method:'PUT',headers:{...headers,'content-type':'application/json'},body:'x'.repeat(20001)});
 assert.equal((await gateway(oversized)).status,413);
 assert.equal(calls.quota,0);
 assert.equal(calls.upstream,0);
 const allowed=new Request(base,{method:'PUT',headers:{...headers,'content-type':'application/json'},body:'{}'});
 assert.equal((await gateway(allowed)).status,200);
 assert.equal(calls.quota,1);
 assert.equal(calls.upstream,1);
});

test('streamed oversized PUT stops before durable quota even without Content-Length',async()=>{
 const calls={upstream:0,quota:0};
 const gateway=makeGateway({consume:async()=>{calls.quota++;return true;}},calls);
 let produced=0;
 const body=new ReadableStream({pull(controller){
  produced++;
  controller.enqueue(new Uint8Array(4096).fill(65));
  if(produced===20)controller.close();
 }});
 const request=new Request('https://gateway.invalid/progress',{method:'PUT',
  headers:{origin:ORIGIN,authorization:'Bearer valid-a-test-token','content-type':'application/json'},
  body,duplex:'half'});
 assert.equal(request.headers.get('content-length'),null);
 const response=await gateway(request);
 assert.equal(response.status,413);
 assert.equal(calls.quota,0);
 assert.equal(calls.upstream,0);
 assert.ok(produced<20,'should stop reading before all chunks are buffered');
});
test('invalid UTF-8 PUT is rejected without consuming durable quota',async()=>{
 const calls={upstream:0,quota:0};
 const gateway=makeGateway({consume:async()=>{calls.quota++;return true;}},calls);
 const request=new Request('https://gateway.invalid/progress',{method:'PUT',
  headers:{origin:ORIGIN,authorization:'Bearer valid-a-test-token','content-type':'application/json'},
  body:new Uint8Array([0xc3,0x28])});
 assert.equal((await gateway(request)).status,400);
 assert.equal(calls.quota,0);
 assert.equal(calls.upstream,0);
});


test('JSON-looking media types are rejected before durable quota and Neon',async()=>{
 const calls={upstream:0,quota:0};
 const gateway=makeGateway({consume:async()=>{calls.quota++;return true;}},calls);
 const url='https://gateway.invalid/progress';
 const headers={origin:ORIGIN,authorization:'Bearer valid-a-test-token'};
 for(const type of ['application/json-malicious','application/jsonp','application/json; charset=iso-8859-1',
  'application/json; boundary=unsafe','text/plain; application/json']){
  const response=await gateway(new Request(url,{method:'PUT',
   headers:{...headers,'content-type':type},body:'{}'}));
  assert.equal(response.status,415,type);
 }
 assert.equal(calls.quota,0);
 assert.equal(calls.upstream,0);
 for(const type of ['application/json','application/json; charset=UTF-8']){
  const response=await gateway(new Request(url,{method:'PUT',
   headers:{...headers,'content-type':type},body:'{}'}));
  assert.equal(response.status,200,type);
 }
 assert.equal(calls.quota,2);
 assert.equal(calls.upstream,2);
});
