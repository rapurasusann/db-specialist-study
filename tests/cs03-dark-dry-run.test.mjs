// 2026-11-25 04:00 JST. Offline only; no Wrangler or network invocation.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {CONFIG,validateChanges} from '../scripts/cs03-dark-preflight.mjs';
import {withRootConfig,dryRunArgs} from '../scripts/cs03-dark-dry-run.mjs';
const config=JSON.parse(await readFile(new URL('../'+CONFIG,import.meta.url),'utf8'));
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'cs03-dark-test-'));
 try{await fn(root);}finally{await rm(root,{recursive:true,force:true});}
}
test('root config preserves relative entrypoint and is removed on success',()=>fixture(async root=>{
 const result=await withRootConfig(root,config,async path=>{
  assert.equal(dirname(path),root);
  assert.deepEqual(JSON.parse(await readFile(path,'utf8')),config);
  assert.deepEqual(dryRunArgs(path),['deploy','--dry-run','--config',path]);
  return 'ok';
 });
 assert.equal(result,'ok');
 assert.deepEqual(await readdir(root),[]);
}));
test('failed dry run removes temporary config and propagates failure',()=>fixture(async root=>{
 await assert.rejects(withRootConfig(root,config,async()=>{throw Error('simulated failure');}),/simulated failure/);
 assert.deepEqual(await readdir(root),[]);
}));
test('invalid config never invokes runner or writes file',()=>fixture(async root=>{
 await assert.rejects(withRootConfig(root,{...config,workers_dev:true},async()=>assert.fail('runner invoked')),/CONFIG_NOT_EXACT/);
 assert.deepEqual(await readdir(root),[]);
}));
test('concurrent preparation uses distinct files',()=>fixture(async root=>{
 await withRootConfig(root,config,async first=>{
  await withRootConfig(root,config,async second=>{
   assert.notEqual(first,second);
   assert.equal((await readdir(root)).length,2);
  });
  assert.equal((await readdir(root)).length,1);
 });
 assert.deepEqual(await readdir(root),[]);
}));
test('reviewed tooling changes are accepted',()=>validateChanges(['scripts/cs03-dark-dry-run.mjs','tests/cs03-dark-dry-run.test.mjs'],''));
for(const path of [CONFIG,'server/cs03-browser-jwt-entrypoint.mjs','package-lock.json','docs/unreviewed.md']){
 test('reject changed '+path,()=>assert.throws(()=>validateChanges([path],''),/DEPLOYMENT_SOURCE_CHANGED/));
}
for(const status of ['?? unexpected.mjs',' M scripts/cs03-dark-preflight.mjs']){
 test('reject dirty status '+status,()=>assert.throws(()=>validateChanges([],status),/WORKTREE_DIRTY/));
}
