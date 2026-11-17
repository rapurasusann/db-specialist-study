// CS-03 browser-side auth/progress coordinator. No secrets in source or storage.
// Inject the Managed Neon Auth vanilla client and fixed HTTPS API base at integration.
const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECORD_ID=/^\d{4}:(am1|am2|pm1|pm2):\d{1,3}$/;
function appError(message){return new Error(message);}
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
 if(!RECORD_ID.test(id)||!data||typeof data!=='object'||Array.isArray(data))throw appError('INVALID_RECORD');
 if(new TextEncoder().encode(JSON.stringify(data)).length>16000)throw appError('RECORD_TOO_LARGE');
}
export function createCs03AccountClient({authClient,apiUrl,fetcher=fetch,storage}){
 if(!authClient?.signUp?.email||!authClient?.signIn?.email||!authClient?.getSession||!authClient?.signOut||!authClient?.token)
  throw appError('AUTH_CLIENT_REQUIRED');
 let endpoint;
 try{endpoint=new URL(apiUrl)}catch{throw appError('API_NOT_CONFIGURED');}
 if(endpoint.protocol!=='https:'||!endpoint.hostname||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')
  throw appError('API_NOT_CONFIGURED');
 const prefix='db-study-cs03-progress-';
 let currentUser=null;
 const storageKey=id=>prefix+id;
 async function session(){
  const s=checkResult(await authClient.getSession());
  const user=identity(s);
  // Account switching invalidates the active account handle.
  currentUser=user.id;
  return user;
 }
 async function jwtFor(userId){
  // Check identity again immediately before requesting a token.
  const latest=await session();
  if(latest.id!==userId)throw appError('ACCOUNT_CHANGED');
  const data=checkResult(await authClient.token());
  if(typeof data?.token!=='string'||!data.token)throw appError('TOKEN_UNAVAILABLE');
  return data.token;
 }
 async function request(userId,method,path,body){
  const token=await jwtFor(userId);
  const headers={authorization:'Bearer '+token};
  if(body!==undefined)headers['content-type']='application/json';
  const response=await fetcher(new URL(path,endpoint),{
   method,headers,cache:'no-store',credentials:'omit',redirect:'error',
   ...(body!==undefined?{body:JSON.stringify(body)}:{})
  });
  if(!response.ok) {
   if(response.status===401)throw appError('SIGN_IN_REQUIRED');
   if(response.status===409)throw appError('REVISION_CONFLICT');
   throw appError('PROGRESS_API_FAILED');
  }
  const parsed=await response.json();
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
  try{checkResult(await authClient.signOut());}
  finally{currentUser=null;}
 }
 async function pull(questionId){
  const user=await session();
  if(!RECORD_ID.test(questionId))throw appError('INVALID_RECORD');
  const examCode='db';
  const value=await request(user.id,'GET','progress?examCode='+examCode+'&questionId='+encodeURIComponent(questionId));
  if(value){
   const local=readLocal(user.id);
   local[questionId]={data:value.data,revision:value.revision,updatedAt:value.updated_at};
   writeLocal(user.id,local);
  }
  return value;
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
   await pull(questionId);
   throw appError('REVISION_CONFLICT_REFRESHED');
  }
  local[questionId]={data:result.data,revision:result.revision,updatedAt:result.updated_at};
  writeLocal(user.id,local);
  return result;
 }
 return Object.freeze({signUp,signIn,signOut,session,pull,save,readLocal,storageKey});
}
