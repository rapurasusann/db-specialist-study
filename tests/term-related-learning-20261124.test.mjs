import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=file('src/term-understanding-questions.js');
const sourceMjs=file('src/term-understanding-questions.mjs');
const questions=vm.runInNewContext(source.replace('export const termQuestions=','const termQuestions=')+'\ntermQuestions;');
test('vocabulary question sets retain exactly the same 50 entries',()=>{
 assert.equal(questions.length,50);
 const other=vm.runInNewContext(sourceMjs.replace('export const termQuestions=','const termQuestions=')+'\nJSON.stringify(termQuestions);');
 assert.equal(JSON.stringify(questions),other);
 assert.equal(new Set(questions.map(x=>x.id)).size,questions.length);
});
test('constraint terminology added without changing existing term IDs and correct choices',()=>{
 const before=['nf-1','nf-2','nf-3','ra-select','ra-division','iso-rr','iso-ser','xp-ci','crypto-rsa','crypto-sign'];
 for(const id of before)assert.ok(questions.find(q=>q.id===id),id);
 const ids=['con-immediate','con-deferred','con-deferrable','con-set-constraints','con-initially-immediate','con-initially-deferred','con-unique','con-transaction'];
 assert.equal(questions.filter(q=>q.category==='制約・トランザクション').length,8);
 for(const id of ids){
  const q=questions.find(x=>x.id===id);
  assert.ok(q,id);
  assert.equal(q.choices.length,4,id);
  assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,id);
  assert.ok(q.explanation.length>40,id);
 }
});
test('vocabulary lessons provide deep links and reveal explanations without scoring them',()=>{
 for(const path of ['src/term-understanding-ui.js','src/term-understanding-ui.mjs']){
  const s=file(path);
  assert.match(s,/new URLSearchParams\(window\.location\.search\)\.get\('term'\)/);
  assert.match(s,/termQuestions\.find\(q=>q\.id===targetId\)/);
  assert.match(s,/id="termReveal"/);
  const reveal=s.slice(s.indexOf("$('termReveal').addEventListener('click'"),s.indexOf("$('termNext').addEventListener"));
  assert.match(reveal,/q\.explanation/);
  assert.doesNotMatch(reveal,/saveResult\(|localStorage\.setItem/);
  assert.match(reveal,/choice\.disabled=true/);
  assert.doesNotThrow(()=>new vm.Script(s.replace(/^import .*?;\s*/,'')));
 }
});
test('past exams link only registered terms using new-tab noopener URLs',()=>{
 const links=file('src/related-term-study-links.js');
 assert.match(links,/2025:am2:8/);
 assert.match(links,/con-immediate/);
 assert.match(links,/con-deferred/);
 assert.match(links,/new URL\(window\.location\.href\)/);
 assert.match(links,/url\.searchParams\.set\('term',tid\)/);
 assert.match(links,/link\.target='_blank'/);
 assert.match(links,/link\.rel='noopener noreferrer'/);
 assert.match(links,/new MutationObserver\(render\)\.observe\(title/);
 assert.doesNotThrow(()=>new vm.Script(links.replace(/^import .*?;\s*/,'')));
});
test('full study app loads the new navigation with same original CSP and preserves past question screens',()=>{
 const html=file('index.html');
 assert.match(html,/script-src 'self'/);
 assert.match(html,/connect-src 'self'/);
 assert.match(html,/src\/term-understanding-ui\.js\?v=20261124c/);
 assert.match(html,/src\/related-term-study-links\.js\?v=20261124a/);
 assert.match(html,/id="currentTitle"/);
 assert.match(html,/id="questionText"/);
 assert.match(html,/src\/afternoon-generic-layout\.js/);
});
