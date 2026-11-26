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
 assert.match(html,/<script\b[^>]*type="module"[^>]*src="src\/am2-25-standalone-ui\.js\?v=[A-Za-z0-9._-]+"[^>]*>/);
 assert.doesNotMatch(html,/<script\b[^>]*src="src\/am2-25-challenge-ui\.js(?:\?[^" ]*)?"/);
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

test('navigation commits a selected answer once, skips unanswered and preserves progress',()=>{
 const start=ui.indexOf('function recordAnswer(item,correct)');
 const end=ui.indexOf('function renderHistory(item)',start);
 const nav=ui.split(/\r?\n/).filter(line=>/^\$\('quiz25(?:Back|Next)'\)\.addEventListener/.test(line));
 assert.ok(start>=0&&end>start);
 assert.equal(nav.length,2);
 const simulate=new Function('round',`
 let active=true,complete=false,position=0,drafts={},answers={},progress={},answerSeen=new Set(),saves=0,renders=0,finished=false;
 const handlers={};
 const $=id=>({addEventListener:(event,fn)=>{handlers[id]=fn}});
 const save=()=>saves++,renderMetrics=()=>{},renderQuestion=()=>renders++,finish=()=>{finished=true;complete=true};
 `+ui.slice(start,end)+'\n'+nav.join('\n')+`
 return {drafts,answers,progress,handlers,state:()=>({position,saves,renders,finished})};
 `);
 const h=simulate([{id:'a',answer:'ア'},{id:'b',answer:'イ'},{id:'c',answer:'ウ'}]);
 h.drafts.a='ア';h.handlers.quiz25Next();
 assert.equal(h.progress.a.correct,true);
 assert.equal(h.progress.a.attempts,1);
 h.handlers.quiz25Back();assert.equal(h.state().position,0);
 h.handlers.quiz25Next();assert.equal(h.progress.a.attempts,1);
 h.handlers.quiz25Next();assert.equal(h.progress.b,undefined);
 h.drafts.c='エ';h.handlers.quiz25Next();
 assert.equal(h.progress.c.correct,false);
 assert.equal(h.state().finished,true);
 assert.equal(h.state().saves,2);
});
