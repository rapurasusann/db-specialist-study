import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {termQuestions} from '../src/term-understanding-questions.mjs';
const ui=readFileSync(new URL('../src/term-understanding-ui.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('one independent four-choice question per term',()=>{
 assert.equal(termQuestions.length,19);
 assert.equal(new Set(termQuestions.map(q=>q.id)).size,termQuestions.length);
 assert.equal(new Set(termQuestions.map(q=>q.term)).size,termQuestions.length);
 for(const q of termQuestions){
  assert.ok(['正規形','関係演算','隔離性水準'].includes(q.category));
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
  assert.ok(q.explanation.length>=45);
 }
});
test('normal forms and key relational operations covered individually',()=>{
 const terms=new Set(termQuestions.map(q=>q.term));
 for(const name of ['第1正規形','第2正規形','第3正規形','選択（σ）','射影（π）','和（∪）','共通（∩）','差（−）','直積（×）','結合（⋈）','商（÷）','名前変更（ρ）','READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE','ダーティリード','反復不能読取り','ファントムリード'])assert.ok(terms.has(name),name);
});
test('term practice is isolated and does not replace legacy progress or question viewer',()=>{
 assert.ok(html.includes('src/term-understanding-ui.mjs'));
 assert.ok(html.includes('id="pageImage"'));
 assert.ok(ui.includes("const recordsKey='db-study-terms-v1'"));
 assert.ok(!ui.includes('db-study-progress-v1'));
 assert.ok(ui.includes("q.term+'の説明として正しいのは次のうちどれでしょうか？'"));
 assert.ok(ui.includes("document.getElementById('study')?.insertAdjacentElement('afterend',panel)"));
});

test('switching to terms hides legacy dashboard metrics and preserves the legacy history',()=>{
 assert.ok(ui.includes('#termPractice[hidden],.metrics[hidden]{display:none!important}'));
 assert.ok(ui.includes("if(metrics)metrics.hidden=true"));
 assert.ok(ui.includes("if(metrics)metrics.hidden=false"));
 assert.ok(ui.includes("$('dashboard').classList.add('hide')"));
 assert.ok(ui.includes("$('study').classList.add('hide')"));
 assert.ok(ui.includes("$('viewStudy').addEventListener('click',leaveTerms)"));
 assert.ok(ui.includes("$('viewDashboard').addEventListener('click',leaveTerms)"));
});
test('answer records are separate, update visibly, and cannot be submitted twice',()=>{
 assert.ok(ui.includes("if(answered)return"));
 assert.ok(ui.includes("localStorage.setItem(recordsKey,JSON.stringify(records))"));
 assert.ok(ui.includes("activeTerm.textContent=q.term+(correct?' ✓':'')"));
 assert.ok(ui.includes("button.disabled=true"));
 assert.ok(!ui.includes("localStorage.setItem('db-study-progress-v1'"));
});
