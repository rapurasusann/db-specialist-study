import test from 'node:test';
import assert from 'node:assert/strict';
import {confirmDeployment} from '../scripts/cs03-deployment-confirm.mjs';
import {recoveryPlan} from '../scripts/cs03-binding-recovery-plan.mjs';
const state={currentId:2,activeId:2,status:'completed'};
const base={inspect:async()=>state,verifyRuntime:async()=>true,expectedId:2,attempts:3,wait:async()=>{}};
test('confirmed runtime',async()=>assert.equal(await confirmDeployment(base),true));
test('stale runtime retries',async()=>{let n=0;assert.equal(await confirmDeployment({...base,verifyRuntime:async()=>++n===2}),true);assert.equal(n,2);});
test('bounded retries',async()=>{let n=0;assert.equal(await confirmDeployment({...base,verifyRuntime:async()=>{n++;return false;}}),false);assert.equal(n,3);});
test('unexpected deployment stops',async()=>assert.equal(await confirmDeployment({...base,inspect:async()=>({...state,currentId:3})}),false));
test('failed deployment stops',async()=>assert.equal(await confirmDeployment({...base,inspect:async()=>({...state,status:'failed'})}),false));
test('read error is bounded',async()=>assert.equal(await confirmDeployment({...base,inspect:async()=>{throw Error('dummy');}}),false));
for(const phase of ['neon','cloudflare','verify','preflight','unknown']){
 test('recovery '+phase,()=>{const r=recoveryPlan({ok:false,phase});assert.equal(r.activationAllowed,false);assert.equal(r.automaticRetry,false);assert.equal(r.automaticRollback,false);if(['neon','cloudflare','verify'].includes(phase)){assert.equal(r.retainProtectedCredentials,true);assert.equal(r.action,'reconcile-both-providers');}});
}
test('success still requires approval',()=>{const r=recoveryPlan({ok:true,phase:'staged'});assert.equal(r.activationAllowed,false);assert.equal(r.action,'verify-before-approval');});
