// Minimal DOM for testing UI interactions without Playwright or a deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPmSubquestionView} from '../src/pm-subquestion-view.mjs';
import {pmVerifiedStructure} from '../src/pm-2025-verified-structure.mjs';

class FakeNode {
 constructor(tag,text=''){
  this.tag=tag;this.textContent=text;this.children=[];this.events={};this.attrs={};
  this.style={};this.dataset={};this.value='';this.disabled=false;
 }
 appendChild(node){this.children.push(node);return node}
 append(...nodes){for(const node of nodes)this.appendChild(node)}
 replaceChildren(...nodes){this.children=[...nodes]}
 setAttribute(key,value){this.attrs[key]=String(value)}
 addEventListener(event,callback){this.events[event]=callback}
 fire(event,value){if(value!==undefined)this.value=value;this.events[event]?.({target:this})}
 get innerText(){return this.textContent}
}
const walk=(node,filter)=>{
 const found=[];
 (function visit(n){if(filter(n))found.push(n);for(const child of n.children||[])visit(child)})(node);
 return found;
};
const byText=(root,tag,text)=>walk(root,n=>n.tag===tag&&n.textContent===text)[0];
function setup(){
 const previousDocument=globalThis.document,previousOption=globalThis.Option;
 globalThis.document={
  createElement:tag=>new FakeNode(tag),
  createElementNS:(_ns,tag)=>new FakeNode(tag),
  createTextNode:text=>new FakeNode('#text',String(text))
 };
 globalThis.Option=function(text,value){const n=new FakeNode('option',text);n.value=value;return n};
 return ()=>{globalThis.document=previousDocument;globalThis.Option=previousOption};
}
test('interactive PM preview pages, figure auto/manual mode and separate answers',()=>{
 const undo=setup();
 try{
  const original=pmVerifiedStructure['2025:pm1:1'];
  const writes=[];
  const root=createPmSubquestionView(original,{
   loadAnswers:()=>({'s1-1':'以前の回答','s2':'別の回答'}),
   saveAnswer:(id,value)=>{writes.push([id,value]);return true}
  });
  const intro=walk(root,n=>n.className==='pmIntroText')[0];
  const page=walk(root,n=>n.tag==='span'&&n.textContent==='1 / 5')[0];
  assert.ok(page);
  assert.ok(intro.children.some(n=>n.textContent==='原本 6 ページ'));
  const introLink=walk(root,n=>n.tag==='a'&&n.textContent==='原本の6ページを開く')[0];
  assert.ok(introLink);
  assert.equal(introLink.href,original.source+'#page=6');
  assert.equal(introLink.rel,'noopener noreferrer');
  byText(root,'button','次ページ').fire('click');
  assert.ok(intro.children.some(n=>n.textContent==='原本 7 ページ'));
  assert.equal(introLink.href,original.source+'#page=7');
  assert.equal(introLink.textContent,'原本の7ページを開く');
  byText(root,'button','前ページ').fire('click');
  assert.ok(intro.children.some(n=>n.textContent==='原本 6 ページ'));
  const textarea=walk(root,n=>n.tag==='textarea')[0];
  assert.equal(textarea.value,'以前の回答');
  let mats=walk(root,n=>n.className==='pmMaterialBody')[0];
  assert.ok(walk(mats,n=>n.textContent.includes('図・表のテキスト再構成は未整備です')).length);
  const figure1Link=walk(mats,n=>n.tag==='a'&&n.textContent.includes('8ページ'))[0];
  assert.ok(figure1Link);
  assert.equal(figure1Link.href,original.source+'#page=8');
  assert.equal(figure1Link.rel,'noopener noreferrer');
  assert.equal(walk(mats,n=>n.tag==='svg').length,0);
  byText(root,'button','設問2').fire('click');
  assert.equal(textarea.value,'別の回答');
  const figure3Link=walk(mats,n=>n.tag==='a'&&n.textContent.includes('10ページ'))[0];
  assert.ok(figure3Link);
  assert.equal(figure3Link.href,original.source+'#page=10');
  assert.equal(walk(mats,n=>n.tag==='table').length,0);
  assert.ok(walk(mats,n=>n.textContent.includes('図・表のテキスト再構成は未整備です')).length);
  textarea.fire('input','設問2の新しい回答');
  assert.deepEqual(writes,[['s2','設問2の新しい回答']]);
  const selector=walk(root,n=>n.tag==='select')[0];
  selector.fire('change','fig1');
  assert.equal(walk(mats,n=>n.tag==='svg').length,0);
  assert.ok(walk(mats,n=>n.textContent.includes('未整備です')).length);
  byText(root,'button','設問1 (1)').fire('click');
  assert.equal(selector.value,'auto');
  assert.equal(textarea.value,'以前の回答');
  textarea.fire('input','設問1の新しい回答');
  byText(root,'button','設問2').fire('click');
  byText(root,'button','設問1 (1)').fire('click');
  assert.equal(textarea.value,'設問1の新しい回答');
  assert.deepEqual(writes,[['s2','設問2の新しい回答'],['s1-1','設問1の新しい回答']]);
 }finally{undo()}
});

