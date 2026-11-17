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

test('AM2 Q8/9/12: original full-page images, no distorted SVG crop', () => {
  const source = new Map();
  const selections = [];
  const createNode = name => ({
    name, style: {cssText:''}, children: [],
    append(...nodes) {this.children.push(...nodes);},
    setAttribute(){},
    querySelector(selector) {
      return selector==='h3' ? {insertAdjacentElement(where,node){selections.push(node);}} : null;
    }
  });
  const document = {
    createElement: createNode,
    createElementNS: (_ns,name) => createNode(name),
    getElementById: id => id==='questionText'?createNode('section'):{classList:{toggle(){}}}
  };
  const context = {document, showQuestion(){}, year:2025,courseId:'am2',number:6};
  vm.createContext(context);
  vm.runInContext(clips,context,{timeout:1000});
  const expected = new Map([[8,7],[9,8],[12,10]]);
  for(const [number,page] of expected) {
    context.number=number;
    context.showQuestion();
    const fig=selections.pop();
    assert.ok(fig,'figure missing for '+number);
    const img=fig.children[0];
    assert.equal(img.name,'img','not a native image for '+number);
    assert.equal(img.src,'pages/am2_qs_'+String(page).padStart(2,'0')+'.webp');
    assert.match(img.style.cssText,/height:auto/);
    assert.match(img.style.cssText,/object-fit:contain/);
    assert.equal(fig.children.length,2);
  }
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

test('updated content scripts use versioned URLs, preserving other scripts',()=>{
  assert.match(html,/<script src="src\/am2-2025-questions\.js\?v=20261117b"><\/script>/);
  assert.match(html,/<script src="src\/am2-figure-clips\.js\?v=20261117f"><\/script>/);
  assert.match(html,/<script src="src\/am2-2025-explanations\.js"><\/script>/);
});
