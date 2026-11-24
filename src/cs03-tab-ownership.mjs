// Cross-tab single-writer ownership for the isolated CS-03 account preview.
// A Web Locks exclusive lock is held until sign-out or tab teardown.
// Never substitute localStorage leases: they are not an atomic exclusion primitive.
const USER=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createCs03TabOwnership({locks}={}){
 if(typeof locks?.request!=='function')throw Error('CS03_TAB_LOCK_UNAVAILABLE');
 let release=null,owned=null;
 async function acquire(userId){
  if(!USER.test(userId??''))throw Error('CS03_TAB_ACCOUNT_INVALID');
  if(release||owned)throw Error('CS03_TAB_LOCK_ALREADY_HELD');
  let notify,fail,unlock;
  const ready=new Promise((resolve,reject)=>{notify=resolve;fail=reject;});
  const hold=new Promise(resolve=>{unlock=resolve;});
  // Web Locks API grants the lock to the callback, then holds it for the
  // callback's promise lifetime. ifAvailable prevents an indefinite wait.
  // Do not await the request promise here, because the lock must stay held.
  const task=Promise.resolve().then(()=>locks.request('cs03-study-account-'+userId.toLowerCase(),
   {mode:'exclusive',ifAvailable:true},async lock=>{
    if(!lock){fail(Error('CS03_ACCOUNT_OPEN_IN_ANOTHER_TAB'));return;}
    release=unlock;owned=userId;
    notify();
    await hold;
   }));
  // Observe release/rejection without an unhandled promise; if acquisition
  // fails, the ready promise propagates it to the login caller.
  void task.catch(error=>{fail(error);});
  await ready;
 }
 function relinquish(){
  const done=release;
  release=null;owned=null;
  if(done)done();
 }
 return Object.freeze({acquire,relinquish});
}
