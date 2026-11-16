'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/pm-2025-introductions.js'),'utf8');
const transcribed={};
vm.runInNewContext(source,{transcribed},{timeout:2000});
assert.deepEqual(Object.keys(transcribed).sort(),['2025:pm1:1','2025:pm1:2','2025:pm1:3','2025:pm2:1','2025:pm2:2']);
const q=transcribed['2025:pm1:1'];
assert.equal(q.sourcePage,6);
assert.equal(q.sourceEndPage,11);
assert.equal(q.partial,true);
assert.equal(q.sections.length,13);
assert.ok(q.stem.length>2000);
for(const term of ['学部','学期','教員','学生','科目','デジタルコンテンツ','講義受講','図1','図2','図3','設問1','設問2','ア〜ス','セ〜ツ']){
 assert.ok(q.stem.includes(term),'missing '+term);
}
assert.ok(q.stem.includes('原本画像'));
for(const [id,row] of Object.entries(transcribed)){
 assert.equal(row.partial,true,id);
 assert.ok(row.stem&&row.sourcePage>=1,id);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('<script src="src/pm-2025-introductions.js"></script>'));
assert.ok(html.includes('id="backup"'));
assert.ok(html.includes('id="importYear"'));
console.log('afternoon PM1 Q1 structure: PASS (5 questions, 13 sections, source navigation retained)');
