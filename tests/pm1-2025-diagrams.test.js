'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'src/pm-2025-diagrams.js'),'utf8');
new vm.Script(source);
assert.ok(html.includes('<script src="src/pm-2025-introductions.js"></script><script src="src/pm-2025-diagrams.js"></script>'));
const matches=[...source.matchAll(/\{page:(\d+),\s*box:\[([0-9.,]+)\],\s*title:'([^']+)'\}/g)];
assert.equal(matches.length,35,'all 35 diagrams and SQL tables');
assert.deepEqual(matches.map(x=>Number(x[1])),[8,9,10,14,14,15,16,19,20,21,22,23,8,8,9,9,10,11,12,13,14,15,16,17,18,19,26,26,28,28,29,29,30,30,30]);
for(const m of matches){
 const box=m[2].split(',').map(Number);
 assert.equal(box.length,4);
 const [x,y,w,h]=box;
 assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1.001&&y+h<=1.001,m[0]);
}
assert.match(source,/key.startsWith\('2025:pm2:'\)/);
assert.match(source,/originalShowQuestion\(\)/);
assert.match(source,/source\.before\(createFigure\(item,key\)\)/);
assert.ok(source.includes("const key=String(year)+':'+courseId+':'+String(number)"));
const transcribedSource=fs.readFileSync(path.join(root,'src/pm-2025-introductions.js'),'utf8');
const entries={};
vm.runInNewContext(transcribedSource,{transcribed:entries},{timeout:2000});
assert.deepEqual(Object.keys(entries).sort(),['2025:pm1:1','2025:pm1:2','2025:pm1:3','2025:pm2:1','2025:pm2:2']);
for(const [key,entry] of Object.entries(entries)){
 assert.ok(entry.stem&&entry.stem.length>100,key);
 assert.ok(!/\\bundefined\\b/.test(entry.stem),'undefined text in question: '+key);
 assert.ok(Array.isArray(entry.sections)&&entry.sections.length>0,'missing sections: '+key);
 for(const section of entry.sections){
  assert.ok(typeof section.title==='string'&&section.title.trim(),'invalid heading: '+key);
  assert.ok(typeof section.body==='string'&&section.body.trim(),'invalid text: '+key);
  assert.ok(entry.stem.includes('【'+section.title+'】'),'heading not rendered: '+key);
 }
 assert.equal(entry.partial,true,'summaries must not be presented as complete transcripts: '+key);
}
assert.equal((html.match(/src\/pm-2025-diagrams\.js/g)||[]).length,1,'one PM diagram renderer');
assert.ok(!html.includes('<script src="src/pm-2025-figures.js"></script>'),'legacy renderer disabled');
for(const required of ['src/am2-2025-explanations.js','src/am2-q4-schema-view.js','src/am2-option-shuffle.js','src/choice-elimination.js']){
 assert.ok(html.includes('<script src="'+required+'"></script>'),'morning feature preserved: '+required);
}
const pages={pm1:new Set(),pm2:new Set()};
let current='';
for(const line of source.split('\n')){
 if(line.includes("'2025:pm1:"))current='pm1';
 if(line.includes("'2025:pm2:"))current='pm2';
 const p=line.match(/\{page:(\d+),\s*box:/);
 if(p&&current)pages[current].add(Number(p[1]));
}
for(const [course,set] of Object.entries(pages)){
 for(const page of set){
  const image=path.join(root,'pages',course+'_qs_'+String(page).padStart(2,'0')+'.webp');
  assert.ok(fs.existsSync(image),'missing original figure page: '+image);
 }
}
const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
const chain=['src/pm-2025-introductions.js','src/pm-2025-diagrams.js','src/am2-q4-schema-view.js','src/am2-figure-clips.js','src/am2-option-shuffle.js'];
for(let i=1;i<chain.length;i++){
 assert.ok(scripts.indexOf(chain[i-1])>=0&&scripts.indexOf(chain[i-1])<scripts.indexOf(chain[i]),'question render chain order: '+chain[i]);
}
for(const [file,expected] of [
 ['src/am2-q4-schema-view.js','previousShow();'],
 ['src/am2-figure-clips.js','baseQuestion();'],
 ['src/am2-option-shuffle.js','originalQuestion();']
]){
 const wrapper=fs.readFileSync(path.join(root,file),'utf8');
 new vm.Script(wrapper);
 assert.ok(wrapper.includes(expected),'wrapper must delegate: '+file);
}
console.log('Five afternoon summaries, 35 diagram mappings, original assets, morning render chain: PASS');

