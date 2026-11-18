import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03StudyHint} from '../src/cs03-study-hint.mjs';
const Q='2025:am2:1';let selected=Q;
const make=()=>{const root={hidden:true,textContent:''};return {root,hint:createCs03StudyHint({root,selectedId:()=>selected})};};
test('read-only account hint shows selected account level separately',()=>{
 selected=Q;const x=make();x.hint.show(Q,{level:'mastered'});
 assert.equal(x.root.hidden,false);assert.match(x.root.textContent,/アカウント履歴（閲覧専用）：習得済み/);
 assert.match(x.root.textContent,/端末内履歴には反映していません/);
});
test('navigation clears old account hint',()=>{
 selected=Q;const x=make();x.hint.show(Q,{level:'review'});selected='2025:am2:2';
 assert.equal(x.hint.current(),false);assert.equal(x.root.hidden,true);assert.equal(x.root.textContent,'');
});
test('stale response for another question is not displayed',()=>{
 selected='2025:am2:2';const x=make();
 assert.throws(()=>x.hint.show(Q,{level:'review'}),/SELECTED_QUESTION_CHANGED/);
 assert.equal(x.root.hidden,true);
});
test('untrusted mastery text cannot inject markup',()=>{
 selected=Q;const x=make();x.hint.show(Q,{level:'<img src=x onerror=alert(1)>'});
 assert.ok(!x.root.textContent.includes('<img'));assert.match(x.root.textContent,/記録あり/);
});
test('clear hides account data on logout',()=>{
 selected=Q;const x=make();x.hint.show(Q,{level:'review'});x.hint.clear();
 assert.equal(x.root.hidden,true);assert.equal(x.root.textContent,'');
});
