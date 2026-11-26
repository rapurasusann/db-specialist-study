'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const clips = fs.readFileSync(path.join(root,'src/am2-figure-clips.js'),'utf8');
const questions = fs.readFileSync(path.join(root,'src/am2-2025-questions.js'),'utf8');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');

test('Q8/9/11/12/23 do not insert obsolete full-page or cropped images',()=>{
 const inserted=[];
 const document={getElementById:()=>({querySelector:()=>({insertAdjacentElement:(_,node)=>inserted.push(node)})})};
 const context={document,showQuestion(){},year:2025,courseId:'am2',number:8};
 vm.createContext(context);
 vm.runInContext(clips,context,{timeout:1000});
 for(const number of [8,9,11,12,23]){
  context.number=number;context.showQuestion();
  assert.equal(inserted.length,0,'obsolete figure injection Q'+number);
 }
 assert.match(html,/id="pageImage"/);
 assert.match(html,/id="localViewer"/);
 assert.match(html,/id="openQuestion"/);
});

test('AM2 Q9/11/12/23: obsolete table and SQL transcriptions absent in source', () => {
  const context={transcribed:{}};
  vm.runInNewContext(questions,context,{timeout:1000});
  for(const [n,phrase] of [[9,'【名簿1・名簿2'],[11,'【注文】'],[12,'【処理内容】'],[23,'【ディスク配置']]) {
    const q=context.transcribed['2025:am2:'+n];
    assert.ok(q);
    assert.ok(!q.stem.includes(phrase),'duplicate text remains in Q'+n);
    assert.equal(Object.keys(q.options).length,4);
  }
});

test('content scripts are versioned and preserve registration order',()=>{
 const tags=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m=>m[1]);
 const required=['am2-2025-questions','am2-2025-original-completion','am2-figure-clips','am2-q8-q9-text-view','am2-shared-vector-figures','am2-archive-2024','am2-25-standalone-ui'];
 for(const name of required){
  const urls=tags.filter(url=>url.split('?')[0]==='src/'+name+'.js');
  assert.equal(urls.length,1,name);
  assert.match(urls[0],/\?v=[A-Za-z0-9._-]+$/);
 }
 const index=name=>tags.findIndex(url=>url.split('?')[0]==='src/'+name+'.js');
 assert.ok(index('am2-2025-questions')<index('am2-2025-original-completion'));
 assert.ok(index('am2-2025-original-completion')<index('am2-archive-2024'));
 assert.ok(index('am2-shared-vector-figures')<index('am2-archive-2024'));
 assert.ok(index('am2-shared-vector-figures')<index('am2-25-standalone-ui'));
 assert.ok(index('am2-2025-explanations')>=0);
});
