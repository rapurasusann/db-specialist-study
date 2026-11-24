'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','src','am2-2025-explanations.js'),'utf8');
function load(){
 const transcribed=Object.fromEntries(Array.from({length:25},(_,i)=>['2025:am2:'+(i+1),{stem:'source question'}]));
 const style={};
 const document={getElementById:id=>id==='answerHint'?{style}:null};
 vm.runInNewContext(source,{transcribed,document},{timeout:1000});
 return {transcribed,style};
}
test('2025 AM2 Q6 explanation uses the original Q6 order and customer examples',()=>{
 const {transcribed}=load(),s=transcribed['2025:am2:6'].explanation;
 assert.match(s,/正解：ウ（4表）/);
 for(const k of ['1055','A7053','鈴木電気','T035','85,000','850,000'])assert.ok(s.includes(k),k);
 assert.match(s,/商品コード/);
 assert.match(s,/受注番号と商品コードの組合せ/);
 assert.match(s,/単価×受注数/);
});
test('Q6 walks through primary keys, second and third normal form, and all four tables',()=>{
 const {transcribed}=load(),s=transcribed['2025:am2:6'].explanation;
 for(const name of ['顧客表','商品表','受注表','受注明細表','第2正規形','第3正規形','関数従属','推移的関数従属'])
  assert.ok(s.includes(name),name);
 assert.match(s,/受注番号＋商品コード（組合せを主キー）/);
 assert.ok(s.split('\n').length>15);
});
test('all 25 explanations still load and multiline explanation appears with retained line breaks',()=>{
 const {transcribed,style}=load();
 assert.equal(Object.values(transcribed).filter(x=>x.explanation).length,25);
 assert.equal(style.whiteSpace,'pre-line');
 assert.equal(style.lineHeight,'1.85');
});
test('explanations script also works without a document (offline unit tests)',()=>{
 const transcribed=Object.fromEntries(Array.from({length:25},(_,i)=>['2025:am2:'+(i+1),{}]));
 assert.doesNotThrow(()=>vm.runInNewContext(source,{transcribed},{timeout:1000}));
});
