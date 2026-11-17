'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('AM2問6: 重複した表テキストは表示せず原本画像と設問・選択肢は維持', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'am2-2025-questions.js'), 'utf8');
  const context = { transcribed: {} };
  vm.runInNewContext(source, context);
  const q = context.transcribed['2025:am2:6'];
  assert.ok(q, '問6が存在する');
  assert.match(q.stem, /第3正規形/);
  assert.doesNotMatch(q.stem, /【表の列】|【主なデータ例】|1055／A7053/);
  assert.deepEqual(Object.entries(q.options).map(([a,b]) => [a,b]),
    [['ア','2'],['イ','3'],['ウ','4'],['エ','5']]);
  assert.equal(q.sourcePage, 5);
  assert.equal(q.verified, true);
});