test('subquestion selection keeps button identity and keyboard focus target',()=>{
 const undo=setup();
 try{
  const root=createPmSubquestionView(pmVerifiedStructure['2025:pm1:1']);
  const nav=walk(root,n=>n.className==='pmQuestionNav')[0];
  const buttons=walk(nav,n=>n.tag==='button');
  assert.equal(buttons.length,4);
  const second=byText(root,'button','設問1 (2)');
  assert.ok(second);
  second.fire('click');
  assert.equal(byText(root,'button','設問1 (2)'),second);
  assert.equal(second.attrs['aria-pressed'],'true');
  assert.equal(buttons[0].attrs['aria-pressed'],'false');
  byText(root,'button','設問2').fire('click');
  assert.equal(byText(root,'button','設問1 (2)'),second);
  assert.equal(second.attrs['aria-pressed'],'false');
  assert.equal(byText(root,'button','設問2').attrs['aria-pressed'],'true');
 }finally{undo()}
});
test('page navigation is bounded at first and last source page',()=>{
 const undo=setup();
 try{
  const root=createPmSubquestionView(pmVerifiedStructure['2025:pm1:1']);
  const prev=byText(root,'button','前ページ'),next=byText(root,'button','次ページ');
  const position=walk(root,n=>n.tag==='span'&&n.textContent==='1 / 5')[0];
  assert.equal(prev.disabled,true);
  prev.fire('click');
  assert.equal(position.textContent,'1 / 5');
  for(let i=0;i<12;i++)next.fire('click');
  assert.equal(position.textContent,'5 / 5');
  assert.equal(next.disabled,true);
  next.fire('click');
  assert.equal(position.textContent,'5 / 5');
  prev.fire('click');
  assert.equal(position.textContent,'4 / 5');
  assert.equal(next.disabled,false);
 }finally{undo()}
});

test('a flipped figure 2 display flag cannot expose incomplete source data',()=>{
 const undo=setup();
 try{
  const draft=structuredClone(pmVerifiedStructure['2025:pm1:1']);
  const fig2=draft.materials.find(m=>m.id==='fig2');
  fig2.verifiedStructure=true;
  const root=createPmSubquestionView(draft);
  const selector=walk(root,n=>n.tag==='select')[0];
  const materials=walk(root,n=>n.className==='pmMaterialBody')[0];
  selector.fire('change','fig2');
  assert.equal(walk(materials,n=>n.tag==='table').length,0);
  assert.ok(walk(materials,n=>n.textContent.includes('未整備です')).length);
  assert.ok(walk(materials,n=>n.tag==='a'&&n.textContent.includes('9ページ')).length);
  fig2.sourceTranscriptionVerified=true;
  fig2.keyNotationVerified=true;
  selector.fire('change','fig2');
  assert.equal(walk(materials,n=>n.tag==='table').length,0,'unresolved key candidates still block display');
 }finally{undo()}
});

test('failed storage writes are visible per subquestion, and unsaved drafts survive switching',()=>{
 const undo=setup();
 try{
  const failures=[];
  const root=createPmSubquestionView(pmVerifiedStructure['2025:pm1:1'],{
   loadAnswers:()=>({'s1-1':'元の回答'}),
   saveAnswer:(id,value)=>{failures.push([id,value]);return false}
  });
  const textarea=walk(root,n=>n.tag==='textarea')[0];
  const note=walk(root,n=>n.className==='muted'&&n.tag==='p'
   &&n.textContent.includes('設問ごとに回答'))[0];
  assert.ok(note);
  assert.equal(note.attrs.role,'status');
  assert.equal(note.attrs['aria-live'],'polite');
  textarea.fire('input','保存されない回答');
  assert.ok(note.textContent.includes('保存できていません'));
  byText(root,'button','設問2').fire('click');
  assert.ok(!note.textContent.includes('保存できていません'));
  byText(root,'button','設問1 (1)').fire('click');
  assert.equal(textarea.value,'保存されない回答');
  assert.ok(note.textContent.includes('保存できていません'));
  assert.deepEqual(failures,[['s1-1','保存されない回答']]);
 }finally{undo()}
});

test('retry unsaved answer succeeds without retyping, and only the selected answer is retried',()=>{
 const undo=setup();
 try{
  let available=false;
  const calls=[];
  const root=createPmSubquestionView(pmVerifiedStructure['2025:pm1:1'],{
   loadAnswers:()=>({'s1-1':'元の回答'}),
   saveAnswer:(id,value)=>{calls.push([id,value]);return available}
  });
  const textarea=walk(root,n=>n.tag==='textarea')[0];
  const retry=byText(root,'button','再保存');
  assert.ok(retry);
  assert.equal(retry.hidden,true);
  textarea.fire('input','再保存対象');
  assert.equal(retry.hidden,false);
  byText(root,'button','設問2').fire('click');
  assert.equal(retry.hidden,true);
  byText(root,'button','設問1 (1)').fire('click');
  assert.equal(retry.hidden,false);
  available=true;
  retry.fire('click');
  assert.equal(retry.hidden,true);
  assert.equal(textarea.value,'再保存対象');
  assert.deepEqual(calls,[['s1-1','再保存対象'],['s1-1','再保存対象']]);
 }finally{undo()}
});
