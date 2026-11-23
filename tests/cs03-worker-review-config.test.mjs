import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectCs03WorkerReviewConfig,inspectCs03WorkerReviewTemplate} from '../scripts/cs03-worker-review-config.mjs';
const path=fileURLToPath(new URL('../docs/cs03-worker-config-review-only.json.example',import.meta.url));
const template=JSON.parse(readFileSync(path,'utf8'));
test('review-only template has disabled public routes and free-tier CPU budget',()=>{
 assert.deepEqual(inspectCs03WorkerReviewTemplate(),[]);
 assert.equal(template.workers_dev,false);
 assert.equal(template.preview_urls,false);
 assert.equal('route' in template||'routes' in template,false);
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
