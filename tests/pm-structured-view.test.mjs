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
 assert.deepEqual(doc.materials.map(m=>m.verifiedStructure),[false,false,false]);
 const fig1=doc.materials.find(m=>m.id==='fig1');
 assert.equal(fig1.verifiedStructure,false);
 assert.deepEqual(fig1.edges,[]);
 assert.deepEqual(fig1.inheritance,[]);
 assert.equal(fig1.checkedVisibleConnectors.length,7);
 assert.ok(fig1.checkedVisibleConnectors.every(c=>c.sourcePage===8&&c.type==='arrow'));
 assert.ok(fig1.checkedVisibleConnectors.every(c=>fig1.nodes.some(n=>n.id===c.from)&&fig1.nodes.some(n=>n.id===c.to)));
 assert.deepEqual(fig1.checkedVisibleConnectors.slice(0,4).map(c=>[c.from,c.to]),[
  ['faculty','department'],['department','offering'],['subject','offering'],['offering','lecture']
 ]);
 assert.equal(doc.introductionPages.slice(0,3).every(p=>p.complete===false),true);
 assert.ok(doc.introductionPages[0].paragraphs.some(t=>t.includes('約15回')));
 assert.ok(doc.introductionPages[1].paragraphs.some(t=>t.includes('オンデマンド')));

 assert.equal(fig1.nodes.length,24);
 assert.equal(doc.introductionPages.length,5);
 assert.deepEqual(doc.introductionPages.map(p=>p.sourcePage),[6,7,8,9,10]);
 const schema=doc.materials.find(m=>m.id==='fig3');
 assert.equal(doc.materials[2].entries.flatMap(e=>e.keyAudit).filter(v=>v==='UNVERIFIED').length,32);
 assert.deepEqual(doc.materials[2].entries[0].keyAudit,['PK_SOLID','NONE']);
 assert.equal(doc.materials[2].entries.every(e=>!Object.hasOwn(e,'keyColumns')),true);

 assert.equal(schema.kind,'schema');
 assert.equal(schema.keyNotationVerified,false);
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

test('figure 3 text renderer is prepared but source fidelity remains gated',()=>{
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

test('preview is opt-in, not mounted in production index, and preserves the old progress key',()=>{
 const preview=readFileSync(new URL('../pm-preview.html',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../src/pm-preview-entry.mjs',import.meta.url),'utf8');
 const style=readFileSync(new URL('../src/pm-preview.css',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(preview.includes('src/pm-preview-entry.mjs'));
 assert.ok(preview.includes('src/pm-preview.css'));
 assert.ok(preview.includes('Content-Security-Policy'));
 assert.ok(entry.includes("const KEY='db-study-progress-v1'"));
 assert.ok(entry.includes('currentProgress()'));
 assert.ok(entry.includes('updateSubquestionAnswer('));
 assert.ok(entry.includes('getSubquestionAnswers('));
 assert.ok(!index.includes('pm-preview-entry.mjs'));
 assert.ok(style.includes('focus-visible'));
});

test('figure 3 cannot be marked verified until original PK/FK underlines are audited',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 doc.materials[2].verifiedStructure=true;
 assert.equal(validatePmStructure(doc),false);
 doc.materials[2].verifiedStructure=false;
 assert.equal(validatePmStructure(doc),true);
});

test('PK and FK have distinct underline styles and schema requires audited keys',()=>{
 const css=readFileSync(new URL('../src/pm-preview.css',import.meta.url),'utf8');
 assert.ok(source.includes("name.classList.add('pmPrimaryKey')"));
 assert.ok(source.includes("name.classList.add('pmForeignKey')"));
 assert.ok(source.includes("name.classList.add('pmBothKeys')"));
 assert.ok(css.includes('.pmPrimaryKey'));
 assert.ok(css.includes('text-decoration-style:solid'));
 assert.ok(css.includes('.pmForeignKey'));
 assert.ok(css.includes('text-decoration-style:dashed'));
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const schema=doc.materials[2];
 schema.verifiedStructure=true;
 schema.keyNotationVerified=true;
 assert.equal(validatePmStructure(doc),false,'cannot publish schema with missing key classifications');
 for(const row of schema.entries){
  row.primaryKeyColumns=[0];
  row.foreignKeyColumns=[];
  row.auditSourcePages=row.attributes.map(()=>10);
 }
 assert.equal(validatePmStructure(doc),false,'unreviewed attributes cannot be accepted even with key column arrays');
 for(const row of schema.entries)row.keyAudit=row.attributes.map((_,i)=>i===0?'PK_SOLID':'NONE');
 assert.equal(validatePmStructure(doc),true,'only complete, internally consistent audited metadata is structurally valid');
 schema.entries[0].foreignKeyColumns=[99];
 assert.equal(validatePmStructure(doc),false,'out-of-range key column rejected');
});

test('figure 3 audit metadata must agree with PK and FK indices',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const schema=doc.materials[2];
 schema.verifiedStructure=true;
 schema.keyNotationVerified=true;
 for(const row of schema.entries){
  row.primaryKeyColumns=[0];row.foreignKeyColumns=[];
  row.auditSourcePages=row.attributes.map(()=>10);
  row.keyAudit=row.attributes.map((_,i)=>i===0?'PK_SOLID':'NONE');
 }
 assert.equal(validatePmStructure(doc),true);
 schema.entries[0].keyAudit[0]='FK_DASHED';
 assert.equal(validatePmStructure(doc),false,'PK/FK mark mismatch must fail closed');
 schema.entries[0].keyAudit[0]='PK_SOLID';
 schema.entries[0].foreignKeyColumns=[0];
 schema.entries[0].keyAudit[0]='BOTH';
 assert.equal(validatePmStructure(doc),true,'both marks are supported');
});

test('figure 3 requires provenance for every individual key mark',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const schema=doc.materials[2];
 schema.verifiedStructure=true;
 schema.keyNotationVerified=true;
 for(const row of schema.entries){
  row.primaryKeyColumns=[0];
  row.foreignKeyColumns=[];
  row.keyAudit=row.attributes.map((_,i)=>i===0?'PK_SOLID':'NONE');
  row.auditSourcePages=row.attributes.map(()=>10);
 }
 assert.equal(validatePmStructure(doc),true);
 schema.entries[1].auditSourcePages[3]=null;
 assert.equal(validatePmStructure(doc),false,'unverified provenance must fail closed');
});

test('figure 2 cannot be published before accurate source transcription',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const fig2=doc.materials.find(m=>m.id==='fig2');
 assert.equal(fig2.kind,'schema');
 assert.equal(fig2.sourcePage,9);
 assert.equal(fig2.verifiedStructure,false);
 assert.deepEqual(fig2.entries,[]);
 fig2.verifiedStructure=true;
 fig2.keyNotationVerified=true;
 assert.equal(validatePmStructure(doc),false,'empty figure 2 may never be marked complete');
 fig2.entries=[{name:'検証専用',attributes:['属性'],
  primaryKeyColumns:[0],foreignKeyColumns:[],keyAudit:['PK_SOLID'],auditSourcePages:[10]}];
 assert.equal(validatePmStructure(doc),false,'source page 10 must not certify a page 9 diagram');
 fig2.entries[0].auditSourcePages=[9];
 assert.equal(validatePmStructure(doc),true,'only structurally complete source-backed figure 2 can pass');
});
