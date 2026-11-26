// Read-only initial dark deployment preflight. No deploy or cloud writes.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
export const ACCOUNT='9829f590b4afea346993621ca3a0c13f';
export const NAME='cs03-browser-isolated-candidate-not-approved';
export const BASE='2da665d6ff0d8e5fe701245e2938ed4d1acb5ca5';
export const CONFIG='docs/cs03-browser-worker-config-review-only.json.example';
const expected={name:NAME,main:'./server/cs03-browser-jwt-entrypoint.mjs',compatibility_date:'2026-11-01',workers_dev:false,preview_urls:false,durable_objects:{bindings:[{name:'CS03_QUOTA',class_name:'Cs03QuotaNotDeployed'}]},migrations:[{tag:'cs03-browser-candidate-sqlite-v1',new_sqlite_classes:['Cs03QuotaNotDeployed']}]};
export function validateConfig(config){if(!isDeepStrictEqual(config,expected))throw Error('CONFIG_NOT_EXACT');}
export async function checkAbsent({account,token,fetcher=fetch}){
 if(account!==ACCOUNT||!token)throw Error('ACCOUNT_OR_READ_TOKEN_MISSING');
 // A successful complete script list is required; a failed lookup is not absence.
 const response=await fetcher('https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts',{headers:{Authorization:'Bearer '+token},redirect:'error'});
 if(!response.ok)throw Error('SCRIPT_LIST_HTTP_FAILED');
 const body=await response.json();
 if(body.success!==true||!Array.isArray(body.result)||body.result.some(x=>typeof x?.id!=='string'))throw Error('SCRIPT_LIST_INVALID');
 const info=body.result_info;
 if(info&&(Number(info.total_pages??1)>1||info.cursor||info.cursors?.after||(info.total_count!=null&&info.total_count!==body.result.length)))throw Error('SCRIPT_LIST_INCOMPLETE');
 if(body.result.some(x=>x.id===NAME))throw Error('WORKER_ALREADY_EXISTS');
 return true;
}
export const ALLOWED_CHANGES=new Set(['docs/CS03_ISOLATED_DEPLOYMENT_APPROVAL.md','docs/CS03_HANDOFF_20261125.md','docs/CS03_DARK_DEPLOY_EXECUTION_20261125.md','scripts/cs03-dark-preflight.mjs','tests/cs03-dark-preflight.test.mjs','scripts/cs03-dark-dry-run.mjs','tests/cs03-dark-dry-run.test.mjs','scripts/cs03-dark-credential.mjs','tests/cs03-dark-credential.test.mjs','scripts/cs03-dark-prepare.mjs','tests/cs03-dark-prepare.test.mjs']);
// Only these two reviewed documentation blobs may differ from the approved base.
export const REVIEWED_DOC_BLOBS=Object.freeze({
 'docs/CS03_INDEX.md':'90a566af617981625e432b930f1c0be4f37f102c',
 'docs/CS03_PROGRESS_API_20261117.md':'7b46c54d44295b35277453b3c5708a05f85452bd'
});
export function validateChanges(paths,status,blobAt=()=>null){
 if(status)throw Error('WORKTREE_DIRTY');
 for(const p of paths){
  if(ALLOWED_CHANGES.has(p))continue;
  if(Object.hasOwn(REVIEWED_DOC_BLOBS,p)&&blobAt(p)===REVIEWED_DOC_BLOBS[p])continue;
  throw Error('DEPLOYMENT_SOURCE_CHANGED');
 }
}
export async function localPreflight(expectedHead){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 const head=git('rev-parse','HEAD');
 if(!/^[a-f0-9]{40}$/.test(expectedHead??'')||head!==expectedHead)throw Error('HEAD_MISMATCH');
 git('merge-base','--is-ancestor',BASE,head);
 validateChanges(git('diff','--no-renames','--name-only',BASE,head).split('\n').filter(Boolean),git('status','--porcelain','--untracked-files=all'),p=>git('rev-parse',head+':'+p));
 const config=JSON.parse(await readFile(new URL('../'+CONFIG,import.meta.url),'utf8'));
 validateConfig(config);
 return {root,head,config};
}
async function main(){
 const {head}=await localPreflight(process.argv[2]);
 await checkAbsent({account:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CS03_CF_READ_TOKEN});
 console.log('CS03_DARK_READONLY_PREFLIGHT_PASS HEAD='+head+' WORKER_ABSENT=YES DEPLOYED=NO');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 main().catch(()=>{console.error('CS03_DARK_READONLY_PREFLIGHT_FAILED');process.exitCode=1;});
}
