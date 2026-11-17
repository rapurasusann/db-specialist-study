'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const clipScript = fs.readFileSync(path.join(__dirname,'..','src','am2-figure-clips.js'),'utf8');

test('AM2 Q6: reconstructed accessible order table includes all 9 columns and 10 exact rows', () => {
  const inserted=[];
  let hidden=false;
  const createNode = name => ({
    name,style:{cssText:''},children:[],attributes:{},textContent:'',
    append(...items){this.children.push(...items);},
    setAttribute(name,value){this.attributes[name]=value;},
    querySelector(q){return q==='h3' ? title : null}
  });
  const title={insertAdjacentElement(where,node){assert.equal(where,'afterend');inserted.push(node);}};
  const viewer={classList:{toggle(name,value){assert.equal(name,'hide');hidden=value;}}};
  const panel=createNode('panel');
  const context={
    year:2025,courseId:'am2',number:6,
    document:{
      createElement:createNode,
      createElementNS(_ns,name){return createNode(name)},
      getElementById(id){return id==='localViewer'?viewer:panel;}
    },
    showQuestion(){}
  };
  vm.createContext(context);
  vm.runInContext(clipScript,context,{timeout:1000});
  context.showQuestion();
  assert.equal(hidden,true,'original full page must be hidden for Q6');
  assert.equal(inserted.length,1);
  const figure=inserted[0],table=figure.children[0];
  assert.equal(figure.attributes['data-study-table'],'am2-q6');
  assert.equal(table.name,'table');
  assert.equal(table.attributes['aria-label'],'問6 受注データの表');
  const [head,body]=table.children;
  const headers=head.children[0].children.map(x=>x.textContent);
  assert.deepEqual(headers,['受注番号','顧客コード','顧客名','受注日','商品コード','商品名','単価','受注数','受注金額']);
  const rows=body.children.map(tr=>tr.children.map(cell=>cell.textContent));
  assert.equal(rows.length,10);
  for(const row of rows) assert.equal(row.length,9);
  assert.deepEqual(rows[0],['1055','A7053','鈴木電気','2025-07-01','T035','テレビA','85,000','10','850,000']);
  assert.deepEqual(rows[4],['2030','B7060','中村商会','2025-07-03','S172','Blu-rayプレイヤーB','78,000','10','780,000']);
  assert.deepEqual(rows[9],['3090','B7060','中村商会','2025-07-04','T035','テレビA','85,000','2','170,000']);
  assert.match(table.style.cssText,/min-width/);
  assert.match(figure.style.cssText,/overflow-x:auto/);
  context.number=8;
  context.showQuestion();
  assert.equal(hidden,false,'other questions must show the original viewer again');
  assert.equal(inserted[1].children[0].name,'img');
});
