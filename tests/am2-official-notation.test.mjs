import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {loadArchives} from './helpers/load-am2-archives.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function element(tag){return {tag,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=String(v)},append(e){this.children.push(e)}}}
const context={window:{},document:{createElementNS(ns,tag){return element(tag)},createElement:element}};
runInNewContext(read('src/am2-shared-vector-figures.js'),context);
const api=context.window.am2SharedVectorFigures;
const data=loadArchives();
const q=(y,n)=>data[y].questions['am2:'+n];
test('2017 Q2 uses original SQL options and marked schemas',()=>{
 const item=q(2017,2);
 for(const [key,figs] of Object.entries(item.optionFigures))assert.equal(figs[0].text,item.options[key]);
 assert.equal(item.figures[1].type,'schema-group');
 assert.equal(item.figures[1].schemas[2].columns.filter(c=>c.primary).length,2);
});
test('2019 Q5 preserves combined primary and foreign key markings',()=>{
 const cols=q(2019,5).figures[0].schemas.find(s=>s.name==='診察').columns;
 assert.equal(cols.filter(c=>c.primary&&c.foreign).length,2);
});
test('object names underline only in object diagrams',()=>{
 const svg=element('svg'),n={id:'N01：ノード',x:50};
 api.diagramNodeLabel(svg,{objectDiagram:true},n,30);
 api.diagramNodeLabel(svg,{},n,50);
 assert.equal(svg.children[0].attrs['text-decoration'],'underline');
 assert.equal(svg.children[1].attrs['text-decoration'],undefined);
});
test('ternary association name is supplied and positioned',()=>{
 const f=q(2019,6).optionFigures['エ'][0],n={id:'履修',diamond:true,x:175,y:60,height:9,half:12};
 const labels=api.diamondAssociationLabels(f,[n]);
 assert.equal(labels[0][2],'履修する');
 assert.ok(api.placeAssociationLabels(labels,[n]).every(p=>p.resolved));
});
test('B+ tree parallel pointers use two distinct reverse segments',()=>{
 const a={x:0,y:0,half:15,height:14},b={x:100,y:0,half:15,height:14};
 const [p,r]=api.parallelPointerSegments(a,b);
 assert.ok(p[0]<p[2]&&r[0]>r[2]);
 assert.notEqual(p[1],r[1]);
 const item=q(2024,3);
 assert.ok([...item.figures,...Object.values(item.optionFigures).flat()].every(f=>f.parallelPointers));
});
test('merged inheritance retains both children with a single triangle',()=>{
 const nodes=[{id:'p',x:100,y:40,height:15},{id:'a',x:40,y:140,height:15},{id:'b',x:160,y:140,height:15}];
 const links=[{kind:'inherit',from:'a',to:'p'},{kind:'inherit',from:'b',to:'p'}];
 const svg=element('svg');
 assert.equal(api.mergedInheritance(svg,nodes,links,'arrow').size,2);
 assert.equal(svg.children.length,4);
 assert.equal(svg.children.filter(e=>e.attrs['marker-end']==='url(#arrow)').length,1);
});
test('ownership constraint is drawn for 2019 Q4',()=>{
 const f=q(2019,4).figures[0],svg=element('svg');
 const nodes=f.classes.map(([id,x,y])=>({id,x,y,height:15}));
 api.ownershipConstraint(svg,nodes,f);
 assert.ok(svg.children.some(e=>e.attrs['stroke-dasharray']));
 assert.ok(svg.children.some(e=>e.textContent==='制約：同時には成立しない'));
});
test('both display modes call all new shared notation functions',()=>{
 for(const path of ['src/am2-archive-2024.js','src/am2-25-standalone-figures.mjs']){
  const s=read(path);
  for(const name of ['diagramNodeLabel','diamondAssociationLabels','parallelPointerSegments','mergedInheritance','ownershipConstraint'])assert.ok(s.includes('window.am2SharedVectorFigures.'+name),path+' '+name);
 }
});
