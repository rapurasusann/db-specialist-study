// CS-03 isolated Workers -> Durable Object quota transport prototype.
// NOT DEPLOYABLE: no production Worker adapter, JWT verifier or account cost gate.
// All instances must use the SAME Durable Object name for global coordination.
const unavailable=()=>Object.assign(new Error('SHARED_QUOTA_UNAVAILABLE'),{code:'SHARED_QUOTA_UNAVAILABLE'});
export function createCs03DurableObjectQuotaTransport({namespace,objectName='cs03-global-v1'}={}){
 if(typeof namespace?.idFromName!=='function'||typeof namespace?.get!=='function'||
    objectName!=='cs03-global-v1')throw Error('DO_QUOTA_CONFIG_INVALID');
 return async function atomicConsume(request){
  if(!request||!Array.isArray(request.keys)||request.keys.length!==3||
     !Number.isSafeInteger(request.now)||!Number.isSafeInteger(request.windowMs))
   throw unavailable();
  try{
   const stub=namespace.get(namespace.idFromName(objectName));
   if(typeof stub?.fetch!=='function')throw Error('INVALID_DO_STUB');
   const result=await stub.fetch('https://cs03-quota.internal/consume',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify(request),redirect:'error'
   });
   if(result.status!==200)throw Error('DO_UNAVAILABLE');
   const json=await result.json();
   if(typeof json?.accepted!=='boolean')throw Error('DO_INVALID_RESPONSE');
   return json.accepted;
  }catch{throw unavailable();}
 };
}
