import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
const base='postgresql://cs03_progress_api:fakepassword@ep-dawn-dew-a11prveg-pooler.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox';
const branch='br-snowy-truth-a162pmdt';
const fakePool={connect:async()=>{throw Error('SHOULD_NOT_CONNECT')},end:async()=>{}};
function config(query,overrides={}){return {CS03_ISOLATED_BRANCH_ID:branch,CS03_TEST_DATABASE_URL:base+query,...overrides}}
test('isolated runtime accepts explicit verify-full only',()=>{
 const r=createCs03Runtime(config('?sslmode=verify-full'),{pool:fakePool});
 assert.equal(typeof r.handle,'function');
});
for(const mode of ['require','prefer','verify-ca','disable']) {
 test('isolated runtime rejects TLS mode '+mode,()=>{
  assert.throws(()=>createCs03Runtime(config('?sslmode='+mode),{pool:fakePool}),/CS03_SSL_VERIFY_FULL_REQUIRED/);
 });
}
test('isolated runtime rejects missing TLS mode',()=>{
 assert.throws(()=>createCs03Runtime(config(''),{pool:fakePool}),/CS03_SSL_VERIFY_FULL_REQUIRED/);
});
test('isolated runtime rejects other branch',()=>{
 assert.throws(()=>createCs03Runtime(config('?sslmode=verify-full',{CS03_ISOLATED_BRANCH_ID:'main'}),{pool:fakePool}),/CS03_ISOLATED_CONFIG_REQUIRED/);
});
test('isolated runtime rejects privileged DB role',()=>{
 const env=config('?sslmode=verify-full');
 env.CS03_TEST_DATABASE_URL=env.CS03_TEST_DATABASE_URL.replace('cs03_progress_api','certification_study_owner');
 assert.throws(()=>createCs03Runtime(env,{pool:fakePool}),/CS03_DATABASE_TARGET_MISMATCH/);
});
test('isolated runtime rejects another database',()=>{
 const env=config('?sslmode=verify-full');
 env.CS03_TEST_DATABASE_URL=env.CS03_TEST_DATABASE_URL.replace('/cs03_auth_sandbox','/certification_study');
 assert.throws(()=>createCs03Runtime(env,{pool:fakePool}),/CS03_DATABASE_TARGET_MISMATCH/);
});
test('isolated runtime rejects libpq compatibility override',()=>{
 assert.throws(()=>createCs03Runtime(config('?sslmode=verify-full&uselibpqcompat=true'),{pool:fakePool}),/CS03_SSL_VERIFY_FULL_REQUIRED/);
});
