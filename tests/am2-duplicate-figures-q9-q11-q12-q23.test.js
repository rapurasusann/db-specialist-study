'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('AM2 Q9 Q11 Q12 Q23: redundant text is absent and original figures/answers remain', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'am2-2025-questions.js'), 'utf8');
  const transcribed = {};
  vm.runInNewContext(source, {transcribed}, {timeout:1500});
  const expectations = [
    {n:9, page:8, clue:/名簿1/, removed:/【名簿1・名簿2|【SQL文】|COMPARE/},
    {n:11, page:9, clue:/ON DELETE/, removed:/【注文】|【注文明細】/},
    {n:12, page:10, clue:/ロールフォワード/, removed:/【処理内容】|【時系列図の読み替え】/},
    {n:23, page:15, clue:/RAID6/, removed:/【ディスク配置|【パリティの計算方法】/}
  ];
  for (const {n, page, clue, removed} of expectations) {
    const q = transcribed['2025:am2:'+n];
    assert.ok(q, 'missing question '+n);
    assert.match(q.stem, clue, 'stem changed incorrectly: '+n);
    assert.doesNotMatch(q.stem, removed, 'duplicate data still present: '+n);
    assert.deepEqual(Object.keys(q.options), ['ア','イ','ウ','エ']);
    assert.equal(q.verified, true);
    assert.equal(q.sourcePage, page);
  }
});
