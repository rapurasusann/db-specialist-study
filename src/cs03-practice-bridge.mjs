// Account-only adapter for the new practice modes. No localStorage writes.
import {validCs03RecordId,termRecordId,stepRecordId,localStepId} from './cs03-learning-record-id.mjs';
export function createCs03PracticeBridge({notify=()=>{}}={}){
 let active=null;
 const key=(kind,id)=>kind==='term'?termRecordId(id):kind==='step'?stepRecordId(id):(()=>{throw Error('INVALID_KIND')})();
 const clone=x=>structuredClone(x);
 function activate(listing,auto){
  if(active||!listing?.records||!auto||!['open','edit','state'].every(k=>typeof auto[k]==='function')||auto.state().userId!==listing.userId)throw Error('PRACTICE_SESSION_INVALID');
  const rows=new Map();
  for(const [id,row] of Object.entries(listing.records)){
   if(!validCs03RecordId(id)||!row?.data||typeof row.data!=='object'||Array.isArray(row.data))throw Error('PRACTICE_SNAPSHOT_INVALID');
   if(id.startsWith('term:')||id.startsWith('step:'))rows.set(id,clone(row.data));
  }
  active={userId:listing.userId,auto,rows,ready:new Set(),loading:new Map()};
 }
 function deactivate(){active=null;}
 function current(ctx){if(active!==ctx||!ctx.auto.state().active||ctx.auto.state().userId!==ctx.userId)throw Error('ACCOUNT_SESSION_CHANGED');}
 function read(kind){
  if(!active)return null;
  current(active);
  const result=Object.create(null);
  for(const [id,row] of active.rows){if(kind==='term'&&id.startsWith('term:'))result[id.slice(5)]=clone(row);if(kind==='step'&&id.startsWith('step:'))result[localStepId(id)]=clone(row);}
  return result;
 }
 async function open(kind,id){
  if(!active)return true;
  const ctx=active,k=key(kind,id);current(ctx);
  if(ctx.loading.has(k))return ctx.loading.get(k);
  ctx.ready.delete(k);
  const p=(async()=>{try{const row=await ctx.auto.open(k);current(ctx);if(row===null)ctx.rows.delete(k);else ctx.rows.set(k,clone(row));ctx.ready.add(k);return true;}finally{ctx.loading.delete(k);}})();
  ctx.loading.set(k,p);return p;
 }
 function write(kind,id,data){
  const ctx=active;if(!ctx)throw Error('ACCOUNT_MODE_INACTIVE');current(ctx);
  const k=key(kind,id);
  if(!ctx.ready.has(k)||ctx.auto.state().blocked.includes(k))throw Error('REMOTE_READ_REQUIRED');
  const row=clone(data);
  if(kind==='term'){
   if(!Number.isSafeInteger(row.attempts)||row.attempts<1||row.attempts>100000||typeof row.correct!=='boolean'||!Number.isSafeInteger(row.streak)||row.streak<0||row.streak>row.attempts)throw Error('INVALID_RECORD');
   row.level=row.correct?(row.streak>=2?'mastered':'learning'):'review';
  }else{if(!['review','learning','mastered'].includes(row.status))throw Error('INVALID_RECORD');row.level=row.status;}
  row.updatedAt=new Date().toISOString();
  const pending=ctx.auto.edit(k,row);
  ctx.rows.set(k,clone(row));
  Promise.resolve(pending).then(()=>{if(active===ctx)notify('saved',k);},()=>{if(active===ctx){ctx.ready.delete(k);notify('blocked',k);}});
  return true;
 }
 return Object.freeze({activate,deactivate,isActive:()=>active!==null,read,open,write});
}
