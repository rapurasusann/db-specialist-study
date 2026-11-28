import test from 'node:test';
import assert from 'node:assert/strict';
import {stageBindings} from '../scripts/cs03-binding-stage-offline.mjs';
const url='postgresql://cs03_progress_api:fake@ep-dawn-dew-a11prveg.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox?sslmode=verify-full';
function fixture(overrides={},fail=''){
 const calls=[]; let secret;
 const api={
 inspect:async()=>({project:'quiet-mouse-39990305',branch:'br-snowy-truth-a162pmdt',function:'cs03progress',deployment:1,worker:'cs03-browser-isolated-candidate-not-approved',dark:true,secretAbsent:true,environmentPreservationVerified:true,...overrides}),
 stageNeon:async env=>{calls.push('neon');secret=env.CS03_ORIGIN_SECRET;assert.match(secret,/^[a-f0-9]{64}$/);return fail!=='neon';},
 stageWorkerSecret:async value=>{calls.push('worker');assert.equal(value,secret);return fail!=='worker';},
 verifyDark:async()=>{calls.push('verify');return fail!=='verify';}
 };return {api,calls};
}
test('stages matching secret without activation',async()=>{const {api,calls}=fixture();assert.deepEqual(await stageBindings(api,url),{ok:true,phase:'staged',activation:false});assert.deepEqual(calls,['neon','worker','verify']);});
for(const [key,value] of Object.entries({project:'wrong',branch:'wrong',deployment:2,dark:false,secretAbsent:false,environmentPreservationVerified:false,worker:'wrong',function:'wrong'})){
 test('rejects '+key,async()=>{const {api,calls}=fixture({[key]:value});assert.equal((await stageBindings(api,url)).ok,false);assert.deepEqual(calls,[]);});
}
for(const [phase,expected] of [['neon',['neon']],['worker',['neon','worker']],['verify',['neon','worker','verify']]]){
 test('stops at '+phase,async()=>{const {api,calls}=fixture({},phase);const result=await stageBindings(api,url);assert.equal(result.ok,false);assert.equal(result.activation,false);assert.deepEqual(calls,expected);});
}
test('rejects wrong database role',async()=>{const {api,calls}=fixture();assert.equal((await stageBindings(api,url.replace('cs03_progress_api','owner'))).ok,false);assert.deepEqual(calls,[]);});
test('redacts thrown errors',async()=>{const {api}=fixture();api.stageNeon=async()=>{throw Error(url)};assert.deepEqual(await stageBindings(api,url),{ok:false,phase:'neon',activation:false});});
