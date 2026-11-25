/** 2016-2024 focused AM2 explanation integrity checks.
 * Run: node --test tests/am2-explanations-focus-20261125.test.mjs
 * This is a consistency test, not independent IPA source certification.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const cases={"2016":[24,25],"2018":[19],"2020":[19],"2021":[13,16],"2022":[15],"2023":[4,15],"2024":[13]};
function load(year){
 const path=year===2024?'src/am2-archive-2024.js':`src/am2-archive-${year}-data.js`;
 const src=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const from=year===2024?src.indexOf('const entry=')+12:src.indexOf('=')+1;
 const to=year===2024?src.indexOf(';\nconst entries=',from):src.lastIndexOf(';');
 return JSON.parse(src.slice(from,to));
}
test('ten targeted AM2 explanations have correct answer keys, examples and distinctions',()=>{
 let count=0;
 for(const [yearText,numbers] of Object.entries(cases)){
  const year=Number(yearText),archive=load(year);
  assert.equal(Object.keys(archive.questions).length,25);
  for(const number of numbers){
   const q=archive.questions['am2:'+number];
   assert.ok(q?.stem && q.options,'question exists '+year+'/'+number);
   assert.equal(q.answer,archive.courses[0].answers[number-1],'registered answer agrees '+year+'/'+number);
   assert.ok(q.explanation.startsWith('正解は'+q.answer),'explanation answer agrees '+year+'/'+number);
   assert.ok(q.explanation.length>=120,'explanation is substantive '+year+'/'+number);
   assert.ok(q.explanation.includes('\n\n'),'separates rationale and distractor comparison '+year+'/'+number);
   count++;
  }
 }
 assert.equal(count,10);
});
