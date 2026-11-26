import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root=new URL('../',import.meta.url);
const window={};
runInNewContext(readFileSync(new URL('src/am2-shared-vector-figures.js',root),'utf8'),{window});
const api=window.am2SharedVectorFigures;
const overlap=(a,b)=>a.left<b.right+2&&a.right>b.left-2&&a.top<b.bottom+2&&a.bottom>b.top-2;
test('horizontal and vertical edges separate relationship name from endpoint labels',()=>{
 for(const end of [[100,0],[0,100],[-100,0],[0,-100]]){
  for(const offset of [-5,0,5]){
   const labels=api.associationLabels(0,0,...end,{fromLabel:'1',toLabel:'*',label:'関連',offset});
   const p=api.placeAssociationLabels(labels,[]);
   assert.equal(p.length,3);assert.ok(p.every(x=>x.resolved));
   const cross=x=>end[0]*(x.y-3)-end[1]*x.x;
   assert.ok(cross(p[0])*cross(p[2])<0);
   assert.ok(cross(p[1])*cross(p[2])<0);
   for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++)assert.ok(!overlap(p[i].box,p[j].box));
  }
 }
});
test('reserved class and prior label bounds are avoided',()=>{
 const axis={tx:1,ty:0,nx:0,ny:-1};
 const p=api.placeAssociationLabels([[50,50,'1',axis],[50,50,'*',axis]], [{x:50,y:50,half:8,height:5}]);
 assert.ok(p.every(x=>x.resolved));assert.ok(!overlap(p[0].box,p[1].box));
 for(const x of p)assert.ok(!overlap(x.box,{left:42,right:58,top:45,bottom:55}));
});
test('unresolved placement remains explicit and text is retained',()=>{
 const p=api.placeAssociationLabels([[50,50,'1',{tx:1,ty:0,nx:0,ny:-1}]], [{x:50,y:50,half:100,height:100}]);
 assert.equal(p.length,1);assert.equal(p[0].resolved,false);assert.equal(p[0].text,'1');
});
test('both screens use the shared layout and browser audit detects unresolved labels',()=>{
 for(const file of ['src/am2-archive-2024.js','src/am2-25-standalone-figures.mjs']){
  const source=readFileSync(new URL(file,root),'utf8');
  assert.match(source,/am2SharedVectorFigures\.placeAssociationLabels\(labels,nodes,reserved\)/);
  assert.match(source,/data-unresolved-association-label/);
 }
 assert.match(readFileSync(new URL('tests/browser/am2-display-audit.mjs',root),'utf8'),/Unresolved association label placement/);
});

test('label renderer cache identifiers are updated together',()=>{
 const html=readFileSync(new URL('index.html',root),'utf8');
 const ui=readFileSync(new URL('src/am2-25-standalone-ui.js',root),'utf8');
 for(const file of ['am2-shared-vector-figures.js','am2-archive-2024.js','am2-25-standalone-ui.js']){
  assert.ok(html.includes(file+'?v=20261126notation2'),file);
 }
 assert.ok(ui.includes('am2-25-standalone-figures.mjs?v=20261126notation2'));
});

test('adaptive layout expands crowded classes without changing identities or dimensions',()=>{
 const nodes=[{id:'A',x:30,y:30,half:37,height:15},{id:'B',x:90,y:30,half:37,height:15}];
 const links=[{from:'A',to:'B',fromLabel:'1',toLabel:'*',label:'関連'}];
 const before=JSON.stringify({nodes,links});
 const result=api.layoutAssociationNodes(nodes,links);
 assert.ok(result[1].x-result[0].x>60);
 assert.equal(JSON.stringify({nodes,links}),before);
 for(let i=0;i<nodes.length;i++){
  assert.equal(result[i].id,nodes[i].id);
  assert.equal(result[i].half,nodes[i].half);
  assert.equal(result[i].height,nodes[i].height);
 }
 const labels=api.associationLabels(...api.associationEndpoints(result[0],result[1],0),links[0]);
 const placed=api.placeAssociationLabels(labels,result);
 assert.equal(placed.length,3);
 assert.ok(placed.every(p=>p.resolved));
});
test('both rendering paths use the same adaptive node layout and endpoint geometry',()=>{
 for(const file of ['src/am2-archive-2024.js','src/am2-25-standalone-figures.mjs']){
  const source=readFileSync(new URL(file,root),'utf8');
  assert.match(source,/layoutAssociationNodes\(nodes,f\.links,f\)/);
  assert.match(source,/associationEndpoints\(a,b,offset\)/);
  assert.match(source,/selfAssociationLabels\(a,e\)/);
 }
});

test('constraint rectangle is reserved against association label overlap',()=>{
 const reserved={left:40,right:100,top:40,bottom:64};
 const p=api.placeAssociationLabels([[70,52,'所属する',{tx:1,ty:0,nx:0,ny:-1}]],[],[reserved]);
 assert.ok(p[0].resolved);assert.ok(!overlap(p[0].box,reserved));
});
