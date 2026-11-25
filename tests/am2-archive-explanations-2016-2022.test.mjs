/** Targeted 2016–2022 explanation quality regression; run with node --test */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const targets={"2016":[3,17],"2017":[17,19],"2018":[4,10],"2019":[15,17],"2020":[5,23],"2021":[4,23],"2022":[3,7]};
function load(year){
 const content=readFileSync(new URL('../src/am2-archive-'+year+'-data.js',import.meta.url),'utf8');
 const json=content.slice(content.indexOf('=')+1,content.lastIndexOf(';'));
 return JSON.parse(json);
}
test('14 improved explanations match answers and preserve source question data',()=>{
 let checked=0;
 for(const [year,numbers] of Object.entries(targets)){
  const archive=load(year);
  for(const n of numbers){
   const q=archive.questions['am2:'+n];
   assert.ok(q?.stem && q.options,year+' question '+n);
   assert.equal(q.answer,archive.courses[0].answers[n-1],year+' question '+n+' official answer key');
   assert.ok(q.explanation.startsWith('正解は'+q.answer),year+' question '+n+' explanation answer label');
   assert.ok(q.explanation.length>=150,year+' question '+n+' must explain rationale');
   assert.ok(q.explanation.includes('\n\n'),year+' question '+n+' clear paragraph structure');
   checked++;
  }
 }
 assert.equal(checked,14);
});
