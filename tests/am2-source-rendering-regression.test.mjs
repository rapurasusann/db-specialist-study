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
 const seq=q(2017,17).figures[0];assert.equal(seq.type,'transaction-sequence');assert.deepEqual(seq.steps.map(s=>s.lane),[1,2,2,1,1,1]);assert.equal(seq.steps[0].lines.join(''),'“数学模試成績”表の登録済データから，合計点Xを算出');assert.equal(inspect(seq).filter(n=>n.tag==='rect').length,6);
 for(const s of q(2018,2).figures[0].schemas)assert.ok(s.columns.every(c=>c.name.trim()));
 for(const f of q(2020,6).figures)assert.deepEqual(f.headers,[f.title.toLowerCase(),'']);
 assert.equal(q(2021,6).figures.find(f=>f.type==='sql').text,'SELECT 仕入先コード FROM 商品\nEXCEPT\nSELECT 仕入先コード FROM 当月商品仕入合計');
});
test('boxed multiplicity retains both placeholders and role',()=>{
 const f=q(2022,2).figures[0],nodes=inspect(f);
 for(const t of ['社員','年','a','b','入社年'])assert.ok(nodes.some(n=>n.textContent===t),t);
});

test('SQL duplicate suppression preserves all five required missing statements',()=>{
 for(const [y,n] of [[2017,8],[2018,6],[2018,8],[2018,10],[2020,10]]){
  const item=q(y,n),sql=item.figures.find(f=>f.type==='sql');
  assert.ok(sql,y+':'+n);assert.equal(shared.shouldRenderSqlFigure(sql,item.stem),true,y+':'+n);
 }
 for(const [y,n] of [[2016,9],[2016,10],[2017,2],[2018,10],[2019,11],[2020,10]]){
  const item=q(y,n);
  for(const [letter,figures] of Object.entries(item.optionFigures||{}))
   for(const sql of figures.filter(f=>f.type==='sql'))assert.equal(shared.shouldRenderSqlFigure(sql,item.options[letter]),false,y+':'+n+' '+letter);
 }
 const item=q(2016,9);assert.equal(shared.shouldRenderSqlFigure(item.figures.find(f=>f.type==='sql'),item.stem),false);
});
test('SQL duplicate detection is conservative about literal content and absent text',()=>{
 const sql={type:'sql',text:"SELECT 'a  b' FROM T"};
 assert.equal(shared.shouldRenderSqlFigure(sql,"SELECT 'a b' FROM T"),true);
 assert.equal(shared.shouldRenderSqlFigure(sql,"SELECT 'a  b'\nFROM T"),false);
 assert.equal(shared.shouldRenderSqlFigure(sql,undefined),true);
 assert.equal(shared.shouldRenderSqlFigure({type:'table'},'anything'),true);
});
test('both study views use the shared SQL guard rather than question-specific lists',()=>{
 const normal=read('src/am2-archive-2024.js'),challenge=read('src/am2-25-standalone-ui.js');
 assert.match(normal,/shouldRenderSqlFigure\(f,q\.stem\)/);
 assert.match(normal,/shouldRenderSqlFigure\(f,q\.options/);
 assert.match(challenge,/shouldRenderSqlFigure\(figure,stem\)/);
 assert.match(challenge,/shouldRenderSqlFigure\(f,q\?\.options/);
 assert.doesNotMatch(challenge,/inlineSqlStemIds|inlineSqlChoiceIds/);
});

test('diagram-only choice explanations are hidden and explicit orthogonal links retained',()=>{const item=q(2019,4);assert.equal(item.answer,'イ');assert.ok(Object.values(item.options).every(t=>t==='（図を参照）'));assert.equal(item.optionFigures['ウ'][0].links.filter(e=>e.route==='bottom-to-side').length,2);assert.equal(shared.orthogonalAssociationPath({x:85,y:45,half:60,height:25},{x:192,y:250,half:60,height:25}),'M 52 70 V 250 H 132');});
