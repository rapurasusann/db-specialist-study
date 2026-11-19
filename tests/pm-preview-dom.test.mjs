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
   saveAnswer:(id,value)=>writes.push([id,value])
  });
  const intro=walk(root,n=>n.className==='pmIntroText')[0];
  const page=walk(root,n=>n.tag==='span'&&n.textContent==='1 / 5')[0];
  assert.ok(page);
  assert.ok(intro.children.some(n=>n.textContent==='原本 6 ページ'));
  byText(root,'button','次ページ').fire('click');
  assert.ok(intro.children.some(n=>n.textContent==='原本 7 ページ'));
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
