// 2026-11-25 01:00 JST: offline tests only; no real cloud calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ACCOUNT,NAME,CONFIG,validateConfig,checkAbsent} from '../scripts/cs03-dark-preflight.mjs';
const config=JSON.parse(await readFile(new URL('../'+CONFIG,import.meta.url),'utf8'));
test('approved configuration passes',()=>validateConfig(config));
for(const [name,mutate] of [
 ['public',c=>c.workers_dev=true],['preview',c=>c.preview_urls=true],
 ['route',c=>c.routes=[{pattern:'example.invalid/*'}]],
 ['secret',c=>c.vars={CS03_GATEWAY_SECRET:'dummy'}],
 ['name',c=>c.name='other'],['entry',c=>c.main='other.mjs'],
 ['migration',c=>c.migrations[0].new_sqlite_classes=['Other']]
]){
 test('reject config '+name,()=>{const c=structuredClone(config);mutate(c);assert.throws(()=>validateConfig(c),/CONFIG_NOT_EXACT/);});
}
const good={success:true,result:[{id:'other'}]};
const mock=(body,ok=true)=>async()=>({ok,json:async()=>body});
const run=fetcher=>checkAbsent({account:ACCOUNT,token:'test-only',fetcher});
test('complete successful list proves absence',async()=>{
 assert.equal(await run(async(url,options)=>{
 assert.equal(url,'https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts');
 assert.equal(options.headers.Authorization,'Bearer test-only');
 assert.equal(options.redirect,'error');
 return {ok:true,json:async()=>good};
 }),true);
});
for(const [name,body,ok,error] of [
 ['existing',{success:true,result:[{id:NAME}]},true,/WORKER_ALREADY_EXISTS/],
 ['HTTP failure',good,false,/SCRIPT_LIST_HTTP_FAILED/],
 ['API failure',{...good,success:false},true,/SCRIPT_LIST_INVALID/],
 ['bad item',{success:true,result:[{}]},true,/SCRIPT_LIST_INVALID/],
 ['pages',{...good,result_info:{total_pages:2}},true,/SCRIPT_LIST_INCOMPLETE/],
 ['cursor',{...good,result_info:{cursors:{after:'next'}}},true,/SCRIPT_LIST_INCOMPLETE/],
 ['count',{...good,result_info:{total_count:2}},true,/SCRIPT_LIST_INCOMPLETE/]
])test('reject '+name,async()=>assert.rejects(run(mock(body,ok)),error));
test('network failure cannot prove absence',async()=>assert.rejects(run(async()=>{throw Error('network');}),/network/));
test('wrong account or missing token never calls API',async()=>{
 for(const [account,token] of [['wrong','test-only'],[ACCOUNT,'']]){
 await assert.rejects(checkAbsent({account,token,fetcher:async()=>assert.fail('unexpected call')}),/ACCOUNT_OR_READ_TOKEN_MISSING/);
 }
});
