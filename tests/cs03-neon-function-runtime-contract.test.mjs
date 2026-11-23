// CS-03: offline verification of Neon Function runtime/dependency contract.
// Does not use real credentials, call Neon or modify configuration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=p=>readFileSync(fileURLToPath(new URL('../'+p,import.meta.url)),'utf8');
const pkg=JSON.parse(read('package.json'));
const fn=read('functions/cs03-progress.mjs');
const runtime=read('server/cs03-runtime.mjs');
const api=read('src/progress-api.js');
const verifier=read('src/neon-jwt-verifier.mjs');
test('Neon Function HTTP default export and safe secret gate are present',()=>{
 assert.match(fn,/export default \{fetch\(request\)/);
 assert.match(fn,/process\.env\.CS03_ORIGIN_SECRET/);
 assert.match(fn,/verifyGatewaySecret\(request,secret\)/);
 assert.match(fn,/timingSafeEqual/);
});
test('Function module closure declares its external packages as runtime dependencies',()=>{
 assert.match(runtime,/import pg from 'pg'/);
 assert.match(verifier,/from 'jose'/);
 assert.ok(pkg.dependencies?.pg);
 assert.ok(pkg.dependencies?.jose);
 assert.equal(pkg.devDependencies?.pg,undefined);
 assert.equal(pkg.devDependencies?.jose,undefined);
 assert.match(runtime,/createRequire\(import\.meta\.url\)/);
 assert.match(api,/require\('\.\/progress-access'\)/);
 assert.match(read('src/progress-access.js'),/module\.exports/);
});
test('Function requires isolation-specific environment, not implicit default DATABASE_URL',()=>{
 assert.match(runtime,/CS03_ISOLATED_BRANCH_ID!==ISOLATED_BRANCH/);
 assert.match(runtime,/!env\.CS03_TEST_DATABASE_URL/);
 assert.match(runtime,/parsed\.username!=='cs03_progress_api'/);
 assert.match(runtime,/const TEST_DB='cs03_auth_sandbox'/);
 assert.match(runtime,/get\('sslmode'\)!=='verify-full'/);
 assert.doesNotMatch(runtime,/env\.DATABASE_URL\b/);
 assert.match(fn,/return response\(401,'Unauthorized'/);
});
test('Function missing secret rejects before a DB runtime is constructed',async()=>{
 const {handleBrowserRequest}=await import('../functions/cs03-progress.mjs');
 let created=0;
 const r=new Request('https://isolated.invalid/progress?examCode=db',{
  headers:{origin:'https://rapurasusann.github.io',authorization:'Bearer local-fake-token'}
 });
 const response=await handleBrowserRequest(r,()=>{created++;throw Error('DB_MUST_NOT_BE_TOUCHED');},undefined);
 assert.equal(response.status,401);
 assert.equal(created,0);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('review-only contract does not imply Neon deployment readiness',()=>{
 assert.match(fn,/Kept undeployed until security gates pass/);
 const config=read('cs03-config.js');
 assert.match(config,/previewEnabled:\s*false/);
 assert.equal('neon' in (pkg.scripts??{}),false);
});
