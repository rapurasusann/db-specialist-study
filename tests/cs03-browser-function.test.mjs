import test from 'node:test';
import assert from 'node:assert/strict';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';
const ORIGIN='https://rapurasusann.github.io';
const SECRET='cs03-test-only-gateway-secret-minimum-32-bytes';
const invoke=(request,factory)=>handleBrowserRequest(request,factory,SECRET);
function req(method,{origin=ORIGIN,auth='Bearer testtoken',contentType='application/json',length,edgeSecret=SECRET}={}) {
 const headers={origin};
 if(edgeSecret!==null)headers['x-secret']=edgeSecret;
 if(auth)headers.authorization=auth;
 if(contentType&&method==='PUT')headers['content-type']=contentType;
 if(length!==undefined)headers['content-length']=length;
 return new Request('https://branch-function.invalid/progress',{method,headers,body:method==='PUT'?'{}':undefined});
}
let calls=0;
const handler=()=>{calls++;return {handle:async()=>Response.json({data:{safe:true}})}};
test('valid GET is forwarded to authenticated API handler',async()=>{
 calls=0;const result=await invoke(req('GET'),handler);
 assert.equal(result.status,200);assert.equal(calls,1);
 assert.equal(result.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(result.headers.get('cache-control'),'no-store');
});
test('valid PUT is forwarded',async()=>{
 calls=0;const result=await invoke(req('PUT'),handler);
 assert.equal(result.status,200);assert.equal(calls,1);
});
test('allowed browser preflight does not call database runtime',async()=>{
 calls=0;const result=await invoke(new Request('https://branch-function.invalid/progress',{method:'OPTIONS',headers:{origin:ORIGIN,'access-control-request-method':'PUT','access-control-request-headers':'authorization, content-type'}}),handler);
 assert.equal(result.status,204);assert.equal(calls,0);
 assert.match(result.headers.get('access-control-allow-headers'),/authorization/);
});
for(const origin of ['https://evil.example','null','http://localhost:5173']){
 test('untrusted origin rejected '+origin,async()=>{
  calls=0;assert.equal((await invoke(req('GET',{origin}),handler)).status,403);assert.equal(calls,0);
 });
}
test('missing origin rejected',async()=>{
 calls=0;
 assert.equal((await invoke(new Request('https://branch-function.invalid/progress'),handler)).status,403);
 assert.equal(calls,0);
});
test('no bearer header rejected before runtime',async()=>{
 calls=0;assert.equal((await invoke(req('GET',{auth:null}),handler)).status,401);assert.equal(calls,0);
});
test('invalid method rejected before runtime',async()=>{
 calls=0;assert.equal((await invoke(req('POST'),handler)).status,405);assert.equal(calls,0);
});
test('wrong route rejected before runtime',async()=>{
 calls=0;const request=new Request('https://branch-function.invalid/other',{headers:{origin:ORIGIN}});
 assert.equal((await invoke(request,handler)).status,404);assert.equal(calls,0);
});
test('oversized PUT rejected before runtime',async()=>{
 calls=0;assert.equal((await invoke(req('PUT',{length:'20001'}),handler)).status,413);assert.equal(calls,0);
});
test('wrong media type rejected before runtime',async()=>{
 calls=0;assert.equal((await invoke(req('PUT',{contentType:'text/plain'}),handler)).status,415);assert.equal(calls,0);
});
test('runtime failure is generic and includes CORS',async()=>{
 const result=await invoke(req('GET'),()=>{throw Error('secret data');});
 assert.equal(result.status,503);assert.equal(result.headers.get('access-control-allow-origin'),ORIGIN);
 assert.doesNotMatch(await result.text(),/secret/);
});

test('native URL rejects missing gateway secret even with bearer JWT and origin',async()=>{
 calls=0;
 const result=await invoke(req('GET',{edgeSecret:null}),handler);
 assert.equal(result.status,401);assert.equal(calls,0);
});
test('native URL rejects incorrect gateway secret before any DB access',async()=>{
 calls=0;
 const result=await invoke(req('GET',{edgeSecret:'not-the-secret'}),handler);
 assert.equal(result.status,401);assert.equal(calls,0);
});
test('native URL rejects when server secret is not configured',async()=>{
 calls=0;
 const result=await handleBrowserRequest(req('GET'),handler,undefined);
 assert.equal(result.status,401);assert.equal(calls,0);
});
test('native URL rejects short server secret',async()=>{
 calls=0;
 const result=await handleBrowserRequest(req('GET',{edgeSecret:'short'}),handler,'short');
 assert.equal(result.status,401);assert.equal(calls,0);
});
