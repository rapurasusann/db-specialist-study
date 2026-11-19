import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/glossary.js',import.meta.url),'utf8');
function simulate({texts,terms}){
 const root={
  parts:[],replacements:0,handlers:{},
  addEventListener(event,fn){this.handlers[event]=fn},
  querySelectorAll(){return this.parts.filter(x=>x.type==='button'&&x.className==='glossary-term'&&x.dataset.glossaryId)},
 };
 const parent={
  closest(){return null},
 };
 const putText=text=>({type:'text',nodeValue:text,parentElement:parent,parentNode:root});
 root.parts=texts.map(putText);
 root.replaceChild=(fragment,node)=>{
  const index=root.parts.indexOf(node);
  assert.ok(index>=0);
  root.parts.splice(index,1,...fragment.parts.map(child=>
   child.type==='text'?putText(child.nodeValue):child));
  root.replacements++;
 };
 let observeCallback=null;
 const document={
  getElementById(id){return id==='questionText'?root:null},
  head:{append(){}},body:{append(){}},
  createElement(tag){return {
   type:tag,tag,style:{},dataset:{},attrs:{},className:'',textContent:'',
   setAttribute(name,value){this.attrs[name]=String(value)},
   removeAttribute(name){delete this.attrs[name]},
  }},
  createDocumentFragment(){return {parts:[],append(child){this.parts.push(child)}}},
  createTextNode(value){return {type:'text',nodeValue:value}},
  createTreeWalker(_root,_type,{acceptNode}){
   let nodes=[],pos=0;
   return {
    nextNode(){
     if(!nodes.length){nodes=root.parts.filter(x=>x.type==='text'
       &&acceptNode(x)===1);pos=0;}
     if(pos>=nodes.length)return false;
     this.currentNode=nodes[pos++];return true;
    },currentNode:null
   };
  },
  addEventListener(){},
 };
 const window={DBStudyGlossaryTerms:terms,addEventListener(){}};
 class MutationObserver {
  constructor(fn){observeCallback=fn}
  observe(){}
 }
 vm.runInNewContext(source,{
  document,window,MutationObserver,
  NodeFilter:{SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2}
 });
 const buttons=()=>root.parts.filter(x=>x.type==='button'&&x.className==='glossary-term');
 const plain=()=>root.parts.filter(x=>x.type==='text').map(x=>x.nodeValue).join('');
 return {root,buttons,plain,rerun:()=>observeCallback(),rerender(text){
  root.parts=[putText(text)];observeCallback();
 }};
}

test('each concept gets a tooltip only on its first occurrence in a question',()=>{
 const s=simulate({texts:['正規化 正規化 関数従属',' 関数従属 正規化'],terms:[
  {id:'norm',term:'正規化',definition:'definition A'},
  {id:'fd',term:'関数従属',definition:'definition B'}]});
 assert.deepEqual(s.buttons().map(x=>x.textContent),['正規化','関数従属']);
 assert.deepEqual(s.buttons().map(x=>x.dataset.glossaryId),['norm','fd']);
 assert.equal(s.plain().includes('正規化'),true);
 assert.equal(s.plain().includes('関数従属'),true);
 const replacements=s.root.replacements;
 s.rerun();
 assert.equal(s.root.replacements,replacements,'unchanged repeated text must not trigger an observer loop');
});
test('aliases of one concept share the single tooltip allowance',()=>{
 const s=simulate({texts:['第3正規形と第三正規形と第3正規形'],terms:[
  {id:'third',term:'第3正規形',aliases:['第三正規形'],definition:'definition'}]});
 assert.deepEqual(s.buttons().map(x=>x.textContent),['第3正規形']);
 assert.ok(s.plain().includes('第三正規形'));
 s.rerender('第三正規形と第3正規形');
 assert.deepEqual(s.buttons().map(x=>x.textContent),['第三正規形'],
  'a newly rendered question must allow its first occurrence again');
});
