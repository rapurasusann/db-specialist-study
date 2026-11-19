import test from 'node:test';
import assert from 'node:assert/strict';

// Run the actual preview entry module against a minimal DOM and storage.
// Import queries isolate module initialization for each simulated reload.
class Node {
 constructor(tag,text=''){
  this.tag=tag;this.textContent=text;this.children=[];this.events={};
  this.attrs={};this.dataset={};this.style={};this.value='';this.hidden=false;
  this.classList={add(){}};
 }
 appendChild(n){this.children.push(n);return n}
 append(...nodes){nodes.forEach(n=>this.appendChild(n))}
 replaceChildren(...nodes){this.children=[...nodes]}
 setAttribute(k,v){this.attrs[k]=String(v)}
 addEventListener(k,f){this.events[k]=f}
 fire(k,value){if(value!==undefined)this.value=value;this.events[k]?.({target:this})}
}
function walk(root,predicate){
 if(predicate(root))return root;
 for(const child of root.children){const result=walk(child,predicate);if(result)return result}
 return null;
}
async function preview(initial,scenario){
 const originalDocument=globalThis.document,originalStorage=globalThis.localStorage,originalOption=globalThis.Option;
 const root=new Node('div'),status=new Node('p');
 let value=initial===undefined?null:initial;
 const writes=[];
 let rejectWrite=false;
 globalThis.document={
  getElementById:id=>id==='pmRoot'?root:id==='storageStatus'?status:null,
  createElement:tag=>new Node(tag),
  createElementNS:(_ns,tag)=>new Node(tag),
  createTextNode:value=>new Node('#text',String(value))
 };
 globalThis.Option=function(text,value){const option=new Node('option',text);option.value=value;return option};
 const storage={
  getItem:key=>key==='db-study-progress-v1'?value:null,
  setItem:(key,next)=>{assert.equal(key,'db-study-progress-v1');if(rejectWrite)throw Error('QUOTA_EXCEEDED');writes.push(next);value=next}
 };
 globalThis.localStorage=storage;
 try{
  await import('../src/pm-preview-entry.mjs?scenario='+scenario);
  const textarea=walk(root,n=>n.tag==='textarea');
  const withStorage=action=>{
   const previous=globalThis.localStorage;
   globalThis.localStorage=storage;
   try{action()}finally{globalThis.localStorage=previous}
  };
  const retry=walk(root,n=>n.tag==='button'&&n.textContent==='再保存');
  return {root,status,writes,stored:()=>value,textarea,retryButton:retry,
   externalWrite:next=>{value=next},
   rejectWrites:flag=>{rejectWrite=flag},
   input:text=>withStorage(()=>textarea.fire('input',text)),
   retry:()=>withStorage(()=>retry.fire('click'))
  };
 }finally{
  globalThis.document=originalDocument;globalThis.localStorage=originalStorage;globalThis.Option=originalOption;
 }
}
test('a null legacy question record must not be silently destroyed',async()=>{
 const initial=JSON.stringify({'2025:pm1:1':null,'2025:pm1:2':{written:'safe'}});
 const ui=await preview(initial,'null-record');
 assert.ok(ui.textarea);
 ui.input('新しい回答');
 assert.equal(ui.writes.length,0);
 assert.equal(ui.stored(),initial);
 assert.match(ui.status.textContent,/保存できませんでした/);
});
test('saving a new subquestion answer preserves legacy and unrelated progress',async()=>{
 const initial={
  '2025:pm1:1':{written:'以前の大問回答',level:'review',writtenBySubquestion:{'s1-2':'保持する回答'}},
  '2025:pm1:2':{written:'別問題の回答'}
 };
 const ui=await preview(JSON.stringify(initial),'preserve-progress');
 ui.input('保存した回答');
 assert.equal(ui.writes.length,1);
 const next=JSON.parse(ui.stored());
 assert.equal(next['2025:pm1:1'].written,'以前の大問回答');
 assert.equal(next['2025:pm1:1'].level,'review');
 assert.equal(next['2025:pm1:1'].writtenBySubquestion['s1-2'],'保持する回答');
 assert.equal(next['2025:pm1:1'].writtenBySubquestion['s1-1'],'保存した回答');
 assert.deepEqual(next['2025:pm1:2'],initial['2025:pm1:2']);
});
test('saved answer restores on a fresh preview initialization',async()=>{
 const first=await preview('{}','save-before-reload');
 first.input('再表示する回答');
 const second=await preview(first.stored(),'reload-and-restore');
 assert.equal(second.textarea.value,'再表示する回答');
 assert.equal(second.writes.length,0);
});

