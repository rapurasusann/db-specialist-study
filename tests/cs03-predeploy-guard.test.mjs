import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCs03Deploy} from '../scripts/cs03-predeploy-guard.mjs';
const good={
 NEON_BRANCH_ID:'br-snowy-truth-a162pmdt',
 CS03_ISOLATED_BRANCH_ID:'br-snowy-truth-a162pmdt',
 NEON_PROJECT_ID:'quiet-mouse-39990305',
 CS03_DEPLOY_OPT_IN:'ISOLATED_ONLY',
 CS03_ORIGIN_SECRET:'test-only-32-character-or-longer-gateway-secret',
 CS03_TEST_DATABASE_URL:'postgresql://cs03_progress_api:dummy@ep-dawn-dew-a11prveg-pooler.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox?sslmode=verify-full'
};
test('predeploy gate accepts only explicitly opted-in isolated configuration',()=>{
 assert.deepEqual(assessCs03Deploy(good),{approved:true,failures:[]});
});
for(const [name,changed] of [
 ['wrong Neon project',{NEON_PROJECT_ID:'other'}],
 ['main branch',{NEON_BRANCH_ID:'br-prod'}],
 ['missing explicit approval',{CS03_DEPLOY_OPT_IN:''}],
 ['missing gateway secret',{CS03_ORIGIN_SECRET:''}],
 ['weak gateway secret',{CS03_ORIGIN_SECRET:'short'}],
 ['owner DB role',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL.replace('cs03_progress_api','owner')}],
 ['another database',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL.replace('cs03_auth_sandbox','certification_study')}],
 ['another endpoint',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL.replace('ep-dawn-dew-a11prveg','ep-other')}],
 ['weaker ssl',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL.replace('verify-full','require')}],
 ['missing password',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL.replace(':dummy@',':@')}],
 ['missing URL',{CS03_TEST_DATABASE_URL:''}],
 ['raw .NET connection string',{CS03_TEST_DATABASE_URL:'Host=foo; Database=cs03_auth_sandbox;'}],
 ['libpq compat',{CS03_TEST_DATABASE_URL:good.CS03_TEST_DATABASE_URL+'&uselibpqcompat=true'}],
 ]) {
 test('predeploy blocks '+name,()=>assert.equal(assessCs03Deploy({...good,...changed}).approved,false));
}
