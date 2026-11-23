import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03StudyAutoSync} from '../src/cs03-study-auto-sync.mjs';
const A='a1111111-1111-4111-8111-111111111111';
const Q='2025:am2:4';
function setup(){
 const remote=new Map(),events=[],calls=[];
 let generation=0,openComplete=true,rejectSave=false;
 const session={
  start:async()=>({userId:A,records:Object.fromEntries([...remote].map(([id,data])=>[id,{data}]))}),
  open:async id=>{calls.push('open:'+id);if(!openComplete)throw Error('NETWORK_FAIL');return structuredClone(remote.get(id)??null);},
  save:async(id,data)=>{calls.push('save:'+id);if(rejectSave)throw Error('REVISION_CONFLICT_REFRESHED');remote.set(id,structuredClone(data));return structuredClone(data);},
  stop:()=>{generation++;calls.push('stop');},
  status:()=>({active:true})
 };
 const ui=createCs03StudyAutoSync({session,onRemote:(id,row)=>events.push(['remote',id,row]),onStatus:(s,id)=>events.push(['status',s,id])});
 return {ui,remote,events,calls,reject:()=>rejectSave=true,failOpen:()=>openComplete=false};
}
test('login exposes account snapshot without importing device progress',async()=>{
 const f=setup(),device={[Q]:{level:'mastered'}};
 const result=await f.ui.login();
 assert.deepEqual(result.records,{});
 assert.deepEqual(device,{[Q]:{level:'mastered'}});
 assert.equal(f.ui.state().userId,A);
});
test('editing before a remote question read fails closed',async()=>{
 const f=setup();await f.ui.login();
 assert.throws(()=>f.ui.edit(Q,{level:'learning'}),/REMOTE_READ_REQUIRED/);
 assert.equal(f.calls.length,0);
});
test('opening followed by study edit stores account record automatically',async()=>{
 const f=setup();await f.ui.login();await f.ui.open(Q);
 await f.ui.edit(Q,{level:'learning',seenAnswer:true});
 assert.deepEqual(f.remote.get(Q),{level:'learning',seenAnswer:true});
 assert.deepEqual(f.calls,['open:'+Q,'save:'+Q]);
});
test('a second browser sees first browser saved study record',async()=>{
 const f=setup();await f.ui.login();await f.ui.open(Q);await f.ui.edit(Q,{level:'mastered'});
 const other=setup();other.remote.set(Q,structuredClone(f.remote.get(Q)));
 await other.ui.login();
 assert.deepEqual(await other.ui.open(Q),{level:'mastered'});
});
test('conflict retains unsent account draft and rejects silent retry',async()=>{
 const f=setup();await f.ui.login();await f.ui.open(Q);f.reject();
 await assert.rejects(f.ui.edit(Q,{level:'mastered'}),/REVISION_CONFLICT_REFRESHED/);
 assert.deepEqual(f.ui.state().blocked,[Q]);
 assert.deepEqual(f.ui.state().pending,[Q]);
 assert.throws(()=>f.ui.edit(Q,{level:'review'}),/CONFLICT_REVIEW_REQUIRED/);
 await assert.rejects(f.ui.open(Q),/LOCAL_ACCOUNT_DRAFT_UNSYNCED/);
 assert.equal(f.remote.size,0);
});
test('logout prevents further writes and ends account session',async()=>{
 const f=setup();await f.ui.login();await f.ui.open(Q);f.ui.logout();
 assert.throws(()=>f.ui.edit(Q,{level:'review'}),/ACCOUNT_SESSION_CHANGED/);
 assert.deepEqual(f.ui.state().pending,[]);
 assert.equal(f.calls.at(-1),'stop');
});
test('invalid identifiers cannot reach remote data',async()=>{
 const f=setup();await f.ui.login();
 await assert.rejects(f.ui.open('2025:am2:0'),/INVALID_RECORD/);
 assert.throws(()=>f.ui.edit('2025:am2:999',{level:'review'}),/INVALID_RECORD/);
 assert.equal(f.calls.length,0);
});
test('opening failed request does not permit account writes',async()=>{
 const f=setup();await f.ui.login();f.failOpen();
 await assert.rejects(f.ui.open(Q),/NETWORK_FAIL/);
 assert.throws(()=>f.ui.edit(Q,{level:'mastered'}),/REMOTE_READ_REQUIRED/);
});

