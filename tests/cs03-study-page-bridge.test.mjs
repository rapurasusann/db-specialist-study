import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../src/cs03-study-page-bridge.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(){
 const original={'2025:am2:1':{level:'mastered'}};
 const status={textContent:'',hidden:true};
 const remote={'2025:am2:4':{level:'review'}};
 const edits=[],reads=[],calls=[];
 let state={pending:[],blocked:[],inFlight:[]};
 const auto={
  open:async id=>{reads.push(id);return structuredClone(remote[id]??null);},
  edit:(id,data)=>{edits.push([id,structuredClone(data)]);return Promise.resolve(data);},
  state:()=>state
 };
 const context={window:{},document:{getElementById:()=>status},progress:original,
  year:2025,courseId:'am2',number:4,
  renderMode:()=>calls.push('renderMode'),
  renderMetrics:()=>calls.push('renderMetrics'),
  renderQuestions:()=>calls.push('renderQuestions'),
  renderAnswer:()=>calls.push('renderAnswer'),
  structuredClone
 };
 runInNewContext(source,context);
 return {context,original,status,auto,reads,edits,calls,remote,
  bridge:context.window.CS03_STUDY_PAGE,setState:x=>state=x};
}
test('activated account mode displays remote records without copying legacy device progress',async()=>{
 const f=fixture();
 f.bridge.activate({userId:'a',records:{'2025:am2:4':{data:{level:'review'}}}},f.auto);
 assert.equal(f.bridge.inAccountMode(),true);
 assert.equal(f.context.progress['2025:am2:4'].level,'review');
 assert.equal(f.context.progress['2025:am2:1'],undefined);
 assert.equal(f.original['2025:am2:1'].level,'mastered');
 f.bridge.deactivate();
 assert.equal(f.context.progress,f.original);
});
test('a study edit is refused until server question load succeeds',async()=>{
 const f=fixture();
 f.bridge.activate({userId:'a',records:{}},f.auto);
 assert.equal(f.bridge.write('2025:am2:4',{level:'learning'}),false);
 assert.equal(f.edits.length,0);
 f.bridge.onStudyRender();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.reads.length,1);
 assert.equal(f.bridge.write('2025:am2:4',{level:'mastered'}),true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.edits[0][0],'2025:am2:4');
 assert.equal(f.original['2025:am2:4'],undefined);
 assert.equal(f.original['2025:am2:1'].level,'mastered');
});
test('unsaved server changes prevent switching back to device mode',()=>{
 const f=fixture();
 f.bridge.activate({userId:'a',records:{}},f.auto);
 f.setState({pending:['2025:am2:4'],blocked:['2025:am2:4'],inFlight:[]});
 assert.throws(()=>f.bridge.deactivate(),/UNSAVED_ACCOUNT_PROGRESS/);
 assert.equal(f.bridge.inAccountMode(),true);
 assert.equal(f.original['2025:am2:1'].level,'mastered');
});
test('main study put routes account mode without calling legacy save and restore is blocked',()=>{
 assert.match(html,/if\(window\.CS03_STUDY_PAGE\?\.inAccountMode\(\)\)/);
 assert.match(html,/window\.CS03_STUDY_PAGE\.write\(id,update\)/);
 assert.match(html,/window\.CS03_STUDY_PAGE\?\.onStudyRender\(\)/);
 assert.match(html,/src="src\/cs03-study-page-bridge\.js"/);
 assert.match(html,/アカウント表示中は端末内履歴を復元できません/);
});
