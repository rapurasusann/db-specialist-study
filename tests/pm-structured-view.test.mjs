import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pmVerifiedStructure,validatePmStructure} from '../src/pm-2025-verified-structure.mjs';
import {createPmSubquestionView} from '../src/pm-subquestion-view.mjs';
const source=readFileSync(new URL('../src/pm-subquestion-view.mjs',import.meta.url),'utf8');
test('verified PM I Q1 has four answer units and grounded cross references',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 assert.ok(validatePmStructure(doc));
 assert.deepEqual(doc.subquestions.map(s=>s.id),['s1-1','s1-2','s1-3','s2']);
 assert.deepEqual(doc.subquestions.map(s=>s.materialIds),[['fig1'],['fig1'],['fig2'],['fig3']]);
 assert.deepEqual(doc.materials.map(m=>m.sourcePage),[8,9,10]);
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
 assert.ok(doc.introductionPages.every(p=>!p.complete));
 assert.deepEqual(doc.materials.map(m=>m.verifiedStructure),[false,false,true]);
 const fig1=doc.materials.find(m=>m.id==='fig1');
 assert.equal(fig1.verifiedStructure,false);
 assert.deepEqual(fig1.edges,[]);
 assert.deepEqual(fig1.inheritance,[]);
 assert.equal(fig1.nodes.length,24);
 assert.equal(doc.introductionPages.length,5);
 assert.deepEqual(doc.introductionPages.map(p=>p.sourcePage),[6,7,8,9,10]);
 const schema=doc.materials.find(m=>m.id==='fig3');
 assert.equal(schema.kind,'schema');
 assert.deepEqual(schema.entries.map(e=>e.name),['レポート課題','レポート課題出題','評価結果','テスト結果','レポート評価結果']);
 assert.deepEqual(schema.entries.flatMap(e=>e.attributes).filter(a=>/^\[ [セソタチツ] \]$/.test(a)),['[ セ ]','[ ソ ]','[ タ ]','[ チ ]','[ ツ ]']);
});
test('source is a staged UI, not wired to public pages or legacy storage',()=>{
 assert.equal(typeof createPmSubquestionView,'function');
 assert.ok(source.includes('前ページ'));
 assert.ok(source.includes('次ページ'));
 assert.ok(source.includes("'auto'"));
 assert.ok(source.includes('selectedMaterial=\'auto\''));
 assert.ok(source.includes('saveAnswer(selected,answer.value)'));
 assert.ok(!source.includes('localStorage.setItem('));
 assert.ok(!source.includes('innerHTML'));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('src/pm-subquestion-view.mjs'));
});

test('verified figure 3 is rendered as text, never as a cropped image',()=>{
 assert.ok(source.includes("mat.kind==='schema'"));
 assert.ok(source.includes("make('table')"));
 assert.ok(source.includes("make('span',attribute)"));
 assert.ok(source.includes("'関係名'"));
 assert.ok(!source.includes('drawImage('));
});

test('unverified drawing cannot be made verified by flipping a flag',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 doc.materials[0].verifiedStructure=true;
 assert.equal(validatePmStructure(doc),false);
 doc.materials[0].verifiedStructure=false;
 assert.equal(validatePmStructure(doc),true);
});
test('diagram has only reference nodes and no unverified relationships',()=>{
 const diagram=pmVerifiedStructure['2025:pm1:1'].materials[0];
 const labels=diagram.nodes.map(n=>n.label.replace('\\n',''));
 assert.equal(new Set(diagram.nodes.map(n=>n.id)).size,24);
 assert.ok(labels.includes('科目履修登録'));
 assert.ok(labels.includes('テスト結果'));
 assert.equal(diagram.edges.length,0);
 assert.equal(diagram.verifiedStructure,false);
});
