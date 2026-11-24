// Preparation only: no live deployment. Run on a clean disposable checkout.
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {localPreflight,checkAbsent,ACCOUNT} from './cs03-dark-preflight.mjs';
import {withVerifiedCredential} from './cs03-dark-credential.mjs';
import {withRootConfig,dryRunArgs} from './cs03-dark-dry-run.mjs';

export async function prepare(head,source,{preflight=localPreflight,verify=withVerifiedCredential,read=readFile,run=execFileSync,materialize=withRootConfig,fetcher=fetch}={}){
 const {root,config}=await preflight(head);
 const pkg=JSON.parse(await read(join(root,'node_modules','wrangler','package.json'),'utf8'));
 if(pkg.version!=='4.168.0')throw Error('WRANGLER_VERSION_MISMATCH');
 const bin=join(root,'node_modules','wrangler','bin','wrangler.js');
 await verify(source,async env=>{
  await materialize(root,config,path=>run(process.execPath,[bin,...dryRunArgs(path)],{cwd:root,env,stdio:'ignore',timeout:120000}));
  await preflight(head);
  await checkAbsent({account:ACCOUNT,token:env.CLOUDFLARE_API_TOKEN,fetcher});
 },{fetcher});
 return {head,prepared:true,deployed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 prepare(process.argv[2],process.env).then(r=>console.log('CS03_DARK_PREPARE_PASS HEAD='+r.head+' DEPLOYED=NO')).catch(()=>{console.error('CS03_DARK_PREPARE_FAILED');process.exitCode=1;}).finally(()=>{delete process.env.CS03_CF_DEPLOY_TOKEN;});
}
