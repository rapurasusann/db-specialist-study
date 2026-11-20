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
 assert.equal(doc.materials[2].entries.flatMap(e=>e.keyAudit).filter(v=>v==='UNVERIFIED').length,27);
 assert.deepEqual(doc.materials[2].entries[0].keyAudit,['PK_SOLID','NONE']);
 assert.equal(doc.materials[2].entries.every(e=>!Object.hasOwn(e,'keyColumns')),true);

 assert.equal(schema.kind,'schema');
 assert.equal(schema.keyNotationVerified,false);
 assert.deepEqual(schema.entries.map(e=>e.name),['レポート課題','レポート課題出題','評価結果','テスト結果','レポート評価結果']);
 assert.deepEqual(schema.entries.flatMap(e=>e.attributes).filter(a=>/^\[ [セソタチツ] \]$/.test(a)),['[ セ ]','[ ソ ]','[ タ ]','[ チ ]','[ ツ ]']);
});
test('IPA page 9 note links figure 2 a to the unsolved figure 1 a',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const figure1=doc.materials.find(m=>m.id==='fig1');
 const figure2=doc.materials.find(m=>m.id==='fig2');
 assert.deepEqual(figure2.crossFigureBlankReference,{
  token:'a',sameAsFigureId:'fig1',sourcePage:9,
  description:'図2のaには図1のaと同じ字句が入る。'
 });
 assert.ok(figure1.nodes.some(n=>n.id==='a'&&n.unfinished));
 assert.ok(figure2.entries.some(row=>row.name==='a'));
 assert.equal(figure1.verifiedStructure,false);
 assert.equal(figure2.verifiedStructure,false);
});

test('full-source status cannot override provisional problem pages, questions or diagrams',()=>{
 const original=pmVerifiedStructure['2025:pm1:1'];
 assert.equal(validatePmStructure(original),true);
 const changed=structuredClone(original);
 changed.status='FULL_SOURCE_VERIFICATION';
 assert.equal(validatePmStructure(changed),false,'unverified pages, questions and diagrams reject status upgrade');
 changed.introductionPages.forEach(p=>p.complete=true);
 assert.equal(validatePmStructure(changed),false,'unverified questions and diagrams still block');
 changed.subquestions.forEach(q=>q.textStatus='VERIFIED_TRANSCRIPTION');
 assert.equal(validatePmStructure(changed),false,'unverified figures still block');
 assert.equal(validatePmStructure(original),true,'the real draft stays usable for internal review');
});

test('figure 1 traced positions keep original diagram structure and incomplete exam edges',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const fig=doc.materials.find(x=>x.id==='fig1'),trace=fig.partialSvgSource;
 assert.equal(trace.status,'REVIEW_ONLY');
 assert.equal(trace.sourcePage,8);
 assert.deepEqual(trace.boxes.map(b=>b[0]),fig.nodes.map(n=>n.id));
 const boxes=new Map(trace.boxes.map(b=>[b[0],b]));
 assert.deepEqual(boxes.get('faculty').slice(1),[20,18,106,42]);
 assert.deepEqual(boxes.get('lecture').slice(1),[20,298,106,42]);
 assert.deepEqual(boxes.get('materialUse').slice(1),[581,526,106,42]);
 assert.deepEqual(boxes.get('testResult').slice(1),[729,649,105,42]);
 assert.deepEqual(trace.arrows[0],[[73,60],[73,84]]);
 assert.deepEqual(trace.arrows[2],[[192,60],[192,135],[93,135],[93,171]]);
 assert.deepEqual(trace.arrows[4].at(-1),[225,526]);
 assert.equal(trace.arrows.length,7);
 assert.deepEqual(trace.arrowConnections.map(c=>[c.from,c.to]),[
  ['faculty','department'],['department','offering'],['subject','offering'],
  ['offering','lecture'],['inperson','a'],['material','materialUse'],['test','testUse']
 ]);
 assert.equal(trace.arrowConnections.length,trace.arrows.length);
 assert.ok(trace.arrowConnections.every(c=>c.sourcePage===8&&fig.nodes.some(n=>n.id===c.from)&&fig.nodes.some(n=>n.id===c.to)));
 assert.deepEqual(trace.arrowConnections.map(c=>[c.from,c.to]),
  fig.checkedVisibleConnectors.map(c=>[c.from,c.to]));
 assert.equal(trace.subtypeGroups.length,5);
 assert.deepEqual(trace.subtypeGroups.map(g=>[g.parentId,...g.childIds]),[
  ['content','material','test'],
  ['fixed','inperson','realtime'],
  ['online','realtime','ondemand'],
  ['use','materialUse','testUse'],
  ['attendance','fixedAttendance','ondemandAttendance']
 ]);
 const known=new Set(fig.nodes.map(n=>n.id));
 assert.ok(trace.subtypeGroups.every(g=>g.sourcePage===8&&known.has(g.parentId)&&
  g.childIds.length===2&&g.childIds.every(id=>known.has(id))&&g.children.length===2));
 assert.equal(trace.subtypeGroups.filter(g=>g.childIds.includes('realtime')).length,2);
 assert.deepEqual(trace.subtypeGroups.map(g=>g.bar[0][1]),[62,422,422,460,645]);
 assert.ok(trace.subtypeGroups.every(g=>g.children.every(c=>c[1]>g.bar[0][1])));
 for(const line of trace.arrows){
  assert.ok(line.length>=2);
  assert.ok(line.every(p=>p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=960)));
 }
 assert.equal(fig.verifiedStructure,false);
 assert.deepEqual(fig.edges,[]);
 assert.deepEqual(fig.inheritance,[]);
 assert.ok(fig.nodes.find(n=>n.id==='a').unfinished);
});

