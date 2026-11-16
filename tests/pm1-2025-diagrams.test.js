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
assert.equal(matches.length,12,'all 12 diagrams and SQL tables');
assert.deepEqual(matches.map(x=>Number(x[1])),[8,9,10,14,14,15,16,19,20,21,22,23]);
for(const m of matches){
 const box=m[2].split(',').map(Number);
 assert.equal(box.length,4);
 const [x,y,w,h]=box;
 assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1.001&&y+h<=1.001,m[0]);
}
assert.match(source,/pages\/pm1_qs_/);
assert.match(source,/originalShowQuestion\(\)/);
assert.match(source,/source\.before\(createFigure\(item\)\)/);
assert.ok(source.includes("const key=String(year)+':'+courseId+':'+String(number)"));
console.log('PM1 Q1/Q2/Q3 12 original diagram mappings: PASS');
