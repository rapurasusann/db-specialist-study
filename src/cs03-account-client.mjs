import {validCs03RecordId,CS03_MAX_CATALOG_RECORDS} from './cs03-learning-record-id.mjs';
// CS-03 browser-side auth/progress coordinator. No secrets in source or storage.
// Inject the Managed Neon Auth vanilla client and fixed HTTPS API base at integration.
const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function appError(message){return new Error(message);}
function abortCheck(signal){if(signal?.aborted)throw signal.reason??appError('PROGRESS_LIST_CANCELLED');}
function abortable(start,signal){
 if(!signal)return Promise.resolve().then(start);
 abortCheck(signal);
 return new Promise((resolve,reject)=>{
  const onAbort=()=>reject(signal.reason??appError('PROGRESS_LIST_CANCELLED'));
  signal.addEventListener('abort',onAbort,{once:true});
  Promise.resolve().then(()=>{abortCheck(signal);return start();}).then(resolve,reject).finally(()=>signal.removeEventListener('abort',onAbort));
 });
}
function defaultWait(ms,signal){
 return new Promise((resolve,reject)=>{
  abortCheck(signal);
  const timer=setTimeout(()=>{signal?.removeEventListener('abort',cancel);resolve();},ms);
  function cancel(){clearTimeout(timer);reject(signal.reason??appError('PROGRESS_LIST_CANCELLED'));}
  signal?.addEventListener('abort',cancel,{once:true});
 });
}
function checkResult(result) {
 if(result?.error)throw appError('AUTH_REQUEST_FAILED');
 return result?.data;
}
function identity(session){
 const user=session?.user;
 if(!USER_ID.test(user?.id??''))throw appError('SIGN_IN_REQUIRED');
 return user;
}
function checkRecord(id,data){
 if(!validCs03RecordId(id)||!data||typeof data!=='object'||Array.isArray(data))throw appError('INVALID_RECORD');
 if(new TextEncoder().encode(JSON.stringify(data)).length>16000)throw appError('RECORD_TOO_LARGE');
}
export function createCs03AccountClient({authClient,apiUrl,fetcher=fetch,storage,wait=defaultWait,listTimeoutMs=600000,onListStatus=()=>{}}){
 if(!authClient?.signUp?.email||!authClient?.signIn?.email||!authClient?.getSession||!authClient?.signOut||!authClient?.token)
  throw appError('AUTH_CLIENT_REQUIRED');
 let endpoint;
 try{endpoint=new URL(apiUrl)}catch{throw appError('API_NOT_CONFIGURED');}
 if(endpoint.protocol!=='https:'||!endpoint.hostname||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')
  throw appError('API_NOT_CONFIGURED');
 const prefix='db-study-cs03-progress-';
 let currentUser=null,listController=null;
 if(!Number.isSafeInteger(listTimeoutMs)||listTimeoutMs<1||listTimeoutMs>600000||typeof onListStatus!=='function')throw appError('LIST_CONFIG_INVALID');
 function listStatus(status){try{onListStatus(status)}catch{/* display callback cannot alter sync */}}
 function cancelListProgress(){if(!listController)return false;listController.abort(appError('PROGRESS_LIST_CANCELLED'));return true;}
 const storageKey=id=>prefix+id;
 async function session(){
  const s=checkResult(await authClient.getSession());
  const user=identity(s);
  // Account switching invalidates the active account handle.
  currentUser=user.id;
  return user;
 }
 async function jwtFor(userId,signal){
  // Check identity again immediately before requesting a token.
  const latest=await abortable(session,signal);
  if(latest.id!==userId)throw appError('ACCOUNT_CHANGED');
  const data=checkResult(await abortable(()=>authClient.token(),signal));
  if(typeof data?.token!=='string'||!data.token)throw appError('TOKEN_UNAVAILABLE');
  // Auth can switch accounts while token() is in flight.
  if((await abortable(session,signal)).id!==userId)throw appError('ACCOUNT_CHANGED');
  abortCheck(signal);return data.token;
 }
 async function request(userId,method,path,body,signal){
  const token=await jwtFor(userId,signal);abortCheck(signal);
  const headers={authorization:'Bearer '+token};
  if(body!==undefined)headers['content-type']='application/json';
  const response=await abortable(()=>fetcher(new URL(path,endpoint),{
   method,headers,cache:'no-store',credentials:'omit',redirect:'error',
   ...(body!==undefined?{body:JSON.stringify(body)}:{}),...(signal?{signal}:{})
  }),signal);
  // Never process an old account's response after an account switch.
  if((await abortable(session,signal)).id!==userId)throw appError('ACCOUNT_CHANGED');
  if(!response.ok) {
   if(response.status===401)throw appError('SIGN_IN_REQUIRED');
   if(response.status===429)throw appError('PROGRESS_RATE_LIMITED');
   if(response.status===409)throw appError('REVISION_CONFLICT');
   throw appError('PROGRESS_API_FAILED');
  }
  const parsed=await abortable(()=>response.json(),signal);
  if((await abortable(session,signal)).id!==userId)throw appError('ACCOUNT_CHANGED');
  abortCheck(signal);
  return parsed?.data;
 }
 function readLocal(userId){
  if(!storage)return {};
  try{
   const data=JSON.parse(storage.getItem(storageKey(userId))??'{}');
   if(data && typeof data==='object'&&!Array.isArray(data))return data;
  }catch{}
  return {};
 }
 function writeLocal(userId,data){
  if(storage)storage.setItem(storageKey(userId),JSON.stringify(data));
 }
 async function signUp({email,password,name}){
  if(!email||!password||!name)throw appError('CREDENTIALS_REQUIRED');
  return checkResult(await authClient.signUp.email({email,password,name}));
 }
 async function signIn({email,password}){
  if(!email||!password)throw appError('CREDENTIALS_REQUIRED');
  checkResult(await authClient.signIn.email({email,password}));
  return session();
 }
 async function signOut(){
  cancelListProgress();
  try{checkResult(await authClient.signOut());}
  finally{currentUser=null;}
 }
 async function pull(questionId){
  return pullFor((await session()).id,questionId);
 }
 async function pullFor(userId,questionId){
  if(!validCs03RecordId(questionId))throw appError('INVALID_RECORD');
  const examCode='db';
  const value=await request(userId,'GET','progress?examCode='+examCode+'&questionId='+encodeURIComponent(questionId));
  if((await session()).id!==userId)throw appError('ACCOUNT_CHANGED');
  if(value){
   const local=readLocal(userId);
   local[questionId]={data:value.data,revision:value.revision,updatedAt:value.updated_at};
   writeLocal(userId,local);
  }
  return value;
 }
 async function listProgress(){
  if(listController)throw appError('PROGRESS_LIST_IN_PROGRESS');
  const controller=new AbortController(),signal=controller.signal;listController=controller;
  const timer=setTimeout(()=>controller.abort(appError('PROGRESS_LIST_TIMEOUT')),listTimeoutMs);
  listStatus({phase:'loading',received:0});
  try{
  const user=await abortable(session,signal);
  const records={};
  let cursor=null;
  const seen=new Set();
  // An account is bounded to 10 years x 4 exams x 100 questions plus 250 study exercises.
  // Abort rather than silently returning a partial view.
  const maxRecords=CS03_MAX_CATALOG_RECORDS,maxQuotaWaits=180;
  let quotaWaits=0;
  for(let page=0;page<maxRecords;page++){
   const path='progress?examCode=db&limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'');
   let value;
   for(;;){
    try{value=await request(user.id,'GET',path,undefined,signal);break;}
    catch(error){
     if(error.message!=='PROGRESS_RATE_LIMITED')throw error;
     if(quotaWaits>=maxQuotaWaits)throw appError('PROGRESS_LIST_QUOTA_LIMIT');
     quotaWaits++;
     // Gateway does not expose Retry-After. Keep the same cursor and wait a full window.
     listStatus({phase:'quota-wait',received:Object.keys(records).length,waitMs:60000});
     await abortable(()=>wait(60000,signal),signal);
     if((await abortable(session,signal)).id!==user.id)throw appError('ACCOUNT_CHANGED');
    }
   }
   if(!value||!Array.isArray(value.records)||value.records.length>100)throw appError('PROGRESS_LIST_INVALID');
   for(const row of value.records){
    if(!validCs03RecordId(row?.question_id??'')||!Number.isSafeInteger(row.revision)||row.revision<1 ||
       !row.data||typeof row.data!=='object'||Array.isArray(row.data)||
       new TextEncoder().encode(JSON.stringify(row.data)).length>16384 ||
       Object.hasOwn(records,row.question_id))throw appError('PROGRESS_LIST_INVALID');
    if(Object.keys(records).length>=maxRecords)throw appError('PROGRESS_LIST_LIMIT');
    records[row.question_id]={data:structuredClone(row.data),revision:row.revision,updatedAt:row.updated_at};
   }
   listStatus({phase:'loading',received:Object.keys(records).length});
   const next=value.nextCursor;
   if(next===null){
    const latest=await abortable(session,signal);
    abortCheck(signal);
    if(latest.id!==user.id)throw appError('ACCOUNT_CHANGED');
    // Return an isolated snapshot; never merge into legacy progress or another user's cache.
    return structuredClone(records);
   }
   if(typeof next!=='string'||!validCs03RecordId(next)||seen.has(next)||value.records.length===0||
      value.records.at(-1).question_id!==next)throw appError('PROGRESS_LIST_INVALID');
   seen.add(next);cursor=next;
  }
  throw appError('PROGRESS_LIST_LIMIT');
  }finally{clearTimeout(timer);if(listController===controller)listController=null;listStatus({phase:'idle'});}
 }
 async function save(questionId,data){
  checkRecord(questionId,data);
  const user=await session();
  const local=readLocal(user.id);
  let revision=(local[questionId]?.revision??0)+1;
  let result;
  try{result=await request(user.id,'PUT','progress',{examCode:'db',questionId,data,revision});}
  catch(error){
   if(error.message!=='REVISION_CONFLICT')throw error;
   // Read before retrying: never overwrite a newer server revision blindly.
   await pullFor(user.id,questionId);
   throw appError('REVISION_CONFLICT_REFRESHED');
  }
  if((await session()).id!==user.id)throw appError('ACCOUNT_CHANGED');
  local[questionId]={data:result.data,revision:result.revision,updatedAt:result.updated_at};
  writeLocal(user.id,local);
  return result;
 }
 return Object.freeze({signUp,signIn,signOut,session,pull,save,listProgress,cancelListProgress,readLocal,storageKey});
}
