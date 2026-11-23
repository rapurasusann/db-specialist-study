// Newly targeted local failure gates. No network, cloud bindings or real credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03Entrypoint} from '../server/cs03-gateway-production-adapter.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03DraftStore} from '../src/cs03-draft-store.mjs';
import {createCs03AccountClient} from '../src/cs03-account-client.mjs';

const ORIGIN='https://rapurasusann.github.io';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const KEY='2026:am2:1';
const SECRET='CS03-LOCAL-ONLY-TEST-SECRET-1234567890';
function memory(){
 const items=new Map();
 return {items,getItem:k=>items.get(k)??null,setItem:(k,v)=>{items.set(k,v);},
  removeItem:k=>{items.delete(k);}};
}
function request(){
 const r=new Request('https://candidate.invalid/progress?examCode=db',{
  headers:{origin:ORIGIN,authorization:'Bearer locally-valid-test-token','cf-connecting-ip':'192.0.2.40'}});
 Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
 return r;
}
function entry({sharedQuota,fetcher}){
 return createCs03Entrypoint({createGateway:()=>createCs03TrustedEdgeGateway({
  verifyToken:async()=>({userId:USER}),getClientIp:()=> '192.0.2.40',
  sharedQuota,fetcher,upstreamUrl:'https://isolated.invalid/progress',
  upstreamSecret:SECRET
 })});
}
const ENV={CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only'};
test('DO outage refuses request and never calls Neon upstream',async()=>{
 let upstream=0,quota=0;
 const e=entry({sharedQuota:{consume:async()=>{quota++;throw Error('DO_UNAVAILABLE');}},
  fetcher:async()=>{upstream++;return Response.json({data:{}});}});
 const response=await e.fetch(request(),ENV);
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'Service Unavailable'});
 assert.equal(quota,1);assert.equal(upstream,0);
 assert.equal(response.headers.get('cache-control'),'no-store');
});
test('Neon upstream exception refuses success and does not leak exception',async()=>{
 let quota=0,upstream=0;
 const e=entry({sharedQuota:{consume:async()=>{quota++;return true;}},
  fetcher:async()=>{upstream++;throw Error('SENSITIVE_TEST_ERROR_DO_NOT_EXPOSE');}});
 const response=await e.fetch(request(),ENV);
 assert.equal(response.status,503);assert.equal(quota,1);assert.equal(upstream,1);
 assert.doesNotMatch(await response.text(),/SENSITIVE_TEST_ERROR_DO_NOT_EXPOSE/);
});
test('missing gateway configuration returns 503 without touching upstream',async()=>{
 let constructed=0;
 const e=createCs03Entrypoint({createGateway:()=>{constructed++;throw Error('MISSING_SECRET');}});
 assert.equal((await e.fetch(request(),ENV)).status,503);
 assert.equal(constructed,1);
 assert.equal((await e.fetch(request(),{})).status,503);
 assert.equal(constructed,1);
});
test('API error preserves per-account unsent draft; no false successful save or cache update',async()=>{
 const local=memory(),drafts=createCs03DraftStore({storage:local});
 const draft={[KEY]:{level:'review',note:'not uploaded'}};
 drafts.replace(USER,draft);
 let sends=0;
 const auth={
  signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
  getSession:async()=>({data:{user:{id:USER}}}),signOut:async()=>({data:{}}),
  token:async()=>({data:{token:'local-only-test'}})
 };
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://isolated.invalid/',
  storage:local,fetcher:async()=>{sends++;return Response.json({error:'Service Unavailable'},{status:503});}});
 await assert.rejects(client.save(KEY,{level:'review'}),/PROGRESS_API_FAILED/);
 assert.equal(sends,1);
 assert.deepEqual(drafts.load(USER).records[KEY],draft[KEY]);
 assert.deepEqual(client.readLocal(USER),{});
 assert.equal(local.items.has(client.storageKey(USER)),false);
});
test('local draft storage failure refuses write and does not claim saved state',()=>{
 const drafts=createCs03DraftStore({storage:{
  getItem:()=>null,setItem:()=>{throw Error('STORAGE_DENIED');},removeItem:()=>{}
 }});
 assert.throws(()=>drafts.replace(USER,{[KEY]:{level:'review'}}),/DRAFT_STORAGE_UNAVAILABLE/);
});
