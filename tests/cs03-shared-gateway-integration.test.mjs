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
