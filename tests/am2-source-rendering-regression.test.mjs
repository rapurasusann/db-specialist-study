import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadArchives} from './helpers/load-am2-archives.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
class Node {
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.textContent='';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 append(...nodes){this.children.push(...nodes);}
}
const document={createElement:t=>new Node(t),createElementNS:(_,t)=>new Node(t)};
const window={};
new Function('window','document',read('src/am2-shared-vector-figures.js'))(window,document);
const shared=window.am2SharedVectorFigures;
const archives=loadArchives();
const q=(y,n)=>archives[y].questions['am2:'+n];
const walk=n=>[n,...n.children.flatMap(walk)];
function inspect(f){
 assert.ok(shared.supports(f),f.type);
 const nodes=walk(shared.render(f)),svg=nodes.find(n=>n.tag==='svg');
 assert.ok(svg);const b=svg.attrs.viewBox.split(' ').map(Number);
 assert.ok(b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0);
 for(const n of nodes)for(const value of Object.values(n.attrs))assert.doesNotMatch(value,/NaN|Infinity|undefined/);
 return nodes;
}
test('source diagram dispatch preserves property graph and server topology',()=>{
 const p=q(2019,4).figures[0],s=q(2020,1).figures[0];
 assert.equal(p.type,'property-graph');assert.equal(s.type,'server-topology');
 const pn=inspect(p),sn=inspect(s);
 assert.equal(pn.filter(n=>n.tag==='polygon').length,2);
 for(const t of ['ノード','エッジ','プロパティ','制約：同時には成立しない'])assert.ok(pn.some(n=>n.textContent===t),t);
 assert.equal(sn.filter(n=>n.tag==='ellipse').length,2);
 assert.equal(sn.filter(n=>n.textContent==='更新・参照要求').length,2);
 assert.equal(sn.filter(n=>n.textContent==='更新・参照').length,2);
 assert.equal(sn.filter(n=>n.textContent==='更新を通知').length,1);
});
test('accounting note retains full condition and a dashed connector',()=>{
 const f=q(2017,2).figures.find(f=>f.type==='uml');
 assert.equal(f.accountingConstraint.lines.join(''),'制約：一つの会計取引につながる移動の金額の和はゼロであること。');
 const svg=new Node('svg'),bounds=shared.accountingConstraint(svg,[{id:'会計取引',x:280,y:70,height:29}],f);
 assert.equal(bounds.length,1);
 assert.ok(svg.children.some(n=>n.attrs['stroke-dasharray']==='4 3'));
 assert.equal(svg.children.filter(n=>n.tag==='text').map(n=>n.textContent).join(''),f.accountingConstraint.lines.join(''));
});
test('restored data does not silently drop choices, conditions, or column labels',()=>{
 for(const l of ['ア','イ','ウ','エ'])assert.ok(q(2017,7).options[l].trim());
 const seq=q(2017,17).figures[0];assert.ok(seq.rows.flat().some(t=>String(t).includes('条件に合う')));
 for(const s of q(2018,2).figures[0].schemas)assert.ok(s.columns.every(c=>c.name.trim()));
 for(const f of q(2020,6).figures)assert.ok(f.headers.every(h=>h.trim()));
 assert.equal(q(2021,6).figures.find(f=>f.type==='sql').text,'SELECT 仕入先コード FROM 商品\nEXCEPT\nSELECT 仕入先コード FROM 当月商品仕入合計');
});
test('boxed multiplicity retains both placeholders and role',()=>{
 const f=q(2022,2).figures[0],nodes=inspect(f);
 for(const t of ['社員','年','a','b','入社年'])assert.ok(nodes.some(n=>n.textContent===t),t);
});
