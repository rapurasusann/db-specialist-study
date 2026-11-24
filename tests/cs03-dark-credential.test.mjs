import test from 'node:test';
import assert from 'node:assert/strict';
import {ACCOUNT,NAME} from '../scripts/cs03-dark-preflight.mjs';
import {credentialContext,withVerifiedCredential} from '../scripts/cs03-dark-credential.mjs';
const source=()=>({CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CS03_CF_DEPLOY_TOKEN:'fake-test-token'});
const response=(result)=>({ok:true,json:async()=>({success:true,result})});
test('wrong account rejected',()=>assert.throws(()=>credentialContext({...source(),CLOUDFLARE_ACCOUNT_ID:'wrong'}),/ACCOUNT_MISMATCH/));
test('missing token rejected',()=>assert.throws(()=>credentialContext({CLOUDFLARE_ACCOUNT_ID:ACCOUNT}),/DEPLOY_TOKEN_REQUIRED/));
test('alternate credential rejected',()=>assert.throws(()=>credentialContext({...source(),CLOUDFLARE_API_TOKEN:'other'}),/AMBIGUOUS_CREDENTIAL/));
test('unrelated secrets and endpoint overrides excluded',()=>{
 const {env}=credentialContext({...source(),DATABASE_URL:'fake',CLOUDFLARE_API_BASE_URL:'https://invalid.example',CS03_ORIGIN_SECRET:'fake'});
 assert.equal(env.DATABASE_URL,undefined);assert.equal(env.CLOUDFLARE_API_BASE_URL,undefined);assert.equal(env.CS03_ORIGIN_SECRET,undefined);
});
test('same bearer and account reach both boundaries and child env is cleared',async()=>{
 let child;
 await withVerifiedCredential(source(),async env=>{child=env;assert.equal(env.CLOUDFLARE_API_TOKEN,'fake-test-token');assert.equal(env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);},{fetcher:async(url,options)=>{assert.ok(url.includes('/accounts/'+ACCOUNT+'/'));assert.equal(options.headers.Authorization,'Bearer fake-test-token');return response([]);}});
 assert.equal(child.CLOUDFLARE_API_TOKEN,undefined);
});
test('existing worker blocks callback',async()=>{
 await assert.rejects(withVerifiedCredential(source(),()=>assert.fail('must not run'),{fetcher:async()=>response([{id:NAME}])}),/WORKER_ALREADY_EXISTS/);
});
test('network failure blocks callback',async()=>{
 await assert.rejects(withVerifiedCredential(source(),()=>assert.fail('must not run'),{fetcher:async()=>{throw Error('network');}}),/network/);
});
test('callback failure clears child credential',async()=>{
 let child;
 await assert.rejects(withVerifiedCredential(source(),env=>{child=env;throw Error('failure');},{fetcher:async()=>response([])}),/failure/);
 assert.equal(child.CLOUDFLARE_API_TOKEN,undefined);
});