test('failed account write can be exported without mutating server or device progress',async()=>{
 const f=setup();
 await f.ui.login();await f.ui.open(Q);f.reject();
 await assert.rejects(f.ui.edit(Q,{level:'mastered',notes:'test draft'}),/REVISION_CONFLICT_REFRESHED/);
 const backup=f.ui.exportPending();
 assert.equal(backup.format,'cs03-unsaved-account-progress-v1');
 assert.equal(backup.userId,A);
 assert.deepEqual(backup.records[Q],{level:'mastered',notes:'test draft'});
 backup.records[Q].notes='mutated exported data';
 assert.deepEqual(f.ui.exportPending().records[Q],{level:'mastered',notes:'test draft'});
 assert.equal(f.remote.size,0);
 assert.throws(()=>f.ui.logout(),/UNSAVED_ACCOUNT_PROGRESS/);
});
test('backup export is denied without a failed write',async()=>{
 const f=setup();
 assert.throws(()=>f.ui.exportPending(),/ACCOUNT_SESSION_CHANGED/);
 await f.ui.login();
 assert.throws(()=>f.ui.exportPending(),/NO_UNSAVED_ACCOUNT_PROGRESS/);
});

test('backup is restored as blocked review-only drafts without any remote saves',async()=>{
 const f=setup();await f.ui.login();
 const backup={format:'cs03-unsaved-account-progress-v1',userId:A,records:{[Q]:{level:'mastered'}}};
 const result=f.ui.restorePending(backup);
 assert.deepEqual(result,{restored:1,accountId:A,requiresReview:true});
 assert.deepEqual(f.ui.state().pending,[Q]);
 assert.deepEqual(f.ui.state().blocked,[Q]);
 assert.equal(f.calls.length,0);
 assert.equal(f.remote.size,0);
 await assert.rejects(f.ui.open(Q),/LOCAL_ACCOUNT_DRAFT_UNSYNCED/);
 assert.throws(()=>f.ui.edit(Q,{level:'review'}),/REMOTE_READ_REQUIRED|CONFLICT_REVIEW_REQUIRED/);
 assert.throws(()=>f.ui.logout(),/UNSAVED_ACCOUNT_PROGRESS/);
 assert.deepEqual(f.ui.exportPending().records[Q],{level:'mastered'});
});
test('mismatched account or invalid multi-row backup cannot modify pending drafts',async()=>{
 const f=setup();await f.ui.login();
 const backup={format:'cs03-unsaved-account-progress-v1',userId:'other',records:{[Q]:{level:'mastered'}}};
 assert.throws(()=>f.ui.restorePending(backup),/BACKUP_ACCOUNT_MISMATCH/);
 backup.userId=A;backup.records['2025:am2:0']={level:'review'};
 assert.throws(()=>f.ui.restorePending(backup),/INVALID_RECORD/);
 assert.deepEqual(f.ui.state().pending,[]);
 assert.deepEqual(f.ui.state().blocked,[]);
 assert.equal(f.calls.length,0);
});
test('restoration never overwrites already-pending account progress',async()=>{
 const f=setup();await f.ui.login();await f.ui.open(Q);f.reject();
 await assert.rejects(f.ui.edit(Q,{level:'mastered'}),/REVISION_CONFLICT_REFRESHED/);
 const backup={format:'cs03-unsaved-account-progress-v1',userId:A,records:{[Q]:{level:'review'}}};
 assert.throws(()=>f.ui.restorePending(backup),/UNSAVED_ACCOUNT_PROGRESS/);
 assert.deepEqual(f.ui.exportPending().records[Q],{level:'mastered'});
});

test('explicit local discard clears restored review drafts and permits sign-out without remote writes',async()=>{
 const f=setup();await f.ui.login();
 f.ui.restorePending({format:'cs03-unsaved-account-progress-v1',userId:A,records:{[Q]:{level:'review'}}});
 const ids=[...f.ui.state().pending].sort();
 assert.deepEqual(f.ui.discardPending({userId:A,questionIds:ids}),{discarded:1});
 assert.deepEqual(f.ui.state().pending,[]);
 assert.deepEqual(f.ui.state().blocked,[]);
 assert.equal(f.remote.size,0);
 f.ui.logout();
 assert.equal(f.calls.some(x=>x.startsWith('save:')),false);
});
test('local discard refuses wrong account, changed draft set, or pending in-flight work',async()=>{
 const f=setup();await f.ui.login();
 f.ui.restorePending({format:'cs03-unsaved-account-progress-v1',userId:A,records:{[Q]:{level:'review'}}});
 assert.throws(()=>f.ui.discardPending({userId:'another-account',questionIds:[Q]}),/BACKUP_ACCOUNT_MISMATCH/);
 assert.throws(()=>f.ui.discardPending({userId:A,questionIds:[]}),/PENDING_DRAFTS_CHANGED/);
 assert.deepEqual(f.ui.state().pending,[Q]);
 assert.equal(f.remote.size,0);
});
