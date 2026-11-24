import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectCs03EntrypointContract,inspectCs03EntrypointReviewFile}
 from '../scripts/cs03-entrypoint-contract-review.mjs';
import {inspectCs03Deployment} from '../scripts/cs03-predeploy-guard.mjs';
const path=fileURLToPath(new URL('../docs/cs03-worker-entrypoint-contract-review-only.json',import.meta.url));
const original=JSON.parse(readFileSync(path,'utf8'));
const inspect=(v)=>inspectCs03EntrypointContract({manifest:v});
const clone=()=>structuredClone(original);
test('review manifest matches entrypoint, binding and isolated environments without credentials',()=>{
 assert.deepEqual(inspectCs03EntrypointReviewFile(),[]);
 assert.equal(original.kind,'CS03_REVIEW_ONLY_NOT_WRANGLER_CONFIG');
 assert.equal(original.deploymentApproved,false);
 assert.equal(original.release,'NO-GO');
});
test('wrong entrypoint or DO binding is rejected',()=>{
 for(const change of [
  v=>{v.entrypoint='server/cs03-worker-candidate.mjs';},
  v=>{v.durableObject.binding='OTHER';},
  v=>{v.durableObject.sqliteRequired=false;}
 ]){
  const v=clone();change(v);assert.notDeepEqual(inspect(v),[]);
 }
});
test('wrong secret names, Neon isolation metadata, or public routes fail closed',()=>{
 for(const change of [
  v=>{v.environment.CS03_GATEWAY_SECRET='plaintext';},
  v=>{v.environment.CS03_NEON_FUNCTION_URL='https://example.invalid/progress';},
  v=>{v.neonFunction.CS03_ISOLATED_BRANCH_ID='default';},
  v=>{v.publicIngress.routes=['example.invalid/*'];},
  v=>{v.publicIngress.workersDev=true;},
  v=>{v.accounts.cloudflare='other-account';}
 ]){
  const v=clone();change(v);assert.notDeepEqual(inspect(v),[]);
 }
});
test('review-only manifesto never upgrades deployment readiness',()=>{
 assert.equal(inspectCs03Deployment().ready,false);
 assert.ok(inspectCs03Deployment().blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
});
test('tampered source can never pass the static contract',()=>{
 const v=clone();
 const source=p=>p==='server/cs03-gateway-production-adapter.mjs'?'export default {}':readFileSync(
  fileURLToPath(new URL('../'+p,import.meta.url)),'utf8');
 const issues=inspectCs03EntrypointContract({manifest:v,source});
 assert.ok(issues.includes('DEFAULT_ENTRYPOINT_MISSING'));
 assert.ok(issues.includes('STOP_MODE_GUARD_MISSING'));
});
