// Offline-only CS-03 Worker -> Neon Function configuration contract review.
// No Cloudflare/Neon API access. This is not a deployment authorization.
// Accept only metadata; NEVER pass actual secrets to this review function.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const read=path=>readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');
const EXPECTED={
 origin:'https://rapurasusann.github.io',
 issuer:'https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech',
 jwks:'https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth/.well-known/jwks.json',
 branch:'br-snowy-truth-a162pmdt',
 db:'cs03_auth_sandbox'
};
const flags=[
 ['server/cs03-trusted-edge-gateway.mjs',/const ORIGIN='https:\/\/rapurasusann\.github\.io'/,'GATEWAY_ORIGIN_MISMATCH'],
 ['functions/cs03-progress.mjs',/const ORIGIN='https:\/\/rapurasusann\.github\.io'/,'FUNCTION_ORIGIN_MISMATCH'],
 ['server/cs03-runtime.mjs',/const ISOLATED_BRANCH='br-snowy-truth-a162pmdt'/,'FUNCTION_BRANCH_MISMATCH'],
 ['server/cs03-runtime.mjs',/const TEST_DB='cs03_auth_sandbox'/,'FUNCTION_DB_MISMATCH'],
 ['server/cs03-runtime.mjs',/const ISSUER='https:\/\/ep-dawn-dew-a11prveg\.neonauth\.ap-southeast-1\.aws\.neon\.tech'/,'FUNCTION_ISSUER_MISMATCH'],
 ['server/cs03-runtime.mjs',/const JWKS='https:\/\/ep-dawn-dew-a11prveg\.neonauth\.ap-southeast-1\.aws\.neon\.tech\/cs03_auth_sandbox\/auth\/\.well-known\/jwks\.json'/,'FUNCTION_JWKS_MISMATCH'],
 ['server/cs03-trusted-edge-gateway.mjs',/['"]x-secret['"]\s*:\s*upstreamSecret/,'UPSTREAM_SECRET_HEADER_MISSING'],
 ['functions/cs03-progress.mjs',/request\.headers\.get\('x-secret'\)/,'FUNCTION_SECRET_HEADER_MISSING'],
 ['server/cs03-worker-candidate.mjs',/CS03_GATEWAY_SECRET:upstreamSecret/,'WORKER_SECRET_BINDING_MISSING'],
 ['functions/cs03-progress.mjs',/process\.env\.CS03_ORIGIN_SECRET/,'FUNCTION_SECRET_BINDING_MISSING'],
 ['server/cs03-gateway-production-adapter.mjs',/CS03_ISOLATED_GATEWAY_MODE!=='isolated-review-only'/,'ADAPTER_FAIL_CLOSED_MODE_MISSING'],
 ['cs03-config.js',/previewEnabled:\s*false/,'PUBLIC_PREVIEW_NOT_DISABLED']
];
export function inspectCs03IsolatedContract({workerMetadata,source=read}={}){
 const issues=[];
 for(const [path,pattern,code] of flags){
  let body;
  try{body=source(path);}catch{issues.push('SOURCE_UNAVAILABLE:'+path);continue;}
  if(!pattern.test(body))issues.push(code);
 }
 if(!workerMetadata||typeof workerMetadata!=='object'||Array.isArray(workerMetadata))
  issues.push('WORKER_METADATA_REQUIRED');
 else{
  const m=workerMetadata;
  if(m.origin!==EXPECTED.origin)issues.push('WORKER_ORIGIN_NOT_ISOLATED');
  if(m.issuer!==EXPECTED.issuer)issues.push('WORKER_ISSUER_MISMATCH');
  if(m.audience!==EXPECTED.issuer)issues.push('WORKER_AUDIENCE_MISMATCH');
  if(m.jwks!==EXPECTED.jwks)issues.push('WORKER_JWKS_MISMATCH');
  // Function invocation URL is not yet provided by Neon (0 deployed functions).
  // DO NOT manufacture a URL or mark upstream verified based on a hostname guess.
  if(typeof m.neonFunctionUrl!=='string'||!m.neonFunctionUrl)
   issues.push('NEON_FUNCTION_URL_UNAVAILABLE');
  else{
   let url;
   try{url=new URL(m.neonFunctionUrl);}catch{}
   if(!url||url.protocol!=='https:'||url.username||url.password||
      url.search||url.hash||url.pathname!=='/progress')
    issues.push('NEON_FUNCTION_URL_INVALID');
   // Even a syntactically valid URL is not proof it belongs to the isolated branch.
   issues.push('NEON_FUNCTION_URL_OWNERSHIP_UNVERIFIED');
  }
  if(m.workerSecretName!=='CS03_GATEWAY_SECRET'||m.functionSecretName!=='CS03_ORIGIN_SECRET')
   issues.push('SECRET_BINDING_NAME_MISMATCH');
  // Only the names are inspected. Matching actual secret values, length, and
  // deployment permissions are intentionally NOT asserted by this tool.
  issues.push('SECRET_VALUE_MATCH_UNVERIFIED');
 }
 // These two items cannot be closed with static source inspection alone.
 issues.push('CLOUDFLARE_TRUSTED_INGRESS_UNVERIFIED');
 issues.push('ISOLATED_DEPLOYMENT_NOT_APPROVED');
 return Object.freeze([...new Set(issues)]);
}
export const CS03_REVIEW_EXPECTED=Object.freeze({...EXPECTED});
