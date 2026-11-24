import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectCs03AccessIngressReview,inspectCs03AccessIngressReviewTemplate} from '../scripts/cs03-access-ingress-review.mjs';

const contract=JSON.parse(readFileSync(fileURLToPath(new URL('../docs/cs03-access-ingress-review-only.json',import.meta.url)),'utf8'));
const review=c=>inspectCs03AccessIngressReview({...contract,...c});

test('review-only Access plan stays explicitly undeployed and NO-GO',()=>{
 assert.deepEqual(inspectCs03AccessIngressReviewTemplate(),[]);
 assert.equal(contract.deploymentApproved,false);
 assert.equal(contract.accessPolicyCreated,false);
 assert.equal(contract.workerCreated,false);
 assert.equal(contract.release,'NO-GO');
});
test('rejects allowing unauthenticated users or broad email domains',()=>{
 for(const change of [{allowEveryone:true},{allowEmailDomain:true},{authenticatedTesters:0},{authenticatedTesters:20}]){
  assert.ok(review(change).includes('INDIVIDUAL_ALLOW_POLICY_REQUIRED'));
 }
});
test('rejects preview-only and hostname-only Access instead of Worker all-traffic',()=>{
 for(const change of [{accessScope:'hostname'},{accessScope:'preview-only'},{accessDestination:'preview_worker'},{accessDestination:'self_hosted_domain'}]){
  assert.ok(review(change).some(x=>x==='WORKER_WIDE_ACCESS_REQUIRED'||x==='PREVIEW_ONLY_OR_HOST_ONLY_ACCESS_REJECTED'));
 }
});
test('rejects accidental URL exposure and Fail open',()=>{
 for(const change of [{workersDev:true},{previewUrls:true},{routes:['example.invalid/*']}]){
  assert.ok(review(change).includes('PUBLIC_INGRESS_MUST_REMAIN_DISABLED'));
 }
 assert.ok(review({cloudflareFailOpen:true}).includes('FAIL_CLOSED_LIVE_PROOF_STILL_REQUIRED'));
});
test('rejects claims of verified live safety or deployment approval',()=>{
 for(const change of [{accessPolicyCreated:true},{workerCreated:true},{deploymentApproved:true},{release:'GO'},{failClosedVerified:true},{neonDirectAccessVerified:true},{durableQuotaVerified:true}]){
  assert.notDeepEqual(review(change),[]);
 }
});
test('rejects account mismatch and malformed review input',()=>{
 assert.ok(review({accountType:'another-account'}).includes('DEDICATED_ACCOUNT_REQUIRED'));
 assert.deepEqual(inspectCs03AccessIngressReview(null),['INVALID_REVIEW_CONTRACT']);
 assert.deepEqual(inspectCs03AccessIngressReview([]),['INVALID_REVIEW_CONTRACT']);
});
