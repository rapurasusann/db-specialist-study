// Explicit one-question copy from legacy device progress to the authenticated account.
// This never modifies legacy storage, never copies automatically and refuses remote overwrite.
const QUESTION=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
export function createCs03ManualTransfer({scoped,readLegacy,confirmTransfer}) {
 if(!scoped || !['pull','save'].every(k=>typeof scoped[k]==='function') ||
   typeof readLegacy!=='function'||typeof confirmTransfer!=='function')
  throw Error('TRANSFER_DEPENDENCIES_REQUIRED');
 async function transfer(id) {
  if(!QUESTION.test(id))throw Error('INVALID_RECORD');
  // Copy the exact selected record; no whole-device migration or merge.
  const row=readLegacy(id);
  if(!row||typeof row!=='object'||Array.isArray(row)||Object.keys(row).length===0)
   throw Error('NO_DEVICE_RECORD');
  const data=structuredClone(row);
  if(JSON.stringify(data).length>14000)throw Error('RECORD_TOO_LARGE');
  const remote=await scoped.pull(id);
  if(remote!==null)throw Error('REMOTE_RECORD_EXISTS');
  const approved=await confirmTransfer(id);
  if(approved!==true)return {copied:false};
  // Do not send a record if it changed while awaiting the confirmation.
  if(JSON.stringify(readLegacy(id))!==JSON.stringify(data))
   throw Error('DEVICE_RECORD_CHANGED');
  await scoped.save(id,data);
  return {copied:true,id};
 }
 return Object.freeze({transfer});
}
