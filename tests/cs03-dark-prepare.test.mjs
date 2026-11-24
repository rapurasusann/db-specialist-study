import test from 'node:test';
import assert from 'node:assert/strict';
import {prepare} from '../scripts/cs03-dark-prepare.mjs';
import {ACCOUNT} from '../scripts/cs03-dark-preflight.mjs';

const head='a'.repeat(40);
function fixture(fail=''){
 const calls=[];
 const env={CLOUDFLARE_API_TOKEN:'synthetic-test-token',CLOUDFLARE_ACCOUNT_ID:ACCOUNT};
 const config={};
 let checks=0;
 const deps={
  preflight:async h=>{assert.equal(h,head);calls.push('preflight');if(fail==='initial'||(fail==='recheck'&&checks>0))throw Error('preflight');checks++;return {root:process.cwd(),config};},
  read:async()=>{calls.push('version');return JSON.stringify({version:fail==='version'?'0':'4.168.0'});},
  verify:async(source,fn)=>{calls.push('credential');if(fail==='credential')throw Error('credential');return fn(env);},
  materialize:async(root,c,fn)=>{calls.push('config');assert.equal(c,config);try{return await fn('temporary.json');}finally{calls.push('cleanup');}},
  run:(exe,args,opts)=>{calls.push('dry-run');assert.equal(exe,process.execPath);assert.deepEqual(args.slice(1),['deploy','--dry-run','--config','temporary.json']);assert.equal(opts.env,env);assert.equal(opts.stdio,'ignore');if(fail==='dry-run')throw Error('dry-run');},
  fetcher:async(url,opts)=>{calls.push('absence');assert.ok(url.includes(ACCOUNT));assert.equal(opts.headers.Authorization,'Bearer synthetic-test-token');return {ok:fail!=='absence',json:async()=>({success:true,result:[]})};}
 };
 return {calls,deps};
}
test('prepare uses only dry-run, cleans config, rechecks source and absence',async()=>{
 const {calls,deps}=fixture();
 assert.deepEqual(await prepare(head,{},deps),{head,prepared:true,deployed:false});
 assert.deepEqual(calls,['preflight','version','credential','config','dry-run','cleanup','preflight','absence']);
});
for(const [failure,expected] of [
 ['initial',['preflight']],
 ['version',['preflight','version']],
 ['credential',['preflight','version','credential']],
 ['dry-run',['preflight','version','credential','config','dry-run','cleanup']],
 ['recheck',['preflight','version','credential','config','dry-run','cleanup','preflight']],
 ['absence',['preflight','version','credential','config','dry-run','cleanup','preflight','absence']]
]){
 test('prepare stops on '+failure,async()=>{
  const {calls,deps}=fixture(failure);
  await assert.rejects(prepare(head,{},deps));
  assert.deepEqual(calls,expected);
 });
}
