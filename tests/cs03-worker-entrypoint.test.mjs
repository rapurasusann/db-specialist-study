import test from 'node:test';
import assert from 'node:assert/strict';
import entry,{Cs03QuotaNotDeployed} from '../server/cs03-gateway-production-adapter.mjs';
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
 assert.ok(audit.blockers.includes('TRUSTED_GATEWAY_NOT_IMPLEMENTED'));
 assert.ok(audit.blockers.includes('GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING'));
 assert.ok(audit.blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
});
