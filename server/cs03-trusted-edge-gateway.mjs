// Development-only CS-03 trusted gateway prototype.
// NOT SAFE TO DEPLOY: rate limits are per-process, not globally durable.
// Keep all secrets in a trusted runtime; never expose this module in client bundle.
const ORIGIN='https://rapurasusann.github.io';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERROR=(status,error)=>Response.json({error},{status,headers:{'cache-control':'no-store'}});
// Read as a stream so a missing/forged Content-Length cannot force an unbounded buffer.
async function readBoundedUtf8(request,maxBytes){
 if(!request.body)return '';
 const reader=request.body.getReader();
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,text='';
 try{
  while(true){
   const part=await reader.read();
   if(part.done)break;
   bytes+=part.value.byteLength;
   if(bytes>maxBytes){
    // Cancellation is best-effort and must not stall the rejection.
    void reader.cancel().catch(()=>{});
    throw Object.assign(new Error('PAYLOAD_TOO_LARGE'),{code:'PAYLOAD_TOO_LARGE'});
   }
   text+=decoder.decode(part.value,{stream:true});
  }
  return text+decoder.decode();
 }finally{reader.releaseLock();}
}
export function createCs03TrustedEdgeGateway({verifyToken,fetcher,upstreamUrl,upstreamSecret,getClientIp,clock=Date.now,
 limits={global:60,perIp:20,perUser:10},windowMs=60000,maxInflight=3,sharedQuota}={}){
 if(typeof verifyToken!=='function'||typeof fetcher!=='function'||
    typeof getClientIp!=='function'||typeof clock!=='function')throw Error('GATEWAY_TRUSTED_RUNTIME_REQUIRED');
 let upstream;
 try{upstream=new URL(upstreamUrl);}catch{throw Error('GATEWAY_UPSTREAM_INVALID');}
 if(upstream.protocol!=='https:'||!upstream.hostname||upstream.username||upstream.password||
    upstream.search||upstream.hash||!['/','/progress'].includes(upstream.pathname))throw Error('GATEWAY_UPSTREAM_INVALID');
 if(typeof upstreamSecret!=='string'||new TextEncoder().encode(upstreamSecret).length<32)
  throw Error('GATEWAY_SECRET_REQUIRED');
 if(!Number.isInteger(windowMs)||windowMs<1000||!Number.isInteger(maxInflight)||maxInflight<1||
    ['global','perIp','perUser'].some(key=>!Number.isInteger(limits[key])||limits[key]<1))
  throw Error('GATEWAY_LIMITS_INVALID');
 const counts=new Map();
 let inflight=0;
 function allowed(key,limit,now){
  const last=counts.get(key);
  const record=!last||now-last.start>=windowMs?{start:now,count:0}:last;
  if(record.count>=limit)return false;
  record.count++;counts.set(key,record);return true;
 }
 const cors={'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET, PUT, OPTIONS',
  'access-control-allow-headers':'authorization, content-type','vary':'Origin','cache-control':'no-store'};
 function result(status,error){const response=ERROR(status,error);for(const [k,v]of Object.entries(cors))response.headers.set(k,v);return response;}
 return async function handle(request){
  if(request.headers.get('origin')!==ORIGIN)return ERROR(403,'Forbidden');
  const url=new URL(request.url);
  if(url.pathname!=='/progress')return result(404,'Not Found');
  if(request.method==='OPTIONS'){
   const method=request.headers.get('access-control-request-method');
   const heads=request.headers.get('access-control-request-headers')??'';
   const requested=heads.split(',').map(x=>x.trim().toLowerCase());
   // Browser JWT requests always send Authorization. Reject malformed or
   // unauthenticated preflight shapes instead of advertising a permissive API.
   if(!['GET','PUT'].includes(method)||!requested.includes('authorization')||
      requested.some(x=>!['authorization','content-type'].includes(x))||
      new Set(requested).size!==requested.length||
      (method==='GET'&&requested.includes('content-type'))||
      (method==='PUT'&&!requested.includes('content-type')))
    return result(405,'Method Not Allowed');
   return new Response(null,{status:204,headers:cors});
  }
  if(!['GET','PUT'].includes(request.method))return result(405,'Method Not Allowed');
  if(url.search.length>1024)return result(400,'Bad Request');
  if(request.method==='GET'&&(!url.searchParams.has('examCode')||
    [...url.searchParams.keys()].some(k=>!['examCode','questionId','cursor','limit'].includes(k))))
   return result(400,'Bad Request');
  if(request.method==='PUT'&&url.search)return result(400,'Bad Request');
  const auth=request.headers.get('authorization');
  if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_~+./=-]{10,8192}$/.test(auth))
   return result(401,'Unauthorized');
  let identity;
  try{identity=await verifyToken(auth.slice(7));}catch{return result(401,'Unauthorized');}
  if(!UUID.test(identity?.userId??''))return result(401,'Unauthorized');
  // IP comes from trusted gateway infrastructure, not client-supplied X-Forwarded-For.
  const ip=getClientIp(request);
  if(typeof ip!=='string'||!ip||ip.length>64)return result(503,'Service Unavailable');
  let body;
  if(request.method==='PUT'){
   if(!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(request.headers.get('content-type')??''))
    return result(415,'Unsupported Media Type');
   const length=request.headers.get('content-length');
   if(length!==null&&(!/^\d+$/.test(length)||Number(length)>20000))return result(413,'Payload Too Large');
   try{body=await readBoundedUtf8(request,20000);}
   catch(error){return error?.code==='PAYLOAD_TOO_LARGE'?result(413,'Payload Too Large'):result(400,'Bad Request');}
  }
  if(inflight>=maxInflight)return result(429,'Too Many Requests');
  const now=clock(), user=identity.userId.toLowerCase();
  // Optional shared-quota integration for isolated verification only.
  // Production is still blocked: no trusted distributed backend is configured here.
  if(sharedQuota!==undefined){
   if(typeof sharedQuota?.consume!=='function')return result(503,'Service Unavailable');
   let granted;
   try{granted=await sharedQuota.consume({userId:user,ip});}
   catch{return result(503,'Service Unavailable');}
   if(granted===false)return result(429,'Too Many Requests');
   if(granted!==true)return result(503,'Service Unavailable');
  }
  // In-process controls are only defense-in-depth, not a billing guarantee.
  if(!allowed('g',limits.global,now)||!allowed('i:'+ip,limits.perIp,now)||
     !allowed('u:'+user,limits.perUser,now))return result(429,'Too Many Requests');
  inflight++;
  try{
   const dest=new URL(upstream);
   if(request.method==='GET')dest.search=url.search;
   const headers={authorization:auth,'x-secret':upstreamSecret,origin:ORIGIN};
   if(request.method==='PUT')headers['content-type']='application/json';
   const response=await fetcher(dest,{method:request.method,headers,body,redirect:'manual',cache:'no-store',
    signal:AbortSignal.timeout(8000)});
   if(![200,400,401,404,405,409,413,415,429,503].includes(response.status))
    return result(503,'Service Unavailable');
   // Do not relay arbitrary upstream headers or redirects to the browser.
   // A malicious or misconfigured upstream may stream indefinitely without
   // Content-Length. Stop reading at the byte limit rather than buffering all.
   let upstreamBody;
   try{upstreamBody=await readBoundedUtf8(response,65536);}
   catch{return result(503,'Service Unavailable');}
   return new Response(upstreamBody,{status:response.status,headers:{...cors,'content-type':'application/json'}});
  }catch{return result(503,'Service Unavailable');}
  finally{inflight--;}
 };
}
