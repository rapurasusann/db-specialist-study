import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCs03HistoryView,clearCs03HistoryView} from '../src/cs03-history-view.mjs';
class Node{
 constructor(tag='div',doc=null){this.tag=tag;this.ownerDocument=doc??this;this.children=[];this.textContent='';this.hidden=true;this.attrs={};}
 createElement(tag){return new Node(tag,this.ownerDocument);}
 setAttribute(k,v){this.attrs[k]=v;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
}
const listing=()=>({records:{'2025:am2:2':{revision:2,data:{level:'mastered'}},'2025:am2:1':{revision:1,data:{level:'review'}}}});
test('read-only account view sorts rows and labels mastery',()=>{
 const root=new Node();
 const result=renderCs03HistoryView(root,listing());
 assert.deepEqual(result,{total:2,shown:2});
 assert.equal(root.hidden,false);
 const body=root.children[1].children[1];
 assert.equal(body.children[0].children[0].textContent,'2025:am2:1');
 assert.equal(body.children[0].children[1].textContent,'要復習');
 assert.equal(body.children[1].children[1].textContent,'習得済み');
});
test('invalid account question is rejected before display',()=>{
 const root=new Node(),input=listing();
 input.records['../../bad']={revision:1,data:{level:'mastered'}};
 assert.throws(()=>renderCs03HistoryView(root,input),/HISTORY_VIEW_INVALID/);
 assert.equal(root.children.length,0);
});
test('table limits number of displayed records',()=>{
 const root=new Node(),input=listing();
 const result=renderCs03HistoryView(root,input,{maxRows:1});
 assert.deepEqual(result,{total:2,shown:1});
 assert.match(root.children[2].textContent,/全2件中1件/);
});
test('clearing view removes previous account records',()=>{
 const root=new Node();
 renderCs03HistoryView(root,listing());
 clearCs03HistoryView(root);
 assert.equal(root.hidden,true);
 assert.equal(root.children.length,0);
});
test('untrusted level is emitted as text, not executable markup',()=>{
 const root=new Node(),input=listing();
 input.records['2025:am2:1'].data.level='<img src=x onerror=alert(1)>';
 renderCs03HistoryView(root,input);
 assert.equal(root.children[1].children[1].children[0].children[1].textContent,'記録あり');
 assert.equal(root.children[1].children[1].children[0].children.length,3);
});
