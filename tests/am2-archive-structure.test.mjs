import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const manifest=JSON.parse(read('data/am2-archive-sources-2016-2024.json'));
const html=read('index.html');
const renderer=read('src/am2-archive-2024.js');
const years=Array.from({length:9},(_,i)=>2016+i);
const letters=['ア','イ','ウ','エ'];
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const context=createContext({years:{},year:2025,courseId:'am2',showQuestion(){},renderYears(){},renderMode(){},document:{createElement(){return {}},head:{append(){}}}});
test('all nine years load in browser script order',()=>{
 assert.deepEqual(manifest.years.map(y=>y.year).sort(),years);
 for(const y of years.slice(0,-1)){
  const name='src/am2-archive-'+y+'-data.js';
  assert.ok(html.indexOf(name)>=0&&html.indexOf(name)<html.indexOf('src/am2-archive-2024.js'),name);
  new Script(read(name)).runInContext(context);
 }
 new Script(renderer).runInContext(context);
 assert.deepEqual(Object.keys(context.years).map(Number).sort(),years);
});
function figure(f){
 assert.ok(['table','sql','uml','graph'].includes(f.type));
 if(f.type==='table'){assert.ok(f.headers.length);for(const row of f.rows)assert.equal(row.length,f.headers.length);}
 if(f.type==='sql')assert.ok(nonempty(f.text));
 if(f.type==='uml'||f.type==='graph'){
  const nodes=f.type==='uml'?f.classes.map(([id,x,y])=>({id,x,y})):f.nodes;
  const ids=new Set(nodes.map(n=>n.id));assert.equal(ids.size,nodes.length);
  for(const n of nodes){assert.ok(nonempty(n.id));assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y));}
  for(const e of f.type==='uml'?f.links:f.edges){assert.ok(ids.has(e.from));if(e.kind!=='self')assert.ok(ids.has(e.to));}
  for(const e of f.associationClasses||[])for(const k of ['from','to','classId'])assert.ok(ids.has(e[k]));
  for(const id of f.diamondNodes||[])assert.ok(ids.has(id));
 }
}
for(const y of years)test(y+' : 25 questions and figure references',()=>{
 const a=manifest.years.find(v=>v.year===y);
 const d=JSON.parse(read('data/am2-'+y+'-reviewed-partial.json'));
 const b=JSON.parse(JSON.stringify(context.years[y]));
 assert.equal(a.answers.length,25);
 assert.deepEqual(b.courses[0].answers,a.answers);
 assert.equal(b.courses[0].count,25);
 assert.equal(b.courses[0].questionUrl,a.questionUrl);
 assert.equal(b.courses[0].answerUrl,a.answerUrl);
 assert.equal(Object.keys(d.questions).length,25);
 assert.deepEqual(b.questions,d.questions);
 for(let n=1;n<=25;n++){
  const q=d.questions['am2:'+n];assert.ok(q,y+':'+n);
  assert.ok(nonempty(q.stem)&&nonempty(q.explanation));
  assert.deepEqual(Object.keys(q.options),letters);
  assert.ok(Object.values(q.options).every(nonempty));
  assert.equal(q.answer,a.answers[n-1]);assert.ok(letters.includes(q.answer));
  for(const f of q.figures||[])figure(f);
  for(const [key,fs] of Object.entries(q.optionFigures||{})){assert.ok(letters.includes(key));for(const f of fs)figure(f);}
 }
});
test('release readiness is not implied by structural tests',()=>{
 assert.ok(manifest.years.some(y=>!y.answerVerification||/pending|hold|recheck|required|open/i.test(y.answerVerification)));
 assert.ok(renderer.includes('原文最終照合前'));
});
