import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/cs03-selected-question.js',import.meta.url),'utf8');
test('study page exposes only a read-only selected-question bridge',()=>{
 const window={};const sandbox={window,year:2025,courseId:'am2',number:4};
 runInNewContext(js,sandbox);
 assert.equal(window.CS03_SELECTED_QUESTION.read(),'2025:am2:4');
 assert.equal(Object.isFrozen(window.CS03_SELECTED_QUESTION),true);
});
test('selected-question bridge rejects invalid question identifiers',()=>{
 const window={};const sandbox={window,year:2025,courseId:'am2',number:101};
 runInNewContext(js,sandbox);
 assert.throws(()=>window.CS03_SELECTED_QUESTION.read(),/INVALID_SELECTED_QUESTION/);
});
test('account progress read is opt-in and cannot modify original page progress',()=>{
 assert.match(html,/data-cs03="load-progress"/);
 assert.match(html,/data-cs03="record-status"/);
 assert.match(html,/src="src\/cs03-selected-question\.js"/);
 assert.match(html,/id="cs03AccountPanel" hidden/);
 assert.match(js,/Object\.defineProperty\(window,'CS03_SELECTED_QUESTION'/);
 assert.doesNotMatch(js,/localStorage|setItem|progress\s*=/);
});
