// Neon Functions adapter for CS-03. Kept undeployed until security gates pass.
// Requires CS03_TEST_DATABASE_URL with the least-privileged cs03_progress_api role.
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
import {timingSafeEqual} from 'node:crypto';
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
function verifyGatewaySecret(request,secret) {
 if(typeof secret!=='string'||Buffer.byteLength(secret,'utf8')<32)return false;
 const received=request.headers.get('x-secret');
 if(received===null)return false;
 const expectedBytes=Buffer.from(secret,'utf8');
 const actualBytes=Buffer.from(received,'utf8');
 return expectedBytes.length===actualBytes.length&&timingSafeEqual(expectedBytes,actualBytes);
}
export async function handleBrowserRequest(request, runtimeFactory=getRuntime, secret=process.env.CS03_ORIGIN_SECRET) {
 const url=new URL(request.url);
 const headers=corsHeaders(request);
 if(request.headers.get('origin')!==ORIGIN)
  return response(403,'Forbidden');
 if(url.pathname!=='/progress') return response(404,'Not Found',headers);
 // The browser preflight terminates at the Cloudflare gateway. Native Neon
 // invocation must never serve an unauthenticated public preflight endpoint.
 // Check the gateway secret before any method-specific work.
 if(!verifyGatewaySecret(request,secret))
  return response(401,'Unauthorized',headers);
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
// Neon calls fetch(request, env, ctx); never interpret env as the test runtime factory.
// The browser never receives CS03_ORIGIN_SECRET.
export default {fetch(request){return handleBrowserRequest(request);}};
