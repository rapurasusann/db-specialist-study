/* DB Study sync merge: pure, no network access. */
(function(root){
'use strict';
const ID=/^20\d{2}:(am1|am2|pm1|pm2):([1-9]|[1-9]\d|100)$/;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const timestamp=v=>{const n=Date.parse(v);return Number.isFinite(n)?n:0};
const canonical=x=>Array.isArray(x)?x.map(canonical):object(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function merge(local,remote){
 if(!object(local)||!Array.isArray(remote))throw Error('Invalid sync payload');
 const progress=Object.create(null),uploads=[],conflicts=[],byId=new Map();
 for(const r of remote){if(object(r)&&ID.test(r.question_id)&&object(r.data)&&!byId.has(r.question_id))byId.set(r.question_id,r)}
 const keys=new Set([...Object.keys(local).filter(id=>ID.test(id)),...byId.keys()]);
 for(const id of keys){
  const a=object(local[id])?local[id]:null,b=byId.get(id)?.data??null;
  if(!a&&b){progress[id]=b;continue}
  if(a&&!b){progress[id]=a;uploads.push({question_id:id,data:a});continue}
  if(!a||!b)continue;
  if(equal(a,b)){progress[id]=a;continue}
  const at=timestamp(a.updatedAt),bt=timestamp(b.updatedAt);
  if(at>bt){progress[id]=a;uploads.push({question_id:id,data:a})}
  else if(bt>at){progress[id]=b}
  else{progress[id]=a;conflicts.push({question_id:id,local:a,remote:b})}
 }
 return {progress,uploads,conflicts};
}
const api=Object.freeze({merge});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.DBStudyMerge=api;
})(typeof globalThis==='object'?globalThis:this);
