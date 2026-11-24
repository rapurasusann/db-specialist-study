import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TabOwnership} from '../src/cs03-tab-ownership.mjs';
import {createCs03DraftStore} from '../src/cs03-draft-store.mjs';
import {createCs03StudyAutoSync} from '../src/cs03-study-auto-sync.mjs';

const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const Q='2025:am2:4';
function fakeLocks(){
 const taken=new Set();
 return {async request(name,options,callback){
  assert.equal(options.mode,'exclusive');
  assert.equal(options.ifAvailable,true);
  if(taken.has(name))return callback(null);
  taken.add(name);
  try{return await callback({name});}finally{taken.delete(name);}
 }};
}
function disk(){
 const map=new Map();
 return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
}
function tab({locks,storage,userId=A}){
 let writes=0;
 const session={start:async()=>({userId,records:{}}),open:async()=>null,
  save:async()=>{writes++;throw Error('NETWORK_FAIL')},stop:()=>{},status:()=>({active:true})};
 const auto=createCs03StudyAutoSync({
  session,tabOwnership:createCs03TabOwnership({locks}),
  draftStore:createCs03DraftStore({storage})
 });
 return {auto,get writes(){return writes}};
}
test('second tab cannot enter same account while first holds lock or overwrite its draft',async()=>{
 const locks=fakeLocks(),storage=disk(),first=tab({locks,storage}),second=tab({locks,storage});
 await first.auto.login();await first.auto.open(Q);
 await assert.rejects(first.auto.edit(Q,{level:'mastered'}),/NETWORK_FAIL/);
 await assert.rejects(second.auto.login(),/CS03_ACCOUNT_OPEN_IN_ANOTHER_TAB/);
 assert.equal(second.writes,0);
 assert.equal(createCs03DraftStore({storage}).load(A).records[Q].level,'mastered');
 assert.deepEqual(first.auto.state().pending,[Q]);
 // The second tab may enter only after the first releases its login lock.
 const state=first.auto.state();
 first.auto.discardPending({userId:A,questionIds:[...state.pending].sort()});
 first.auto.logout();
 await second.auto.login();
 second.auto.logout();
});
test('separate accounts can hold independent locks without sharing records',async()=>{
 const locks=fakeLocks(),storage=disk(),first=tab({locks,storage,userId:A}),second=tab({locks,storage,userId:B});
 await first.auto.login();await second.auto.login();
 assert.equal(first.auto.state().userId,A);
 assert.equal(second.auto.state().userId,B);
 first.auto.logout();second.auto.logout();
});
test('missing native lock capability fails closed rather than using a non-atomic storage lease',()=>{
 assert.throws(()=>createCs03TabOwnership({locks:null}),/CS03_TAB_LOCK_UNAVAILABLE/);
});
test('lock is relinquished after failed account checkpoint recovery',async()=>{
 const locks=fakeLocks(),storage=disk();
 storage.setItem('db-study-cs03-unsaved-v1-'+A,'{corrupt');
 const first=tab({locks,storage});
 await assert.rejects(first.auto.login(),/DRAFT_STORAGE_CORRUPT/);
 const second=tab({locks,storage});
 await assert.rejects(second.auto.login(),/DRAFT_STORAGE_CORRUPT/);
 // The second attempt must reach storage, not fail with an owned-tab error.
});
