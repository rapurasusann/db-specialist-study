'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const shuffle=fs.readFileSync(path.join(root,'src/am2-option-shuffle.js'),'utf8');
const figures=fs.readFileSync(path.join(root,'src/am2-figure-clips.js'),'utf8');
const eliminated=fs.readFileSync(path.join(root,'src/choice-elimination.js'),'utf8');
new vm.Script(shuffle);
new vm.Script(figures);
new vm.Script(eliminated);
const scripts=['src/choice-elimination.js','src/am2-figure-clips.js','src/am2-option-shuffle.js'];
const order=scripts.map(s=>html.indexOf('src="'+s));
assert.ok(order.every(x=>x>0) && order.every((x,i)=>i===0||x>order[i-1]),'script load order');
assert.doesNotMatch(figures,/pages\/am2_qs_/);
for(const n of [3,6])assert.ok(figures.includes("'2025:am2:"+n+"'"),'missing dedicated figure '+n);
const data=fs.readFileSync(path.join(root,'src/am2-2025-original-completion.js'),'utf8');
const transcribed=Object.fromEntries(Array.from({length:25},(_,i)=>['2025:am2:'+(i+1),{}]));
vm.runInNewContext(data,{transcribed},{timeout:1500});
for(const n of [3,6,8,9,11,12,23])assert.ok(transcribed['2025:am2:'+n].figures?.length,'missing structured figure '+n);
assert.match(shuffle,/Math\.random\(\)/);
assert.match(shuffle,/const j = Math\.floor\(Math\.random\(\) \* \(i \+ 1\)\)/);
assert.match(shuffle,/row\.dataset\.originalChoice = answerLetters\[index\]/);
assert.match(eliminated,/row\.dataset\.originalChoice \|\| choices\[index\]/);
assert.doesNotMatch(shuffle,/\b(?:put|save|localStorage)\s*\(/);
assert.match(shuffle,/courseId === 'am2'/);

// Minimal DOM simulation: verify question choices and answer radios stay aligned,
// keep their original letters and are renewed when the question is displayed again.
let n=0,seed=[0,0,0,.9,.9,.9];
const rows=()=>['ア','イ','ウ','エ'].map(letter=>({letter,dataset:{}}));
const panel={items:[],source:{tag:'source'},querySelectorAll(sel){return sel==='.optionText'?this.items.filter(x=>x.tag!=='source'):[]},querySelector(sel){return sel==='.source'?this.source:null},appendChild(node){this.items=this.items.filter(x=>x!==node);this.items.push(node)}};
const answers={items:[],querySelectorAll(sel){return sel==='label'?this.items:[]},appendChild(node){this.items=this.items.filter(x=>x!==node);this.items.push(node)}};
let views=0;
const sandbox={
 year:2025,courseId:'am2',number:1,
 course:()=>({type:'choice'}),
 questionData:()=>({options:{'ア':'a','イ':'b','ウ':'c','エ':'d'}}),
 document:{getElementById(id){return id==='questionText'?panel:answers}},
 Math:Object.assign(Object.create(Math),{random:()=>seed[n++%seed.length]}),
 showQuestion:()=>{views++;panel.items=rows();panel.items.forEach(x=>x.tag='choice');panel.items.push(panel.source)},
 renderAnswer:()=>{answers.items=['ア','イ','ウ','エ'].map(letter=>({querySelector:()=>({value:letter})}))},
};
vm.runInNewContext(shuffle,sandbox,{timeout:2000});
sandbox.showQuestion();sandbox.renderAnswer();
const rowValues=()=>panel.querySelectorAll('.optionText').map(x=>x.dataset.originalChoice);
const radioValues=()=>answers.items.map(x=>x.querySelector('input').value);
assert.deepEqual(rowValues(),radioValues());
assert.deepEqual(rowValues().slice().sort(),['ア','イ','ウ','エ']);
const first=rowValues().join('');
sandbox.showQuestion();sandbox.renderAnswer();
assert.deepEqual(rowValues(),radioValues());
assert.notEqual(rowValues().join(''),first);
assert.equal(views,2);
console.log('AM2 shuffle + 7 structured figure registrations: PASS');
