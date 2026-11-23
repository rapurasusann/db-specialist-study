import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCs03CloudflareAccount,CS03_CLOUDFLARE_ACCOUNT_ID as EXPECTED}
 from '../scripts/cs03-cloudflare-account-guard.mjs';
import {inspectCs03Deployment} from '../scripts/cs03-predeploy-guard.mjs';

const OTHER='f677da3674421730171a1cfba48c2a04';
test('the separate Certification-Study account ID is the only permitted account',()=>{
 assert.equal(EXPECTED,'9829f590b4afea346993621ca3a0c13f');
 assert.deepEqual(inspectCs03CloudflareAccount({env:{CLOUDFLARE_ACCOUNT_ID:EXPECTED}}),[]);
 assert.deepEqual(inspectCs03CloudflareAccount({env:{CF_ACCOUNT_ID:EXPECTED}}),[]);
});
test('missing, other, malformed, and mixed accounts fail closed',()=>{
 assert.ok(inspectCs03CloudflareAccount({env:{}})
  .includes('CS03_DEDICATED_CLOUDFLARE_ACCOUNT_MISSING'));
 for(const wrong of [OTHER,'', 'not-an-id',EXPECTED.toUpperCase()]){
  assert.notDeepEqual(inspectCs03CloudflareAccount({env:{CLOUDFLARE_ACCOUNT_ID:wrong}}),[]);
 }
 const mixed=inspectCs03CloudflareAccount({env:{CLOUDFLARE_ACCOUNT_ID:EXPECTED,CF_ACCOUNT_ID:OTHER}});
 assert.ok(mixed.includes('CS03_CLOUDFLARE_ACCOUNT_ENV_CONFLICT'));
 assert.ok(mixed.includes('CS03_DEDICATED_CLOUDFLARE_ACCOUNT_MISMATCH'));
});
test('review Wrangler metadata cannot point at another account or public routes',()=>{
 assert.deepEqual(inspectCs03CloudflareAccount({env:{CF_ACCOUNT_ID:EXPECTED},
  config:{workers_dev:false,preview_urls:false}}),[]);
 for(const config of [{account_id:OTHER},{route:'example.invalid/*'},
  {routes:['example.invalid/*']},{zone_id:OTHER}]){
  assert.notDeepEqual(inspectCs03CloudflareAccount({env:{CF_ACCOUNT_ID:EXPECTED},config}),[]);
 }
});
test('account match does not release independent deployment NO-GO blockers',()=>{
 const previousA=process.env.CLOUDFLARE_ACCOUNT_ID,previousB=process.env.CF_ACCOUNT_ID;
 try{
  process.env.CLOUDFLARE_ACCOUNT_ID=EXPECTED;
  delete process.env.CF_ACCOUNT_ID;
  const state=inspectCs03Deployment();
  assert.equal(state.ready,false);
  assert.ok(state.blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
  assert.ok(state.blockers.includes('GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING'));
 }finally{
  if(previousA===undefined)delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID=previousA;
  if(previousB===undefined)delete process.env.CF_ACCOUNT_ID;
  else process.env.CF_ACCOUNT_ID=previousB;
 }
});
test('default deployment gate blocks an unspecified Cloudflare account',()=>{
 const current=inspectCs03Deployment();
 assert.equal(current.ready,false);
 // The user has not provisioned any Cloudflare deployment binding.
 if(!process.env.CF_ACCOUNT_ID&&!process.env.CLOUDFLARE_ACCOUNT_ID)
  assert.ok(current.blockers.includes('CS03_DEDICATED_CLOUDFLARE_ACCOUNT_MISSING'));
});
