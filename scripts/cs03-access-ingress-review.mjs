// CS-03: strictly offline planning check. NEVER describes a deployed Access policy.
// This review gate does not grant deployment approval or query Cloudflare.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const path=fileURLToPath(new URL('../docs/cs03-access-ingress-review-only.json',import.meta.url));

export function inspectCs03AccessIngressReview(contract){
 const blockers=[];
 if(!contract||typeof contract!=='object'||Array.isArray(contract))return ['INVALID_REVIEW_CONTRACT'];
 if(contract.kind!=='CS03_ACCESS_INGRESS_REVIEW_ONLY')blockers.push('REVIEW_KIND_REQUIRED');
 if(contract.deploymentApproved!==false||contract.release!=='NO-GO')blockers.push('UNAPPROVED_DEPLOYMENT_MUST_REMAIN_BLOCKED');
 if(contract.workerCreated!==false||contract.accessPolicyCreated!==false)
  blockers.push('LIVE_RESOURCES_MUST_NOT_BE_CLAIMED');
 if(contract.accessScope!=='single-worker-all-traffic')blockers.push('WORKER_WIDE_ACCESS_REQUIRED');
 if(contract.accessDestination!=='worker')blockers.push('PREVIEW_ONLY_OR_HOST_ONLY_ACCESS_REJECTED');
 if(contract.authenticatedTesters!==1||contract.allowEveryone!==false||contract.allowEmailDomain!==false)
  blockers.push('INDIVIDUAL_ALLOW_POLICY_REQUIRED');
 if(contract.workersDev!==false||contract.previewUrls!==false||
    !Array.isArray(contract.routes)||contract.routes.length!==0)
  blockers.push('PUBLIC_INGRESS_MUST_REMAIN_DISABLED');
 if(contract.cloudflareFailOpen!==false||contract.failClosedVerified!==false)
  blockers.push('FAIL_CLOSED_LIVE_PROOF_STILL_REQUIRED');
 if(contract.neonDirectAccessVerified!==false||contract.durableQuotaVerified!==false)
  blockers.push('LIVE_UPSTREAM_SECURITY_STILL_UNVERIFIED');
 if(contract.accountType!=='Certification-Study')
  blockers.push('DEDICATED_ACCOUNT_REQUIRED');
 return blockers;
}

export function inspectCs03AccessIngressReviewTemplate(){
 return inspectCs03AccessIngressReview(JSON.parse(readFileSync(path,'utf8')));
}
