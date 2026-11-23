import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCs03Entrypoint} from '../server/cs03-gateway-production-adapter.mjs';
import {inspectCs03Deployment} from '../scripts/cs03-predeploy-guard.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const runbook=read('docs/CS03_INCIDENT_STOP_RECOVERY_RUNBOOK_20261123.md');
test('runbook documents no-go, isolation, cost, draft protection and no blind rollback',()=>{
 for(const item of ['NO-GO','previewEnabled:false','429','503','409','fail-open','fail-closed',
 'CS03_ORIGIN_SECRET','CS03_GATEWAY_SECRET','localStorage','JSON','discardPending',
 'ParkWait','main','追加','承認']){
  assert.ok(runbook.includes(item),'RUNBOOK_MISSING:'+item);
 }
});
test('public preview stays disabled and deployment blockers remain active',()=>{
 const cfg=read('cs03-config.js');
 assert.match(cfg,/previewEnabled:\s*false/);
 const gate=inspectCs03Deployment();
 assert.equal(gate.ready,false);
 assert.ok(gate.blockers.includes('ISOLATED_DEPLOYMENT_APPROVAL_MISSING'));
 assert.ok(gate.blockers.includes('GATEWAY_RATE_LIMIT_ACCEPTANCE_MISSING'));
});
test('candidate Worker fails closed without isolated flag even for a Cloudflare-looking request',async()=>{
 let forwarded=0;
 const entry=createCs03Entrypoint({createGateway:()=>{
  forwarded++;
  return async()=>new Response('should not run');
 }});
 const req=new Request('https://candidate.invalid/progress',{headers:{origin:'https://rapurasusann.github.io'}});
 Object.defineProperty(req,'cf',{value:{colo:'NRT'}});
 const res=await entry.fetch(req,{});
 assert.equal(res.status,503);
 assert.equal(forwarded,0);
});
test('candidate Worker fails closed with isolated flag but no CF request context',async()=>{
 let forwarded=0;
 const entry=createCs03Entrypoint({createGateway:()=>{
  forwarded++;
  return async()=>new Response('should not run');
 }});
 const req=new Request('https://candidate.invalid/progress',{headers:{origin:'https://rapurasusann.github.io'}});
 const res=await entry.fetch(req,{CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only'});
 assert.equal(res.status,503);
 assert.equal(forwarded,0);
});
