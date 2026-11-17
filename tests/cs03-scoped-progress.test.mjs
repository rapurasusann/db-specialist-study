import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03ScopedProgress} from '../src/cs03-scoped-progress.mjs';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222',Q='2025:am2:4';
function setup(){
 let active=A,fail=false,switchedOnPull=false;
 const db=new Map(),local=new Map();
 const log=[];
 const account={
  session:async()=>({id:active}),
  readLocal:id=>local.get(id)||{},
  pull:async id=>{
   log.push('pull:'+active+':'+id);
   const record=db.get(active+':'+id)||null;
   if(record){const cache={...(local.get(active)||{})};cache[id]=structuredClone(record);local.set(active,cache);}
   if(switchedOnPull)active=B;
   return record?structuredClone(record):null;
  },
  save:async(id,data)=>{
   log.push('save:'+active+':'+id);
   if(fail)throw Error('REVISION_CONFLICT_REFRESHED');
   const record={data:structuredClone(data),revision:(db.get(active+':'+id)?.revision||0)+1};
   db.set(active+':'+id,record);
   const cache={...(local.get(active)||{})};cache[id]=structuredClone(record);local.set(active,cache);
   return structuredClone(record);
  }
 };
 return {account,db,local,log,change:id=>active=id,fail:v=>fail=v,switchOnPull:()=>switchedOnPull=true};
}
test('binding never imports unowned legacy records',async()=>{
 const f=setup();
 const legacy={'2025:am2:4':{level:'mastered'}};
 const scoped=createCs03ScopedProgress({account:f.account});
 const {userId,records}=await scoped.bind();
 assert.equal(userId,A);assert.deepEqual(records,{});
 assert.equal(legacy[Q].level,'mastered');
 assert.equal(f.log.length,0);
});
test('explicit account write pulls revision then saves to bound identity',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();
 await scoped.pull(Q);
 const r=await scoped.save(Q,{level:'learning'});
 assert.equal(r.level,'learning');
 assert.deepEqual(f.log,['pull:'+A+':'+Q,'save:'+A+':'+Q]);
 assert.deepEqual(scoped.snapshot(),{[Q]:{level:'learning'}});
});
test('downloaded record has no alias to cache',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 f.db.set(A+':'+Q,{data:{level:'mastered'},revision:1});
 await scoped.bind();const item=await scoped.pull(Q);
 item.level='review';
 assert.equal(scoped.snapshot()[Q].level,'mastered');
});
test('switching accounts cannot save under another account',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();f.change(B);
 await assert.rejects(scoped.save(Q,{level:'mastered'}),/ACCOUNT_CHANGED/);
 assert.equal(f.log.length,0);
 scoped.unbind();await scoped.bind();
 await scoped.pull(Q);
 await scoped.save(Q,{level:'learning'});
 assert.equal(f.db.has(A+':'+Q),false);
 assert.equal(f.db.get(B+':'+Q).data.level,'learning');
});
test('account switch during a pull aborts before write',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();f.switchOnPull();
 await assert.rejects(scoped.pull(Q),/ACCOUNT_CHANGED/);
 assert.equal(f.log.filter(x=>x.startsWith('save:')).length,0);
});
test('conflict is surfaced without blind retry',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();await scoped.pull(Q);f.fail(true);
 await assert.rejects(scoped.save(Q,{level:'mastered'}),/REVISION_CONFLICT_REFRESHED/);
 assert.equal(f.log.filter(x=>x.startsWith('save:')).length,1);
});
test('invalid question rejected without remote calls',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();
 await assert.rejects(scoped.save('2025:am2:0',{level:'learning'}),/INVALID_RECORD/);
 await assert.rejects(scoped.pull('2025:am2:101'),/INVALID_RECORD/);
 assert.deepEqual(f.log,[]);
});
test('unbind prevents further remote calls',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();scoped.unbind();
 await assert.rejects(scoped.pull(Q),/ACCOUNT_NOT_BOUND/);
 assert.deepEqual(f.log,[]);
});

test('no save is permitted without an explicit remote read',async()=>{
 const f=setup(),scoped=createCs03ScopedProgress({account:f.account});
 await scoped.bind();
 await assert.rejects(scoped.save(Q,{level:'mastered'}),/REMOTE_READ_REQUIRED/);
 assert.deepEqual(f.log,[]);
});
