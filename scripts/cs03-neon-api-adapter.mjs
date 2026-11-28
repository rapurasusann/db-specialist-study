const API='https://console.neon.tech/api/v2';
const EXPECTED={project:'quiet-mouse-39990305',branch:'br-snowy-truth-a162pmdt',slug:'cs03progress'};
function assertTarget(t){if(!t||t.project!==EXPECTED.project||t.branch!==EXPECTED.branch||t.slug!==EXPECTED.slug)throw Error('NEON_TARGET_REJECTED');}
function headers(token){if(typeof token!=='string'||token.length<20)throw Error('NEON_CREDENTIAL_MISSING');return {Authorization:'Bearer '+token};}
async function parse(res){let body;try{body=await res.json()}catch{throw Error('NEON_RESPONSE_INVALID')}if(!res.ok||body?.error)throw Error('NEON_API_FAILED');return body;}
export function createNeonAdapter({token,fetchImpl=fetch,target=EXPECTED}){
 assertTarget(target);
 return {
  async inspect(){const r=await fetchImpl(`${API}/projects/${target.project}/branches/${target.branch}/functions/${target.slug}`,{headers:headers(token)});const b=await parse(r);return {currentId:b.current_deployment?.id,activeId:b.active_deployment?.id,status:b.current_deployment?.status};},
  async stageEnvironment(environment){if(!environment||Object.keys(environment).some(k=>!['CS03_ORIGIN_SECRET','CS03_TEST_DATABASE_URL','CS03_ISOLATED_BRANCH_ID'].includes(k)))throw Error('NEON_ENV_ALLOWLIST_REJECTED');const form=new FormData();form.set('environment',JSON.stringify(environment));const r=await fetchImpl(`${API}/projects/${target.project}/branches/${target.branch}/functions/${target.slug}/deployments`,{method:'POST',headers:headers(token),body:form});const b=await parse(r);return {id:b.id,status:b.status};}
 };
}
