'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'..');
const dictionary=fs.readFileSync(path.join(dir,'src/glossary-terms.js'),'utf8');
const ctx={window:{}};
vm.runInNewContext(dictionary,ctx,{timeout:1500});
const entries=ctx.window.DBStudyGlossaryTerms;
assert.ok(Array.isArray(entries));
const all=[...entries];
assert.equal(all.length,31,'29 new entries plus 2 existing entries');
assert.equal(new Set(all.map(x=>x.id)).size,all.length,'duplicate term ids');
assert.equal(new Set(all.map(x=>x.term)).size,all.length,'duplicate terms');
for(const t of all){assert.ok(t.term&&t.definition.length>=15,t.id);assert.ok(!/<[^>]*>/.test(t.definition),t.id)}
const expected={
 2:['概念データモデル'],3:['UML'],5:['関数従属','関係の属性'],
 6:['第3正規形','正規化'],7:['3値論理'],
 10:['関係演算','商演算'],11:['参照制約定義','削除規則'],
 13:['クラスタ化インデックス'],14:['べき等'],15:['隔離性水準'],
 16:['トランザクションスケジュール','性質'],
 18:['ブロックチェーン','データ構造'],
 20:['RSA方式','デジタル署名','検証鍵'],21:['秘密鍵'],
 23:['磁気ディスク','ディスクアレイシステム','パリティ'],
 24:['オブジェクト指向','抽象クラス'],
 25:['エクストリームプログラミング','プラクティス']
};
const questionFile=fs.readFileSync(path.join(dir,'src/am2-2025-questions.js'),'utf8');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const transcribed={};
vm.runInNewContext(questionFile,{transcribed},{timeout:1500});
const inline=html.match(/const transcribed = \{([\s\S]*?)\n\};/);
assert.ok(inline);
const source=inline[0].replace('const transcribed =','(').replace(/;$/,'')+')';
const originals=vm.runInNewContext(source,{}, {timeout:1500});
const questions={...originals,...transcribed};
for(const [num,words] of Object.entries(expected)){
 const id='2025:am2:'+num;
 const q=questions[id];assert.ok(q,'missing question '+id);
 for(const word of words){
  const entry=all.find(x=>x.term===word);
  assert.ok(entry,'missing glossary term: '+word);
  assert.ok(q.stem.includes(word),'term not in question stem: '+id+' '+word);
  assert.ok(!entry.questionIds||entry.questionIds.includes(id),'wrong scope for '+word);
 }
}
assert.deepEqual(Array.from(all.find(x=>x.term==='性質').questionIds),['2025:am2:16']);
assert.deepEqual(Array.from(all.find(x=>x.term==='データ構造').questionIds),['2025:am2:18']);
const renderer=fs.readFileSync(path.join(dir,'src/glossary.js'),'utf8');
assert.match(renderer,/const applicable = entries\.filter/);
assert.match(renderer,/if \(ix >= 0 &&/,'no regression to infinite loop');
console.log('glossary 31 terms, requested 29/29, scopes and freeze regression checks PASS');
