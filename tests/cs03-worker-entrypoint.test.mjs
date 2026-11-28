import test from 'node:test';
import assert from 'node:assert/strict';
import entry,{createCs03Entrypoint,Cs03QuotaNotDeployed} from '../server/cs03-gateway-production-adapter.mjs';
import {inspectCs03Deployment} from '../scripts/cs03-predeploy-guard.mjs';
const request=()=>new Request('https://candidate.invalid/progress?examCode=db',{headers:{
 origin:'https://rapurasusann.github.io','cf-connecting-ip':'192.0.2.9'
}});
function cloudflareRequest(){
 const r=request();
 Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
 return r;
}
test('Worker adapter denies access before isolated review opt-in',async()=>{
 assert.equal((await entry.fetch(request(),{})).status,503);
 assert.equal((await entry.fetch(cloudflareRequest(),{})).status,503);
 assert.equal((await entry.fetch(cloudflareRequest(),{CS03_ISOLATED_GATEWAY_MODE:'production'})).status,503);
});
test('Worker adapter rejects missing Cloudflare metadata and incomplete bindings',async()=>{
 assert.equal((await entry.fetch(request(),{CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only'})).status,503);
 const response=await entry.fetch(cloudflareRequest(),{CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only'});
 assert.equal(response.status,503);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.deepEqual(await response.json(),{error:'Service Unavailable'});
});
test('review entrypoint exports SQLite DO binding but still leaves independent deployment guard blocked',()=>{
 assert.equal(typeof Cs03QuotaNotDeployed,'function');
 const audit=inspectCs03Deployment();
 assert.equal(audit.ready,false);
 assert.equal(audit.scope,'development-only');
 assert.ok(audit.blockers.includes('LIVE_ISOLATION_AND_COST_NOT_VERIFIED'));
 assert.ok(!audit.blockers.includes('SHARED_GATEWAY_WIRING_UNVERIFIED'));
 assert.ok(!audit.blockers.includes('TRUSTED_GATEWAY_NOT_IMPLEMENTED'));
 assert.ok(!audit.blockers.includes('GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING'));
 assert.ok(!audit.blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
});

test('Worker requires matching Access authentication audience before creating gateway',async()=>{
 let gatewayCreated=0,upstreamCalls=0;
 const guarded=createCs03Entrypoint({createGateway:()=>{
  gatewayCreated++;
  return async()=>{upstreamCalls++;return Response.json({testOnly:true});};
 }});
 const config={CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only',CS03_ACCESS_AUD:'cs03-test-access-audience'};
 const req=cloudflareRequest();
 for(const [env,ctx] of [
  [config,undefined],
  [config,{access:{aud:'another-access-audience'}}],
  [{...config,CS03_ACCESS_AUD:''},{access:{aud:'cs03-test-access-audience'}}],
  [{...config,CS03_ACCESS_AUD:'other-access-audience'},{access:{aud:'cs03-test-access-audience'}}]
 ]){
  const response=await guarded.fetch(req,env,ctx);
  assert.equal(response.status,503);
  assert.equal(response.headers.get('cache-control'),'no-store');
 }
 assert.equal(gatewayCreated,0);
 assert.equal(upstreamCalls,0);
 const response=await guarded.fetch(req,config,{access:{aud:'cs03-test-access-audience'}});
 assert.equal(response.status,200);
 assert.equal(gatewayCreated,1);
 assert.equal(upstreamCalls,1);
});
