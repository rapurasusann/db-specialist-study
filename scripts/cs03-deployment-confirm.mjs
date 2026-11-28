// Read-only polling helper. Never writes or retries a deployment.
export async function confirmDeployment({inspect, verifyRuntime, expectedId, attempts=12, wait}) {
 if (!Number.isSafeInteger(expectedId) || expectedId<1 || !Number.isInteger(attempts) || attempts<1 || attempts>60) return false;
 for(let i=0;i<attempts;i++){
  try {
   const s=await inspect();
   if(s.currentId!==expectedId || s.status==='failed') return false;
   if(s.activeId===expectedId && s.status==='completed' && await verifyRuntime()===true) return true;
  } catch { /* bounded read-only retry; never expose raw errors */ }
  if(i+1<attempts) await wait();
 }
 return false;
}
