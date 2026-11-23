// CS-03 account-scoped learning coordinator.
// Never imports unowned legacy records or silently merges them into an account.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
export function createCs03ScopedProgress({account}) {
 if(!account || !['session','pull','save','readLocal'].every(name=>typeof account[name]==='function'))
  throw new Error('ACCOUNT_PROGRESS_REQUIRED');
 let boundUser=null;
 const loaded=new Set();
 async function verifyBound(){
  if(!boundUser)throw new Error('ACCOUNT_NOT_BOUND');
  const user=await account.session();
  if(user?.id!==boundUser)throw new Error('ACCOUNT_CHANGED');
  return boundUser;
 }
 async function bind(){
  const user=await account.session();
  if(!UUID.test(user?.id??''))throw new Error('SIGN_IN_REQUIRED');
  boundUser=user.id;
  loaded.clear();
  return {userId:boundUser,records:snapshot()};
 }
 function snapshot(){
  if(!boundUser)throw new Error('ACCOUNT_NOT_BOUND');
  const records=account.readLocal(boundUser);
  const output={};
  for(const [id,row] of Object.entries(records??{})){
   if(KEY.test(id)&&row?.data&&typeof row.data==='object'&&!Array.isArray(row.data))
    output[id]=structuredClone(row.data);
  }
  return output;
 }
 async function pull(id){
  if(!KEY.test(id))throw new Error('INVALID_RECORD');
  await verifyBound();
  const result=await account.pull(id);
  await verifyBound();
  loaded.add(id);
  // Absence on server is not permission to import legacy device progress.
  return result?.data?structuredClone(result.data):null;
 }
 async function save(id,data){
  if(!KEY.test(id)||!data||typeof data!=='object'||Array.isArray(data))
   throw new Error('INVALID_RECORD');
  await verifyBound();
  // Save is permitted only after the caller explicitly loaded this question.
  // A hidden pre-save pull could silently overwrite a newer remote value.
  if(!loaded.has(id))throw new Error('REMOTE_READ_REQUIRED');
  let result;
  try{result=await account.save(id,structuredClone(data));}
  catch(error){
   // Any failed save invalidates the last explicit read, including conflicts.
   loaded.delete(id);
   throw error;
  }
  await verifyBound();
  return structuredClone(result.data);
 }
 async function list(){
  const user=await verifyBound();
  if(typeof account.listProgress!=='function')throw Error('ACCOUNT_LIST_UNAVAILABLE');
  const snapshot=await account.listProgress();
  await verifyBound();
  // No implicit legacy merge; show only a validated snapshot for this user.
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))throw Error('INVALID_PROGRESS_LIST');
  const out={};
  for(const [id,record] of Object.entries(snapshot)){
    if(!KEY.test(id)||!record?.data||typeof record.data!=='object'||Array.isArray(record.data))
      throw Error('INVALID_PROGRESS_LIST');
    out[id]=structuredClone(record);
  }
  return Object.freeze({userId:user,records:out});
 }
 function unbind(){boundUser=null;loaded.clear();}
 return Object.freeze({bind,unbind,snapshot,pull,save,list});
}
