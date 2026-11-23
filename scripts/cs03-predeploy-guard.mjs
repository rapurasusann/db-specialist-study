// CS-03 deployment gate: static, offline, read-only. Never deploys or exposes secrets.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=path=>readFileSync(resolve(root,path),'utf8');
export function inspectCs03Deployment(){
 const functionCode=read('functions/cs03-progress.mjs');
 const clientCode=read('src/cs03-account-client.mjs');
 const cfg=read('cs03-config.js');
 const blockers=[];
 // This is a wiring gate, not a security proof or a gateway deployment.
 if(!/verifyGatewaySecret\(request,secret\)/.test(functionCode)||!/x-secret/.test(functionCode))
  blockers.push('NATIVE_FUNCTION_GATEWAY_GUARD_UNVERIFIED');
 if(!/authorization:'Bearer '/.test(clientCode))
  blockers.push('CLIENT_JWT_HEADER_UNVERIFIED');
 if(!existsSync(resolve(root,'server/cs03-trusted-edge-gateway.mjs')))
  blockers.push('TRUSTED_GATEWAY_NOT_IMPLEMENTED');
 if(!existsSync(resolve(root,'docs/CS03_GATEWAY_RATE_LIMIT_ACCEPTANCE.md')))
  blockers.push('GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING');
 if(!existsSync(resolve(root,'docs/CS03_ISOLATED_DEPLOYMENT_APPROVAL.md')))
  blockers.push('ISOLATED_DEPLOYMENT_APPROVAL_MISSING');
 if(!/previewEnabled\s*:\s*false/.test(cfg))
  blockers.push('PREVIEW_MUST_REMAIN_DISABLED');
 const manifest={ready:blockers.length===0,blockers,scope:'development-only'};
 return Object.freeze(manifest);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=inspectCs03Deployment();
 for(const item of result.blockers)console.log('CS03_DEPLOY_BLOCKER='+item);
 console.log('CS03_DEPLOY_READINESS='+(result.ready?'REVIEW_REQUIRED':'BLOCKED'));
 // Even when all documentary gates are filled, require an independent approval.
 if(!process.argv.includes('--report'))process.exitCode=1;
}
