// Account-only learning sync session. Never reads/writes the legacy device store.
// The UI must explicitly start the session and open a question before saving.
import {createCs03ScopedProgress} from './cs03-scoped-progress.mjs';

export function createCs03CrossBrowserSession({account,onRemoteRecord=()=>{},onSaved=()=>{}}){
 if(typeof onRemoteRecord!=='function'||typeof onSaved!=='function')
  throw Error('SYNC_CALLBACK_INVALID');
 const scoped=createCs03ScopedProgress({account});
 let active=false,starting=false,generation=0,userId=null;
 const opened=new Set();
 function assertActive(){if(!active)throw Error('SYNC_NOT_ACTIVE');return generation;}
 function assertGeneration(expected){
  if(!active||generation!==expected)throw Error('SYNC_SESSION_CHANGED');
 }
 async function start(){
  if(active||starting)throw Error('SYNC_ALREADY_STARTED');
  starting=true;const mark=++generation;
  try{
   const bound=await scoped.bind();
   if(generation!==mark)throw Error('SYNC_SESSION_CHANGED');
   // Fetch an authoritative read-only snapshot; never import device progress.
   const listing=await scoped.list();
   if(generation!==mark||listing.userId!==bound.userId)throw Error('SYNC_SESSION_CHANGED');
   userId=bound.userId;active=true;
   return structuredClone(listing);
  }catch(error){
   scoped.unbind();active=false;userId=null;opened.clear();
   throw error;
  }finally{starting=false;}
 }
 async function open(id){
  const mark=assertActive();
  const remote=await scoped.pull(id);
  assertGeneration(mark);
  // Explicit read is necessary for revision-aware writes.
  opened.add(id);
  const copy=remote===null?null:structuredClone(remote);
  onRemoteRecord(id,copy===null?null:structuredClone(copy));
  return copy;
 }
 async function save(id,data){
  const mark=assertActive();
  if(!opened.has(id))throw Error('REMOTE_READ_REQUIRED');
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('INVALID_RECORD');
  // No optimistic silent retry: a conflicting newer remote must be reviewed.
  try{
   const saved=await scoped.save(id,structuredClone(data));
   assertGeneration(mark);
   onSaved(id,structuredClone(saved));
   return structuredClone(saved);
  }catch(error){
   opened.delete(id);
   throw error;
  }
 }
 function stop(){
  ++generation;active=false;userId=null;opened.clear();scoped.unbind();
 }
 function status(){return Object.freeze({active,userId,openedCount:opened.size});}
 return Object.freeze({start,open,save,stop,status});
}
