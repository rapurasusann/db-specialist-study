import {validCs03RecordId} from './cs03-learning-record-id.mjs';
// CS-03 read-only reconciliation preview for future cross-device progress.
// Never writes to device storage or an account API. No timestamp-based silent merge.

function source(value,name){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('SYNC_PREVIEW_INVALID_'+name);
 const normalized=new Map();
 for(const [id,row] of Object.entries(value)){
  if(!validCs03RecordId(id)||!row||typeof row!=='object'||Array.isArray(row))throw Error('SYNC_PREVIEW_INVALID_'+name);
  const data=name==='ACCOUNT'?row.data:row;
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('SYNC_PREVIEW_INVALID_'+name);
  if(Object.keys(data).some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('SYNC_PREVIEW_INVALID_'+name);
  normalized.set(id,structuredClone(data));
 }
 return normalized;
}
export function previewCs03Sync({deviceRecords,accountListing}){
 const device=source(deviceRecords,'DEVICE');
 const account=source(accountListing?.records,'ACCOUNT');
 const ids=[...new Set([...device.keys(),...account.keys()])].sort((a,b)=>a.localeCompare(b,'en'));
 const entries=ids.map(id=>{
  const local=device.get(id),remote=account.get(id);
  const direction=local&&remote?'CONFLICT':local?'DEVICE_ONLY':'ACCOUNT_ONLY';
  // Don't imply records with equal displayed fields can safely be overwritten:
  // revisions, update timestamps and account binding also affect correctness.
  return Object.freeze({id,direction,device:local?structuredClone(local):null,account:remote?structuredClone(remote):null});
 });
 const counts=Object.freeze({
  deviceOnly:entries.filter(e=>e.direction==='DEVICE_ONLY').length,
  accountOnly:entries.filter(e=>e.direction==='ACCOUNT_ONLY').length,
  conflicts:entries.filter(e=>e.direction==='CONFLICT').length
 });
 return Object.freeze({userId:accountListing.userId,counts,entries:Object.freeze(entries),
   requiresExplicitApproval:true,automaticWrites:false});
}
