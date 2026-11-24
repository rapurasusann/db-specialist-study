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
async function main(){
 const root=fileURLToPath(new URL('../',import.meta.url));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 const head=git('rev-parse','HEAD');
 if(!/^[a-f0-9]{40}$/.test(head))throw Error('HEAD_INVALID');
 git('merge-base','--is-ancestor',BASE,head);
 // Only documentation and this preflight/test may differ from the tested deployment source.
 const allowed=new Set(['scripts/cs03-dark-preflight.mjs','tests/cs03-dark-preflight.test.mjs']);
 const changed=git('diff','--name-only',BASE,head).split('\n').filter(Boolean);
 if(changed.some(p=>!p.startsWith('docs/')&&!allowed.has(p)))throw Error('DEPLOYMENT_SOURCE_CHANGED');
 if(git('status','--porcelain','--untracked-files=no'))throw Error('TRACKED_WORKTREE_DIRTY');
 validateConfig(JSON.parse(await readFile(new URL('../'+CONFIG,import.meta.url),'utf8')));
 await checkAbsent({account:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CS03_CF_READ_TOKEN});
 console.log('CS03_DARK_READONLY_PREFLIGHT_PASS HEAD='+head+' WORKER_ABSENT=YES DEPLOYED=NO');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 main().catch(()=>{console.error('CS03_DARK_READONLY_PREFLIGHT_FAILED');process.exitCode=1;});
}
