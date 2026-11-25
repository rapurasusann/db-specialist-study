/** Verify the archive's actual figure()/diagram() renderer without browser dependencies.
 * Run: node --test tests/am2-archive-render.test.mjs
 * This is a DOM-stub smoke test, NOT a visual/browser acceptance test.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const rendererSource = read('src/am2-archive-2024.js');
const start = rendererSource.indexOf("const ns='http://www.w3.org/2000/svg'");
const end = rendererSource.indexOf('\nshowQuestion=function(){', start);
assert.ok(start >= 0 && end > start, 'Renderer source boundaries have changed');

class FakeElement {
 constructor(tagName){this.tagName=tagName;this.children=[];this.attributes={};this.style={};this.textContent='';}
 setAttribute(name,value){this.attributes[name]=String(value);}
 append(...children){this.children.push(...children);}
}
const document={
 createElement: name=>new FakeElement(name),
 createElementNS: (_ns,name)=>new FakeElement(name)
};
const {figure} = runInNewContext(rendererSource.slice(start,end)+'\n({figure})', {document});
const walk = (node,tag) => [ ...(node.tagName===tag?[node]:[]),...node.children.flatMap(child=>typeof child==='object' ? walk(child,tag):[]) ];

function archive(year){
 const text=read(year===2024?'src/am2-archive-2024.js':`src/am2-archive-${year}-data.js`);
 const json=year===2024?text.slice(text.indexOf('const entry=')+12,text.indexOf(';\nconst entries=')):text.slice(text.indexOf('=')+1,text.lastIndexOf(';'));
 return JSON.parse(json);
}

test('all 2016–2024 archive figure data renders without exceptions',()=>{
 let count=0;
 for(let year=2016;year<=2024;year++){
  const data=archive(year);
  assert.equal(Object.keys(data.questions).length,25,year+' has 25 questions');
  for(const [id,question] of Object.entries(data.questions)){
   assert.ok(question.stem, year+':'+id+' has stem');
   assert.deepEqual(Object.keys(question.options).sort(),['ア','イ','ウ','エ'].sort(),year+':'+id+' has choices');
   const fixtures=[...(question.figures||[]),...Object.values(question.optionFigures||{}).flat()];
   for(const f of fixtures){
    const result=figure(f);
    assert.equal(result.tagName,'figure',year+':'+id);
    assert.ok(result.children.length,year+':'+id+' '+f.type+' is populated');
    if(f.type==='table'){
     const tables=walk(result,'table');
     assert.equal(tables.length,1,year+':'+id);
     assert.equal(walk(result,'tr').length,f.rows.length+1,year+':'+id);
     assert.ok(f.rows.every(row=>row.length===f.headers.length),year+':'+id+' has matching columns');
    }
    if(f.type==='uml'||f.type==='graph'){
     const svg=walk(result,'svg')[0];
     assert.ok(svg?.attributes.viewBox,year+':'+id+' has SVG viewBox');
     assert.ok(walk(svg,'text').length,year+':'+id+' has labels');
     const nodeIds=new Set(f.type==='uml'?f.classes.map(x=>x[0]):f.nodes.map(x=>x.id));
     const edges=f.type==='uml'?f.links:f.edges;
     for(const e of edges){
      assert.ok(nodeIds.has(e.from),year+':'+id+' start '+e.from);
      if(e.kind!=='self')assert.ok(nodeIds.has(e.to),year+':'+id+' end '+e.to);
     }
    }
    if(f.type==='sql')assert.equal(walk(result,'pre')[0].textContent,String(f.text));
    count++;
   }
  }
 }
 assert.ok(count >= 165,'expected at least 165 figure instances; found '+count);
});

test('multiline question and choice text is preserved by UI styles',()=>{
 const html=read('index.html');
 assert.match(html,/#questionText h3\s*\{\s*white-space:\s*pre-wrap\s*\}/);
 assert.match(html,/\.optionText\s*\{[^}]*white-space:\s*pre-wrap\s*\}/);
});
