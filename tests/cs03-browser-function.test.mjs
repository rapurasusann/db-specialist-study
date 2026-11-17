import test from 'node:test';
import assert from 'node:assert/strict';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';
const ORIGIN='https://rapurasusann.github.io';
function req(method,{origin=ORIGIN,auth='Bearer testtoken',contentType='application/json',length}={}) {
 const headers={origin};
 if(auth)headers.authorization=auth;
 if(contentType&&method==='PUT')headers['content-type']=contentType;
 if(length!==undefined)headers['content-length']=length;
 return new Request('https://branch-function.invalid/progress',{method,headers,body:method==='PUT'?'{}':undefined});
}
let calls=0;
const handler=()=>{calls++;return {handle:async()=>Response.json({data:{safe:true}})}};
test('valid GET is forwarded to authenticated API handler',async()=>{
 calls=0;const result=await handleBrowserRequest(req('GET'),handler);
 assert.equal(result.status,200);assert.equal(calls,1);
 assert.equal(result.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal(result.headers.get('cache-control'),'no-store');
});
test('valid PUT is forwarded',async()=>{
 calls=0;const result=await handleBrowserRequest(req('PUT'),handler);
 assert.equal(result.status,200);assert.equal(calls,1);
});
test('allowed browser preflight does not call database runtime',async()=>{
 calls=0;const result=await handleBrowserRequest(new Request('https://branch-function.invalid/progress',{method:'OPTIONS',headers:{origin:ORIGIN,'access-control-request-method':'PUT','access-control-request-headers':'authorization, content-type'}}),handler);
 assert.equal(result.status,204);assert.equal(calls,0);
 assert.match(result.headers.get('access-control-allow-headers'),/authorization/);
});
for(const origin of ['https://evil.example','null','http://localhost:5173']){
 test('untrusted origin rejected '+origin,async()=>{
  calls=0;assert.equal((await handleBrowserRequest(req('GET',{origin}),handler)).status,403);assert.equal(calls,0);
 });
}
test('missing origin rejected',async()=>{
 calls=0;
 assert.equal((await handleBrowserRequest(new Request('https://branch-function.invalid/progress'),handler)).status,403);
 assert.equal(calls,0);
});
test('no bearer header rejected before runtime',async()=>{
 calls=0;assert.equal((await handleBrowserRequest(req('GET',{auth:null}),handler)).status,401);assert.equal(calls,0);
});
test('invalid method rejected before runtime',async()=>{
 calls=0;assert.equal((await handleBrowserRequest(req('POST'),handler)).status,405);assert.equal(calls,0);
});
test('wrong route rejected before runtime',async()=>{
 calls=0;const request=new Request('https://branch-function.invalid/other',{headers:{origin:ORIGIN}});
 assert.equal((await handleBrowserRequest(request,handler)).status,404);assert.equal(calls,0);
});
test('oversized PUT rejected before runtime',async()=>{
 calls=0;assert.equal((await handleBrowserRequest(req('PUT',{length:'20001'}),handler)).status,413);assert.equal(calls,0);
});
test('wrong media type rejected before runtime',async()=>{
 calls=0;assert.equal((await handleBrowserRequest(req('PUT',{contentType:'text/plain'}),handler)).status,415);assert.equal(calls,0);
});
test('runtime failure is generic and includes CORS',async()=>{
 const result=await handleBrowserRequest(req('GET'),()=>{throw Error('secret data');});
 assert.equal(result.status,503);assert.equal(result.headers.get('access-control-allow-origin'),ORIGIN);
 assert.doesNotMatch(await result.text(),/secret/);
});