test('malformed JSON must not be overwritten by a new answer',async()=>{
 const initial='{broken';
 const ui=await preview(initial,'malformed-json');
 assert.ok(ui.textarea);
 ui.input('回答');
 assert.equal(ui.writes.length,0);
 assert.equal(ui.stored(),initial);
 assert.match(ui.status.textContent,/保存できませんでした/);
});
test('array-shaped legacy question record must not be overwritten',async()=>{
 const initial=JSON.stringify({'2025:pm1:1':[],'2025:pm1:2':{written:'保存済み'}});
 const ui=await preview(initial,'array-record');
 ui.input('回答');
 assert.equal(ui.writes.length,0);
 assert.equal(ui.stored(),initial);
 assert.match(ui.status.textContent,/保存できませんでした/);
});

test('an external progress update is preserved when the preview saves later',async()=>{
 const initial=JSON.stringify({'2025:pm1:1':{written:'元の本文'}});
 const ui=await preview(initial,'external-update');
 const changed={
  '2025:pm1:1':{written:'別画面の新しい本文',level:'mastered',writtenBySubquestion:{'s2':'別設問の更新'}},
  '2025:pm1:2':{written:'別の問題への更新'}
 };
 ui.externalWrite(JSON.stringify(changed));
 ui.input('この設問の新しい回答');
 const out=JSON.parse(ui.stored());
 assert.equal(out['2025:pm1:1'].written,'別画面の新しい本文');
 assert.equal(out['2025:pm1:1'].level,'mastered');
 assert.equal(out['2025:pm1:1'].writtenBySubquestion.s2,'別設問の更新');
 assert.equal(out['2025:pm1:1'].writtenBySubquestion['s1-1'],'この設問の新しい回答');
 assert.deepEqual(out['2025:pm1:2'],changed['2025:pm1:2']);
});
test('a quota failure retains the unsaved draft until manual retry succeeds',async()=>{
 const initial=JSON.stringify({'2025:pm1:1':{written:'保持する本文'}});
 const ui=await preview(initial,'quota-retry');
 ui.rejectWrites(true);
 ui.input('失いたくない回答');
 assert.equal(ui.writes.length,0);
 assert.equal(ui.stored(),initial);
 assert.equal(ui.textarea.value,'失いたくない回答');
 assert.equal(ui.retryButton.hidden,false);
 assert.match(ui.status.textContent,/保存できませんでした/);
 ui.rejectWrites(false);
 ui.retry();
 assert.equal(ui.retryButton.hidden,true);
 assert.equal(ui.writes.length,1);
 assert.equal(JSON.parse(ui.stored())['2025:pm1:1'].writtenBySubquestion['s1-1'],'失いたくない回答');
 assert.equal(JSON.parse(ui.stored())['2025:pm1:1'].written,'保持する本文');
});
test('a malformed nested answer container cannot erase existing progress',async()=>{
 const initial=JSON.stringify({'2025:pm1:1':{written:'残す回答',writtenBySubquestion:[]},other:{level:'review'}});
 const ui=await preview(initial,'bad-answer-map');
 ui.input('上書きしない');
 assert.equal(ui.writes.length,0);
 assert.equal(ui.stored(),initial);
 assert.equal(ui.retryButton.hidden,false);
 assert.match(ui.status.textContent,/保存できませんでした/);
});
