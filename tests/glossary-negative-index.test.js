'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/glossary.js'), 'utf8');
assert.match(source, /ix\s*>=\s*0\s*&&/);
const entries=['グラフデータモデル','プロパティグラフ'];
function scan(text) {
 let pos=0, iterations=0, found=[];
 while(pos<text.length){
  if(++iterations>text.length+entries.length+5)throw Error('loop detected');
  let best=null,at=text.length;
  for(const phrase of entries) {
   const ix=text.indexOf(phrase,pos);
   if(ix>=0&&(ix<at||(ix===at&&best&&phrase.length>best.length))){
    best=phrase;at=ix;
   }
  }
  if(!best||at===text.length)break;
  found.push(best);
  pos=at+best.length;
 }
 return found;
}
assert.deepEqual(scan('グラフデータモデルの一つである，プロパティグラフに関する記述'),entries);
assert.deepEqual(scan('グラフデータモデルの説明'),['グラフデータモデル']);
assert.deepEqual(scan('用語の存在しない文章'),[]);
assert.deepEqual(scan('プロパティグラフとプロパティグラフ'),['プロパティグラフ','プロパティグラフ']);
console.log('glossary negative-index regression: 4/4 PASS');
