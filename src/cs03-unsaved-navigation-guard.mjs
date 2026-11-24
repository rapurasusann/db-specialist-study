// Warn on normal tab close/reload when CS-03 account edits are not acknowledged.
// This is NOT crash recovery or persistence: the user still needs a JSON backup.
export function attachCs03UnsavedNavigationGuard({auto,windowRef}={}){
 if(typeof auto?.state!=='function'||typeof windowRef?.addEventListener!=='function'||
    typeof windowRef?.removeEventListener!=='function')
  throw Error('NAVIGATION_GUARD_CONFIG_REQUIRED');
 const handler=event=>{
  let state;
  try{state=auto.state();}catch{return;}
  if(!state?.active)return;
  if(!(state.pending?.length||state.blocked?.length||state.inFlight?.length))return;
  event.preventDefault();
  // Modern browsers ignore custom text and show a built-in confirmation.
  event.returnValue='';
 };
 windowRef.addEventListener('beforeunload',handler);
 return ()=>windowRef.removeEventListener('beforeunload',handler);
}
