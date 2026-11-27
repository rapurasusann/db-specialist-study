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
test('all historical figures render in a minimal DOM without invalid coordinates',()=>{const result=new Function('data',"\nclass Node {\n constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.style={};this.textContent='';}\n setAttribute(k,v){this.attrs[k]=String(v);}\n append(...nodes){this.children.push(...nodes);}\n}\nconst document={createElement:t=>new Node(t),createElementNS:(ns,t)=>new Node(t)};\nconst window={};\n"+read("src/am2-shared-vector-figures.js")+"\n"+source+"\nconst errors=[],counts={};for(const {y,k,f} of data){try{\n const root=figure(f);counts[f.type]=(counts[f.type]||0)+1;\n const walk=n=>[n,...n.children.flatMap(walk)];const nodes=walk(root);\n const check=(v,m)=>{if(!v)throw Error(m)};\n if(f.type==='uml'||f.type==='graph'){\n const svg=nodes.find(n=>n.tag==='svg');check(svg,'missing svg');\n const bounds=svg.attrs.viewBox.split(' ').map(Number);check(bounds.length===4&&bounds.every(Number.isFinite)&&bounds[2]>0&&bounds[3]>0,'viewBox');\n for(const n of nodes)for(const [key,value] of Object.entries(n.attrs))if(['x','y','x1','y1','x2','y2','cx','cy','r','width','height','points','d','viewBox'].includes(key))check(!/NaN|Infinity|undefined/.test(value),'invalid coordinate '+key);\n check(nodes.filter(n=>n.tag==='polygon').length===(f.diamondNodes||[]).length,'diamond count');\n check(nodes.filter(n=>n.tag==='line'&&n.attrs['stroke-dasharray']==='4 3').length>=(f.associationClasses||[]).length,'association connectors');\n }else if(f.type==='table'){check(nodes.filter(n=>n.tag==='th').length===f.headers.length,'headers');check(nodes.filter(n=>n.tag==='td').length===f.rows.flat().length,'cells');}else if(f.type==='sql'){check(nodes.find(n=>n.tag==='pre')?.textContent===f.text,'SQL content');}\n }catch(e){errors.push({y,k,type:f.type,error:String(e)});}}\nreturn {counts,errors,total:data.length};")(data);assert.equal(result.total,data.length);assert.deepEqual(result.errors,[]);assert.equal(result.total,171);});

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
   }else if(['2016:6','2017:2','2019:5','2021:4'].includes(id)){
    const oldTable=expected.find(f=>f.type==='table'),group=actual.find(f=>f.type==='schema-group');
    assert.ok(oldTable&&group,id);
    assert.deepEqual(group.schemas.map(s=>s.name),oldTable.rows.map(r=>r[0]));
    for(const [i,row] of oldTable.rows.entries()){
     const schema=group.schemas[i],keys=row[1].split(/[・＋]/);
     assert.deepEqual(schema.columns.filter(c=>c.primary).map(c=>c.name),keys,id+' primary keys');
     for(const name of row[2].split(/[・、]/).filter(v=>v&&v!=='なし'))assert.ok(schema.columns.some(c=>c.name===name),id+' '+name);
     if(row.length===4)assert.deepEqual(schema.columns.filter(c=>c.foreign).map(c=>c.name),row[3].split(/[・、]/).filter(v=>v&&v!=='なし'),id+' foreign keys');
    }
    const rest=actual.filter(f=>f!==group),priorRest=expected.filter(f=>f!==oldTable);
    if(id==='2017:2'){
     assert.equal(rest.length,1);assert.equal(priorRest.length,1);
     const {accountingConstraint,...diagram}=rest[0],{title,...priorDiagram}=priorRest[0];
     assert.deepEqual(diagram,priorDiagram);
     assert.equal(accountingConstraint.target,'会計取引');
     assert.equal(accountingConstraint.lines.join(''),'制約：一つの会計取引につながる移動の金額の和はゼロであること。');
    }else assert.deepEqual(rest,priorRest);
   }else if(['2016:5','2018:2'].includes(id)){
    assert.equal(actual.length,1);assert.equal(actual[0].type,'schema-group');
    assert.deepEqual(actual[0].schemas.map(s=>s.name),expected.map(f=>f.title));
    for(const [i,schema] of actual[0].schemas.entries()){
     assert.deepEqual(schema.columns.map(c=>c.name),expected[i].headers.map(h=>h.replace('（主キー）','')));
     assert.deepEqual(schema.columns.filter(c=>c.primary).map(c=>c.name),[expected[i].headers[0].replace('（主キー）','')]);
    }
   }else if(['2017:8','2018:6','2018:8','2018:10','2020:10','2024:10'].includes(id)){
    const specs={'2017:8':['社員','社員コード','部署コード','社員名','役職'],'2018:6':['A','A1','A2','A3'],'2018:8':['部品','部品番号','部品名','親部品番号'],'2018:10':['社員','社員番号','社員名','性別','生年月日'],'2020:10':['社員','社員番号','社員名','性別','生年月日'],'2024:10':['従業員','従業員番号','従業員名','性別','生年月日']};
    const [name,...columns]=specs[id],group=actual.find(f=>f.type==='schema-group');
    assert.equal(group.schemas.length,1);assert.equal(group.schemas[0].name,name);
    assert.deepEqual(group.schemas[0].columns.map(c=>c.name),columns);
    assert.deepEqual(group.schemas[0].columns.filter(c=>c.primary).map(c=>c.name),[columns[0]]);
    assert.deepEqual(actual.filter(f=>f!==group).map(f=>f.type),expected.map(f=>f.type));
    const sql=compact(actual.find(f=>f.type==='sql').text),before=compact(expected.find(f=>f.type==='sql').text).replace(/^.*?(?=SELECT|UPDATE)/,'').replace(/S1\./g,'');
    assert.equal(sql.replace(/S1\./g,'').replace(/AS主任の人数|AS一般社員の人数/g,''),before,id+' SQL');
    if(id==='2017:8')assert.deepEqual(actual.find(f=>f.type==='table').rows,expected.find(f=>f.type==='table').rows);
   }else if(id==='2019:4'||id==='2020:1'){
    assert.equal(actual.length,1);assert.equal(actual[0].type,id==='2019:4'?'property-graph':'server-topology');
    assert.deepEqual(actual[0].classes,expected[0].classes);
    assert.deepEqual(actual[0].links.map(({label,...e})=>e),expected[0].links.map(({label,...e})=>e));
    if(id==='2019:4'){assert.deepEqual(actual[0].attributes,expected[0].attributes);assert.deepEqual(actual[0].associationClasses,expected[0].associationClasses);}
   }else if(id==='2021:2'){
    assert.deepEqual(actual.map(f=>f.type),['uml','uml','uml']);
    for(const [model,cls,attrs] of expected[3].rows)for(const m of model.split('・')){
     const figure=actual['ABC'.indexOf(m)];
     assert.deepEqual(figure.attributes[cls],attrs.split('、'));
    }
    assert.deepEqual(actual[2].links.map(e=>[e.fromLabel,e.toLabel]),[['1 親','*'],['1 子','*']]);
   }else if(id==='2022:2'){
    const e=expected[0].links[0];assert.deepEqual(actual,[{type:'boxed-multiplicity',left:e.from,right:e.to,a:e.fromLabel,b:e.toLabel,role:e.label}]);
   }else if(id==='2022:4'){
    assert.equal(actual.length,0);assert.equal(expected.length,1);
    const normalize=s=>{
     const source=compact(s).replace(/^\{(.*)\}$/,'$1');
     const tokens=[];let depth=0,start=0;
     for(let i=0;i<source.length;i++){
      if(source[i]==='{')depth++;
      if(source[i]==='}')depth--;
      if(source[i]===','&&depth===0){tokens.push(source.slice(start,i));start=i+1;}
      assert.ok(depth>=0);
     }
     assert.equal(depth,0);tokens.push(source.slice(start));
     return tokens.map(t=>t.replace(/\{([A-Z](?:,[A-Z])*)\}/g,(_,attrs)=>attrs.replace(/,/g,''))).sort();
    };
    for(const [name,dependencies] of expected[0].rows){
     const line=now.stem.split('\n').find(l=>l.startsWith(name+'＝'));
     assert.ok(line);const lhs=normalize(line.split('＝')[1]),rhs=normalize(dependencies);
     assert.deepEqual(lhs,rhs);
    }
    removed++;
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
 assert.equal(removed,19);
});
