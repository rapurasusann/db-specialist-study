// Local-only Neon canonical invocation URL acceptance. No cloud, DB or secrets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';

const ORIGIN='https://rapurasusann.github.io';
const SECRET='TEST-ONLY-SHARED-SECRET-FOR-LOCAL-CS03-ROUTE';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function request(path,{secret=SECRET,method='GET',body}={}){
 const headers={origin:ORIGIN,authorization:'Bearer local-test-valid-token'};
 if(secret!==null)headers['x-secret']=secret;
 if(method==='PUT')headers['content-type']='application/json';
 return new Request('https://isolated-function.invalid'+path,{method,headers,body});
}
test('Neon canonical root normalizes to internal /progress without dropping query',async()=>{
 let calls=0;
 const response=await handleBrowserRequest(request('/?examCode=db&questionId=2026%3Aam2%3A1'),()=>{
  calls++;return {handle:async r=>{
   assert.equal(new URL(r.url).pathname,'/progress');
   assert.equal(new URL(r.url).searchParams.get('questionId'),'2026:am2:1');
   assert.equal(r.headers.get('x-secret'),SECRET);
   return Response.json({data:{safe:true}});
  }};
 },SECRET);
 assert.equal(response.status,200);
 assert.equal(calls,1);
 assert.equal((await response.json()).data.safe,true);
});
test('canonical root PUT keeps request body when adapting internal route',async()=>{
 let calls=0;
 const body=JSON.stringify({examCode:'db',questionId:'2026:am2:1',revision:1,data:{level:'learning'}});
 const response=await handleBrowserRequest(request('/',{method:'PUT',body}),()=>{
  calls++;return {handle:async r=>{
   assert.equal(r.method,'PUT');
   assert.equal(new URL(r.url).pathname,'/progress');
   assert.deepEqual(await r.json(),JSON.parse(body));
   return Response.json({data:{revision:1}});
  }};
 },SECRET);
 assert.equal(response.status,200);
 assert.equal(calls,1);
});
test('root blocks missing or wrong secret before database is touched',async()=>{
 let calls=0;
 const factory=()=>{calls++;throw Error('NO_DB_CALL_ALLOWED')};
 for(const secret of [null,'bad-secret']) {
  const r=await handleBrowserRequest(request('/',{secret}),factory,SECRET);
  assert.equal(r.status,401);
  assert.equal(r.headers.get('cache-control'),'no-store');
 }
 assert.equal(calls,0);
});
test('legacy /progress remains supported; every unknown URL rejects',async()=>{
 let calls=0;
 const runtime=()=>{calls++;return {handle:async r=>Response.json({path:new URL(r.url).pathname})}};
 const ok=await handleBrowserRequest(request('/progress?examCode=db'),runtime,SECRET);
 assert.equal(ok.status,200);
 assert.equal((await ok.json()).path,'/progress');
 for(const path of ['/wrong','/progress/','//progress','/%2e%2e/progress/other']){
  const result=await handleBrowserRequest(request(path),runtime,SECRET);
  assert.equal(result.status,404,path);
 }
 assert.equal(calls,1);
});
test('Worker forwards only root or /progress Neon upstream; wrong path fails at configuration',async()=>{
 let sent=[];
 const gatewayConfig={verifyToken:async()=>({userId:USER}),getClientIp:()=> '192.0.2.55',
  sharedQuota:{consume:async()=>true},upstreamSecret:SECRET,
  fetcher:async(target,options)=>{
   sent.push({path:new URL(target).pathname,query:new URL(target).search,secret:options.headers['x-secret']});
   return handleBrowserRequest(new Request(target,{method:options.method,headers:options.headers,body:options.body}),
    ()=>({handle:async r=>Response.json({data:{path:new URL(r.url).pathname}})}),SECRET);
  }};
 for(const path of ['/', '/progress']){
  const gateway=createCs03TrustedEdgeGateway({...gatewayConfig,upstreamUrl:'https://isolated-function.invalid'+path});
  const response=await gateway(new Request('https://worker.invalid/progress?examCode=db',{headers:{
   origin:ORIGIN,authorization:'Bearer local-test-valid-token'
  }}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).data.path,'/progress');
 }
 assert.deepEqual(sent.map(x=>x.path),['/','/progress']);
 assert.deepEqual(sent.map(x=>x.query),['?examCode=db','?examCode=db']);
 assert.ok(sent.every(x=>x.secret===SECRET));
 assert.throws(()=>createCs03TrustedEdgeGateway({...gatewayConfig,upstreamUrl:'https://isolated-function.invalid/other'}),/GATEWAY_UPSTREAM_INVALID/);
});
