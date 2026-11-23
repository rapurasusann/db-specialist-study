// Local-only end-to-end workerd check. Test key is NOT a production credential.
// Start: wrangler dev --local --config local/wrangler.cs03-auth-do.json --port 8790
import assert from 'node:assert/strict';
import {createPrivateKey,randomUUID} from 'node:crypto';
import {SignJWT} from 'jose';
const PEM=`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIILW6h3IXsgXkfh11WmSxZ6JXmdmOFnCpdSvmcNjIzoG
-----END PRIVATE KEY-----`;
const issuer='https://cs03-local.example.test/issuer',audience='cs03-local-only';
const user=randomUUID();
const token=await new SignJWT({}).setProtectedHeader({alg:'EdDSA',kid:'local-cs03-only'})
 .setIssuer(issuer).setAudience(audience).setSubject(user).setIssuedAt().setExpirationTime('5m')
 .sign(createPrivateKey(PEM));
const base='http://127.0.0.1:8790/progress';
const headers={origin:'https://rapurasusann.github.io',authorization:'Bearer '+token};
async function call(method='GET',extra={}){
 const response=await fetch(base+(method==='GET'?'?examCode=db':''),{
  method,headers:{...headers,...(method==='PUT'?{'content-type':'application/json'}:{}),...extra.headers},
  ...(method==='PUT'?{body:JSON.stringify({examCode:'db',questionId:'demo',revision:0,data:{seen:true}})}:{}),
  signal:AbortSignal.timeout(10000)
 });
 return {status:response.status,body:await response.json()};
}
let result=await call();
assert.equal(result.status,200);
assert.equal(result.body.userId,user);
assert.equal(result.body.data,null);
result=await call('PUT');
assert.equal(result.status,200);
assert.equal(result.body.saved,true);
result=await call();
assert.equal(result.status,200);
assert.deepEqual(result.body.data.data,{seen:true});
const invalid=await call('GET',{headers:{authorization:'Bearer not-a-real-signed-token'}});
assert.equal(invalid.status,401);
const evil=await call('GET',{headers:{origin:'https://evil.example'}});
assert.equal(evil.status,403);
for(let i=0;i<7;i++)assert.equal((await call()).status,200);
assert.equal((await call()).status,429);
console.log('CS03_WORKERD_JWT_DO_FULLCHAIN_PASS read=1 write=1 repeat=8 denied=1 invalidJWT=401 invalidOrigin=403');
