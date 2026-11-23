// Connects study UI events with an authenticated account session.
// A caller must explicitly enter account mode and open a remote question before edits.
// No references to legacy localStorage or unowned device progress.
export function createCs03StudyAutoSync({session,onRemote=()=>{},onStatus=()=>{},draftStore=null,tabOwnership=null}){
 if(!session||!['start','open','save','stop','status'].every(k=>typeof session[k]==='function') ||
 typeof onRemote!=='function'||typeof onStatus!=='function'||
 (draftStore!==null&&(!draftStore||typeof draftStore.load!=='function'||typeof draftStore.replace!=='function'))||
 (tabOwnership!==null&&(!tabOwnership||typeof tabOwnership.acquire!=='function'||typeof tabOwnership.relinquish!=='function')))
 throw Error('AUTO_SYNC_DEPENDENCIES_REQUIRED');
 const ID=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
 let epoch=0,active=false,owner=null;
 const opened=new Set(),pending=new Map(),queue=new Map(),blocked=new Set(),journal=new Map();
 const copy=value=>structuredClone(value);
 const entries=map=>Object.fromEntries(map);
 // Persist a candidate copy BEFORE accepting an edit or deleting an acknowledged draft.
 function updateJournal(next){
  if(draftStore)draftStore.replace(owner,entries(next));
  journal.clear();for(const [id,row] of next)journal.set(id,row);
 }
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
   if(tabOwnership)await tabOwnership.acquire(listing.userId);
   if(mark!==epoch){tabOwnership?.relinquish();throw Error('ACCOUNT_SESSION_CHANGED');}
   owner=listing.userId;active=true;
   // Restored drafts are blocked: NEVER replay them automatically after a reload.
   const recovered=draftStore?.load(owner);
   if(recovered){
    const records=Object.entries(recovered.records);
    for(const [id,row] of records)validate(id,row);
    updateJournal(new Map(records));
    for(const [id,row] of records){pending.set(id,copy(row));blocked.add(id);}
    onStatus('recovered',records.length);
   }
   onStatus('ready');
   return copy(listing);
  }catch(e){
   if(mark===epoch){tabOwnership?.relinquish();active=false;owner=null;pending.clear();blocked.clear();journal.clear();session.stop();}
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
  // Checkpoint before the first network attempt. Fail closed on storage errors.
  const row=copy(data),candidate=new Map(journal);
  candidate.set(id,row);
  updateJournal(candidate);
  pending.set(id,row);
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
      if(journal.get(id)===next){
       const remaining=new Map(journal);remaining.delete(id);updateJournal(remaining);
      }
      onStatus('saved',id);
     }catch(e){
      if(mark===epoch){
       blocked.add(id);
       if(!pending.has(id))pending.set(id,next);
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
 function restorePending(backup){
  current(epoch);
  // A backup is an untrusted local file: never send it to the server on import.
  // Restoration is only allowed when no work is running or awaiting review.
  if(queue.size)throw Error('ACCOUNT_WRITE_IN_PROGRESS');
  if(pending.size||blocked.size)throw Error('UNSAVED_ACCOUNT_PROGRESS');
  if(!backup||typeof backup!=='object'||Array.isArray(backup)||
     backup.format!=='cs03-unsaved-account-progress-v1')throw Error('BACKUP_FORMAT_INVALID');
  if(backup.userId!==owner)throw Error('BACKUP_ACCOUNT_MISMATCH');
  const rows=backup.records;
  if(!rows||typeof rows!=='object'||Array.isArray(rows))throw Error('BACKUP_RECORDS_INVALID');
  const entries=Object.entries(rows);
  if(entries.length<1||entries.length>1600)throw Error('BACKUP_RECORDS_INVALID');
  const snapshot=[];
  let totalBytes=0;
  for(const [id,data] of entries){
   validate(id,data);
   const safe=copy(data);
   const size=new TextEncoder().encode(JSON.stringify(safe)).length;
   if(size>16000)throw Error('BACKUP_RECORD_TOO_LARGE');
   totalBytes+=size;
   if(totalBytes>1024*1024)throw Error('BACKUP_TOO_LARGE');
   snapshot.push([id,safe]);
  }
  // Atomically checkpoint before accepting imported drafts, never auto-submit.
  updateJournal(new Map(snapshot));
  for(const [id,data] of snapshot){pending.set(id,data);blocked.add(id);}
  for(const [id] of snapshot)onStatus('blocked',id);
  return Object.freeze({restored:snapshot.length,accountId:owner,requiresReview:true});
 }
 function discardPending({userId,questionIds}={}){
  current(epoch);
  // This is a deliberate local-only discard, never a server delete.
  // The UI must first ask the operator to keep an independent backup.
  if(queue.size)throw Error('ACCOUNT_WRITE_IN_PROGRESS');
  if(userId!==owner||!Array.isArray(questionIds))throw Error('BACKUP_ACCOUNT_MISMATCH');
  const ids=[...pending.keys()].sort();
  if(!ids.length||ids.length!==questionIds.length||
     ids.some((id,i)=>id!==questionIds[i])||blocked.size!==ids.length||
     ids.some(id=>!blocked.has(id)))throw Error('PENDING_DRAFTS_CHANGED');
  updateJournal(new Map());
  for(const id of ids){pending.delete(id);blocked.delete(id);opened.delete(id);}
  for(const id of ids)onStatus('discarded',id);
  return Object.freeze({discarded:ids.length});
 }
 function logout(){
  // Never discard an unacknowledged write. The UI must resolve or explicitly
  // export account drafts before signing out.
  if(pending.size||blocked.size||queue.size||journal.size)throw Error('UNSAVED_ACCOUNT_PROGRESS');
  ++epoch;active=false;owner=null;
  opened.clear();pending.clear();blocked.clear();queue.clear();journal.clear();
  tabOwnership?.relinquish();
  session.stop();onStatus('signed-out');
 }
 function state(){return Object.freeze({active,userId:owner,pending:[...pending.keys()],blocked:[...blocked],inFlight:[...queue.keys()]});}
 return Object.freeze({login,open,edit,exportPending,restorePending,discardPending,logout,state});
}
