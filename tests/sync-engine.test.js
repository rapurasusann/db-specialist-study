'use strict';
const assert=require('node:assert/strict');
const {createSyncEngine}=require('../src/sync-engine.js');
function scenario(initialLocal={},initialRemote={},initialBaseline={}){
 let local=structuredClone(initialLocal),baseline=structuredClone(initialBaseline),conflicts=[];
 const rows=structuredClone(initialRemote);
 let sent=0;
 const transport={
  async list(){return Object.entries(rows).map(([question_id,r])=>({question_id,...structuredClone(r)}))},
  async put(id,data,expectedRevision){
   const old=rows[id];
   if((old?.revision??0)!==expectedRevision)throw Error('409 conflict');
   rows[id]={data:structuredClone(data),revision:expectedRevision+1};
   sent++;return {revision:rows[id].revision};
  }
 };
 return {
  sync:createSyncEngine({transport,readLocal:()=>structuredClone(local),writeLocal:v=>{local=structuredClone(v)},readBaseline:()=>structuredClone(baseline),writeBaseline:v=>{baseline=structuredClone(v)},onConflict:v=>{conflicts=structuredClone(v)}}).sync,
  state:()=>({local,baseline,rows,conflicts,sent})
 };
}
const id='2025:am2:1';
(async()=>{
 let t=scenario({[id]:{level:'review'}});let r=await t.sync();
 assert.equal(r.sent,1);assert.equal(t.state().rows[id].revision,1);
 t=scenario({}, {[id]:{revision:4,data:{level:'mastered'}}});r=await t.sync();
 assert.equal(r.received,1);assert.equal(t.state().local[id].level,'mastered');
 t=scenario({[id]:{level:'review'}},{[id]:{revision:1,data:{level:'mastered'}}});r=await t.sync();
 assert.equal(r.conflicts.length,1);assert.equal(t.state().local[id].level,'review');assert.equal(t.state().rows[id].data.level,'mastered');
 const baseline={[id]:{revision:1,data:{level:'review'}}};
 t=scenario({[id]:{level:'mastered'}},{[id]:{revision:1,data:{level:'review'}}},baseline);r=await t.sync();
 assert.equal(r.sent,1);assert.equal(t.state().rows[id].revision,2);
 t=scenario({[id]:{level:'review'}},{[id]:{revision:2,data:{level:'mastered'}}},baseline);r=await t.sync();
 assert.equal(r.received,1);assert.equal(t.state().local[id].level,'mastered');
 t=scenario({[id]:{level:'learning'}},{[id]:{revision:2,data:{level:'mastered'}}},baseline);r=await t.sync();
 assert.equal(r.conflicts.length,1);assert.equal(t.state().local[id].level,'learning');assert.equal(t.state().sent,0);
 t=scenario({[id]:{level:'learning'}},{},baseline);r=await t.sync();
 assert.equal(r.conflicts.length,1);assert.equal(t.state().sent,0);
 t=scenario({'custom-year-data':{preserve:true}},{});await t.sync();
 assert.equal(t.state().local['custom-year-data'].preserve,true);
 console.log('sync-engine 8 scenarios PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
