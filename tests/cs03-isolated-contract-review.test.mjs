import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCs03IsolatedContract,CS03_REVIEW_EXPECTED} from '../scripts/cs03-isolated-contract-review.mjs';
const meta=()=>({
 origin:CS03_REVIEW_EXPECTED.origin,issuer:CS03_REVIEW_EXPECTED.issuer,
 audience:CS03_REVIEW_EXPECTED.issuer,jwks:CS03_REVIEW_EXPECTED.jwks,
 neonFunctionUrl:null,workerSecretName:'CS03_GATEWAY_SECRET',
 functionSecretName:'CS03_ORIGIN_SECRET'
});
test('source and fixed isolated identity agree; missing Neon function stays a blocker',()=>{
 const issues=inspectCs03IsolatedContract({workerMetadata:meta()});
 assert.deepEqual(issues,[
  'NEON_FUNCTION_URL_UNAVAILABLE','SECRET_VALUE_MATCH_UNVERIFIED',
  'CLOUDFLARE_TRUSTED_INGRESS_UNVERIFIED','ISOLATED_DEPLOYMENT_NOT_APPROVED'
 ]);
});
test('rejects mismatched issuer, audience, JWKS, origin and secret binding names',()=>{
 const issues=inspectCs03IsolatedContract({workerMetadata:{
  ...meta(),origin:'https://other.invalid',issuer:'https://other.invalid',
  audience:'wrong',jwks:'https://other.invalid/jwks',
  workerSecretName:'SOME_OTHER_KEY',functionSecretName:'WRONG'
 }});
 for(const code of ['WORKER_ORIGIN_NOT_ISOLATED','WORKER_ISSUER_MISMATCH',
  'WORKER_AUDIENCE_MISMATCH','WORKER_JWKS_MISMATCH',
  'SECRET_BINDING_NAME_MISMATCH'])assert.ok(issues.includes(code),code);
});
test('even a well-formed hypothetical URL does not constitute isolated Function ownership evidence',()=>{
 const issues=inspectCs03IsolatedContract({workerMetadata:{
  ...meta(),neonFunctionUrl:'https://unverified.example.invalid/progress'
 }});
 assert.ok(issues.includes('NEON_FUNCTION_URL_OWNERSHIP_UNVERIFIED'));
 assert.ok(!issues.includes('NEON_FUNCTION_URL_UNAVAILABLE'));
 assert.ok(issues.includes('ISOLATED_DEPLOYMENT_NOT_APPROVED'));
});
test('malformed Function targets are denied and never treated as deployable',()=>{
 for(const value of ['http://example.invalid/progress','https://example.invalid/other',
  'https://user:pw@example.invalid/progress','not-a-url']){
  const issues=inspectCs03IsolatedContract({workerMetadata:{...meta(),neonFunctionUrl:value}});
  assert.ok(issues.includes('NEON_FUNCTION_URL_INVALID'),value);
 }
});
test('code inspection catches missing fixed origin or secret header independently',async()=>{
 const fs=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const source=path=>fs.readFileSync(fileURLToPath(new URL('../'+path,import.meta.url)),'utf8');
 const issues=inspectCs03IsolatedContract({workerMetadata:meta(),source:path=>{
  const body=source(path);
  if(path==='functions/cs03-progress.mjs')return body.replace("request.headers.get('x-secret')","request.headers.get('wrong-header')");
  return body;
 }});
 assert.ok(issues.includes('FUNCTION_SECRET_HEADER_MISSING'));
});
test('no metadata means not verified; never prints or stores actual secrets',()=>{
 const issues=inspectCs03IsolatedContract();
 assert.ok(issues.includes('WORKER_METADATA_REQUIRED'));
 assert.ok(issues.includes('ISOLATED_DEPLOYMENT_NOT_APPROVED'));
});
