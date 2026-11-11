/* Revision-based DB / PM / SC sync engine: never uses timestamps to decide overwrites.
   The caller persists local rows and revision baselines independently. */
(function(root){
'use strict';
const ID=/^20\d{2}:(am1|am2|pm1|pm2):([1-9]|[1-9]\d|100)$/;
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function canonical(v){
 if(Array.isArray(v))return v.map(canonical);
 if(isObject(v))return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));
 return v;
}
function equal(a,b){return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))}
function createSyncEngine({transport,readLocal,writeLocal,readBaseline,writeBaseline,onConflict=()=>{}}){
 if(!transport||typeof transport.list!=='function'||typeof transport.put!=='function'||[readLocal,writeLocal,readBaseline,writeBaseline,onConflict].some(f=>typeof f!=='function'))throw Error('Invalid sync engine configuration');
 let busy=false;
 async function sync(){
  if(busy)return {busy:true};
  busy=true;
  let received=0,sent=0;
  const conflicts=[];
  try{
   const rows=await transport.list();
   if(!Array.isArray(rows))throw Error('Invalid remote rows');
   const remote=new Map();
   for(const r of rows){
    if(!r||!ID.test(r.question_id)||!isObject(r.data)||!Number.isSafeInteger(Number(r.revision))||Number(r.revision)<1||remote.has(r.question_id))throw Error('Invalid remote progress row');
    remote.set(r.question_id,{data:r.data,revision:Number(r.revision)});
   }
   const local=readLocal(),baseline=readBaseline();
   if(!isObject(local)||!isObject(baseline))throw Error('Invalid local progress');
   const ids=new Set([...Object.keys(local).filter(id=>ID.test(id)),...remote.keys()]);
   for(const id of ids){
    const mine=isObject(local[id])?local[id]:null;
    const theirs=remote.get(id)??null;
    const previous=isObject(baseline[id])&&isObject(baseline[id].data)&&Number.isSafeInteger(baseline[id].revision)?baseline[id]:null;
    const preserveConflict=()=>{
     conflicts.push({question_id:id,local:mine,remote:theirs?.data??null,remoteRevision:theirs?.revision??null});
    };
    if(!theirs){
     if(!mine)continue;
     if(previous){preserveConflict();continue}
     const out=await transport.put(id,mine,0);
     if(!Number.isSafeInteger(Number(out.revision))||Number(out.revision)<1)throw Error('Invalid server revision');
     baseline[id]={revision:Number(out.revision),data:mine};
     writeBaseline(baseline);
     sent++;continue;
    }
    if(!mine){
     if(previous){preserveConflict();continue}
     local[id]=theirs.data;
     writeLocal(local);
     baseline[id]={revision:theirs.revision,data:theirs.data};
     writeBaseline(baseline);
     received++;continue;
    }
    if(equal(mine,theirs.data)){
     baseline[id]={revision:theirs.revision,data:theirs.data};
     writeBaseline(baseline);
     continue;
    }
    if(!previous){preserveConflict();continue}
    const localChanged=!equal(mine,previous.data);
    const remoteChanged=theirs.revision!==previous.revision||!equal(theirs.data,previous.data);
    if(localChanged&&remoteChanged){preserveConflict();continue}
    if(remoteChanged){
     local[id]=theirs.data;
     writeLocal(local);
     baseline[id]={revision:theirs.revision,data:theirs.data};
     writeBaseline(baseline);
     received++;continue;
    }
    if(localChanged){
     const out=await transport.put(id,mine,theirs.revision);
     if(!Number.isSafeInteger(Number(out.revision))||Number(out.revision)<=theirs.revision)throw Error('Invalid server revision');
     baseline[id]={revision:Number(out.revision),data:mine};
     writeBaseline(baseline);
     sent++;
    }
   }
   onConflict(conflicts);
   return {received,sent,conflicts};
  }finally{busy=false}
 }
 return Object.freeze({sync});
}
const api=Object.freeze({createSyncEngine});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.DBStudySyncEngine=api;
})(typeof globalThis==='object'?globalThis:this);
