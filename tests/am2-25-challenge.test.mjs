import test from 'node:test';
import assert from 'node:assert/strict';
import {BATCH_SIZE,studyWeight,weightedSample,roundSummary,eligibleQuestions} from '../src/am2-25-challenge-engine.mjs';
const pool=Array.from({length:250},(_,n)=>({id:'q'+n,answer:'ア',year:2016+Math.floor(n/25),n:n%25+1}));
function seeded(seed=12345){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed+.5)/4294967296}}
test('only source-complete AM2 questions are eligible',()=>{
 const years={2025:{courses:[{id:'am2',count:3,answers:['ア','イ','ウ']}],questions:{'am2:1':{stem:'A',options:{ア:'1',イ:'2',ウ:'3',エ:'4'}},'am2:2':{stem:'B',options:{ア:'1',イ:'2'}}}}};
 const transcribed={'2025:am2:3':{stem:'C',options:{ア:'1',イ:'2',ウ:'3',エ:'4'}}};
 assert.deepEqual(eligibleQuestions(years,transcribed).map(x=>x.id),['2025:am2:1','2025:am2:3']);
});
test('draws exactly 25 distinct questions and avoids previous batch',()=>{
 const first=weightedSample(pool,{},BATCH_SIZE,[],seeded(27));
 assert.equal(first.length,25);assert.equal(new Set(first.map(q=>q.id)).size,25);
 const second=weightedSample(pool,{},BATCH_SIZE,first.map(q=>q.id),seeded(28));
 assert.equal(second.length,25);
 assert.equal(second.filter(q=>first.some(old=>old.id===q.id)).length,0);
});
test('well-mastered questions have much less weight than review and unseen questions',()=>{
 assert.ok(studyWeight({level:'mastered',correct:true,streak:3}) < studyWeight({}));
 assert.ok(studyWeight({level:'mastered'}) < studyWeight({level:'review'}));
 const records=Object.fromEntries(pool.map((q,i)=>[q.id,i<50?{level:'mastered'}:i<75?{level:'review'}:{}]));
 let reviewed=0,mastered=0,rand=seeded(914);
 for(let i=0;i<120;i++){for(const q of weightedSample(pool,records,25,[],rand)){const n=Number(q.id.slice(1));if(n<50)mastered++;else if(n<75)reviewed++;}}
 assert.ok(mastered/50 < reviewed/25/10,'per-question mastered frequency is less than one tenth of review frequency');
});
test('results compute initial accuracy and retry only missed questions',()=>{
 const first=pool.slice(0,25),submitted=Object.fromEntries(first.map((q,i)=>[q.id,i<18?'ア':'エ']));
 const summary=roundSummary(first,submitted);
 assert.equal(summary.count,25);assert.equal(summary.correct,18);assert.equal(summary.rate,72);
 assert.deepEqual(summary.wrong.map(x=>x.id),first.slice(18).map(x=>x.id));
 const perfect=roundSummary(summary.wrong,Object.fromEntries(summary.wrong.map(q=>[q.id,'ア'])));
 assert.equal(perfect.rate,100);assert.equal(perfect.wrong.length,0);
});
