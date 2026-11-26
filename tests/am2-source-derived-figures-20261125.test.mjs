import {loadArchives} from './helpers/load-am2-archives.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const archives=loadArchives();
function load(year){return archives[year];}

test('2022 Q7 AVG ignores NULL for rank-A products',()=>{
 const q=load(2022).questions['am2:7'],[products,sales]=q.figures;
 const amounts=new Map(sales.rows.map(([id,n])=>[id,n]));
 const a=products.rows.filter(row=>row[2]==='A').map(row=>amounts.get(row[0])).filter(n=>n!=null);
 assert.equal(a.reduce((sum,n)=>sum+n,0)/a.length,150);
 assert.match(q.explanation,/商品ランクA/);
 assert.equal(q.answer,'イ');
});
test('2024 Q8 leaf extraction is child set minus parent set',()=>{
 const q=load(2024).questions['am2:8'],[,list]=q.figures;
 const parents=new Set(list.rows.map(([parent])=>parent));
 const leaf=[...new Set(list.rows.map(([,child])=>child))].filter(node=>!parents.has(node));
 assert.deepEqual(leaf,['D','E','G']);
 assert.equal(q.answer,'ア');
});
test('2024 Q9 equijoin yields five rows with six columns',()=>{
 const q=load(2024).questions['am2:9'],[products,deliveries]=q.figures;
 const joined=deliveries.rows.flatMap(d=>products.rows.filter(p=>p[0]===d[0]).map(p=>[...p,...d]));
 assert.equal(joined.length,5);
 assert.ok(joined.every(row=>row.length===6));
 assert.equal(q.optionFigures['エ'][0].rows.length,5);
 assert.equal(q.optionFigures['エ'][0].headers.length,6);
 assert.equal(q.answer,'エ');
});
test('2017 Q11 requires composite slot key and unique card identifier',()=>{
 const q=load(2017).questions['am2:11'];
 assert.match(q.options[q.answer],/PRIMARY KEY\(PCID, スロット番号\)/);
 assert.match(q.options[q.answer],/UNIQUE\(メモリカードID\)/);
});
