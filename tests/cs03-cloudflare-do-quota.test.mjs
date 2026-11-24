import test from 'node:test';
import assert from 'node:assert/strict';
import {consumeCs03SqliteQuota} from '../server/cs03-cloudflare-do-quota.mjs';
const keys=[{key:'cs03:global',limit:2},{key:'cs03:ip:192.0.2.1',limit:3},{key:'cs03:user:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',limit:3}];
function fakeStorage(){
 const data=new Map();let transactions=0;
 const sql={exec(query,...args){
  if(query.startsWith('CREATE TABLE'))return {toArray:()=>[]};
  const [key,bucket]=args, id=JSON.stringify([key,bucket]);
  if(query.startsWith('DELETE')){const cutoff=args[0];for(const id of data.keys())if(JSON.parse(id)[1]<cutoff)data.delete(id);return {toArray:()=>[]};}
  if(query.startsWith('SELECT'))return {toArray:()=>data.has(id)?[{count:data.get(id)}]:[]};
  if(query.startsWith('INSERT')){data.set(id,(data.get(id)??0)+1);return {toArray:()=>[]};}
  throw Error('UNEXPECTED_SQL');
 }};
 return {sql,data,get transactions(){return transactions},transactionSync(fn){transactions++;return fn();}};
}
const input=(now=10000)=>({keys,now,windowMs:60000});
test('Durable Object quota checks all keys and denies atomically within one window',()=>{
 const s=fakeStorage();
 assert.equal(consumeCs03SqliteQuota(s,input()),true);
 assert.equal(consumeCs03SqliteQuota(s,input()),true);
 const before=new Map(s.data);
 assert.equal(consumeCs03SqliteQuota(s,input()),false);
 assert.deepEqual(s.data,before);
 assert.equal(s.transactions,3);
});
test('quota persists across coordinator calls and rotates by window',()=>{
 const s=fakeStorage();
 assert.equal(consumeCs03SqliteQuota(s,input()),true);
 assert.equal(consumeCs03SqliteQuota(s,input(70000)),true);
 assert.equal(s.data.size,6);
});
test('missing transaction or malformed quota request rejects',()=>{
 const s=fakeStorage();
 assert.throws(()=>consumeCs03SqliteQuota({...s,transactionSync:undefined},input()),/QUOTA_INVALID/);
 assert.throws(()=>consumeCs03SqliteQuota(s,{...input(),keys:[keys[0],keys[0],keys[2]]}),/QUOTA_INVALID/);
 assert.throws(()=>consumeCs03SqliteQuota(s,{...input(),windowMs:0}),/QUOTA_INVALID/);
});
test('storage failure is thrown and must be caught by the outer gateway as 503',()=>{
 const s=fakeStorage();s.sql.exec=()=>{throw Error('STORAGE_UNAVAILABLE')};
 assert.throws(()=>consumeCs03SqliteQuota(s,input()),/STORAGE_UNAVAILABLE/);
});

test('older quota windows are pruned after a successful request',()=>{
 const storage=fakeStorage();
 assert.equal(consumeCs03SqliteQuota(storage,input(10000)),true);
 assert.equal(consumeCs03SqliteQuota(storage,input(70000)),true);
 assert.equal(storage.data.size,6);
 assert.equal(consumeCs03SqliteQuota(storage,input(130000)),true);
 assert.equal(storage.data.size,6);
 assert.ok([...storage.data.keys()].every(id=>JSON.parse(id)[1]>=1));
});
test('quota keys must match exact trusted key formats',()=>{
 const storage=fakeStorage();
 for(const invalid of ['cs03:global:extra','cs03:user:spoof','cs03:ip:','cs03:ip:a b']){
  const forged=keys.map((k,i)=>i===0?{...k,key:invalid}:k);
  assert.throws(()=>consumeCs03SqliteQuota(storage,{...input(),keys:forged}),/QUOTA_INVALID/);
 }
 assert.equal(storage.transactions,0);
});
