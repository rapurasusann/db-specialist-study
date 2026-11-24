import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function backend(){
 const values=new Map();
 return async ({keys,windowMs,now})=>{
  // In-memory single-process fixture only. NOT a production distributed store.
  const snapshot=keys.map(({key,limit})=>{
   const old=values.get(key);
   const record=!old||now-old.start>=windowMs?{start:now,count:0}:old;
   return {key,limit,record};
  });
  if(snapshot.some(({limit,record})=>record.count>=limit))return false;
  for(const {key,record} of snapshot) values.set(key,{start:record.start,count:record.count+1});
  return true;
 };
}
test('two gateway clients use the same atomic backend and enforce global quota',async()=>{
 const consume=backend();
 const first=createCs03SharedQuota({atomicConsume:consume,limits:{global:3,perIp:4,perUser:4},clock:()=>10000});
 const second=createCs03SharedQuota({atomicConsume:consume,limits:{global:3,perIp:4,perUser:4},clock:()=>10000});
 const results=await Promise.all(Array.from({length:10},(_,i)=>(i%2?second:first).consume({userId:i%2?B:A,ip:'192.0.2.'+(i%2?2:1)})));
 assert.equal(results.filter(Boolean).length,3);
});
test('per-user limit survives recreation of the quota coordinator',async()=>{
 const atomicConsume=backend(),options={atomicConsume,limits:{global:10,perIp:10,perUser:1},clock:()=>10000};
 assert.equal(await createCs03SharedQuota(options).consume({userId:A,ip:'192.0.2.1'}),true);
 assert.equal(await createCs03SharedQuota(options).consume({userId:A,ip:'192.0.2.1'}),false);
 assert.equal(await createCs03SharedQuota(options).consume({userId:B,ip:'192.0.2.2'}),true);
});
test('per-IP limit cannot be changed by untrusted forwarded headers',async()=>{
 const atomicConsume=backend();
 const quota=createCs03SharedQuota({atomicConsume,limits:{global:10,perIp:1,perUser:10},clock:()=>10000});
 assert.equal(await quota.consume({userId:A,ip:'192.0.2.5'}),true);
 assert.equal(await quota.consume({userId:B,ip:'192.0.2.5',forwardedFor:'203.0.113.44'}),false);
});
test('backend rejection and invalid results fail closed',async()=>{
 for(const atomicConsume of [async()=>{throw Error('offline')},async()=>undefined,async()=>({accepted:true})]){
  const q=createCs03SharedQuota({atomicConsume,clock:()=>10000});
  await assert.rejects(q.consume({userId:A,ip:'192.0.2.5'}),/SHARED_QUOTA_UNAVAILABLE/);
 }
});
test('invalid identity and configuration fail closed',async()=>{
 const q=createCs03SharedQuota({atomicConsume:backend(),clock:()=>10000});
 await assert.rejects(q.consume({userId:'not-a-user',ip:'192.0.2.5'}),/SHARED_QUOTA_UNAVAILABLE/);
 await assert.rejects(q.consume({userId:A,ip:''}),/SHARED_QUOTA_UNAVAILABLE/);
 assert.throws(()=>createCs03SharedQuota({atomicConsume:null}),/SHARED_QUOTA_CONFIG_INVALID/);
});
