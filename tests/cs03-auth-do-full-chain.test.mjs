import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalJWKSet,exportJWK,generateKeyPair,SignJWT} from 'jose';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';
// The SQLite interface here is an in-memory FAKE; real workerd SQLite is checked separately
// by local/cs03-do-smoke-check.mjs. No real Neon or Cloudflare accounts are contacted.
function simulatedStorage(){
 const data=new Map();
 return {transactionSync(fn){return fn();},sql:{exec(sql,...args){
  if(sql.startsWith('CREATE TABLE'))return {toArray:()=>[]};
  if(sql.startsWith('DELETE')){for(const id of data.keys())if(JSON.parse(id)[1]<args[0])data.delete(id);return {toArray:()=>[]};}
  const id=JSON.stringify([args[0],args[1]]);
  if(sql.startsWith('SELECT'))return {toArray:()=>data.has(id)?[{count:data.get(id)}]:[]};
  if(sql.startsWith('INSERT')){data.set(id,(data.get(id)??0)+1);return {toArray:()=>[]};}
  throw Error('UNEXPECTED_SQL');
 }}};
}
const ISS='https://auth.example.test/issuer',AUD='cs03-isolated-test';
const ORIGIN='https://rapurasusann.github.io';
const USER='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const {privateKey,publicKey}=await generateKeyPair('EdDSA');
const jwk=await exportJWK(publicKey);
const verifier=createNeonJwtVerifier({issuer:ISS,audience:AUD,jwks:createLocalJWKSet({keys:[{...jwk,kid:'isolated-key',alg:'EdDSA'}]})});
async function tokenFor(subject=USER,key=privateKey){
 return new SignJWT({}).setProtectedHeader({alg:'EdDSA',kid:'isolated-key'}).setSubject(subject)
  .setIssuer(ISS).setAudience(AUD).setIssuedAt().setExpirationTime('5m').sign(key);
}
function harness({limit=10,storage=simulatedStorage()}={}){
 const seen={upstream:0,do:0,identities:[]};
 const handler=createCs03QuotaObjectHandler({storage,limits:{global:60,perIp:20,perUser:limit}});
 const namespace={idFromName(name){assert.equal(name,'cs03-global-v1');return name;},get(){
  return {fetch(request,init){seen.do++;return handler(new Request(request,init));}};
 }};
 const atomicConsume=createCs03DurableObjectQuotaTransport({namespace});
 const quota=createCs03SharedQuota({atomicConsume,limits:{global:60,perIp:20,perUser:limit}});
 function gateway(){
  return createCs03TrustedEdgeGateway({
   verifyToken:verifier,getClientIp:()=> '192.0.2.155',
   sharedQuota:quota,limits:{global:100,perIp:100,perUser:100},
   upstreamUrl:'https://isolated-neon-function.invalid/progress',
   upstreamSecret:'isolated-test-secret-xxxxxxxxxxxxxxxxxxxxxxxxxx',
   fetcher:async(_url,opts)=>{
    seen.upstream++;
    const identity=await verifier(opts.headers.authorization.slice(7));
    seen.identities.push(identity.userId);
    assert.equal(opts.headers['x-secret'],'isolated-test-secret-xxxxxxxxxxxxxxxxxxxxxxxxxx');
    return Response.json({saved:opts.method==='PUT',userId:identity.userId});
   }
  });
 }
 return {gateway,seen};
}
const req=(bearer,method='GET',origin=ORIGIN)=>new Request('https://isolated-gateway.invalid/progress'+(method==='GET'?'?examCode=db':''),
 {method,headers:{origin,authorization:'Bearer '+bearer,...(method==='PUT'?{'content-type':'application/json'}:{})},
 ...(method==='PUT'?{body:JSON.stringify({examCode:'db',questionId:'q1',revision:0,data:{}})}:{})});
test('signed JWT -> gateway -> DO quota transport -> DO handler -> isolated upstream GET and PUT',async()=>{
 const h=harness(),g=h.gateway(),token=await tokenFor();
 for(const method of ['GET','PUT']){
  const response=await g(req(token,method));
  assert.equal(response.status,200);
  assert.equal((await response.json()).userId,USER);
 }
 assert.equal(h.seen.do,2);
 assert.equal(h.seen.upstream,2);
 assert.deepEqual(h.seen.identities,[USER,USER]);
});
test('forged JWT and untrusted browser origin never reach quota or upstream',async()=>{
 const h=harness(),g=h.gateway(),pair=await generateKeyPair('EdDSA');
 assert.equal((await g(req(await tokenFor(USER,pair.privateKey)))).status,401);
 assert.equal((await g(req(await tokenFor(),'GET','https://evil.example'))).status,403);
 assert.equal(h.seen.do,0);
 assert.equal(h.seen.upstream,0);
});
test('two gateways sharing one DO reject quota excess before isolated Neon upstream',async()=>{
 const h=harness({limit:2}),first=h.gateway(),second=h.gateway(),token=await tokenFor();
 const statuses=await Promise.all([first(req(token)),second(req(token)),first(req(token)),second(req(token))]);
 assert.deepEqual(statuses.map(r=>r.status).sort(),[200,200,429,429]);
 assert.equal(h.seen.upstream,2);
 assert.equal(h.seen.do,4);
});
