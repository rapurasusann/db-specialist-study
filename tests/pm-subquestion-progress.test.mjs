import test from 'node:test';
import assert from 'node:assert/strict';
import {updateSubquestionAnswer,getSubquestionAnswers} from '../src/pm-subquestion-progress.mjs';
test('subquestion answers survive switching, retain existing main-question answer and level',()=>{
 const original={written:'以前に大問全体へ入力した回答',level:'review',updatedAt:'old',extra:{keep:true}};
 const first=updateSubquestionAnswer(original,'s1-1','回答A','2026-11-19T00:00:00Z');
 const second=updateSubquestionAnswer(first,'s1-2','回答B','2026-11-19T00:00:01Z');
 assert.deepEqual(getSubquestionAnswers(second),{'s1-1':'回答A','s1-2':'回答B'});
 assert.equal(second.written,original.written);
 assert.equal(second.level,'review');
 assert.deepEqual(second.extra,{keep:true});
 assert.deepEqual(original,{written:'以前に大問全体へ入力した回答',level:'review',updatedAt:'old',extra:{keep:true}});
 assert.equal(second.updatedAt,'2026-11-19T00:00:01Z');
});
test('editing an answer only changes that subquestion, including clearing it',()=>{
 const rec={writtenBySubquestion:{'s1-1':'旧回答','s1-2':'残す回答'}};
 const out=updateSubquestionAnswer(rec,'s1-1','');
 assert.deepEqual(getSubquestionAnswers(out),{'s1-1':'','s1-2':'残す回答'});
 assert.equal(rec.writtenBySubquestion['s1-1'],'旧回答');
});
test('reject invalid keys and malformed answer containers',()=>{
 assert.throws(()=>updateSubquestionAnswer({},'__proto__','x'),/INVALID_SUBQUESTION_ID/);
 assert.throws(()=>updateSubquestionAnswer({},'s1-1',null),/INVALID_ANSWER/);
 assert.throws(()=>updateSubquestionAnswer({writtenBySubquestion:[]},'s1-1','x'),/INVALID_SUBQUESTION_ANSWERS/);
 assert.deepEqual(getSubquestionAnswers({writtenBySubquestion:{'s1-1':'OK',bad:42}}),{'s1-1':'OK'});
});
