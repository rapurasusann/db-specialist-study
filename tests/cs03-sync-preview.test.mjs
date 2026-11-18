import test from 'node:test';
import assert from 'node:assert/strict';
import {previewCs03Sync} from '../src/cs03-sync-preview.mjs';
const A='2025:am2:1',B='2025:am2:2',C='2025:pm1:1';
const uuid='a1111111-1111-4111-8111-111111111111';
function input(){
 return {deviceRecords:{[A]:{level:'review'},[B]:{level:'mastered'}},
 accountListing:{userId:uuid,records:{[B]:{data:{level:'learning'},revision:2},[C]:{data:{level:'review'},revision:1}}}};
}
test('sync preview identifies device-only, account-only and conflicts without writes',()=>{
 const p=previewCs03Sync(input());
 assert.deepEqual(p.counts,{deviceOnly:1,accountOnly:1,conflicts:1});
 assert.deepEqual(p.entries.map(e=>[e.id,e.direction]),[[A,'DEVICE_ONLY'],[B,'CONFLICT'],[C,'ACCOUNT_ONLY']]);
 assert.equal(p.automaticWrites,false);assert.equal(p.requiresExplicitApproval,true);
});
test('sync preview never changes supplied records',()=>{
 const v=input(),before=structuredClone(v);const p=previewCs03Sync(v);
 p.entries[0].device.level='mastered';assert.deepEqual(v,before);
});
test('sync preview does not resolve same-key conflicts automatically',()=>{
 const v=input();v.accountListing.records[B].data.level='mastered';
 const p=previewCs03Sync(v);
 assert.equal(p.entries[1].direction,'CONFLICT');
});
test('empty datasets are valid and have zero counts',()=>{
 const p=previewCs03Sync({deviceRecords:{},accountListing:{userId:uuid,records:{}}});
 assert.deepEqual(p.counts,{deviceOnly:0,accountOnly:0,conflicts:0});assert.deepEqual(p.entries,[]);
});
test('invalid account record rejects entire preview',()=>{
 const v=input();v.accountListing.records['2025:am2:0']={data:{level:'review'}};
 assert.throws(()=>previewCs03Sync(v),/SYNC_PREVIEW_INVALID_ACCOUNT/);
});
test('invalid device record rejects entire preview',()=>{
 const v=input();v.deviceRecords[B]=null;
 assert.throws(()=>previewCs03Sync(v),/SYNC_PREVIEW_INVALID_DEVICE/);
});
