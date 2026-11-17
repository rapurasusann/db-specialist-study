// Neon Functions adapter for CS-03. Kept undeployed until security gates pass.
// Requires CS03_TEST_DATABASE_URL with the least-privileged cs03_progress_api role.
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
const ORIGIN='https://rapurasusann.github.io';
const METHODS='GET, PUT, OPTIONS';
const HEADERS='authorization, content-type';
let runtime;
function corsHeaders(request) {
 const origin=request.headers.get('origin');
 if(origin!==ORIGIN) return {};
 return {
  'access-control-allow-origin':ORIGIN,
  'access-control-allow-methods':METHODS,
  'access-control-allow-headers':HEADERS,
  'access-control-max-age':'600',
  'vary':'Origin'
 };
}
function response(status,error,headers={}) {
 return Response.json({error},{status,headers:{'cache-control':'no-store',...headers}});
}
function getRuntime() {
 if(!runtime) runtime=createCs03Runtime();
 return runtime;
}
export async function handleBrowserRequest(request, runtimeFactory=getRuntime) {
 const url=new URL(request.url);
 const headers=corsHeaders(request);
 if(request.headers.get('origin')!==ORIGIN)
  return response(403,'Forbidden');
 if(url.pathname!=='/progress') return response(404,'Not Found',headers);
 if(request.method==='OPTIONS') {
  if(request.headers.get('access-control-request-method') && !['GET','PUT'].includes(request.headers.get('access-control-request-method').toUpperCase())) {
   return response(405,'Method Not Allowed',headers);
  }
  return new Response(null,{status:204,headers:{...headers,'cache-control':'no-store'}});
 }
 if(!['GET','PUT'].includes(request.method))
  return response(405,'Method Not Allowed',headers);
 if(!request.headers.get('authorization')?.startsWith('Bearer '))
  return response(401,'Unauthorized',headers);
 if(request.method==='PUT'){
   const contentLength=request.headers.get('content-length');
   if(contentLength!==null && (!/^\d+$/.test(contentLength)||Number(contentLength)>20000))
    return response(413,'Payload Too Large',headers);
   if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return response(415,'Unsupported Media Type',headers);
 }
 try {
  const result=await runtimeFactory().handle(request);
  const outHeaders=new Headers(result.headers);
  Object.entries(headers).forEach(([key,value])=>outHeaders.set(key,value));
  outHeaders.set('cache-control','no-store');
  return new Response(result.body,{status:result.status,headers:outHeaders});
 }catch{
  return response(503,'Service Unavailable',headers);
 }
}
export default {fetch:handleBrowserRequest};
