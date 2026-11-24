import test from 'node:test';
import assert from 'node:assert/strict';
import {exportCs03UnsavedBackup} from '../src/cs03-unsaved-export.mjs';
const row={format:'cs03-unsaved-account-progress-v1',userId:'test-a',records:{'2025:am2:1':{level:'review'}}};
test('export writes only confirmed failed account records to an isolated JSON blob',async()=>{
 let blob,clicked=0,revoke;
 const doc={body:{append:()=>{}},createElement:()=>({click:()=>clicked++,remove:()=>{}})};
 const result=exportCs03UnsavedBackup({auto:{exportPending:()=>structuredClone(row)},confirmDownload:()=>true,documentRef:doc,createUrl:value=>(blob=value,'blob:test'),revokeUrl:url=>revoke=url,schedule:cb=>cb()});
 assert.equal(clicked,1);assert.equal(revoke,'blob:test');
 assert.deepEqual(JSON.parse(await blob.text()),row);
 assert.match(result,/書き出しました/);
});
test('cancelled export does not create a file',()=>{
 let attempts=0;
 const value=exportCs03UnsavedBackup({auto:{exportPending:()=>structuredClone(row)},confirmDownload:()=>false,createUrl:()=>{attempts++;throw Error('SHOULD_NOT_WRITE')}});
 assert.match(value,/キャンセル/);assert.equal(attempts,0);
});
test('unauthenticated or empty pending data is not exported',()=>{
 assert.throws(()=>exportCs03UnsavedBackup({auto:{exportPending:()=>{throw Error('NO_UNSAVED_ACCOUNT_PROGRESS')}}}),/NO_UNSAVED_ACCOUNT_PROGRESS/);
});
