// Preparation only. Never executes a live deployment.
import {mkdtemp,writeFile,readFile,unlink,rmdir} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {ACCOUNT,validateConfig,localPreflight,checkAbsent} from './cs03-dark-preflight.mjs';
import {randomUUID} from 'node:crypto';
export async function withRootConfig(root,config,run){
 validateConfig(config);
 const path=join(root,'.cs03-dark-'+randomUUID()+'.json');
 await writeFile(path,JSON.stringify(config),{flag:'wx',mode:0o600});
 try{
  validateConfig(JSON.parse(await readFile(path,'utf8')));
  return await run(path);
 }finally{await unlink(path);}
}
export function dryRunArgs(path){return ['deploy','--dry-run','--config',path];}
async function main(){
 const {root,head,config}=await localPreflight(process.argv[2]);
 await checkAbsent({account:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CS03_CF_READ_TOKEN});
 // Require an already installed pinned Wrangler; no automatic package download.
 const pkg=JSON.parse(await readFile(join(root,'node_modules','wrangler','package.json'),'utf8'));
 if(pkg.version!=='4.168.0')throw Error('WRANGLER_VERSION_MISMATCH');
 const bin=join(root,'node_modules','wrangler','bin','wrangler.js');
 const env={...process.env,CLOUDFLARE_ACCOUNT_ID:ACCOUNT,WRANGLER_SEND_METRICS:'false'};
 for(const key of Object.keys(env))if(/TOKEN|SECRET|PASSWORD|API_KEY|DATABASE_URL/i.test(key))delete env[key];
 await withRootConfig(root,config,path=>execFileSync(process.execPath,[bin,...dryRunArgs(path)],{cwd:root,env,stdio:'ignore',timeout:120000}));
 console.log('CS03_DARK_DRY_RUN_PASS HEAD='+head+' DEPLOYED=NO');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('CS03_DARK_DRY_RUN_FAILED');process.exitCode=1;});
