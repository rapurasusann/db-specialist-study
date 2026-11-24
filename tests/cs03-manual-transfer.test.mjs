import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03ManualTransfer} from '../src/cs03-manual-transfer.mjs';
const ID='2025:am2:1';
function fixture(){
 const original={level:'mastered',updatedAt:'2026-11-18T00:00:00.000Z'};
 const calls=[];let remote=null,approval=true,record=structuredClone(original);
 const scoped={
  pull:async id=>{calls.push('pull:'+id);return remote;},
  save:async(id,data)=>{calls.push('save:'+id);remote=structuredClone(data);return remote;}
 };
 const transfer=createCs03ManualTransfer({scoped,readLegacy:()=>record,confirmTransfer:async()=>{
  calls.push('confirm');return approval;
 }});
 return {transfer,calls,original,getRemote:()=>remote,setRemote:v=>remote=v,setApproval:v=>approval=v,setRecord:v=>record=v};
}
test('explicit confirmed transfer copies only the selected record',async()=>{
 const f=fixture();assert.deepEqual(await f.transfer.transfer(ID),{copied:true,id:ID});
 assert.deepEqual(f.calls,['pull:'+ID,'confirm','save:'+ID]);
 assert.deepEqual(f.getRemote(),f.original);
});
test('existing account record refuses overwrite before confirmation',async()=>{
 const f=fixture();f.setRemote({level:'review'});
 await assert.rejects(f.transfer.transfer(ID),/REMOTE_RECORD_EXISTS/);
 assert.deepEqual(f.calls,['pull:'+ID]);
 assert.equal(f.getRemote().level,'review');
});
test('user cancellation never calls account save',async()=>{
 const f=fixture();f.setApproval(false);
 assert.deepEqual(await f.transfer.transfer(ID),{copied:false});
 assert.deepEqual(f.calls,['pull:'+ID,'confirm']);
});
test('missing device record is refused without remote access',async()=>{
 const f=fixture();f.setRecord(null);
 await assert.rejects(f.transfer.transfer(ID),/NO_DEVICE_RECORD/);
 assert.deepEqual(f.calls,[]);
});
test('device edits during confirmation refuse stale copy',async()=>{
 let row={level:'review'},writes=0;
 const transfer=createCs03ManualTransfer({scoped:{pull:async()=>null,save:async()=>{writes++;}},readLegacy:()=>row,confirmTransfer:async()=>{row={level:'mastered'};return true;}});
 await assert.rejects(transfer.transfer(ID),/DEVICE_RECORD_CHANGED/);
 assert.equal(writes,0);
});
test('invalid question is rejected without reading the device',async()=>{
 let reads=0;
 const transfer=createCs03ManualTransfer({scoped:{pull:async()=>null,save:async()=>{}},readLegacy:()=>{reads++;return {level:'review'};},confirmTransfer:async()=>true});
 await assert.rejects(transfer.transfer('2025:am2:0'),/INVALID_RECORD/);
 assert.equal(reads,0);
});
test('remote conflict propagates without automatic overwrite',async()=>{
 let attempts=0;
 const transfer=createCs03ManualTransfer({scoped:{pull:async()=>null,save:async()=>{attempts++;throw Error('REVISION_CONFLICT_REFRESHED');}},readLegacy:()=>({level:'learning'}),confirmTransfer:async()=>true});
 await assert.rejects(transfer.transfer(ID),/REVISION_CONFLICT_REFRESHED/);
 assert.equal(attempts,1);
});
