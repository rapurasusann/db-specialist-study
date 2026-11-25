// Preparation by default. Explicit PC-only initial deployment requires an exclusive operator window.
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {localPreflight,checkAbsent,ACCOUNT} from './cs03-dark-preflight.mjs';
import {withVerifiedCredential} from './cs03-dark-credential.mjs';
import {withRootConfig,dryRunArgs} from './cs03-dark-dry-run.mjs';

export async function prepare(head,source,{preflight=localPreflight,verify=withVerifiedCredential,read=readFile,run=execFileSync,materialize=withRootConfig,fetcher=fetch,deploy=false,exclusive=false}={}){
 if(deploy&&!exclusive)throw Error('EXCLUSIVE_WINDOW_REQUIRED');
 const {root,config}=await preflight(head);
 const pkg=JSON.parse(await read(join(root,'node_modules','wrangler','package.json'),'utf8'));
 if(pkg.version!=='4.168.0')throw Error('WRANGLER_VERSION_MISMATCH');
 const bin=join(root,'node_modules','wrangler','bin','wrangler.js');
 await verify(source,async env=>{
  await materialize(root,config,path=>run(process.execPath,[bin,...dryRunArgs(path)],{cwd:root,env,stdio:'ignore',timeout:120000}));
  await preflight(head);
  await checkAbsent({account:ACCOUNT,token:env.CLOUDFLARE_API_TOKEN,fetcher});
  if(deploy){
   // No retry: even a timeout may mean the provider created the Worker.
   try{await materialize(root,config,path=>run(process.execPath,[bin,'deploy','--config',path],{cwd:root,env,stdio:'ignore',timeout:120000}));}
   catch{throw Error('DEPLOY_RESULT_UNKNOWN_DO_NOT_RETRY');}
  }
 },{fetcher});
 return {head,prepared:true,deployed:deploy,liveVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const flags=process.argv.slice(3);
 const deploy=flags.length===2&&flags[0]==='--initial-dark-deploy'&&flags[1]==='--exclusive-window-confirmed';
 if(flags.length&&!deploy){console.error('CS03_INVALID_FLAGS');process.exitCode=1;}
 else prepare(process.argv[2],process.env,{deploy,exclusive:deploy}).then(r=>console.log('CS03_DARK_PREPARE_PASS HEAD='+r.head+' DEPLOY_COMMAND_RETURNED='+ (r.deployed?'YES':'NO')+' LIVE_VERIFIED=NO')).catch(e=>{console.error(e.message==='DEPLOY_RESULT_UNKNOWN_DO_NOT_RETRY'?'CS03_DEPLOY_RESULT_UNKNOWN_DO_NOT_RETRY':'CS03_DARK_PREPARE_FAILED');process.exitCode=1;}).finally(()=>{delete process.env.CS03_CF_DEPLOY_TOKEN;});
}
