'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'src/am2-2025-questions.js'), 'utf8');

test('問8: 重複転記を削除して設問・選択肢・原本表示は維持', () => {
  const transcribed = {};
  vm.runInNewContext(source, { transcribed });
  const q = transcribed['2025:am2:8'];
  assert.ok(q && /トランザクションA/.test(q.stem));
  assert.doesNotMatch(q.stem, /【表定義】|【システム担当者（初期データ）】|【トランザクションA】|CREATE TABLE/);
  assert.equal(JSON.stringify(q.options), JSON.stringify({
    'ア':'PK_システム番号 DEFERRED',
    'イ':'PK_システム番号 IMMEDIATE',
    'ウ':'UK_担当者番号 DEFERRED',
    'エ':'UK_担当者番号 IMMEDIATE',
  }));
  assert.equal(q.sourcePage, 7);
  assert.equal(q.verified, true);
});

function harness() {
  const start = html.indexOf('function gradeCurrentAnswer(');
  const end = html.indexOf("$('grade').onclick=", start);
  const navStart = html.indexOf('function navigate(delta)', end);
  const navEnd = html.indexOf("$('pagePrev').onclick=", navStart);
  assert.ok(start >= 0 && end > start && navStart > end && navEnd > navStart);
  const gradeSrc = html.slice(start, end);
  const navSrc = html.slice(navStart, navEnd);
  const context = {
    year: 2025, courseId: 'am2', number: 8,
    sessionSelected: null, sessionGradedSelection: null, showAnswer: false,
    progress: {}, events: [], alerts: [],
    years: {2025: {questions:{}}},
    transcribed: {},
    course: () => ({type:'choice',count:25,answers:{7:'ウ',8:'ウ',9:'エ'}}),
    questionData: () => ({options:{ア:'a'}}),
    $: () => ({value:'all',textContent:''}),
    renderStudy: () => { context.sessionSelected=null;context.sessionGradedSelection=null;context.events.push('render'); },
    rec: () => context.progress[context.number] || {},
    put: x => { context.progress[context.number]={...context.rec(),...x}; context.events.push(['put',context.number,x]); },
    alert: x => context.alerts.push(x),
  };
  vm.createContext(context);
  vm.runInContext(gradeSrc+'\n'+navSrc,context);
  return context;
}

test('前後の問題へ移動すると選択済みの答えを自動採点し、履歴を保存', () => {
  const c=harness();
  c.sessionSelected='ウ';
  c.navigate(1);
  assert.equal(c.number,9);
  assert.deepEqual(JSON.parse(JSON.stringify(c.progress[8])),{correct:true,level:'learning',attempts:1});
  assert.equal(c.sessionSelected,null);
  c.sessionSelected='ア';
  c.navigate(-1);
  assert.equal(c.number,8);
  assert.deepEqual(JSON.parse(JSON.stringify(c.progress[9])),{correct:false,level:'review',attempts:1});
});

test('未選択・同じ選択肢の既判定・端の移動で二重採点しない', () => {
  const c=harness();
  c.navigate(1);
  assert.equal(c.progress[8],undefined);
  c.number=8;
  c.sessionSelected='ウ';
  c.gradeCurrentAnswer(true);
  c.navigate(1);
  assert.equal(c.progress[8].attempts,1);
  c.number=25;
  c.sessionSelected='ウ';
  c.navigate(1);
  assert.equal(c.number,25);
  assert.equal(c.progress[25],undefined);
});

test('判定済みでも選択肢を変更した場合は最後の回答を採点', () => {
  const c=harness();
  c.sessionSelected='ア';
  c.gradeCurrentAnswer(true);
  assert.equal(c.progress[8].correct,false);
  c.sessionSelected='ウ';
  c.navigate(1);
  assert.equal(c.progress[8].correct,true);
  assert.equal(c.progress[8].attempts,2);
});
