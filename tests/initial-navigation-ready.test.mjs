/** No-browser acceptance for stable initial navigation and year choices. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const html=read('index.html');

test('all four navigation buttons exist in the initial HTML exactly once',()=>{
 const toolbar=html.slice(html.indexOf('<main>'),html.indexOf('</section>',html.indexOf('<main>')));
 for(const id of ['viewDashboard','viewStudy','viewTerms','viewStepUp']){
  assert.equal((toolbar.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'initial '+id);
 }
 assert.match(toolbar, /id="viewTerms"[^>]*disabled/);
 assert.match(toolbar, /id="viewStepUp"[^>]*disabled/);
 const order=['viewDashboard','viewStudy','viewTerms','viewStepUp'].map(id=>toolbar.indexOf('id="'+id+'"'));
 assert.ok(order.every((p,i)=>p>=0&&(i===0||p>order[i-1])),'stable tab order');
});

test('all ten years are visible before scripts execute',()=>{
 const year=html.match(/<select id="year"[^>]*>([\s\S]*?)<\/select>/);
 assert.ok(year,'initial year selector');
 for(let y=2016;y<=2025;y++){
  assert.match(year[1],new RegExp('<option value="'+y+'"[^>]*>'+y+'年度<\\/option>'));
 }
 assert.equal((year[1].match(/<option /g)||[]).length,10);
 assert.match(year[1],/<option value="2025" selected>/);
});

test('year selection stays visible while unloaded years are disabled',()=>{
 const start=html.indexOf('function renderYears(){');
 const end=html.indexOf('\nfunction renderMetrics()',start);
 assert.ok(start>=0 && end>start,'renderYears found');
 const source=html.slice(start,end);
 const options=[];
 const select={replaceChildren(){options.length=0;},append(o){options.push(o);},value:'',disabled:true};
 const document={createElement(){return {value:'',textContent:'',disabled:false}}};
 const $=()=>select;
 const render=new Function('document','$','years','year',source+';return renderYears;');
 const loaded={'2025':{courses:[]}};
 render(document,$,loaded,2025)();
 assert.equal(options.length,10);
 assert.equal(options.filter(o=>!o.disabled).length,1);
 assert.equal(options[0].value,'2025');
 assert.equal(options.at(-1).value,'2016');
 for(let y=2016;y<=2024;y++)loaded[y]={courses:[]};
 render(document,$,loaded,2025)();
 assert.equal(options.filter(o=>!o.disabled).length,10);
 assert.equal(select.value,'2025');
 assert.equal(select.disabled,false);
});

test('module navigation reuses initial buttons and enables after setup',()=>{
 for(const [path,id] of [
  ['src/term-understanding-ui.js','viewTerms'],
  ['src/afternoon-step-up-ui.js','viewStepUp']]){
  const code=read(path);
  assert.ok(code.includes("getElementById('"+id+"')")||code.includes("$('"+id+"')"),path+' reuses button');
  assert.doesNotMatch(code,new RegExp("createElement\\('button'\\)\\s*;\\s*button\\.id='"+id+"'"),path+' must not duplicate button');
  assert.match(code,/button\.disabled=false;\s*$/,path+' enables after registration');
 }
});
