import {loadArchives} from './helpers/load-am2-archives.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const renderer=read('src/am2-archive-2024.js');
const i=renderer.indexOf('const ns='),j=renderer.indexOf('showQuestion=function()',i);
assert.ok(i>=0&&j>i);
const source=renderer.slice(i,j);
const archives=loadArchives();
const data=[];for(let y=2016;y<=2024;y++){const d=archives[y];for(const [k,q] of Object.entries(d.questions))for(const f of [...(q.figures||[]),...Object.values(q.optionFigures||{}).flat()])data.push({y,k,f});}
test('all historical figures render in a minimal DOM without invalid coordinates',()=>{const result=new Function('data',"\nclass Node {\n constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.textContent='';}\n setAttribute(k,v){this.attrs[k]=String(v);}\n append(...nodes){this.children.push(...nodes);}\n}\nconst document={createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t)};\nconst window={};\n"+read("src/am2-shared-vector-figures.js")+"\n"+source+"\nconst errors=[],counts={};for(const {y,k,f} of data){try{\n const root=figure(f);counts[f.type]=(counts[f.type]||0)+1;\n const walk=n=>[n,...n.children.flatMap(walk)];const nodes=walk(root);\n const check=(v,m)=>{if(!v)throw Error(m)};\n if(f.type==='uml'||f.type==='graph'){\n const svg=nodes.find(n=>n.tag==='svg');check(svg,'missing svg');\n const bounds=svg.attrs.viewBox.split(' ').map(Number);check(bounds.length===4&&bounds.every(Number.isFinite)&&bounds[2]>0&&bounds[3]>0,'viewBox');\n for(const n of nodes)for(const [key,value] of Object.entries(n.attrs))if(['x','y','x1','y1','x2','y2','cx','cy','r','width','height','points','d','viewBox'].includes(key))check(!/NaN|Infinity|undefined/.test(value),'invalid coordinate '+key);\n check(nodes.filter(n=>n.tag==='polygon').length===(f.diamondNodes||[]).length,'diamond count');\n check(nodes.filter(n=>n.tag==='line'&&n.attrs['stroke-dasharray']==='4 3').length>=(f.associationClasses||[]).length,'association connectors');\n }else if(f.type==='table'){check(nodes.filter(n=>n.tag==='th').length===f.headers.length,'headers');check(nodes.filter(n=>n.tag==='td').length===f.rows.flat().length,'cells');}else if(f.type==='sql'){check(nodes.find(n=>n.tag==='pre')?.textContent===f.text,'SQL content');}\n }catch(e){errors.push({y,k,type:f.type,error:String(e)});}}\nreturn {counts,errors,total:data.length};")(data);assert.equal(result.total,data.length);assert.deepEqual(result.errors,[]);assert.equal(result.total,165);});

test('historical figure slots survive or have an explicitly checked text migration',()=>{
 const migrated=new Set(['2021:8','2022:6','2022:12','2024:10']);
 const compact=s=>s.replace(/\s+/g,'').replace(/[，,]/g,',').replace(/[（(]/g,'(').replace(/[）)]/g,')');
 let removed=0;
 for(let y=2016;y<=2024;y++){
  const old=JSON.parse(read('data/am2-'+y+'-reviewed-partial.json'));
  for(const [k,prior] of Object.entries(old.questions)){
   const now=archives[y].questions[k],n=k.split(':')[1],id=y+':'+n;
   const expected=prior.figures||[],actual=now.figures||[];
   if(id==='2022:12'){
    assert.equal(expected.length,1);assert.equal(actual.length,0);
    assert.ok(now.stem.includes('社員番号［主キー］'));
    assert.ok(compact(now.stem).includes('SELECT社員番号,社員名FROM社員ASS1WHERE生年月日>(a)'));
    removed++;
   }else if(id==='2024:14'){
    assert.equal(expected.length,1);assert.equal(actual.length,0);
    assert.match(now.stem,/READ COMMITTED/);
    assert.match(now.stem,/単版2相ロッキングプロトコル/);
    assert.match(now.stem,/多版同時実行制御/);
    for(const [letter,single,multi] of expected[0].rows){
     const parts=now.options[letter].split('\n');
     assert.equal(parts.length,2);
     for(const [i,value] of [single,multi].entries()){
      assert.ok(parts[i].includes(value.endsWith('5')?'値5':'値4'));
      assert.ok(parts[i].includes(value.startsWith('待機後')?'待機した後':'待機することなく'));
     }
    }
    removed++;
   }else if(id==='2017:2'||id==='2019:5'){
    const oldTable=expected.find(f=>f.type==='table'),group=actual.find(f=>f.type==='schema-group');
    assert.ok(oldTable&&group,id);
    assert.deepEqual(group.schemas.map(s=>s.name),oldTable.rows.map(r=>r[0]));
    for(const [i,row] of oldTable.rows.entries()){
     const schema=group.schemas[i],keys=row[1].split('・');
     assert.deepEqual(schema.columns.filter(c=>c.primary).map(c=>c.name),keys,id+' primary keys');
     for(const name of row[2].split('・').filter(v=>v!=='なし'))assert.ok(schema.columns.some(c=>c.name===name),id+' '+name);
     if(row.length===4)assert.deepEqual(schema.columns.filter(c=>c.foreign).map(c=>c.name),row[3].split('・').filter(v=>v!=='なし'),id+' foreign keys');
    }
    assert.deepEqual(actual.filter(f=>f!==group),expected.filter(f=>f!==oldTable));
   }else{
    assert.deepEqual(actual.map(f=>f.type),expected.map(f=>f.type),id+' stem figures');
   }
   for(const [letter,figures] of Object.entries(prior.optionFigures||{})){
    const current=now.optionFigures?.[letter]||[];
    if(migrated.has(id)){
     assert.equal(current.length,0);
     for(const f of figures){assert.equal(f.type,'sql');assert.equal(compact(now.options[letter]),compact(f.text),id+' '+letter);removed++;}
    }else assert.deepEqual(current.map(f=>f.type),figures.map(f=>f.type),id+' '+letter);
   }
  }
 }
 assert.equal(removed,18);
});