test('IPA page 8 section 7 records all five conditions and page 7 continuation without completing the original',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page7=doc.introductionPages[1],page8=doc.introductionPages[2];
 assert.equal(page8.sourcePage,8);
 assert.equal(page8.complete,false);
 assert.equal(page8.sourceAudit,'SECTION_SCOPE_CHECKED');
 assert.deepEqual(page8.sectionNumbers,['6','7']);
 assert.deepEqual(page8.sectionItemCounts,{'6':6,'7':5});
 assert.deepEqual(page8.continuesFromPreviousPage,{section:'6',item:'(6)',sourcePage:7});
 assert.equal(page7.continuesOnNextPage.sourcePage,page8.sourcePage);
 assert.equal(page7.continuesOnNextPage.section,page8.continuesFromPreviousPage.section);
 assert.equal(page7.continuesOnNextPage.item,page8.continuesFromPreviousPage.item);
 assert.deepEqual(page8.figureReferences,[{id:'fig1',sourcePage:8},{id:'fig2',sourcePage:9}]);
 for(const term of ['解答期限日時','解答入力ページ','受講年月日','遅刻の有無','早退の有無',
  '受講完了年月日','得点','評価年月日','通期又は半期','成績','図1','図2']){
  assert.ok(page8.paragraphs.some(p=>p.includes(term)),term);
 }
 assert.ok(page8.paragraphs.some(p=>p.includes('要約・全文転記ではありません')));
 assert.equal(doc.materials[0].verifiedStructure,false);
 assert.deepEqual(doc.materials[0].edges,[]);
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('IPA page 7 lecture and digital-content section counts and boundaries are audited',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page6=doc.introductionPages[0],page7=doc.introductionPages[1];
 assert.equal(page7.sourcePage,7);
 assert.equal(page7.complete,false);
 assert.equal(page7.sourceAudit,'NUMBERED_CONDITION_PARAPHRASE');
 assert.deepEqual(page7.sectionNumbers,['5','6']);
 assert.deepEqual(page7.sectionItemCounts,{'5':9,'6':6});
 assert.deepEqual(page7.continuesFromPreviousPage,{section:'5',item:'(1)',sourcePage:6});
 assert.deepEqual(page7.continuesOnNextPage,{section:'6',item:'(6)',sourcePage:8});
 assert.equal(page6.continuesOnNextPage.sourcePage,page7.sourcePage);
 assert.equal(page7.continuesFromPreviousPage.sourcePage,page6.sourcePage);
 assert.equal(page6.continuesOnNextPage.section,page7.continuesFromPreviousPage.section);
 assert.equal(page6.continuesOnNextPage.item,page7.continuesFromPreviousPage.item);
 for(const fact of ['90分','講義番号','オンデマンド','リアルタイム','オンライン教室ID','補助教員',
  'コンテンツID','文書・画像・動画','公開期間','解答時間','リアルタイム型']){
  assert.ok(page7.paragraphs.some(line=>line.includes(fact)),fact);
 }
 assert.ok(page7.paragraphs.some(line=>line.includes('要約・全文転記ではありません')));
 assert.ok(doc.introductionPages.every(page=>page.complete===false));
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('IPA page 6 section structure, details and page 7 continuation remain identifiable',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page6=doc.introductionPages[0];
 assert.equal(page6.sourcePage,6);
 assert.equal(page6.complete,false);
 assert.equal(page6.sourceAudit,'NUMBERED_CONDITION_PARAPHRASE');
 assert.deepEqual(page6.sectionNumbers,['1','2','3','4','5']);
 assert.deepEqual(page6.sectionItemCounts,{'1':3,'2':2,'3':2,'4':4,'5':1});
 assert.deepEqual(page6.continuesOnNextPage,{section:'5',item:'(1)',sourcePage:7});
 for(const fact of ['4年制','4～9月','10月～翌3月','教員番号','学籍番号',
  '科目ID','単位数','担当教員1名','並行開講','接続先URL','約15回','約30回']){
  assert.ok(page6.paragraphs.some(line=>line.includes(fact)),fact);
 }
 assert.ok(page6.paragraphs.some(line=>line.includes('要約・全文転記ではありません')));
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('page 6 study context and page 7 one-or-more usage constraints are preserved',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page6=doc.introductionPages.find(p=>p.sourcePage===6);
 const page7=doc.introductionPages.find(p=>p.sourcePage===7);
 assert.ok(page6.paragraphs.some(p=>p.includes('オンライン講義の増加')&&p.includes('概念データモデルと関係スキーマ')));
 const material=page7.paragraphs.find(p=>p.startsWith('(4) 教材は'));
 assert.ok(material?.includes('一つ又は複数')&&material.includes('講義ごと・教材ごと'));
 const tests=page7.paragraphs.find(p=>p.startsWith('(6) テスト問題'));
 assert.ok(tests?.includes('リアルタイム型講義だけ')&&tests.includes('一つ又は複数'));
 assert.ok(tests.includes('8ページに続く'));
 assert.ok(page6.complete===false&&page7.complete===false);
});

test('source page 6 and 7 numbered paraphrases cover every stated condition without claiming full transcription',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page6=doc.introductionPages[0],page7=doc.introductionPages[1];
 const groups=[
  [page6,{'1':3,'2':2,'3':2,'4':4,'5':1}],
  [page7,{'5':9,'6':6}]
 ];
 for(const [page,counts] of groups){
  for(const [group,count] of Object.entries(counts)){
   const headers=page.paragraphs.filter(line=>line.startsWith('【'+group+'. '));
   assert.equal(headers.length,1,'missing group '+group+' on page '+page.sourcePage);
   const at=page.paragraphs.indexOf(headers[0]);
   const next=page.paragraphs.findIndex((line,i)=>i>at&&/^【[0-9]+\. /.test(line));
   const body=page.paragraphs.slice(at,next<0?undefined:next);
   const numbered=body.filter(line=>/^\([1-9]\) /.test(line));
   assert.equal(numbered.length,count,'condition count '+group+' on page '+page.sourcePage);
  }
  assert.equal(page.complete,false);
  assert.ok(page.paragraphs.some(p=>p.includes('全文転記ではありません')));
 }
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('IPA pages 9 and 10 have separate expansion and answer-rule summaries while remaining incomplete',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 assert.deepEqual(doc.introductionPages.map(x=>x.sourcePage),[6,7,8,9,10]);
 const page9=doc.introductionPages[3],page10=doc.introductionPages[4];
 assert.equal(page9.sourceAudit,'SECTION_SCOPE_CHECKED');
 assert.equal(page10.sourceAudit,'SECTION_SCOPE_CHECKED');
 assert.equal(page9.complete,false);
 assert.equal(page10.complete,false);
 assert.ok(page9.paragraphs.some(x=>x.includes('学習管理システムの拡充')));
 assert.ok(page9.paragraphs.some(x=>x.includes('レポート課題')));
 assert.ok(page9.paragraphs.some(x=>x.includes('レポート課題')));
 assert.deepEqual(page9.sourceSections[1].itemNumbers,['(1)','(2)','(3)']);
 assert.ok(page10.paragraphs.some(x=>x.includes('提出期間の開始・終了の年月日')));
 assert.ok(page10.paragraphs.some(x=>x.includes('評価結果')));
 assert.ok(page10.paragraphs.some(x=>x.includes('第3正規形')));
 assert.ok(page10.paragraphs.some(x=>x.includes('主キーを実線')));
 assert.deepEqual(page10.sourceSections[1].itemNumbers,['①','②','③','④','⑤','⑥']);
 assert.deepEqual(page10.continuesFromPreviousPage,{section:'学習管理システムの拡充',item:'(3)',sourcePage:9});
 assert.ok(doc.introductionPages.every(x=>x.complete===false));
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('page 9 report assignment is exclusive to on-demand lectures and at most one per lecture',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page9=doc.introductionPages.find(p=>p.sourcePage===9);
 const item=page9.paragraphs.find(p=>p.startsWith('(3)'));
 assert.ok(item.includes('オンデマンド型講義だけ'));
 assert.ok(item.includes('教員が必要と判断'));
 assert.ok(item.includes('1回のオンデマンド型講義'));
 assert.ok(item.includes('一つだけ'));
 assert.equal(page9.complete,false);
});

test('official report-assignment and evaluation terminology appears without inventing blank answers',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page9=doc.introductionPages.find(p=>p.sourcePage===9);
 const page10=doc.introductionPages.find(p=>p.sourcePage===10);
 assert.ok(page9.paragraphs.some(p=>p.includes('課題観点記述')));
 assert.ok(page10.paragraphs.some(p=>p.includes('レポート提出先URL')&&p.includes('提出期間の開始・終了の年月日')));
 assert.ok(page10.paragraphs.some(p=>p.includes('レポート評価')&&p.includes('評価年月日')&&p.includes('汎化')));
 assert.equal(page9.complete,false);
 assert.equal(page10.complete,false);
 assert.equal(doc.materials[2].verifiedStructure,false);
 assert.deepEqual(doc.materials[2].entries[0].attributes,['コンテンツID','[ セ ]']);
});

test('page 9 and 10 show ordered extension requirements and six numbered answer rules',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page9=doc.introductionPages[3],page10=doc.introductionPages[4];
 for(const number of ['(1)','(2)','(3)'])assert.ok(page9.paragraphs.some(x=>x.startsWith(number)),number);
 for(const number of ['(4)','(5)','①','②','③','④','⑤','⑥'])assert.ok(page10.paragraphs.some(x=>x.startsWith(number)),number);
 assert.equal(page9.complete,false);
 assert.equal(page10.complete,false);
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('official page 10 exception to zero-cardinality notation and page 8 figure locations are explicit',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const page8=doc.introductionPages.find(p=>p.sourcePage===8);
 const page10=doc.introductionPages.find(p=>p.sourcePage===10);
 assert.deepEqual(page8.figureReferences,[{id:'fig1',sourcePage:8},{id:'fig2',sourcePage:9}]);
 assert.ok(page8.paragraphs.some(x=>x.includes('図1（この8ページ）')&&x.includes('図2（次の9ページ）')));
 assert.ok(page10.paragraphs.some(x=>x.includes('対応関係')&&x.includes('0を含むかどうか')&&x.includes('必要はない')));
 assert.ok(page10.paragraphs.some(x=>x.startsWith('⑥ ')&&x.includes('角括弧')));
 assert.equal(page8.complete,false);
 assert.equal(page10.complete,false);
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('both relation-schema questions include page 10 requirements for PK and FK underline notation',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 for(const id of ['s1-3','s2']){
  const q=doc.subquestions.find(x=>x.id===id);
  assert.ok(q.text.includes('主キー')&&q.text.includes('外部キー'));
  assert.ok(q.text.includes('実線')&&q.text.includes('破線'));
  assert.ok(q.text.includes('表記ルール⑤'));
  assert.equal(q.textStatus,'PARAPHRASE');
 }
 assert.equal(doc.subquestions.find(x=>x.id==='s1-2').answerFormat,'DIAGRAM_RELATIONSHIPS');
});

test('IPA page 11 source audit preserves all four question scopes without claiming full transcription',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const qs=doc.subquestions;
 assert.equal(qs.length,4);
 assert.deepEqual(qs.map(q=>q.sourcePage),[11,11,11,11]);
 assert.ok(qs.every(q=>q.sourceQuestionAudit==='QUESTION_SCOPE_CHECKED'));
 assert.ok(qs.every(q=>q.textStatus==='PARAPHRASE'));
 assert.deepEqual(qs.map(q=>q.answerFormat),[
  'ENTITY_NAME','DIAGRAM_RELATIONSHIPS','ATTRIBUTE_NAMES','ATTRIBUTE_NAMES'
 ]);
 assert.deepEqual(qs.map(q=>q.answerBlankTokens),[
  ['a'],[],'アイウエオカキクケコサシス'.split(''),'セソタチツ'.split('')
 ]);
 assert.deepEqual(qs.map(q=>q.materialIds),[['fig1'],['fig1'],['fig2'],['fig3']]);
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('each subquestion has grounded introduction-page links and original-page 11 reference',()=>{
 const doc=pmVerifiedStructure['2025:pm1:1'];
 const pages=new Set(doc.introductionPages.map(p=>p.sourcePage));
 const expected=[[8],[8],[8,9],[9,10]];
 assert.deepEqual(doc.subquestions.map(q=>q.relatedIntroPages),expected);
 for(const q of doc.subquestions){
  assert.equal(q.sourcePage,11);
  assert.ok(q.relatedIntroPages.every(p=>pages.has(p)));
  assert.ok(q.relatedIntroPages.every(p=>p>=6&&p<=10));
 }
 assert.equal(doc.status,'PARTIAL_SOURCE_VERIFICATION');
});

test('source is a staged UI, not wired to public pages or legacy storage',()=>{
 assert.equal(typeof createPmSubquestionView,'function');
 assert.ok(source.includes('前ページ'));
 assert.ok(source.includes('次ページ'));
 assert.ok(source.includes("'auto'"));
 assert.ok(source.includes('selectedMaterial=\'auto\''));
 assert.ok(source.includes("saveAnswer(selected,answers[selected]||'')"),'save latest answer for the currently selected subquestion');
 assert.ok(!source.includes('localStorage.setItem('));
 assert.ok(!source.includes('innerHTML'));
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('src/pm-subquestion-view.mjs'));
});

test('figure 3 original page 10 has no underline on the four answer boxes and evaluation type',()=>{
 const fig=pmVerifiedStructure['2025:pm1:1'].materials.find(m=>m.id==='fig3');
 for(const [relation,attribute] of [
  ['レポート課題出題','[ ソ ]'],['評価結果','評価結果区分'],
  ['評価結果','[ タ ]'],['テスト結果','[ チ ]'],['レポート評価結果','[ ツ ]']]){
  const row=fig.entries.find(e=>e.name===relation),i=row?.attributes.indexOf(attribute);
  assert.ok(i>=0,relation+' / '+attribute);
  assert.equal(row.keyAudit[i],'NONE');
  assert.equal(row.auditSourcePages[i],10);
 }
 assert.equal(fig.entries.flatMap(e=>e.keyAudit).filter(k=>k==='NONE').length,6);
 assert.equal(fig.entries.flatMap(e=>e.keyAudit).filter(k=>k==='UNVERIFIED').length,27);
 assert.equal(fig.verifiedStructure,false);
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
 assert.ok(preview.includes('図1は作業中のSVG再構成図として表示します'));
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
 assert.equal(fig2.transcriptionStage,'TEXT_DRAFT_PARTIAL_KEY_AUDIT');
 assert.equal(fig2.entries.length,24);
 assert.deepEqual(fig2.entries.slice(0,7).map(e=>e.name),['学部','学科','科目','教員','学生','開講科目','講義']);
 assert.deepEqual(fig2.entries.slice(7).map(e=>e.name),[
  '時間固定講義','オンライン講義','対面講義','リアルタイム型講義','オンデマンド型講義',
  'a','デジタルコンテンツ','教材','テスト問題','コンテンツ使用','教材使用',
  'テスト問題使用','科目履修登録','講義受講','時間固定講義受講',
  'オンデマンド型講義受講','テスト結果'
 ]);
 assert.equal(fig2.entries.reduce((sum,row)=>sum+row.attributes.length,0),129);
 const blanks=fig2.entries.flatMap(row=>row.attributes.filter(x=>/^\[ [ア-ス] \]$/.test(x))).map(x=>x.replace(/[^ア-ス]/g,''));
 assert.deepEqual(blanks,'アイウエオカキクケコサシス'.split(''));
 assert.ok(fig2.entries.some(row=>row.name==='コンテンツ使用'&&row.attributes.includes('[コンテンツ区分]')));
 assert.equal(fig2.entries[16].keyAudit[6],'NONE');
 assert.equal(fig2.entries[16].auditSourcePages[6],9);
 assert.deepEqual(fig2.entries[0].attributes,['学部コード','学部名']);
 assert.deepEqual(fig2.entries[5].attributes.slice(-1),['[ ア ]']);
 assert.equal(fig2.entries.flatMap(e=>e.keyAudit).filter(k=>k==='PK_SOLID').length,6);
 assert.equal(fig2.entries.flatMap(e=>e.keyAudit).filter(k=>k==='NONE').length,29);
 assert.equal(fig2.entries.flatMap(e=>e.keyAudit).filter(k=>k==='UNVERIFIED').length,93);
 assert.deepEqual(fig2.entries[0].keyAudit,['PK_SOLID','NONE']);
 assert.deepEqual(fig2.entries[2].keyAudit,['PK_SOLID','NONE','NONE','NONE','NONE','NONE','NONE']);
 assert.deepEqual(fig2.entries[6].keyAudit.slice(5),['NONE','NONE','NONE','NONE','NONE']);
 assert.ok(fig2.entries.every(e=>e.keyAudit.every((status,i)=>
  status==='UNVERIFIED'?e.auditSourcePages[i]===null:e.auditSourcePages[i]===9)));
 for(const e of fig2.entries.slice(0,5)){
  assert.deepEqual(e.primaryKeyColumns,[0]);
  assert.equal(e.keyAudit[0],'PK_SOLID');
  assert.equal(e.auditSourcePages[0],9);
  assert.ok(e.keyAudit.slice(1).every(k=>k==='NONE'||k==='UNVERIFIED'||k==='FK_DASHED'));
 }
 assert.deepEqual(fig2.entries[13].primaryKeyColumns,[0]);
 assert.deepEqual(fig2.entries[13].keyAudit,['PK_SOLID','NONE','NONE','NONE','NONE']);
 assert.equal(fig2.entries[13].auditSourcePages.every(p=>p===9),true);
 assert.ok(fig2.entries.slice(5).every((e,i)=>i===8||e.primaryKeyColumns.length===0));
 assert.deepEqual(fig2.entries[5].primaryKeyCandidates,[0,1,2,3]);
 for(const e of fig2.entries.slice(6,12))assert.deepEqual(e.primaryKeyCandidates,[0,1,2,3,4]);
 assert.deepEqual(fig2.entries[13].primaryKeyCandidates,[]);
 for(const e of fig2.entries.slice(14,16))assert.deepEqual(e.primaryKeyCandidates,[0]);
 for(const e of fig2.entries.slice(16,19))assert.deepEqual(e.primaryKeyCandidates,[0,1,2,3,4,5]);
 for(const e of fig2.entries.slice(20,23))assert.deepEqual(e.primaryKeyCandidates,[0,1,2,3,4,5]);
 assert.deepEqual(fig2.entries[23].primaryKeyCandidates,[0,1,2,3,4,5,6]);
 assert.equal(fig2.entries.flatMap(e=>e.primaryKeyCandidates).length,79);
 assert.deepEqual(fig2.entries[1].foreignKeyColumns,[2]);
 assert.equal(fig2.entries[1].attributes[2],'学部コード');
 assert.equal(fig2.entries[1].keyAudit[2],'FK_DASHED');
 assert.equal(fig2.entries[1].auditSourcePages[2],9);
 assert.ok(fig2.entries.every((e,i)=>i===1||e.foreignKeyColumns.length===0));
 assert.ok(fig2.entries.flatMap(e=>e.keyAudit).includes('UNVERIFIED'));
 assert.ok(fig2.entries.every(e=>e.keyAudit.every((status,i)=>
   status!=='PK_SOLID'||e.auditSourcePages[i]===9)));
 assert.equal(fig2.verifiedStructure,false);
 assert.equal(fig2.sourceTranscriptionVerified,false);
 fig2.verifiedStructure=true;
 fig2.keyNotationVerified=true;
 assert.equal(validatePmStructure(doc),false,'unverified figure 2 may never be marked complete');
 assert.equal(validatePmStructure(doc),false,'incomplete key evidence must fail closed');
 fig2.entries=[{name:'検証専用',attributes:['属性'],
  primaryKeyColumns:[0],foreignKeyColumns:[],keyAudit:['PK_SOLID'],auditSourcePages:[10]}];
 assert.equal(validatePmStructure(doc),false,'source page 10 must not certify a page 9 diagram');
 fig2.entries[0].auditSourcePages=[9];
 assert.equal(validatePmStructure(doc),false,'one fabricated row must not pass the full figure 2 completeness gate');
});

test('figure 2 cannot be verified when composite key candidates remain unresolved',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const fig=doc.materials.find(m=>m.id==='fig2');
 fig.verifiedStructure=true;
 fig.keyNotationVerified=true;
 fig.sourceTranscriptionVerified=true;
 for(const e of fig.entries){
  e.primaryKeyColumns=[0];
  e.foreignKeyColumns=[];
  e.keyAudit=e.attributes.map((_,i)=>i===0?'PK_SOLID':'NONE');
  e.auditSourcePages=e.attributes.map(()=>9);
 }
 assert.equal(validatePmStructure(doc),false,'candidate marks are not verified marks');
 for(const e of fig.entries)e.primaryKeyCandidates=[];
 assert.equal(validatePmStructure(doc),true,'gate permits complete structurally consistent audit data');
});

test('figure 2 rejects incomplete source data even if key metadata is fabricated as valid',()=>{
 const doc=structuredClone(pmVerifiedStructure['2025:pm1:1']);
 const fig=doc.materials.find(m=>m.id==='fig2');
 fig.verifiedStructure=true;
 fig.keyNotationVerified=true;
 for(const e of fig.entries){
  e.primaryKeyColumns=[0]; e.foreignKeyColumns=[];
  e.keyAudit=e.attributes.map((_,i)=>i===0?'PK_SOLID':'NONE');
  e.auditSourcePages=e.attributes.map(()=>9);
 }
 assert.equal(validatePmStructure(doc),false,'mocked key audits cannot substitute for a verified full transcription');
 fig.sourceTranscriptionVerified=true;
 assert.equal(validatePmStructure(doc),false,'candidate key marks are still unresolved');
 for(const e of fig.entries)e.primaryKeyCandidates=[];
 assert.equal(validatePmStructure(doc),true,'only fully resolved metadata and source approval can pass the structural gate');
 fig.entries.pop();
 assert.equal(validatePmStructure(doc),false,'missing relation is blocked');
});
test('preview warning never advertises incomplete figures as usable materials',()=>{
 const html=readFileSync(new URL('../pm-preview.html',import.meta.url),'utf8');
 const doc=pmVerifiedStructure['2025:pm1:1'];
 assert.ok(doc.materials.every(mat=>mat.verifiedStructure===false));
 assert.ok(html.includes('図1は作業中のSVG再構成図として表示します'));
 assert.ok(html.includes('図2は確認用の表として表示し、原本で確認済みの主キー6属性を実線、外部キー1属性を破線で表示します'));
 assert.ok(html.includes('図3は5関係の属性を確認用の表として表示しますが、未確認の主キー・外部キー下線は表示しません'));
 assert.ok(!html.includes('原本に照合できた図3のみテキストで表示します'));
});
