// Offline end-to-end entrypoint acceptance. All token signing keys, quota storage,
// upstream progress data, and Cloudflare metadata are test-only. No network calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03Entrypoint} from '../server/cs03-gateway-production-adapter.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';
import {handleBrowserRequest} from '../functions/cs03-progress.mjs';

const ORIGIN='https://rapurasusann.github.io';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SECRET='TEST-ONLY-NEON-GATEWAY-SECRET-1234567890';
const ISS='https://isolated-auth.example.test/issuer',AUD='cs03-entry-test';
const {privateKey,publicKey}=await generateKeyPair('EdDSA');
const jwk=await exportJWK(publicKey);
const verifyToken=createNeonJwtVerifier({issuer:ISS,audience:AUD,
 jwks:createLocalJWKSet({keys:[{...jwk,kid:'entry-local',alg:'EdDSA'}]})});
async function signedToken(key=privateKey){
 return new SignJWT({}).setProtectedHeader({alg:'EdDSA',kid:'entry-local'})
  .setSubject(USER).setIssuer(ISS).setAudience(AUD).setIssuedAt().setExpirationTime('5m').sign(key);
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
function setup(){
 const seen={neon:0,do:0,records:new Map()};
 const internal=createCs03QuotaObjectHandler({storage:storage(),
  limits:{global:60,perIp:20,perUser:2}});
 const namespace={idFromName:name=>{assert.equal(name,'cs03-global-v1');return name;},
  get:()=>({fetch:(url,init)=>{seen.do++;return internal(new Request(url,init));}})};
 const quota=createCs03SharedQuota({atomicConsume:createCs03DurableObjectQuotaTransport({namespace}),
  limits:{global:60,perIp:20,perUser:2}});
 const runtime={handle:async r=>{
  const identity=await verifyToken(r.headers.get('authorization')?.slice(7));
  const key=identity.userId;
  if(r.method==='PUT'){seen.records.set(key,await r.json());return Response.json({data:{saved:true}});}
  return Response.json({data:seen.records.get(key)??null});
 }};
 const entry=createCs03Entrypoint({createGateway:()=>createCs03TrustedEdgeGateway({
  verifyToken,sharedQuota:quota,getClientIp:()=> '192.0.2.55',
  upstreamUrl:'https://isolated-neon.invalid/progress',
  upstreamSecret:SECRET,limits:{global:100,perIp:100,perUser:100},
  fetcher:async(url,init)=>{
   seen.neon++;
   return handleBrowserRequest(new Request(url,{method:init.method,headers:init.headers,body:init.body}),
    ()=>runtime,SECRET);
  }
 })});
 const env={CS03_ISOLATED_GATEWAY_MODE:'isolated-review-only'};
 function request(token,{method='GET',origin=ORIGIN,cf=true}={}){
  const url='https://candidate.invalid/progress'+(method==='GET'?'?examCode=db':'');
  const headers={origin,authorization:'Bearer '+token,'cf-connecting-ip':'192.0.2.55'};
  if(method==='PUT')headers['content-type']='application/json';
  const r=new Request(url,{method,headers,
   ...(method==='PUT'?{body:JSON.stringify({examCode:'db',questionId:'q1',revision:1,data:{level:'review'}})}:{})});
  if(cf)Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
  return r;
 }
 return {entry,env,seen,request};
}
test('entrypoint routes signed JWT through shared DO and native Neon read/write',async()=>{
 const h=setup(),token=await signedToken();
 const put=await h.entry.fetch(h.request(token,{method:'PUT'}),h.env);
 assert.equal(put.status,200);
 const get=await h.entry.fetch(h.request(token),h.env);
 assert.equal(get.status,200);
 assert.equal((await get.json()).data.data.level,'review');
 assert.equal(h.seen.neon,2);
 assert.equal(h.seen.do,2);
});
test('entrypoint blocks forged tokens, bad origins, missing CF metadata without DO or Neon calls',async()=>{
 const h=setup(),token=await signedToken(),forged=await generateKeyPair('EdDSA');
 assert.equal((await h.entry.fetch(h.request(await signedToken(forged.privateKey)),h.env)).status,401);
 assert.equal((await h.entry.fetch(h.request(token,{origin:'https://evil.invalid'}),h.env)).status,403);
 assert.equal((await h.entry.fetch(h.request(token,{cf:false}),h.env)).status,503);
 assert.equal(h.seen.do,0);
 assert.equal(h.seen.neon,0);
});
test('entrypoint denies quota excess before Neon and still fails closed when mode absent',async()=>{
 const h=setup(),token=await signedToken();
 const statuses=[];
 for(let i=0;i<3;i++)statuses.push((await h.entry.fetch(h.request(token),h.env)).status);
 assert.deepEqual(statuses,[200,200,429]);
 assert.equal(h.seen.neon,2);
 assert.equal(h.seen.do,3);
 assert.equal((await h.entry.fetch(h.request(token),{})).status,503);
 assert.equal(h.seen.neon,2);
});
