import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {roundSummary} from '../src/am2-25-challenge-engine.mjs';

const ui=readFileSync(new URL('../src/am2-25-challenge-ui.js',import.meta.url),'utf8');
test('challenge supports next without submitting and backward navigation',()=>{
 assert.match(ui,/id="quiz25Back"/);
 assert.match(ui,/次の問題へ（未回答でも可）/);
 assert.match(ui,/byId\('quiz25Back'\)\.addEventListener\('click'/);
 assert.match(ui,/byId\('quiz25Next'\)\.addEventListener\('click',\(\)=>\{\s*if\(!active\|\|finished\|\|!round\.length\)return;/);
 assert.doesNotMatch(ui,/!Object\.hasOwn\(answers,round\[index\]\.id\)\)return/);
});
test('skips count as incorrect and are retried with wrong answers',()=>{
 const q=Array.from({length:25},(_,i)=>({id:'2025:am2:'+(i+1),year:2025,n:i+1,answer:'ア'}));
 const answers=Object.fromEntries(q.slice(0,20).map((x,i)=>[x.id,i<18?'ア':'イ']));
 const summary=roundSummary(q,answers);
 assert.equal(summary.count,25);
 assert.equal(summary.correct,18);
 assert.equal(summary.rate,72);
 assert.deepEqual(summary.wrong.map(x=>x.id),q.slice(18).map(x=>x.id));
 assert.equal(summary.wrong.filter(x=>!Object.hasOwn(answers,x.id)).length,5);
 const retried=roundSummary(summary.wrong,Object.fromEntries(summary.wrong.map(x=>[x.id,'ア'])));
 assert.equal(retried.rate,100);
 assert.deepEqual(retried.wrong,[]);
});
test('a skipped answer may be selected and revisited before grading',()=>{
 assert.match(ui,/function rememberDraft\(\)/);
 assert.match(ui,/drafts\[item\.id\]=sessionSelected/);
 assert.match(ui,/sessionSelected=drafts\[item\.id\];renderAnswer\(\)/);
 assert.match(ui,/drafts=\{\};index=0;stage\+\+/);
});
