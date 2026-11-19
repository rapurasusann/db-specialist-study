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
 assert.ok(doc.materials.every(m=>m.verifiedStructure===false));
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
