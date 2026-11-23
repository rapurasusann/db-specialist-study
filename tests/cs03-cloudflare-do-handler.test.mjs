import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';
const base={now:10000,windowMs:60000,keys:[
 {key:'cs03:global',limit:60},{key:'cs03:ip:192.0.2.1',limit:20},
 {key:'cs03:user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',limit:10}
]};
const request=(payload=base,method='POST')=>new Request('https://cs03-quota.internal/consume',{method,
 headers:{'content-type':'application/json'},...(method==='POST'?{body:JSON.stringify(payload)}:{})});
test('internal handler applies server clock and returns one boolean',async()=>{
 let captured;
 const handler=createCs03QuotaObjectHandler({storage:{},clock:()=>10100,consume:(_s,payload)=>{captured=payload;return true;}});
 const result=await handler(request());
 assert.equal(result.status,200);
 assert.deepEqual(await result.json(),{accepted:true});
 assert.equal(captured.now,10100);
 assert.equal(result.headers.get('cache-control'),'no-store');
});
test('wrong path, method and malformed quota are rejected without storage access',async()=>{
 let count=0;const handler=createCs03QuotaObjectHandler({storage:{},clock:()=>10000,consume:()=>{count++;return true;}});
 const invalid=[
  new Request('https://cs03-quota.internal/wrong',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(base)}),
  request(base,'GET'),
  request({...base,keys:[{...base.keys[0],limit:999},...base.keys.slice(1)]}),
  request({...base,keys:[base.keys[0],base.keys[1],{...base.keys[2],key:'cs03:user:spoof'}]}),
  request({...base,windowMs:1000}),
  request({...base,now:-1})
 ];
 for(const r of invalid)assert.equal((await handler(r)).status,400);
 assert.equal(count,0);
});
test('clock skew and storage failure are fail closed',async()=>{
 let count=0;
 const skewed=createCs03QuotaObjectHandler({storage:{},clock:()=>100000,consume:()=>{count++;return true;}});
 assert.equal((await skewed(request())).status,503);
 assert.equal(count,0);
 const broken=createCs03QuotaObjectHandler({storage:{},clock:()=>10000,consume:()=>{throw Error('secret storage detail');}});
 const response=await broken(request());
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'Service Unavailable'});
});
