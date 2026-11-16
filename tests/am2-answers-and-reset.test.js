'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'src/am2-2025-questions.js'),'utf8');
const explaining=fs.readFileSync(path.join(root,'src/am2-2025-explanations.js'),'utf8');

const initial=html.match(/const transcribed = \{([\s\S]*?)\n\};/);
assert.ok(initial,'embedded original 5 questions');
const original=vm.runInNewContext('('+initial[0].replace('const transcribed =','').replace(/;$/,'')+')',{},{timeout:1500});
const transcribed={...original};
vm.runInNewContext(source,{transcribed},{timeout:1500});
vm.runInNewContext(explaining,{transcribed},{timeout:1500});
const expected='ア エ ア エ エ ウ ウ ウ エ イ ア ア エ イ ウ エ エ エ イ ウ イ イ ウ ア ウ'.split(' ');
assert.equal(expected.length,25);
for(let num=1;num<=25;num++){
 const q=transcribed['2025:am2:'+num];
 assert.ok(q&&q.stem,'missing question '+num);
 assert.ok(q.explanation&&q.explanation.length>65,'missing explanation '+num);
 assert.ok(q.explanation.startsWith('正解は'+expected[num-1]),'answer differs from official IPA key at '+num);
}
assert.ok(html.includes('<script src="src/am2-2025-explanations.js"></script>'));
assert.ok(html.includes('let sessionSelected=null;'));
assert.ok(html.includes('function renderStudy(){sessionSelected=null;'));
assert.ok(html.includes('input.checked=sessionSelected===l'));
assert.ok(html.includes('const selected=sessionSelected;'));
assert.ok(!html.includes('input.checked=r.selected===l'));
assert.ok(!html.includes('const selected=rec().selected;'));
assert.ok(!html.includes('put({selected:l})'));
assert.ok(html.includes('id="backup"'));
assert.ok(html.includes('id="importYear"'));

// Modifying a classic inline script requires the CSP sha256 hash to be recomputed.
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).filter(text=>text.length>100);
assert.equal(scripts.length,2);
for(const script of scripts){
 new vm.Script(script);
 const hash=crypto.createHash('sha256').update(script,'utf8').digest('base64');
 assert.ok(html.includes("'sha256-"+hash+"'"),'CSP hash mismatch');
}
console.log('AM2 25/25 explanations, answer reset guards, inline CSP hashes: PASS');
