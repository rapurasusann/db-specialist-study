// CS-03 account-scoped learning coordinator.
// Never imports unowned legacy records or silently merges them into an account.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
export function createCs03ScopedProgress({account}) {
 if(!account || !['session','pull','save','readLocal'].every(name=>typeof account[name]==='function'))
  throw new Error('ACCOUNT_PROGRESS_REQUIRED');
 let boundUser=null;
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
  // Absence on server is not permission to import legacy device progress.
  return result?.data?structuredClone(result.data):null;
 }
 async function save(id,data){
  if(!KEY.test(id)||!data||typeof data!=='object'||Array.isArray(data))
   throw new Error('INVALID_RECORD');
  await verifyBound();
  // Re-check server revision, then write. The underlying client fails on conflicts.
  // Do NOT retry a conflict by overwriting a newer server revision.
  await account.pull(id);
  await verifyBound();
  const result=await account.save(id,structuredClone(data));
  await verifyBound();
  return structuredClone(result.data);
 }
 function unbind(){boundUser=null;}
 return Object.freeze({bind,unbind,snapshot,pull,save});
}
