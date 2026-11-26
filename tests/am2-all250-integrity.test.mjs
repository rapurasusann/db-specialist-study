import {loadArchives} from './helpers/load-am2-archives.mjs';
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

const archives=loadArchives();
function archive(year){return archives[year];}

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
 const q12=data.questions['am2:12'];
 assert.deepEqual(Array.from(q12.figures,f=>f.type),['table','table']);
 const [counts,timeline]=q12.figures;
 assert.deepEqual(Array.from(counts.rows,row=>Array.from(row)),[
  ['T1，T2','10','20'],['T3，T4','100','0'],['T5，T6','20','10']]);
 assert.deepEqual(Array.from(timeline.rows,row=>Array.from(row)),[
  ['T1','チェックポイント前','チェックポイント前にコミット','コミット済み'],
  ['T2','チェックポイント前','チェックポイント後にコミット','コミット済み'],
  ['T3','チェックポイント後','コミット前に障害発生','未コミット'],
  ['T4','チェックポイント前','コミット前に障害発生','未コミット'],
  ['T5','チェックポイント後','障害発生前にコミット','コミット済み'],
  ['T6','チェックポイント後','コミット前に障害発生','未コミット']]);
 const raid=data.questions['am2:23'];
 assert.deepEqual(Array.from(raid.figures,f=>f.type),['table','sql']);
 assert.deepEqual(Array.from(raid.figures[0].headers),['磁気ディスク1','磁気ディスク2','磁気ディスク3','磁気ディスク4']);
 assert.deepEqual(Array.from(raid.figures[0].rows,row=>Array.from(row)),[
  ['Aₚ','A₁','A₂','Aᵥ'],['B₁','Bₚ','B₂','Bᵥ'],['Cₚ','C₁','C₂','Cᵥ'],['D₁','Dₚ','D₂','Dᵥ']]);
 for(const premise of ['Aₚ＝A₁⊕A₂','Aᵥ＝D₁⊕A₂','Bᵥ＝A₁⊕B₂','Dₚ＝D₁⊕D₂']){
  assert.ok(raid.figures[1].text.includes(premise),'2025 Q23 parity premise: '+premise);
 }
});

test('2025 Q6 and Q9 retain complete structured official tables and SQL',()=>{
 const data=year2025();
 const q6=data.questions['am2:6'];
 assert.equal(q6.figures.length,1);
 assert.equal(q6.figures[0].type,'table');
 assert.equal(q6.figures[0].headers.length,9);
 assert.equal(q6.figures[0].rows.length,10);
 assert.ok(q6.figures[0].rows.every(row=>row.length===9));
 assert.deepEqual([...q6.figures[0].rows[0]],[ '1055','A7053','鈴木電気','2025-07-01','T035','テレビA','85000','10','850000']);
 const q9=data.questions['am2:9'];
 assert.deepEqual(Array.from(q9.figures, f=>f.type),['table','table','sql']);
 assert.equal(q9.figures[0].rows.length,3);
 assert.equal(q9.figures[1].rows.length,3);
 assert.ok(q9.figures[0].rows.every(row=>row.length===4));
 assert.ok(q9.figures[1].rows.every(row=>row.length===4));
 assert.ok(q9.figures[2].text.includes('[ a ]') && q9.figures[2].text.includes('[ b ]') && q9.figures[2].text.includes('[ c ]'));
 assert.ok(read('src/am2-archive-2024.js').includes("current?.figures?.length"),'2025 renderer includes structured figures');
});

test('2025 Q8 renders the official deferrable constraint premise as structured data',()=>{
 const q=year2025().questions['am2:8'];
 assert.deepEqual(Array.from(q.figures,f=>f.type),['sql','table','sql']);
 const [ddl,staff,transaction]=q.figures;
 assert.ok(ddl.text.includes('CONSTRAINT PK_システム番号 PRIMARY KEY(システム番号)'));
 assert.ok(ddl.text.includes('CONSTRAINT UK_担当者番号 UNIQUE(担当者番号)'));
 assert.ok(ddl.text.includes('DEFERRABLE INITIALLY IMMEDIATE'));
 assert.deepEqual(Array.from(staff.headers),['システム番号','担当者番号']);
 assert.deepEqual(Array.from(staff.rows,row=>Array.from(row)),[['1234','111'],['6789','222']]);
 assert.ok(transaction.text.includes('SET CONSTRAINTS [ a ];'));
 assert.ok(transaction.text.includes('UPDATE システム担当者 SET 担当者番号 = 222 WHERE システム番号 = 1234;'));
 assert.ok(transaction.text.includes('UPDATE システム担当者 SET 担当者番号 = 111 WHERE システム番号 = 6789;'));
 assert.ok(transaction.text.endsWith('COMMIT;'));
});

test('2025 Q3 UML reproduces nodes, attributes and multiplicities',()=>{
 const q=year2025().questions['am2:3'];
 assert.equal(q.figures?.length,1);
 const f=q.figures[0];
 assert.equal(f.type,'uml');
 assert.deepEqual(Array.from(f.classes,c=>c[0]).sort(),['商品','在庫商品','倉庫','入庫','出庫'].sort());
 assert.deepEqual(Array.from(f.links,l=>l.from+'->'+l.to).sort(),[
  '商品->在庫商品','在庫商品->倉庫','入庫->在庫商品','出庫->在庫商品'].sort());
 for(const [from,to,fromLabel,toLabel] of [
  ['商品','在庫商品','1','1..*'],
  ['在庫商品','倉庫','0..*','1'],
  ['入庫','在庫商品','1..*','1'],
  ['出庫','在庫商品','0..*','1']]){
  const edge=f.links.find(l=>l.from===from&&l.to===to);
  assert.ok(edge);
  assert.equal(edge.fromLabel,fromLabel);
  assert.equal(edge.toLabel,toLabel);
 }
 assert.deepEqual(Array.from(f.attributes['在庫商品']),['/在庫数量']);
});

test('2025 Q4 and Q11 key underlines match the official schema diagrams',()=>{
 const data=year2025();
 const q4=data.questions['am2:4'];
 const employee=q4.figures[0];
 assert.equal(employee.type,'schema');
 assert.deepEqual(Array.from(employee.columns,c=>[c.name,!!c.primary,!!c.foreign]),[
  ['従業員番号',true,false],['氏名',false,false]]);
 for(const [option,keys] of Object.entries({
  'ア':['氏名［主キー］'],'イ':['プログラム言語［主キー］'],
  'ウ':['従業員番号［主キー］'],'エ':['従業員番号［主キーの一部］','プログラム言語［主キーの一部］']})){
  for(const key of keys)assert.ok(q4.options[option].includes(key),'Q4 '+option+' '+key);
 }
 const q11=data.questions['am2:11'];
 assert.deepEqual(Array.from(q11.figures,f=>f.name),['注文','注文明細']);
 assert.deepEqual(Array.from(q11.figures[0].columns,c=>[c.name,!!c.primary,!!c.foreign]),[
  ['注文番号',true,false],['注文日',false,false],['顧客番号',false,true]]);
 assert.deepEqual(Array.from(q11.figures[1].columns,c=>[c.name,!!c.primary,!!c.foreign]),[
  ['注文番号',true,true],['明細番号',true,false],['商品番号',false,true],['数量',false,false]]);
 const renderer=read('src/am2-archive-2024.js');
 assert.ok(renderer.includes("f.type==='schema'"),'schema figure rendering branch present');
 assert.ok(renderer.includes('underline dashed'),'foreign key dashed underline');
 assert.ok(renderer.includes('underline solid'),'primary key solid underline');
});
