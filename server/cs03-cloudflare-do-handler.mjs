// Internal Durable Object request handler for CS-03 isolated testing only.
// This is NOT a public Worker route and NOT a deployment entrypoint.
import {consumeCs03SqliteQuota} from './cs03-cloudflare-do-quota.mjs';
const ERROR=(status)=>Response.json({error:status===400?'Bad Request':'Service Unavailable'},{status,headers:{'cache-control':'no-store'}});
// Durable Object stubs should only receive tiny internal requests. Enforce the
// byte limit even when Content-Length is missing or forged, before JSON.parse.
async function readTinyPayload(request,maxBytes=1024){
 if(!request.body)throw Error('EMPTY_BODY');
 const reader=request.body.getReader();
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let text='',bytes=0;
 try{
  while(true){
   const part=await reader.read();
   if(part.done)break;
   bytes+=part.value.byteLength;
   if(bytes>maxBytes){
    void reader.cancel().catch(()=>{});
    throw Error('DO_PAYLOAD_TOO_LARGE');
   }
   text+=decoder.decode(part.value,{stream:true});
  }
  return JSON.parse(text+decoder.decode());
 }finally{reader.releaseLock();}
}
export function createCs03QuotaObjectHandler({storage,clock=Date.now,consume=consumeCs03SqliteQuota,
 limits={global:60,perIp:20,perUser:10},windowMs=60000}={}){
 if(!storage||typeof clock!=='function'||typeof consume!=='function'||
    !Number.isSafeInteger(windowMs)||windowMs<1000||
    ['global','perIp','perUser'].some(key=>!Number.isSafeInteger(limits[key])||limits[key]<1))
  throw Error('DO_HANDLER_CONFIG_INVALID');
 return async function handle(request){
  if(request.method!=='POST'||new URL(request.url).pathname!=='/consume'||
     request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')
   return ERROR(400);
  const advertised=request.headers.get('content-length');
  if(advertised!==null&&(!/^\d+$/.test(advertised)||Number(advertised)>1024))return ERROR(400);
  let payload;
  try{
   payload=await readTinyPayload(request);
  }catch{return ERROR(400);}
  const keys=payload?.keys;
  if(!Array.isArray(keys)||keys.length!==3||
    keys[0]?.key!=='cs03:global'||keys[0]?.limit!==limits.global||
    !/^cs03:ip:[^\s]{1,64}$/.test(keys[1]?.key??'')||keys[1]?.limit!==limits.perIp||
    !/^cs03:user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(keys[2]?.key??'')||
    keys[2]?.limit!==limits.perUser||payload.windowMs!==windowMs||
    !Number.isSafeInteger(payload.now)||payload.now<0)return ERROR(400);
  const now=clock();
  if(!Number.isSafeInteger(now)||now<0||Math.abs(now-payload.now)>windowMs)return ERROR(503);
  try{
   // Trusted object clock, not caller-supplied clock, determines the quota window.
   const accepted=consume(storage,{keys,now,windowMs});
   if(typeof accepted!=='boolean')return ERROR(503);
   return Response.json({accepted},{headers:{'cache-control':'no-store'}});
  }catch{return ERROR(503);}
 };
}
