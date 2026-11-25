/** Verify all 2025 AM2 explanations point to the correct answer key.
 * Run: node --test tests/am2-2025-explanations-consistency.test.mjs
 * These are data integrity tests, not source-PDF transcription verification.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html');
const source=read('src/am2-2025-explanations.js');
const match=source.match(/const explanations\s*=\s*(\{[\s\S]*?\});/);
assert.ok(match,'explanations data declaration present');
const explanations=JSON.parse(match[1]);
const answerLine=html.match(/id:'am2',name:'午前Ⅱ'[^\n]*answers:'([^']+)'\.split\(' '\)/);
assert.ok(answerLine,'2025 AM2 answer key declaration present');
const answers=answerLine[1].split(' ');

test('2025 AM2 explanations cover exactly 25 questions',()=>{
 assert.equal(answers.length,25);
 assert.deepEqual(Object.keys(explanations).sort((a,b)=>Number(a)-Number(b)),
  Array.from({length:25},(_,i)=>String(i+1)));
});

test('the correct answer stated in every explanation matches the official registered answer',()=>{
 for(let n=1;n<=25;n++){
  const exp=explanations[n];
  assert.ok(typeof exp==='string' && exp.length>=60,'Q'+n+' explanation exists');
  const stated=exp.match(/^(?:正解は([アイウエ])|【正解：([アイウエ]))/);
  assert.ok(stated,'Q'+n+' starts with a recognizable answer declaration');
  assert.equal(stated[1]??stated[2],answers[n-1],'Q'+n+' answer statement agrees with key');
 }
});

test('expanded Q6 normalization explanation includes split-table reasoning',()=>{
 const text=explanations[6];
 for(const phrase of ['顧客','受注','商品','4表']){
  assert.ok(text.includes(phrase),'Q6 normalization explanation mentions '+phrase);
 }
});
