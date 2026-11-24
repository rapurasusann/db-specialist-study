import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
function fakePage(){
 const nodes=new Map();
 class Element{
  constructor(tag){this.tagName=tag;this.id='';this.hidden=false;this.children=[];
   this.value='';this.listeners={};this.attrs={};this.className='';this.style={};
   this.classList={add(){},remove(){}};this._html='';}
  set innerHTML(value){
   this._html=value;
   for(const m of value.matchAll(/<(?:div|select|a|textarea|button|p)\b[^>]*\bid="([^"]+)"/g)){
    const el=new Element('child');el.id=m[1];nodes.set(el.id,el);
   }
  }
  get innerHTML(){return this._html;}
  insertAdjacentElement(_at,el){nodes.set(el.id,el);return el;}
  append(...children){this.children.push(...children);for(const x of children)if(x.id)nodes.set(x.id,x);}
  replaceChildren(...children){this.children=children;}
  setAttribute(name,value){this.attrs[name]=value;}
  addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);}
  dispatch(name){for(const fn of this.listeners[name]??[])fn({target:this});}
  click(){this.dispatch('click');}
 }
 for(const id of ['viewStudy','viewDashboard','study','dashboard','termPractice','viewTerms','metrics']){
  const el=new Element('div');el.id=id;nodes.set(id,el);
 }
 const document={
  createElement:tag=>new Element(tag),
  getElementById:id=>nodes.get(id)||null,
  querySelector:selector=>selector==='.metrics'?nodes.get('metrics'):null,
  addEventListener(){},
  head:new Element('head')
 };
 const win={addEventListener(){}};
 runInNewContext(source('src/pm-archive-data.js'),{window:win});
 let saves=0;
 const progress={};
 const pending=new Map();let nextTimer=0;
 const setTimeoutFake=fn=>{const id=++nextTimer;pending.set(id,fn);return id;};
 const clearTimeoutFake=id=>pending.delete(id);
 const code=source('src/pm-archive-view.js');
 assert.doesNotThrow(()=>new Script(code));
 runInNewContext(code,{window:win,document,progress,
  save:()=>{saves++;},setTimeout:setTimeoutFake,clearTimeout:clearTimeoutFake,Date});
 return {get:id=>nodes.get(id),progress,getSaves:()=>saves};
}
test('archive opens separately and leaves the existing 2025 study panel intact',()=>{
 const h=fakePage();
 h.get('viewPmArchive').click();
 assert.equal(h.get('pmArchive').hidden,false);
 assert.equal(h.get('study').className,'');
 assert.equal(h.get('pmArchiveQuestions').children.length,3);
 assert.match(h.get('pmArchivePdf').href,/2025r07a_db_pm1_qs\.pdf#page=6$/);
 assert.match(h.get('pmArchiveAnswer').href,/2025r07a_db_pm1_ans\.pdf$/);
});
test('switching to 2024 PM-II question 2 saves notes and level to the existing backup key format',()=>{
 const h=fakePage();
 h.get('viewPmArchive').click();
 h.get('pmArchiveYear').value='2024';h.get('pmArchiveYear').dispatch('change');
 h.get('pmArchiveSession').value='pm2';h.get('pmArchiveSession').dispatch('change');
 h.get('pmArchiveQuestions').children[1].click();
 assert.match(h.get('pmArchivePdf').href,/2024r06a_db_pm2_qs\.pdf$/);
 h.get('pmArchiveWritten').value='テスト用の解答';
 h.get('pmArchiveWritten').dispatch('input');
 h.get('pmArchiveWritten').dispatch('change');
 h.get('pmArchiveLevel').value='review';h.get('pmArchiveLevel').dispatch('change');
 assert.equal(h.progress['2024:pm2:2'].written,'テスト用の解答');
 assert.equal(h.progress['2024:pm2:2'].level,'review');
 assert.equal(h.getSaves(),2);
 assert.equal(h.progress['2025:pm1:1'],undefined);
 h.get('viewDashboard').click();
 assert.equal(h.get('pmArchive').hidden,true);
});
