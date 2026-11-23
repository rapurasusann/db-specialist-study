import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreCs03UnsavedBackup} from '../src/cs03-unsaved-restore.mjs';
import {createCs03StudyAutoSync} from '../src/cs03-study-auto-sync.mjs';

const A='a1111111-1111-4111-8111-111111111111',B='b1111111-1111-4111-8111-111111111111';
const Q='2025:am2:4';
function setup(){
 let userId=A,saves=0;
 const session={start:async()=>({userId,records:{}}),open:async()=>null,save:async()=>{saves++},stop:()=>{}};
 const auto=createCs03StudyAutoSync({session});
 return {auto,changeUser:id=>userId=id,get saves(){return saves}};
}
const backup=(userId=A)=>JSON.stringify({format:'cs03-unsaved-account-progress-v1',userId,
 records:{[Q]:{level:'review'}}});
test('confirmed same-account file imports into review-only drafts without remote writes',async()=>{
 const f=setup();await f.auto.login();
 const result=await restoreCs03UnsavedBackup({auto:f.auto,jsonText:backup(),confirmRestore:async n=>n===1});
 assert.equal(result.restored,1);assert.equal(result.requiresReview,true);
 assert.deepEqual(f.auto.state().blocked,[Q]);assert.equal(f.saves,0);
});
test('cancelled recovery leaves account data unchanged',async()=>{
 const f=setup();await f.auto.login();
 const result=await restoreCs03UnsavedBackup({auto:f.auto,jsonText:backup(),confirmRestore:async()=>false});
 assert.equal(result.cancelled,true);assert.deepEqual(f.auto.state().pending,[]);assert.equal(f.saves,0);
});
test('different account, malformed file and invalid record fail closed',async()=>{
 const f=setup();await f.auto.login();
 await assert.rejects(restoreCs03UnsavedBackup({auto:f.auto,jsonText:backup(B),confirmRestore:async()=>true}),/BACKUP_ACCOUNT_MISMATCH/);
 await assert.rejects(restoreCs03UnsavedBackup({auto:f.auto,jsonText:'{bad',confirmRestore:async()=>true}),/BACKUP_FILE_INVALID/);
 const invalid=JSON.stringify({format:'cs03-unsaved-account-progress-v1',userId:A,records:{'2025:am2:0':{level:'review'}}});
 await assert.rejects(restoreCs03UnsavedBackup({auto:f.auto,jsonText:invalid,confirmRestore:async()=>true}),/INVALID_RECORD/);
 assert.deepEqual(f.auto.state().pending,[]);assert.equal(f.saves,0);
});
test('account changed while awaiting confirmation does not import',async()=>{
 const f=setup();await f.auto.login();
 await assert.rejects(restoreCs03UnsavedBackup({auto:f.auto,jsonText:backup(),confirmRestore:async()=>{
  f.auto.logout();f.changeUser(B);await f.auto.login();return true;
 }}),/BACKUP_ACCOUNT_MISMATCH/);
 assert.deepEqual(f.auto.state().pending,[]);assert.equal(f.saves,0);
});
