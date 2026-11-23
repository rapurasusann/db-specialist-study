// Offline end-to-end entrypoint acceptance. All token signing keys, quota storage,
// upstream progress data, and Cloudflare metadata are test-only. No network calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03Entrypoint} from '../server/cs03-gateway-production-adapter.mjs';
import {createCs03BrowserJwtEntrypoint} from '../server/cs03-browser-jwt-entrypoint.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';
import {createCs03AccountClient} from '../src/cs03-account-client.mjs';

const ORIGIN='https://rapurasusann.github.io';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECRET='TEST-ONLY-NEON-GATEWAY-SECRET-1234567890';
const ISS='https://isolated-auth.example.test/issuer',AUD='cs03-entry-test';
const {privateKey,publicKey}=await generateKeyPair('EdDSA');
const jwk=await exportJWK(publicKey);
const verifyToken=createNeonJwtVerifier({issuer:ISS,audience:AUD,
 jwks:createLocalJWKSet({keys:[{...jwk,kid:'entry-local',alg:'EdDSA'}]})});
async function signedToken(key=privateKey,subject=USER){
 return new SignJWT({}).setProtectedHeader({alg:'EdDSA',kid:'entry-local'})
  .setSubject(subject).setIssuer(ISS).setAudience(AUD).setIssuedAt().setExpirationTime('5m').sign(key);
}
function storage(){
 const rows=new Map();
 return {transactionSync:fn=>fn(),sql:{exec(sql,...args){
  if(sql.startsWith('CREATE TABLE'))return {toArray:()=>[]};
  if(sql.startsWith('DELETE')){for(const key of rows.keys())if(JSON.parse(key)[1]<args[0])rows.delete(key);return {toArray:()=>[]};}
  const key=JSON.stringify([args[0],args[1]]);
  if(sql.startsWith('SELECT'))return {toArray:()=>rows.has(key)?[{count:rows.get(key)}]:[]};
  if(sql.startsWith('INSERT')){rows.set(key,(rows.get(key)??0)+1);return {toArray:()=>[]};}
  throw Error('UNEXPECTED_SQL');
 }}};
}
function setup({perUserLimit=2}={}){
 const seen={neon:0,do:0,records:new Map()};
 const internal=createCs03QuotaObjectHandler({storage:storage(),
  limits:{global:60,perIp:20,perUser:perUserLimit}});
 const namespace={idFromName:name=>{assert.equal(name,'cs03-global-v1');return name;},
  get:()=>({fetch:(url,init)=>{seen.do++;return internal(new Request(url,init));}})};
 const quota=createCs03SharedQuota({atomicConsume:createCs03DurableObjectQuotaTransport({namespace}),
  limits:{global:60,perIp:20,perUser:perUserLimit}});
 const runtime={handle:async r=>{
  const identity=await verifyToken(r.headers.get('authorization')?.slice(7));
  const key=identity.userId;
  if(r.method==='PUT'){
   const body=await r.json(),prior=seen.records.get(key);
   if(body.revision!==(prior?.revision??0)+1)return Response.json({error:'Conflict'},{status:409});
   const saved={data:body.data,revision:body.revision,updated_at:'2026-11-23T00:00:00Z'};
   seen.records.set(key,saved);
   return Response.json({data:saved});
  }
  return Response.json({data:seen.records.get(key)??null});
 }};
 const gatewayFactory=()=>createCs03TrustedEdgeGateway({
  verifyToken,sharedQuota:quota,getClientIp:()=> '192.0.2.55',
  upstreamUrl:'https://isolated-neon.invalid/progress',
  upstreamSecret:SECRET,limits:{global:100,perIp:100,perUser:100},
  fetcher:async(url,init)=>{
   seen.neon++;
   return handleBrowserRequest(new Request(url,{method:init.method,headers:init.headers,body:init.body}),
    ()=>runtime,SECRET);
  }
 });
 const entry=createCs03Entrypoint({createGateway:gatewayFactory});
 const browserEntry=createCs03BrowserJwtEntrypoint({createGateway:gatewayFactory});
 const env={CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only',CS03_BROWSER_JWT_MODE:'isolated-review-only',CS03_ACCESS_AUD:'cs03-test-access-audience'};
 const accessContext={access:{aud:'cs03-test-access-audience'}};
 function request(token,{method='GET',origin=ORIGIN,cf=true}={}){
  const url='https://candidate.invalid/progress'+(method==='GET'?'?examCode=db':'');
  const headers={origin,authorization:'Bearer '+token,'cf-connecting-ip':'192.0.2.55'};
  if(method==='PUT')headers['content-type']='application/json';
  const r=new Request(url,{method,headers,
   ...(method==='PUT'?{body:JSON.stringify({examCode:'db',questionId:'q1',revision:1,data:{level:'review'}})}:{})});
  if(cf)Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
  return r;
 }
 return {entry,browserEntry,env,seen,request,accessContext};
}
test('entrypoint routes signed JWT through shared DO and native Neon read/write',async()=>{
 const h=setup(),token=await signedToken();
 const put=await h.entry.fetch(h.request(token,{method:'PUT'}),h.env,h.accessContext);
 assert.equal(put.status,200);
 const get=await h.entry.fetch(h.request(token),h.env,h.accessContext);
 assert.equal(get.status,200);
 assert.equal((await get.json()).data.data.level,'review');
 assert.equal(h.seen.neon,2);
 assert.equal(h.seen.do,2);
});
test('entrypoint blocks forged tokens, bad origins, missing CF metadata without DO or Neon calls',async()=>{
 const h=setup(),token=await signedToken(),forged=await generateKeyPair('EdDSA');
 assert.equal((await h.entry.fetch(h.request(await signedToken(forged.privateKey)),h.env,h.accessContext)).status,401);
 assert.equal((await h.entry.fetch(h.request(token,{origin:'https://evil.invalid'}),h.env,h.accessContext)).status,403);
 assert.equal((await h.entry.fetch(h.request(token,{cf:false}),h.env,h.accessContext)).status,503);
 assert.equal(h.seen.do,0);
 assert.equal(h.seen.neon,0);
});
test('entrypoint denies quota excess before Neon and still fails closed when mode absent',async()=>{
 const h=setup(),token=await signedToken();
 const statuses=[];
 for(let i=0;i<3;i++)statuses.push((await h.entry.fetch(h.request(token),h.env,h.accessContext)).status);
 assert.deepEqual(statuses,[200,200,429]);
 assert.equal(h.seen.neon,2);
 assert.equal(h.seen.do,3);
 assert.equal((await h.entry.fetch(h.request(token),{})).status,503);
 assert.equal(h.seen.neon,2);
});

test('browser account client reaches JWT-only Worker, shared DO, native Function; accounts remain isolated',async()=>{
 const h=setup({perUserLimit:10});
 const userB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 async function account(userId){
  const token=await signedToken(privateKey,userId);
  const local=new Map();
  const authClient={
   signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
   getSession:async()=>({data:{user:{id:userId,email:'test@example.invalid'}}}),
   signOut:async()=>({data:{}}),token:async()=>({data:{token}})
  };
  return createCs03AccountClient({authClient,apiUrl:'https://candidate.invalid/',
   storage:{getItem:key=>local.get(key)??null,setItem:(key,val)=>local.set(key,val)},
   fetcher:(url,init)=>{
    const headers=new Headers(init.headers);
    assert.equal(headers.has('x-secret'),false,'the browser must not know gateway secret');
    assert.equal(init.credentials,'omit');
    assert.equal(headers.has('cookie'),false);
    assert.equal(headers.has('cf-access-client-secret'),false);
    headers.set('origin',ORIGIN);headers.set('cf-connecting-ip','192.0.2.55');
    const r=new Request(url,{method:init.method,headers,body:init.body});
    Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
    return h.browserEntry.fetch(r,h.env);
   }});
 }
 const a=await account(USER),b=await account(userB),question='2026:am2:100';
 assert.equal(await a.pull(question),null);
 assert.equal((await a.save(question,{level:'mastered'})).revision,1);
 assert.equal(await b.pull(question),null);
 assert.equal((await b.save(question,{level:'review'})).revision,1);
 assert.equal((await a.pull(question)).data.level,'mastered');
 assert.equal((await b.pull(question)).data.level,'review');
 assert.equal(h.seen.records.size,2);
 assert.equal(h.seen.neon,6);
 assert.equal(h.seen.do,6);
});

test('entrypoint refuses absent or mismatched Cloudflare Access context before DO or Neon',async()=>{
 const h=setup(),token=await signedToken(),req=h.request(token);
 assert.equal((await h.entry.fetch(req,h.env)).status,503);
 assert.equal((await h.entry.fetch(req,h.env,{access:{aud:'wrong-app-audience'}})).status,503);
 assert.equal((await h.entry.fetch(req,{...h.env,CS03_ACCESS_AUD:'wrong-app-audience'},h.accessContext)).status,503);
 assert.equal((await h.entry.fetch(req,{...h.env,CS03_ACCESS_AUD:''},h.accessContext)).status,503);
 assert.equal(h.seen.neon,0);
 assert.equal(h.seen.do,0);
});

test('browser JWT entrypoint: signed JWT PUT/GET uses DO and isolated Neon without Access cookies',async()=>{
 const h=setup({perUserLimit:10}),token=await signedToken();
 const put=await h.browserEntry.fetch(h.request(token,{method:'PUT'}),h.env);
 assert.equal(put.status,200);
 const get=await h.browserEntry.fetch(h.request(token),h.env);
 assert.equal(get.status,200);
 assert.equal((await get.json()).data.data.level,'review');
 assert.equal(h.seen.do,2);
 assert.equal(h.seen.neon,2);
});
test('browser JWT entrypoint: preflight is strict, unauthenticated and forged JWT never reach DO or Neon',async()=>{
 const h=setup(),token=await signedToken(),forged=await generateKeyPair('EdDSA');
 const preflight=new Request('https://candidate.invalid/progress',{method:'OPTIONS',headers:{
  origin:ORIGIN,'access-control-request-method':'GET',
  'access-control-request-headers':'authorization, content-type'
 }});
 Object.defineProperty(preflight,'cf',{value:{colo:'NRT'}});
 const options=await h.browserEntry.fetch(preflight,h.env);
 assert.equal(options.status,204);
 assert.equal(options.headers.get('access-control-allow-origin'),ORIGIN);
 assert.equal((await h.browserEntry.fetch(h.request('not-a-valid-token'),h.env)).status,401);
 assert.equal((await h.browserEntry.fetch(h.request(await signedToken(forged.privateKey)),h.env)).status,401);
 assert.equal((await h.browserEntry.fetch(h.request(token,{origin:'https://evil.invalid'}),h.env)).status,403);
 assert.equal((await h.browserEntry.fetch(h.request(token,{cf:false}),h.env)).status,503);
 assert.equal(h.seen.do,0);
 assert.equal(h.seen.neon,0);
});
test('browser JWT entrypoint: quota excess and DO storage failure fail closed before Neon',async()=>{
 const h=setup({perUserLimit:2}),token=await signedToken();
 const statuses=[];
 for(let i=0;i<3;i++)statuses.push((await h.browserEntry.fetch(h.request(token),h.env)).status);
 assert.deepEqual(statuses,[200,200,429]);
 assert.equal(h.seen.neon,2);
 assert.equal(h.seen.do,3);
 let forbiddenUpstream=0;
 const failing=createCs03BrowserJwtEntrypoint({createGateway:()=>createCs03TrustedEdgeGateway({
  verifyToken,upstreamUrl:'https://isolated-neon.invalid/progress',upstreamSecret:SECRET,
  getClientIp:()=> '192.0.2.55',
  sharedQuota:{consume:async()=>{throw Error('DO_UNAVAILABLE');}},
  fetcher:async()=>{forbiddenUpstream++;throw Error('UPSTREAM_MUST_NOT_BE_CALLED');}
 })});
 const reply=await failing.fetch(h.request(token),h.env);
 assert.equal(reply.status,503);
 assert.equal(forbiddenUpstream,0);
});
