// Static-only CS-03 entrypoint acceptance. Not a Wrangler config or deployment gate release.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(fileURLToPath(new URL(p,root)),'utf8');
export function inspectCs03EntrypointContract({manifest,source=read}={}){
 const issues=[];
 if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))return Object.freeze(['ENTRYPOINT_MANIFEST_REQUIRED']);
 if(manifest.kind!=='CS03_REVIEW_ONLY_NOT_WRANGLER_CONFIG'||manifest.deploymentApproved!==false||
    manifest.release!=='NO-GO')issues.push('UNAPPROVED_REVIEW_MANIFEST');
 if(manifest.entrypoint!=='server/cs03-gateway-production-adapter.mjs'||manifest.defaultExport!=='fetch')
  issues.push('ENTRYPOINT_PATH_INVALID');
 if(manifest.durableObject?.binding!=='CS03_QUOTA'||
    manifest.durableObject?.className!=='Cs03QuotaNotDeployed'||
    manifest.durableObject?.sqliteRequired!==true)
  issues.push('DURABLE_OBJECT_BINDING_MISMATCH');
 const env=manifest.environment;
 if(!env||env.CS03_ISOLATED_GATEWAY_MODE!=='isolated-review-only'||
   env.CS03_GATEWAY_SECRET!=='server-secret-only'||env.CS03_NEON_FUNCTION_URL!=='isolated-ownership-unverified'||
   ['CS03_JWKS_URL','CS03_JWT_ISSUER','CS03_JWT_AUDIENCE'].some(k=>env[k]!=='metadata-verified-required'))
  issues.push('WORKER_ENVIRONMENT_CONTRACT_MISMATCH');
 if(manifest.neonFunction?.CS03_ORIGIN_SECRET!=='server-secret-only'||
    manifest.neonFunction?.CS03_ISOLATED_BRANCH_ID!=='br-snowy-truth-a162pmdt'||
    manifest.neonFunction?.CS03_TEST_DATABASE_URL!=='isolated-secret-only')
  issues.push('NEON_ISOLATION_CONTRACT_MISMATCH');
 const exposure=manifest.publicIngress;
 if(!exposure||exposure.workersDev!==false||exposure.previewUrls!==false||
   !Array.isArray(exposure.routes)||exposure.routes.length!==0||exposure.zoneId!==null)
  issues.push('PUBLIC_INGRESS_MUST_STAY_DISABLED');
 if(manifest.accounts?.cloudflare!=='dedicated-id-check-required'||manifest.accounts?.neon!=='Certification-Study')
  issues.push('ISOLATED_ACCOUNT_CONTRACT_MISMATCH');
 if(['missingMode','missingCloudflareContext','malformedBindings','quotaUnavailable']
   .some(k=>manifest.failClosed?.[k]!==503))issues.push('FAIL_CLOSED_CONTRACT_MISMATCH');
 const required=[
 ['server/cs03-gateway-production-adapter.mjs',/export default createCs03Entrypoint\(\)/,'DEFAULT_ENTRYPOINT_MISSING'],
 ['server/cs03-gateway-production-adapter.mjs',/export \{Cs03QuotaNotDeployed\}/,'SQLITE_DO_CLASS_EXPORT_MISSING'],
 ['server/cs03-gateway-production-adapter.mjs',/CS03_ISOLATED_GATEWAY_MODE!=='isolated-review-only'/,'STOP_MODE_GUARD_MISSING'],
 ['server/cs03-gateway-production-adapter.mjs',/!request\?\.cf/,'CLOUDFLARE_CONTEXT_GUARD_MISSING'],
 ['server/cs03-worker-candidate.mjs',/CS03_QUOTA:namespace/,'DO_ENV_BINDING_MISSING'],
 ['server/cs03-worker-candidate.mjs',/CS03_GATEWAY_SECRET:upstreamSecret/,'WORKER_SECRET_BINDING_MISSING'],
 ['functions/cs03-progress.mjs',/process\.env\.CS03_ORIGIN_SECRET/,'FUNCTION_SECRET_BINDING_MISSING'],
 ['server/cs03-runtime.mjs',/const TEST_DB='cs03_auth_sandbox'/,'ISOLATED_DATABASE_MISSING'],
 ['cs03-config.js',/previewEnabled:\s*false/,'BROWSER_PREVIEW_MUST_STAY_OFF']
 ];
 for(const [p,pattern,code] of required){
  let body;
  try{body=source(p);}catch{issues.push('SOURCE_MISSING:'+p);continue;}
  if(!pattern.test(body))issues.push(code);
 }
 // Static consistency cannot establish this service is safe/approved to deploy.
 return Object.freeze([...new Set(issues)]);
}
export function inspectCs03EntrypointReviewFile(){
 return inspectCs03EntrypointContract({manifest:JSON.parse(read('docs/cs03-worker-entrypoint-contract-review-only.json'))});
}
