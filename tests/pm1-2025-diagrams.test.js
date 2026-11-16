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
console.log('PM1 12 + PM2 Q1 14 + PM2 Q2 9 original diagram mappings: PASS');
