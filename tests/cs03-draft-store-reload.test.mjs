import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03DraftStore} from '../src/cs03-draft-store.mjs';
import {createCs03StudyAutoSync} from '../src/cs03-study-auto-sync.mjs';
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const Q='2025:am2:4';
function storage(){
 const map=new Map();
 return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
}
function app(store,userId=A,{fail=false}={}){
 const calls=[];
 const session={start:async()=>({userId,records:{}}),open:async()=>null,
  save:async(id,data)=>{calls.push([id,structuredClone(data)]);if(fail)throw Error('NETWORK_FAIL');},
  stop:()=>{},status:()=>({active:true})};
 const auto=createCs03StudyAutoSync({session,draftStore:store});
 return {auto,calls};
}
test('successful acknowledged edit removes checkpoint',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk}),f=app(store);
 await f.auto.login();await f.auto.open(Q);
 await f.auto.edit(Q,{level:'mastered'});
 assert.equal(store.load(A),null);
 assert.equal(f.calls.length,1);
});
test('failed edit survives simulated reload as blocked draft and cannot auto-submit',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk}),f=app(store,A,{fail:true});
 await f.auto.login();await f.auto.open(Q);
 await assert.rejects(f.auto.edit(Q,{level:'review'}),/NETWORK_FAIL/);
 assert.deepEqual(store.load(A).records[Q],{level:'review'});
 const recovered=app(store);await recovered.auto.login();
 assert.deepEqual(recovered.auto.state().blocked,[Q]);
 assert.deepEqual(recovered.auto.exportPending().records[Q],{level:'review'});
 await assert.rejects(recovered.auto.open(Q),/LOCAL_ACCOUNT_DRAFT_UNSYNCED/);
 assert.equal(recovered.calls.length,0);
});
test('storage checkpoints are account scoped; wrong account neither sees nor clears A',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk}),a=app(store,A,{fail:true});
 await a.auto.login();await a.auto.open(Q);
 await assert.rejects(a.auto.edit(Q,{level:'mastered'}),/NETWORK_FAIL/);
 const b=app(store,B);await b.auto.login();
 assert.deepEqual(b.auto.state().pending,[]);
 assert.deepEqual(store.load(A).records[Q],{level:'mastered'});
});
test('explicit review discard clears persisted draft and allows sign-out',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk}),a=app(store,A,{fail:true});
 await a.auto.login();await a.auto.open(Q);
 await assert.rejects(a.auto.edit(Q,{level:'review'}),/NETWORK_FAIL/);
 const current=a.auto.state();
 a.auto.discardPending({userId:A,questionIds:[...current.pending].sort()});
 assert.equal(store.load(A),null);
 a.auto.logout();
});
test('failed local storage fails closed BEFORE any network save',async()=>{
 const disk=storage();
 disk.setItem=()=>{throw Error('QUOTA_EXCEEDED')};
 const store=createCs03DraftStore({storage:disk}),a=app(store);
 await a.auto.login();await a.auto.open(Q);
 assert.throws(()=>a.auto.edit(Q,{level:'review'}),/DRAFT_STORAGE_UNAVAILABLE/);
 assert.equal(a.calls.length,0);
 assert.deepEqual(a.auto.state().pending,[]);
});
test('corrupted checkpoint is not silently discarded or replayed',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk});
 disk.map.set('db-study-cs03-unsaved-v1-'+A,'{bad');
 const f=app(store);
 await assert.rejects(f.auto.login(),/DRAFT_STORAGE_CORRUPT/);
 assert.equal(disk.map.size,1);
 assert.equal(f.calls.length,0);
});
test('imported backup is checkpointed and survives reload without server writes',async()=>{
 const disk=storage(),store=createCs03DraftStore({storage:disk}),a=app(store);
 await a.auto.login();
 a.auto.restorePending({format:'cs03-unsaved-account-progress-v1',userId:A,records:{[Q]:{level:'review'}}});
 assert.equal(store.load(A).records[Q].level,'review');
 const next=app(store);await next.auto.login();
 assert.deepEqual(next.auto.state().blocked,[Q]);
 assert.equal(next.calls.length,0);
});
