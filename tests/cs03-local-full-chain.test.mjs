// CS-03 local-only full request chain: account browser client -> trusted gateway
// -> actual Neon Function adapter -> isolated in-memory runtime. No network/DB writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';
import {createCs03AccountClient} from '../src/cs03-account-client.mjs';
const ORIGIN='https://rapurasusann.github.io', SECRET='cs03-test-only-secret-do-not-deploy-123456789';
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',Q='2025:am2:1';
function setup({limit=30,upstreamFails=false}={}){
 const rows=new Map(),calls={gateway:0,function:0,database:0};let failure=upstreamFails;
 const validTokens=new Map([['valid-a-test-token',A],['valid-b-test-token',B]]);
 const verify=async token=>{const userId=validTokens.get(token);if(!userId)throw Error('TOKEN_INVALID');return {userId};};
 const runtime={handle:async request=>{
  calls.database++;
  const jwt=request.headers.get('authorization')?.slice(7);
  const userId=validTokens.get(jwt);
  if(!userId)return Response.json({error:'Unauthorized'},{status:401});
  const url=new URL(request.url);
  if(request.method==='GET'){
   const id=url.searchParams.get('questionId');
   if(id){const row=rows.get(userId+'|'+id)??null;return Response.json({data:row});}
   return Response.json({data:{records:[...rows].filter(([key])=>key.startsWith(userId+'|')).map(([key,r])=>({question_id:key.split('|')[1],...r})),nextCursor:null}});
  }
  const body=await request.json();
  if(body.examCode!=='db'||body.questionId!==Q||!Number.isInteger(body.revision)||body.revision<1)
   return Response.json({error:'Bad Request'},{status:400});
  const key=userId+'|'+body.questionId,old=rows.get(key);
  if(body.revision!==(old?.revision??0)+1)return Response.json({error:'Conflict'},{status:409});
  const row={data:body.data,revision:body.revision,updated_at:'2026-11-23T00:00:00Z'};
  rows.set(key,row);
  return Response.json({data:row});
 }};
 const gateway=createCs03TrustedEdgeGateway({
  verifyToken:verify,
  getClientIp:()=> '192.0.2.5',
  upstreamUrl:'https://isolated-neon-function.invalid/progress',
  upstreamSecret:SECRET,
  limits:{global:limit,perIp:limit,perUser:limit},
  fetcher:async(url,init)=>{
   calls.function++;
   if(failure)throw Error('TEST_NETWORK_UNAVAILABLE');
   // Make a real Request with the forwarded headers, not a shortcut call.
   const request=new Request(String(url),{method:init.method,headers:init.headers,body:init.body});
   return handleBrowserRequest(request,()=>runtime,SECRET);
  }
 });
 function account(userId){
  const token=userId===A?'valid-a-test-token':'valid-b-test-token';
  const storage=new Map();
  const authClient={
   signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
   getSession:async()=>({data:{user:{id:userId,email:'test@example.invalid'}}}),
   signOut:async()=>({data:{}}),token:async()=>({data:{token}})
  };
  const client=createCs03AccountClient({
   authClient,apiUrl:'https://gateway.invalid/',
   storage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
   fetcher:async(url,init)=>{
    calls.gateway++;
    const request=new Request(String(url),{method:init.method,headers:{...init.headers,origin:ORIGIN},
     body:init.body});
    return gateway(request);
   }
  });
  return client;
 }
 function raw(method,token='valid-a-test-token',origin=ORIGIN,body){
  return gateway(new Request('https://gateway.invalid/progress'+(method==='GET'?'?examCode=db&questionId='+encodeURIComponent(Q):''),{
   method,headers:{origin,authorization:'Bearer '+token,...(method==='PUT'?{'content-type':'application/json'}:{})},
   body:method==='PUT'?JSON.stringify(body):undefined}));
 }
 return {rows,calls,account,raw,setFailure:v=>failure=v};
}
test('client -> gateway -> native Function -> isolated store: write and read',async()=>{
 const f=setup(),a=f.account(A);
 assert.equal(await a.pull(Q),null);
 const saved=await a.save(Q,{level:'mastered'});
 assert.equal(saved.revision,1);
 assert.deepEqual((await a.pull(Q)).data,{level:'mastered'});
 assert.equal(f.calls.function,3);assert.equal(f.calls.database,3);
});
test('account B cannot read or overwrite A; both use isolated user keys',async()=>{
 const f=setup(),a=f.account(A),b=f.account(B);
 await a.pull(Q);await a.save(Q,{level:'mastered'});
 assert.equal(await b.pull(Q),null);
 await b.save(Q,{level:'review'});
 assert.equal((await a.pull(Q)).data.level,'mastered');
 assert.equal((await b.pull(Q)).data.level,'review');
 assert.equal(f.rows.size,2);
});
test('stale revision is blocked, server wins and no automatic overwrite',async()=>{
 const f=setup(),a1=f.account(A),a2=f.account(A);
 await a1.pull(Q);await a2.pull(Q);
 await a1.save(Q,{level:'mastered'});
 await assert.rejects(a2.save(Q,{level:'review'}),/REVISION_CONFLICT_REFRESHED/);
 assert.equal((await a1.pull(Q)).data.level,'mastered');
});
test('invalid auth and origin never reach the isolated function',async()=>{
 const f=setup();
 assert.equal((await f.raw('GET','forged-test-token')).status,401);
 assert.equal((await f.raw('GET','valid-a-test-token','https://attacker.invalid')).status,403);
 assert.equal(f.calls.function,0);assert.equal(f.calls.database,0);
});
test('rate-limit before function / database and upstream failure is fail-closed',async()=>{
 const f=setup({limit:1});
 assert.equal((await f.raw('GET')).status,200);
 assert.equal((await f.raw('GET')).status,429);
 assert.equal(f.calls.function,1);assert.equal(f.calls.database,1);
 const down=setup({upstreamFails:true});
 assert.equal((await down.raw('GET')).status,503);
 assert.equal(down.calls.database,0);
});
test('direct native invocation without gateway secret is rejected before runtime',async()=>{
 const f=setup();
 const req=new Request('https://isolated-neon-function.invalid/progress?examCode=db',{headers:{origin:ORIGIN,authorization:'Bearer valid-a-test-token'}});
 const result=await handleBrowserRequest(req,()=>{throw Error('MUST_NOT_OPEN_DB')},SECRET);
 assert.equal(result.status,401);assert.equal(f.calls.database,0);
});
