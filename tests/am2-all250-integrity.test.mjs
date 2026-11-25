/** AM2 source data regression checks without a browser.
 * Run: node --test tests/am2-all250-integrity.test.mjs
 * These checks do not establish character-perfect identity with IPA originals.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const letters=['ア','イ','ウ','エ'];
const html=read('index.html');

function archive(year){
 const source=read(year===2024?'src/am2-archive-2024.js':`src/am2-archive-${year}-data.js`);
 const json=year===2024
  ? source.slice(source.indexOf('const entry=')+12,source.indexOf(';\nconst entries='))
  : source.slice(source.indexOf('=')+1,source.lastIndexOf(';'));
 return JSON.parse(json);
}

function year2025(){
 const start=html.indexOf('const transcribed = {');
 const end=html.indexOf('};',start);
 assert.ok(start>=0&&end>start,'2025 initial question data present');
 const inline=html.slice(start,end+2);
 const context=runInNewContext(inline+'; ({transcribed})');
 runInNewContext(read('src/am2-2025-questions.js'),context);
 runInNewContext(read('src/am2-2025-original-completion.js'),context);
 const answerLine=html.match(/id:'am2',name:'午前Ⅱ'[^\n]*answers:'([^']+)'\.split\(' '\)/);
 assert.ok(answerLine,'2025 AM2 answers definition present');
 return {questions:Object.fromEntries(Array.from({length:25},(_,i)=>['am2:'+(i+1),context.transcribed['2025:am2:'+(i+1)]])),courses:[{answers:answerLine[1].split(' ')}]};
}

test('250 AM2 stems, question keys, options, and answer keys are valid',()=>{
 let questionCount=0;
 for(let year=2016;year<=2025;year++){
  const data=year===2025?year2025():archive(year);
  const questions=data.questions,answers=data.courses[0].answers;
  assert.equal(answers.length,25,year+' has 25 answer keys');
  assert.equal(Object.keys(questions).length,25,year+' has 25 questions');
  for(let n=1;n<=25;n++){
   const q=questions['am2:'+n];
   assert.ok(q,year+' question '+n+' is present');
   assert.ok(typeof q.stem==='string'&&q.stem.trim().length>0,year+':'+n+' has stem');
   assert.ok(q.options&&typeof q.options==='object',year+':'+n+' has options');
   assert.deepEqual(Object.keys(q.options).sort(),[...letters].sort(),year+':'+n+' choice labels');
   for(const k of letters){
    assert.equal(typeof q.options[k],'string',year+':'+n+' choice '+k);
    if(!q.options[k].trim()){
     assert.equal(year,2024,year+':'+n+' unexpected empty choice '+k);
     assert.ok(q.optionFigures?.[k]?.length,year+':'+n+' empty text requires diagram');
    }
   }
   assert.ok(letters.includes(answers[n-1]),year+':'+n+' valid answer');
   if(year!==2025) assert.equal(q.answer,answers[n-1],year+':'+n+' stored answer matches year key');
   if(q.optionFigures)for(const k of Object.keys(q.optionFigures)){
    assert.ok(letters.includes(k),year+':'+n+' known option figure key');
    assert.ok(Array.isArray(q.optionFigures[k])&&q.optionFigures[k].length>0);
   }
   questionCount++;
  }
 }
 assert.equal(questionCount,250);
});

test('2025 supplemental script loads after base data and before archive overrides',()=>{
 const order=['src/am2-2025-questions.js','src/am2-2025-original-completion.js','src/am2-archive-2024.js'];
 const positions=order.map(path=>html.indexOf(path));
 assert.ok(positions.every(pos=>pos>=0));
 assert.ok(positions[0]<positions[1]&&positions[1]<positions[2]);
});

test('2025 official Q12 checkpoint chronology and Q23 parity premises are retained',()=>{
 const data=year2025();
 const timeline=data.questions['am2:12'].stem;
 for(const label of ['T1：チェックポイント前に開始・コミット','T2：チェックポイント前に開始 → チェックポイント後にコミット','T3：チェックポイント後に開始','T4：チェックポイント前に開始','T5：チェックポイント後に開始・コミット','T6：チェックポイント後に開始']){
  assert.ok(timeline.includes(label),'2025 Q12 timeline: '+label);
 }
 const raid=data.questions['am2:23'].stem;
 for(const premise of ['磁気ディスク1｜Aₚ，B₁，Cₚ，D₁','磁気ディスク2｜A₁，Bₚ，C₁，Dₚ','磁気ディスク3｜A₂，B₂，C₂，D₂','磁気ディスク4｜Aᵥ，Bᵥ，Cᵥ，Dᵥ','Aₚ＝A₁⊕A₂','Aᵥ＝D₁⊕A₂']){
  assert.ok(raid.includes(premise),'2025 Q23 premise: '+premise);
 }
});
