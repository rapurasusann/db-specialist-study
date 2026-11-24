import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
const req={now:10000,windowMs:60000,keys:[{key:'cs03:global',limit:2},{key:'cs03:ip:192.0.2.1',limit:2},{key:'cs03:user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',limit:2}]};
function namespace(fetcher){
 const names=[];
 return {names,idFromName(name){names.push(name);return name;},get(){return {fetch:fetcher}}};
}
test('two clients use one global Durable Object identity and preserve true/false decisions',async()=>{
 let count=0;const ns=namespace(async(url,options)=>{
  assert.equal(url,'https://cs03-quota.internal/consume');
  assert.equal(options.method,'POST');
  assert.deepEqual(JSON.parse(options.body),req);
  return Response.json({accepted:++count<=2});
 });
 const first=createCs03DurableObjectQuotaTransport({namespace:ns});
 const second=createCs03DurableObjectQuotaTransport({namespace:ns});
 assert.deepEqual(await Promise.all([first(req),second(req),first(req)]),[true,true,false]);
 assert.deepEqual(ns.names,['cs03-global-v1','cs03-global-v1','cs03-global-v1']);
});
test('unavailable and malformed Durable Object replies fail closed',async()=>{
 const bad=[async()=>{throw Error('OFFLINE')},async()=>Response.json({error:'no'},{status:503}),async()=>Response.json({accepted:'yes'})];
 for(const fetcher of bad){
  const consume=createCs03DurableObjectQuotaTransport({namespace:namespace(fetcher)});
  await assert.rejects(consume(req),/SHARED_QUOTA_UNAVAILABLE/);
 }
});
test('invalid bindings, object names and requests refuse consumption',async()=>{
 assert.throws(()=>createCs03DurableObjectQuotaTransport({namespace:{}}),/DO_QUOTA_CONFIG_INVALID/);
 assert.throws(()=>createCs03DurableObjectQuotaTransport({namespace:namespace(async()=>Response.json({accepted:true})),objectName:'another-shard'}),/DO_QUOTA_CONFIG_INVALID/);
 const consume=createCs03DurableObjectQuotaTransport({namespace:namespace(async()=>Response.json({accepted:true}))});
 await assert.rejects(consume({keys:[]}),/SHARED_QUOTA_UNAVAILABLE/);
});
