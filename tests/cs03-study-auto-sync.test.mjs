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
