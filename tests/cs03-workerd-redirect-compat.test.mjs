import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
const request={now:10000,windowMs:60000,keys:[{key:'cs03:global',limit:60},{key:'cs03:ip:192.0.2.1',limit:20},{key:'cs03:user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',limit:10}]};
test('DO transport uses workerd-supported redirect mode and refuses redirects',async()=>{
 const namespace={idFromName:()=> 'one',get:()=>({fetch:async (_url,init)=>{
  assert.equal(init.redirect,'manual');
  return new Response(null,{status:302,headers:{location:'https://evil.example'}});
 }})};
 const consume=createCs03DurableObjectQuotaTransport({namespace});
 await assert.rejects(consume(request),/SHARED_QUOTA_UNAVAILABLE/);
});
test('trusted upstream fetch uses workerd-supported redirect mode and rejects redirect',async()=>{
 let checked=false;
 const gateway=createCs03TrustedEdgeGateway({
  verifyToken:async()=>({userId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}),
  getClientIp:()=> '192.0.2.1',
  upstreamUrl:'https://isolated.invalid/progress',
  upstreamSecret:'test-secret-isolated-abcdefghijklmnopqrstuvwxyz',
  fetcher:async(_url,init)=>{checked=true;assert.equal(init.redirect,'manual');return new Response(null,{status:302});}
 });
 const response=await gateway(new Request('https://gateway.invalid/progress?examCode=db',{
  headers:{origin:'https://rapurasusann.github.io',authorization:'Bearer isolated-valid-token'}}));
 assert.equal(checked,true);
 assert.equal(response.status,503);
});
