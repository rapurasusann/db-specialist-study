// CS-03 deployment gate: static, offline, read-only. Never deploys or exposes secrets.
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {inspectCs03CloudflareAccount} from './cs03-cloudflare-account-guard.mjs';
import {inspectCs03BrowserWorkerReviewTemplate} from './cs03-worker-review-config.mjs';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=path=>readFileSync(resolve(root,path),'utf8');
export function inspectCs03Deployment(){
 const functionCode=read('functions/cs03-progress.mjs');
 const clientCode=read('src/cs03-account-client.mjs');
 const cfg=read('cs03-config.js');
 const blockers=[];
 blockers.push(...inspectCs03CloudflareAccount({env:process.env}));
 // This is a wiring gate, not a security proof or a gateway deployment.
 if(!/verifyGatewaySecret\(request,secret\)/.test(functionCode)||!/x-secret/.test(functionCode))
  blockers.push('NATIVE_FUNCTION_GATEWAY_GUARD_UNVERIFIED');
 if(!/authorization:'Bearer '/.test(clientCode))
  blockers.push('CLIENT_JWT_HEADER_UNVERIFIED');
 // Static wiring evidence only; actual ingress and quota are not verified here.
 const gatewayPaths=['server/cs03-trusted-edge-gateway.mjs','server/cs03-worker-candidate.mjs','server/cs03-browser-jwt-entrypoint.mjs','server/cs03-shared-quota.mjs','server/cs03-cloudflare-do-transport.mjs','server/cs03-cloudflare-do-handler.mjs'];
 if(gatewayPaths.some(path=>!existsSync(resolve(root,path))))blockers.push('TRUSTED_GATEWAY_NOT_IMPLEMENTED');
 else if(!/sharedQuota,fetcher,upstreamUrl,upstreamSecret/.test(read(gatewayPaths[1])) ||
         !/atomicConsume:createCs03DurableObjectQuotaTransport/.test(read(gatewayPaths[1])) ||
         !/createCs03WorkerCandidate/.test(read(gatewayPaths[2])))
  blockers.push('SHARED_GATEWAY_WIRING_UNVERIFIED');
 try{blockers.push(...inspectCs03BrowserWorkerReviewTemplate().map(code=>'BROWSER_TEMPLATE_'+code));}
 catch{blockers.push('BROWSER_TEMPLATE_UNREADABLE');}
 // No file-presence check may substitute for independently verified live prerequisites.
 blockers.push('LIVE_ISOLATION_AND_COST_NOT_VERIFIED');
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
