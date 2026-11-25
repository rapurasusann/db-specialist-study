/** Guard edited archive explanations against losing answer alignment and rationale.
 * Run: node --test tests/am2-archive-explanations-targeted.test.mjs
 * This checks local consistency, not word-for-word identity with the IPA PDF.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function source(year){
 const p=year===2024?'src/am2-archive-2024.js':`src/am2-archive-${year}-data.js`;
 const js=readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const first=year===2024?js.indexOf('const entry=')+12:js.indexOf('=')+1;
 const last=year===2024?js.indexOf(';\nconst entries=',first):js.lastIndexOf(';');
 return JSON.parse(js.slice(first,last));
}

const target={
 2023:{6:['第3正規形','情報無損失','従属性保存','BCNF'],19:['DRDoS','送信元IPアドレス','反射','DNS']},
 2024:{5:['代理キー','UNIQUE','複合キー'],19:['95ⁿ','10¹⁶','15.84','9桁'],22:['RAID5+0','最低6台','同じグループ'],24:['プラットフォーム','結合テスト','複数機器']}
};
test('edited explanations match official answer keys and distinguish incorrect options',()=>{
 for(const [year,questions] of Object.entries(target)){
  const archive=source(Number(year));
  for(const [n,words] of Object.entries(questions)){
   const q=archive.questions['am2:'+n];
   assert.ok(q?.stem&&q.options&&q.explanation,'question and explanation exist: '+year+' Q'+n);
   assert.equal(q.answer,archive.courses[0].answers[Number(n)-1],'stored answer aligns with year key');
   assert.ok(q.explanation.startsWith('正解は'+q.answer),'explanation answer aligns: '+year+' Q'+n);
   assert.ok(q.explanation.length>=170,'explanation supplies more than a one-sentence summary');
   for(const word of words)assert.ok(q.explanation.includes(word),'missing '+word+' in '+year+' Q'+n);
  }
 }
});
