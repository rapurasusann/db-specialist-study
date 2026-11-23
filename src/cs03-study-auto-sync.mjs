// Connects study UI events with an authenticated account session.
// A caller must explicitly enter account mode and open a remote question before edits.
// No references to legacy localStorage or unowned device progress.
export function createCs03StudyAutoSync({session,onRemote=()=>{},onStatus=()=>{}}){
 if(!session||!['start','open','save','stop','status'].every(k=>typeof session[k]==='function') ||
 typeof onRemote!=='function'||typeof onStatus!=='function')throw Error('AUTO_SYNC_DEPENDENCIES_REQUIRED');
 const ID=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
 let epoch=0,active=false,owner=null;
 const opened=new Set(),pending=new Map(),queue=new Map(),blocked=new Set();
 const copy=value=>structuredClone(value);
 function validate(id,data){
  if(!ID.test(id))throw Error('INVALID_RECORD');
  if(data!==undefined&&(!data||typeof data!=='object'||Array.isArray(data)))throw Error('INVALID_RECORD');
 }
 function current(mark){if(!active||mark!==epoch)throw Error('ACCOUNT_SESSION_CHANGED');}
 async function login(){
  if(active)throw Error('ALREADY_LOGGED_IN');
  const mark=++epoch;
  let listing;
  try{
   listing=await session.start();
   if(mark!==epoch){session.stop();throw Error('ACCOUNT_SESSION_CHANGED');}
   if(!listing||typeof listing.userId!=='string'||!listing.records||typeof listing.records!=='object')
    throw Error('INVALID_ACCOUNT_SNAPSHOT');
   owner=listing.userId;active=true;
   onStatus('ready');
   return copy(listing);
  }catch(e){
   if(mark===epoch){active=false;owner=null;session.stop();}
   throw e;
  }
 }
 async function open(id){
  validate(id);
  const mark=epoch;current(mark);
  if(queue.has(id))await queue.get(id);
  current(mark);
  // Don't display stale remote data over unsaved account drafts.
  if(pending.has(id)||blocked.has(id))throw Error('LOCAL_ACCOUNT_DRAFT_UNSYNCED');
  const data=await session.open(id);
  current(mark);
  opened.add(id);
  onRemote(id,data===null?null:copy(data));
  return data===null?null:copy(data);
 }
 function edit(id,data){
  validate(id,data);
  const mark=epoch;current(mark);
  if(!opened.has(id))throw Error('REMOTE_READ_REQUIRED');
  if(blocked.has(id))throw Error('CONFLICT_REVIEW_REQUIRED');
  // Snapshot at the time of editing; callbacks must not mutate queued values.
  pending.set(id,copy(data));
  onStatus('pending',id);
  if(!queue.has(id)){
   const running=(async()=>{
    // Give same-tick edits a chance to coalesce; revisions still serialize.
    await Promise.resolve();
    while(pending.has(id)){
     current(mark);
     const next=pending.get(id);
     pending.delete(id);
     try{
      await session.save(id,copy(next));
      current(mark);
      onStatus('saved',id);
     }catch(e){
      if(mark===epoch){
       blocked.add(id);
       pending.set(id,next);
       onStatus('blocked',id);
      }
      throw e;
     }
    }
   })();
   const result=running.finally(()=>{if(queue.get(id)===result)queue.delete(id);});
   queue.set(id,result);
  }
  return queue.get(id);
 }
 function exportPending(){
  current(epoch);
  // Export only fully failed writes. In-flight data is not yet stable.
  if(queue.size)throw Error('ACCOUNT_WRITE_IN_PROGRESS');
  if(!pending.size)throw Error('NO_UNSAVED_ACCOUNT_PROGRESS');
  const records=Object.create(null);
  for(const [id,row] of pending)records[id]=copy(row);
  return copy({format:'cs03-unsaved-account-progress-v1',userId:owner,records});
 }
 function logout(){
  // Never discard an unacknowledged write. The UI must resolve or explicitly
  // export account drafts before signing out.
  if(pending.size||blocked.size||queue.size)throw Error('UNSAVED_ACCOUNT_PROGRESS');
  ++epoch;active=false;owner=null;
  opened.clear();pending.clear();blocked.clear();queue.clear();
  session.stop();onStatus('signed-out');
 }
 function state(){return Object.freeze({active,userId:owner,pending:[...pending.keys()],blocked:[...blocked],inFlight:[...queue.keys()]});}
 return Object.freeze({login,open,edit,exportPending,logout,state});
}
