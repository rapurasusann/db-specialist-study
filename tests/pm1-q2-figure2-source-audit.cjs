'use strict';
// Source: IPA 2025 Autumn DB Specialist PM I Q2, printed page 14, Figure 2.
// Checks printed relation/attribute text and blank structure, NOT correctness of underline types.
const fs=require('node:fs'),path=require('node:path');
const file=path.resolve(process.cwd(),'src/pm1-q2-figure2-review.svg');
if(!fs.existsSync(file))throw Error('SVG_NOT_FOUND:'+file);
const svg=fs.readFileSync(file,'utf8');
const expected=[
 ['得意先','得意先コード','得意先名','所在地情報'],
 ['得意先担当者','得意先コード','担当者コード','担当者氏名','所属先組織名','役職名'],
 ['製品','製品型番','製品名','a'],
 ['案件','案件コード','案件名','年間見込売上金額','受注フラグ','案件開始年月日','案件終了年月日','b'],
 ['商談','商談終了年月日時分','商談場所','議事内容','c'],
 ['商談参加従業員','案件コード','従業員コード','従業員氏名','商談開始年月日時分','案件担当開始年月日','案件担当終了年月日','担当業務内容'],
 ['商談参加得意先担当者'],
 ['見積り','見積番号','納品条件','販売単価','諸経費','見積年月日','見積対象期間','d'],
 ['契約','契約番号','見積番号','納品荷姿','納品先の所在地情報','納品期間','月間納品数量','納品頻度','初回納品年月日時分','初回納品数量','契約年月日'],
 ['得意先納品要求','契約番号','要求番号','要求納期年月日時分','要求数量','納品完了フラグ']
];
const ys=[70,121,172,223,274,325,376,427,478,529];
const errors=[];const rows=[];
for(let i=0;i<expected.length;i++){
 const y=ys[i];
 const rx=new RegExp('<text\\s+x="[^"]+"\\s+y="'+y+'(?:\\.0)?"[^>]*>([^<]*)<\\/text>','g');
 const cells=[...svg.matchAll(rx)].map(x=>x[1]);
 const actual=cells.filter(x=>x!=='（'&&x!=='）'&&x!=='、');
 const want=expected[i];
 if(JSON.stringify(actual)!==JSON.stringify(want))errors.push(`ROW_${i+1}_MISMATCH expected=${JSON.stringify(want)} actual=${JSON.stringify(actual)}`);
 rows.push({row:i+1,relation:want[0],attributes:want.slice(1).length,textMatch:JSON.stringify(actual)===JSON.stringify(want)});
}
const blanks=(svg.match(/class="answer-blank"/g)||[]).length;
if(blanks!==5)errors.push('ANSWER_BLANK_COUNT expected=5 actual='+blanks);
for(const symbol of ['a','b','c','d'])if(!svg.includes('>'+symbol+'</text>'))errors.push('ANSWER_SYMBOL_MISSING:'+symbol);
const keyMarks=(svg.match(/class="key-mark[^\"]*"/g)||[]).length;
const unverified=(svg.match(/class="key-mark[^\"]*unverified[^\"]*"/g)||[]).length;
// Explicitly avoid certifying keys: screenshot-derived underline type has not been audited fully.
const result={source:'IPA 2025 Autumn PM I Q2 printed p14 Figure 2',attributeRowsChecked:rows.length,attributeTextPass:errors.length===0,answerBlankCount:blanks,keyMarkCount:keyMarks,unverifiedKeyMarkCount:unverified,keyLineTypesCertified:false,overallStatus:errors.length?'FAIL':'TEXT_ONLY_PASS_KEY_LINES_PENDING',errors,rows};
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;
