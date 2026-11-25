import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {roundSummary} from '../src/am2-25-challenge-engine.mjs';

const ui=readFileSync(new URL('../src/am2-25-standalone-ui.js',import.meta.url),'utf8');
const renderer=readFileSync(new URL('../src/am2-25-standalone-figures.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('challenge has a separate responsive screen, not the old screen overlay',()=>{
 assert.match(ui,/screen\.id='quiz25Screen'/);
 assert.match(ui,/\$\('study'\)\.after\(screen\)/);
 assert.match(ui,/quiz25Columns/);
 assert.match(ui,/quiz25Jump/);
 assert.match(ui,/quiz25Figures/);
 assert.match(ui,/quiz25Result/);
 assert.doesNotMatch(ui,/renderStudy\(|renderAnswer\(|gradeCurrentAnswer\(|byId\('viewStudy'\)\.click\(\)/);
 assert.match(html,/src\/am2-25-standalone-ui\.js\?v=20261125stand1/);
 assert.doesNotMatch(html,/src\/am2-25-challenge-ui\.js\?v=20261125skip1/);
});

test('independent screen supports tables, SQL, diagrams, and option-specific diagrams',()=>{
 assert.match(ui,/renderChallengeFigure\(figure\)/);
 assert.match(ui,/q\?\.optionFigures\?\.\[letter\]/);
 for(const type of ['sql','table','schema','graph','uml'])assert.match(renderer,new RegExp(type));
 assert.match(renderer,/export function renderChallengeFigure/);
});

test('unanswered question remains navigable and eligible for retry',()=>{
 assert.match(ui,/次の問題へ（未回答でも可）/);
 assert.match(ui,/function renderJump\(/);
 assert.match(ui,/position=i;renderQuestion\(\)/);
 assert.match(ui,/drafts\[item\.id\]=letter/);
 assert.match(ui,/const skipped=result\.wrong\.filter\(q=>!Object\.hasOwn\(answers,q\.id\)\)\.length/);
 const questions=Array.from({length:25},(_,n)=>({id:'q'+n,year:2025,n:n+1,answer:'ア'}));
 const answers=Object.fromEntries(questions.slice(0,20).map((q,n)=>[q.id,n<18?'ア':'イ']));
 const result=roundSummary(questions,answers);
 assert.equal(result.correct,18);
 assert.equal(result.rate,72);
 assert.equal(result.wrong.length,7);
});

test('answer changes are stored in original progress and do not grade merely on navigation',()=>{
 assert.match(ui,/progress\[item\.id\]=\{/);
 assert.match(ui,/save\(\)/);
 assert.match(ui,/attempts:\(Number\(prev\.attempts\)\|\|0\)\+1/);
 assert.match(ui,/byId|\$\('quiz25Next'\)\.addEventListener/);
 assert.match(ui,/if\(!active\|\|complete\)return;if\(position\+1<round\.length\)/);
});
