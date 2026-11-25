/** Verify explanations against the data shown in three archive questions.
 * Run: node --test tests/am2-archive-table-calculation.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function question(year,number){
 const file=readFileSync(new URL('../src/am2-archive-'+year+'-data.js',import.meta.url),'utf8');
 const archive=JSON.parse(file.slice(file.indexOf('=')+1,file.lastIndexOf(';')));
 return {q:archive.questions['am2:'+number],answer:archive.courses[0].answers[number-1]};
}

test('2017 Q10: filtered SUM is month-end stock, not shipped quantity or amount',()=>{
 const {q,answer}=question(2017,10);
 const [stock,shipped]=q.figures;
 assert.equal(answer,'ア');
 const totals=new Map();
 for(const [code,,quantity] of shipped.rows)totals.set(code,(totals.get(code)||0)+quantity);
 const selected=stock.rows.filter(([code])=>totals.has(code)&&totals.get(code)<=300);
 assert.deepEqual(selected.map(([code])=>code),['S001','S003']);
 assert.equal(selected.reduce((sum,[,,n])=>sum+n,0),400);
 assert.match(q.explanation,/月末在庫数/);
 assert.match(q.explanation,/NULL/);
 assert.doesNotMatch(q.explanation,/金額を足す/);
});

test('2021 Q6: EXCEPT removes both duplicate suppliers and right-hand supplier codes',()=>{
 const {q,answer}=question(2021,6);
 const [products,purchases]=q.figures;
 assert.equal(answer,'エ');
 const right=new Set(purchases.rows.map(([code])=>code));
 const actual=[...new Set(products.rows.map(([,code])=>code))].filter(code=>!right.has(code)).sort();
 assert.deepEqual(actual,['K02','K04']);
 assert.match(q.explanation,/EXCEPT/);
});

test('2023 Q11: relational division includes only stores with every required item',()=>{
 const {q,answer}=question(2023,11);
 const [offers,required]=q.figures;
 assert.equal(answer,'ウ');
 const allItems=new Set(required.rows.map(([item])=>item));
 const shops=new Map();
 for(const [shop,item] of offers.rows){if(!shops.has(shop))shops.set(shop,new Set());shops.get(shop).add(item)}
 const actual=[...shops].filter(([,items])=>[...allItems].every(item=>items.has(item))).map(([shop])=>shop);
 assert.deepEqual(actual,['B']);
 assert.match(q.explanation,/全ての商品/);
});
