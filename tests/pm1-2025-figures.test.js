'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=fs.readFileSync(path.join(root,'src/pm-2025-figures.js'),'utf8');
new vm.Script(code);
assert.ok(html.includes('<script src="src/pm-2025-figures.js"></script>'));
assert.ok(html.indexOf('src/pm-2025-introductions.js')<html.indexOf('src/pm-2025-figures.js'));
const matches=[...code.matchAll(/\{page:(\d+),rect:\[([^\]]+)\],title:'([^']+)'\}/g)];
assert.equal(matches.length,7,'3 Q1 diagrams + 4 Q2 diagrams');
const pages=matches.map(m=>Number(m[1]));
assert.deepEqual(pages,[8,9,10,14,14,15,16]);
for(const m of matches){
 const coords=m[2].split(',').map(Number);
 assert.equal(coords.length,4);
 const [x,y,w,h]=coords;
 assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1.001&&y+h<=1.001);
}
assert.match(code,/pages\/pm1_qs_/);
assert.match(code,/document\.createElementNS/);
assert.match(code,/const original = showQuestion/);
assert.match(code,/if\(!list\)return/);
assert.ok(html.includes('id="backup"'));
console.log('PM1 Q1+Q2 7 source-image figures: structural PASS');
