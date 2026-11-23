import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectCs03Deployment} from '../scripts/cs03-predeploy-guard.mjs';
const script=fileURLToPath(new URL('../scripts/cs03-predeploy-guard.mjs',import.meta.url));
test('undeployed edge gateway is a mandatory blocker',()=>{
 const status=inspectCs03Deployment();
 assert.equal(status.ready,false);
 assert.ok(status.blockers.includes('TRUSTED_GATEWAY_NOT_IMPLEMENTED'));
});
test('deployment guard never silently returns successful exit status',()=>{
 const result=spawnSync(process.execPath,[script],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stdout,/CS03_DEPLOY_READINESS=BLOCKED/);
});
test('report mode is explicitly read-only and lists blockers',()=>{
 const result=spawnSync(process.execPath,[script,'--report'],{encoding:'utf8'});
 assert.equal(result.status,0);
 assert.match(result.stdout,/TRUSTED_GATEWAY_NOT_IMPLEMENTED/);
 assert.match(result.stdout,/GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING/);
});
test('preview remains off and isolated deployment lacks approval',()=>{
 const result=inspectCs03Deployment();
 assert.ok(!result.blockers.includes('PREVIEW_MUST_REMAIN_DISABLED'));
 assert.ok(result.blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
});
