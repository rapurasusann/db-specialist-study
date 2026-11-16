'use strict';
const assert = require('node:assert/strict');
const ids = require('../src/question-identity.js');
const cases = [
  ['2025:am2:1', 'db:2025:am2:1'],
  ['2025:pm1:20', 'db:2025:pm1:20'],
  ['db:2025:am2:1', 'db:2025:am2:1'],
  ['pm:2025:am2:1', 'pm:2025:am2:1'],
  ['sc:2025:am2:1', 'sc:2025:am2:1']
];
for (const [value, normalized] of cases) {
  assert.equal(ids.normalize(value), normalized, value);
  assert.equal(ids.format(ids.parse(normalized)), normalized);
}
assert.equal(ids.toLegacy('db:2025:am2:1'), '2025:am2:1');
assert.equal(ids.toLegacy('pm:2025:am2:1'), null);
assert.equal(ids.toLegacy('sc:2025:am2:1'), null);
assert.notEqual(ids.normalize('db:2025:am2:1'), ids.normalize('pm:2025:am2:1'));
for (const bad of ['', '2025:am2:0', '2025:am2:01', '2025:am2:1000',
  'pm:2025:am2:0', 'db:2025:am2:01', 'db:2025:am2:1000',
  'db:2025:am2:1:extra', 'unknown:2025:am2:1',
  '2025:am3:1', 'db:2025:am3:1',
  'db:1999:am2:1', 'db:2100:am2:1',
  '2025:am2:1\nsc:2025:am2:1', null, {}, 123]) {
  assert.equal(ids.normalize(bad), null, String(bad));
}
for (const bad of [
  {examId:'db',year:2025,courseId:'am2',number:0},
  {examId:'pm',year:2025,courseId:'am2',number:'1'},
  {examId:'other',year:2025,courseId:'am2',number:1}
]) assert.throws(() => ids.format(bad), TypeError);
console.log('question identity: legacy DB compatibility, 3 qualifications, collision and invalid-input guards PASS');
