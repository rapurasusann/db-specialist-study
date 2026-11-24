import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectCs03WorkerReviewConfig,inspectCs03WorkerReviewTemplate,inspectCs03BrowserWorkerReviewTemplate} from '../scripts/cs03-worker-review-config.mjs';
const path=fileURLToPath(new URL('../docs/cs03-worker-config-review-only.json.example',import.meta.url));
const template=JSON.parse(readFileSync(path,'utf8'));
test('review-only template has disabled public routes and no misleading CPU override',()=>{
 assert.deepEqual(inspectCs03WorkerReviewTemplate(),[]);
 assert.equal(template.workers_dev,false);
 assert.equal(template.preview_urls,false);
 assert.equal('route' in template||'routes' in template,false);
 assert.equal('limits' in template,false);
});
test('review validation rejects accidental public exposure and account identifiers',()=>{
 for(const change of [{workers_dev:true},{preview_urls:true},{routes:['example.com/*']},{route:'example.com/*'},{account_id:'fake-account'},{vars:{TOKEN:'unsafe'}},{limits:{cpu_ms:1000}}]){
  assert.notDeepEqual(inspectCs03WorkerReviewConfig({...template,...change}),[]);
 }
});
test('review validation rejects missing or changed SQLite DO isolation binding',()=>{
 for(const config of [{...template,durable_objects:{bindings:[]}},
  {...template,migrations:[]},{...template,durable_objects:{bindings:[{name:'SOMETHING_ELSE',class_name:'Cs03QuotaNotDeployed'}]}}]){
  assert.notDeepEqual(inspectCs03WorkerReviewConfig(config),[]);
 }
});

test('review-only Worker template targets the guarded default export, not the bare candidate',()=>{
 assert.equal(template.main,'./server/cs03-gateway-production-adapter.mjs');
 for(const main of ['./server/cs03-worker-candidate.mjs','./server/cs03-trusted-edge-gateway.mjs','./other.mjs','']){
  assert.ok(inspectCs03WorkerReviewConfig({...template,main}).includes('GUARDED_WORKER_ENTRYPOINT_REQUIRED'));
 }
 assert.ok(inspectCs03WorkerReviewConfig({...template,name:'cs03-public'}).includes('REVIEW_ONLY_WORKER_NAME_REQUIRED'));
});

test('browser JWT review template is disabled and distinct from the Access worker',()=>{
 const browser=JSON.parse(readFileSync(new URL('../docs/cs03-browser-worker-config-review-only.json.example',import.meta.url),'utf8'));
 assert.deepEqual(inspectCs03BrowserWorkerReviewTemplate(),[]);
 assert.notDeepEqual(inspectCs03WorkerReviewConfig(browser),[]);
 for(const change of [{workers_dev:true},{preview_urls:true},{routes:['example.com/*']},{main:template.main},{name:template.name},{vars:{CS03_BROWSER_JWT_MODE:'isolated-review-only'}},{durable_objects:{bindings:[]}}])
  assert.notDeepEqual(inspectCs03WorkerReviewConfig({...browser,...change},{browser:true}),[]);
});
