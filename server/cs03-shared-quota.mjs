// CS-03 shared quota contract, development-only. Not a production storage adapter.
// Backend MUST atomically check/increment ALL keys together across every instance.
// Never substitute in-process counters for the shared backend on failure.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rejected=()=>Object.assign(new Error('SHARED_QUOTA_UNAVAILABLE'),{code:'SHARED_QUOTA_UNAVAILABLE'});
export function createCs03SharedQuota({atomicConsume,limits={global:60,perIp:20,perUser:10},windowMs=60000,clock=Date.now}={}){
 if(typeof atomicConsume!=='function'||typeof clock!=='function'||
   !Number.isSafeInteger(windowMs)||windowMs<1000||
   ['global','perIp','perUser'].some(k=>!Number.isSafeInteger(limits[k])||limits[k]<1))
   throw Error('SHARED_QUOTA_CONFIG_INVALID');
 return Object.freeze({
  async consume({userId,ip}={}){
   if(!uuid.test(userId??'')||typeof ip!=='string'||!ip||ip.length>64)throw rejected();
   const now=clock();
   if(!Number.isSafeInteger(now)||now<0)throw rejected();
   // Backend must treat these keys as ONE transaction; three separate increments
   // can consume quota on denied requests or allow races across instances.
   const request=Object.freeze({windowMs,now,keys:Object.freeze([
    Object.freeze({key:'cs03:global',limit:limits.global}),
    Object.freeze({key:'cs03:ip:'+ip,limit:limits.perIp}),
    Object.freeze({key:'cs03:user:'+userId.toLowerCase(),limit:limits.perUser})
   ])});
   let accepted;
   try{accepted=await atomicConsume(request);}catch{throw rejected();}
   if(typeof accepted!=='boolean')throw rejected();
   return accepted;
  }
 });
}
