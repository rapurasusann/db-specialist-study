'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=fs.readFileSync(path.join(root,'src/am2-q8-q9-text-view.js'),'utf8');
const clipSource=fs.readFileSync(path.join(root,'src/am2-figure-clips.js'),'utf8');

function harness(){
 const inserted=[];
 function el(tag){
  return {tag,children:[],style:{},attributes:{},textContent:'',className:'',
   append(...nodes){this.children.push(...nodes)},
   setAttribute(k,v){this.attributes[k]=v},
   querySelector(selector){if(selector==='h3'&&tag==='section')return {insertAdjacentElement(where,node){assert.equal(where,'afterend');inserted.push(node)}};return null}};
 }
 const question=el('section');
 const document={head:el('head'),createElement:el,getElementById:id=>id==='questionText'?question:null};
 const ctx={document,year:2025,courseId:'am2',number:8,showQuestion(){}};
 vm.createContext(ctx);
 vm.runInContext(source,ctx,{timeout:1000});
 return {ctx,inserted};
}
const children=(root,tag)=>{
 const result=[];
 function walk(node){if(node.tag===tag)result.push(node);for(const child of node.children||[])walk(child)}
 walk(root);return result;
};

test('Q8: SQL source and initial data table are real DOM text with exact two rows',()=>{
 const {ctx,inserted}=harness();
 ctx.showQuestion();
 assert.equal(inserted.length,1);
 const fig=inserted[0];
 assert.equal(fig.attributes['data-study-text'],'am2-q8');
 const tables=children(fig,'table');assert.equal(tables.length,1);
 const rows=children(tables[0],'tr');assert.equal(rows.length,3);
 assert.deepEqual(rows.map(row=>row.children.map(cell=>cell.textContent)),[
  ['システム番号','担当者番号'],['1234','111'],['6789','222']]);
 const codes=children(fig,'pre').map(n=>n.textContent);
 assert.equal(codes.length,2);
 assert.match(codes[0],/DEFERRABLE INITIALLY IMMEDIATE/);
 assert.match(codes[0],/PRIMARY KEY\(システム番号\)/);
 assert.match(codes[1],/SET CONSTRAINTS \[ a \]/);
 assert.match(codes[1],/担当者番号 = 222/);
 assert.match(codes[1],/担当者番号 = 111/);
 assert.equal(children(fig,'img').length,0);
});

test('Q9: two native register tables, three original rows each and SQL placeholder text',()=>{
 const {ctx,inserted}=harness();ctx.number=9;ctx.showQuestion();
 const fig=inserted[0];assert.equal(fig.attributes['data-study-text'],'am2-q9');
 const tables=children(fig,'table');assert.equal(tables.length,2);
 for(const t of tables){
  const rows=children(t,'tr');
  assert.equal(rows.length,4);
  assert.deepEqual(rows.map(row=>row.children.map(cell=>cell.textContent)),[
   ['名前','住所','性別','年齢'],['試験 太郎','東京','男','22'],
   ['情報 花子','大阪','女','24'],['処理 一郎','京都','男','35']]);
 }
 const sql=children(fig,'pre')[0].textContent;
 assert.match(sql,/SELECT CASE WHEN COUNT\(\*\) = 0/);
 assert.match(sql,/\[ a \]/);assert.match(sql,/\[ b \]/);assert.match(sql,/\[ c \]/);
 assert.equal(children(fig,'img').length,0);
});

test('unrelated questions and non-2025 courses get no supplemental table',()=>{
 const {ctx,inserted}=harness();
 for(const [year,courseId,number] of [[2025,'am2',6],[2025,'am2',10],[2024,'am2',8],[2025,'am1',8]]){
  ctx.year=year;ctx.courseId=courseId;ctx.number=number;ctx.showQuestion();
 }
 assert.equal(inserted.length,0);
});
test('existing lower original viewer, learning storage and navigation remain unchanged',()=>{
 assert.match(html,/id="localViewer"/);
 assert.match(html,/db-study-progress-v1/);
 assert.match(html,/function gradeCurrentAnswer\(/);
 assert.match(html,/function navigate\(delta\)/);
 assert.match(html,/src="src\/am2-figure-clips\.js\?v=20261120q8q9"/);
 assert.match(html,/src="src\/am2-q8-q9-text-view\.js\?v=20261120q8q9"/);
 assert.ok(html.indexOf('src/am2-figure-clips.js')<html.indexOf('src/am2-q8-q9-text-view.js'));
 assert.doesNotMatch(clipSource,/'2025:am2:(8|9)'/);
 assert.match(clipSource,/'2025:am2:12'/);
});
