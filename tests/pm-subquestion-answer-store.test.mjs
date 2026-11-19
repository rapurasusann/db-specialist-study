import test from 'node:test';
import assert from 'node:assert/strict';
import {createPmDraftStore,PM_DRAFT_KEY} from '../src/pm-subquestion-answer-store.mjs';
function memoryStorage(initial={}){
 const data=new Map(Object.entries(initial));
 return {getItem:key=>data.has(key)?data.get(key):null,setItem:(key,value)=>data.set(key,String(value)),dump:()=>Object.fromEntries(data)};
}
test('answers remain independent across subquestions and questions',()=>{
 const storage=memoryStorage(),a=createPmDraftStore(storage);
 a.save('2025:pm1:1','s1-1','顧客');a.save('2025:pm1:1','s1-2','リレーションシップ');a.save('2025:pm1:2','s1-1','別の答え');
 assert.deepEqual(a.load('2025:pm1:1'),{'s1-1':'顧客','s1-2':'リレーションシップ'});
 assert.deepEqual(a.load('2025:pm1:2'),{'s1-1':'別の答え'});
 assert.deepEqual(createPmDraftStore(storage).load('2025:pm1:1'),a.load('2025:pm1:1'));
});
test('legacy progress and existing term progress are never modified',()=>{
 const original='{"2025:pm1:1":{"written":"元の大問回答","level":"review"}}';
 const terms='{"xp-pair":{"correct":true}}';
 const storage=memoryStorage({'db-study-progress-v1':original,'db-study-terms-v1':terms});
 createPmDraftStore(storage).save('2025:pm1:1','s1-1','新しい設問回答');
 assert.equal(storage.getItem('db-study-progress-v1'),original);
 assert.equal(storage.getItem('db-study-terms-v1'),terms);
 assert.ok(storage.getItem(PM_DRAFT_KEY));
});
test('malformed saved data does not break reads or erase old history',()=>{
 const storage=memoryStorage({[PM_DRAFT_KEY]:'{invalid'});
 const store=createPmDraftStore(storage);
 assert.deepEqual(store.load('2025:pm1:1'),{});
 store.save('2025:pm1:1','s1-1','回復後の回答');
 assert.equal(store.load('2025:pm1:1')['s1-1'],'回復後の回答');
});
test('invalid answer data is rejected before writing',()=>{
 const storage=memoryStorage(),store=createPmDraftStore(storage);
 assert.throws(()=>store.save('','s1','答え'),/INVALID_PM_ANSWER/);
 assert.throws(()=>store.save('2025:pm1:1','s1',null),/INVALID_PM_ANSWER/);
 assert.equal(storage.getItem(PM_DRAFT_KEY),null);
});
