// CS-03 NEW negative-only workerd acceptance. Local loopback only.
// Start separately: wrangler dev --local --config local/wrangler.cs03-auth-do.json --port 8790
// No real Cloudflare or Neon calls, no production credentials.
import assert from 'node:assert/strict';
import {createPrivateKey,randomUUID} from 'node:crypto';
import {SignJWT} from 'jose';

const PEM=`-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIILW6h3IXsgXkfh11WmSxZ6JXmdmOFnCpdSvmcNjIzoG
-----END PRIVATE KEY-----`;
const ORIGIN='https://rapurasusann.github.io';
const URL_BASE='http://127.0.0.1:8790';
const ISSUER='https://cs03-local.example.test/issuer';
const AUDIENCE='cs03-local-only';
const key=createPrivateKey(PEM);
const user=randomUUID();
const token=async({issuer=ISSUER,audience=AUDIENCE,expired=false}={})=>{
 const now=Math.floor(Date.now()/1000);
 return new SignJWT({}).setProtectedHeader({alg:'EdDSA',kid:'local-cs03-only'})
  .setIssuer(issuer).setAudience(audience).setSubject(user)
  .setIssuedAt(now-120).setExpirationTime(expired?now-60:now+240).sign(key);
};
async function request(path,init){
 const url=new URL(path,URL_BASE);
 if(url.hostname!=='127.0.0.1'||url.protocol!=='http:'||url.port!=='8790')
  throw Error('NON_LOCAL_TARGET_DENIED');
 const response=await fetch(url,{...init,redirect:'manual',signal:AbortSignal.timeout(10000)});
 return {status:response.status,headers:response.headers};
}
function check(label,got,expected){
 console.log(label+'='+(got===expected?'PASS':'FAIL'));
 assert.equal(got,expected,label);
}
try{
 const valid=await token();
 const base='/progress?examCode=db';
 check('NEG_MISSING_AUTH', (await request(base,{headers:{origin:ORIGIN}})).status,401);
 check('NEG_WRONG_ISSUER', (await request(base,{headers:{origin:ORIGIN,authorization:'Bearer '+await token({issuer:'https://incorrect.invalid/issuer'})}})).status,401);
 check('NEG_WRONG_AUDIENCE', (await request(base,{headers:{origin:ORIGIN,authorization:'Bearer '+await token({audience:'other'})}})).status,401);
 check('NEG_EXPIRED_JWT', (await request(base,{headers:{origin:ORIGIN,authorization:'Bearer '+await token({expired:true})}})).status,401);
 check('NEG_MISSING_ORIGIN', (await request(base,{headers:{authorization:'Bearer '+valid}})).status,403);
 check('NEG_WRONG_HTTP_METHOD', (await request('/progress',{method:'DELETE',headers:{origin:ORIGIN,authorization:'Bearer '+valid}})).status,405);
 check('NEG_WRONG_PATH', (await request('/other',{headers:{origin:ORIGIN,authorization:'Bearer '+valid}})).status,404);
 check('NEG_BAD_PUT_CONTENT_TYPE', (await request('/progress',{method:'PUT',headers:{origin:ORIGIN,authorization:'Bearer '+valid,'content-type':'text/plain'},body:'hello'})).status,415);
 check('NEG_LARGE_PUT_BODY', (await request('/progress',{method:'PUT',headers:{origin:ORIGIN,authorization:'Bearer '+valid,'content-type':'application/json'},body:JSON.stringify({data:'x'.repeat(21000)})})).status,413);
 check('NEG_INVALID_PREFLIGHT_METHOD', (await request('/progress',{method:'OPTIONS',headers:{origin:ORIGIN,'access-control-request-method':'DELETE','access-control-request-headers':'authorization'}})).status,405);
 check('NEG_VALID_PREFLIGHT', (await request('/progress',{method:'OPTIONS',headers:{origin:ORIGIN,'access-control-request-method':'PUT','access-control-request-headers':'authorization, content-type'}})).status,204);
 console.log('CS03_WORKERD_NEGATIVE_ONLY_PASS');
}catch(error){
 console.log('CS03_WORKERD_NEGATIVE_ONLY_FAIL');
 console.log('FAIL_CLASS='+(error?.code==='ECONNREFUSED'?'LOCAL_WORKER_NOT_RUNNING':
  error?.code==='ERR_ASSERTION'?'NEGATIVE_ASSERTION_FAILED':'LOCAL_WORKER_ENVIRONMENT_OR_ASSERTION_FAILED'));
 process.exitCode=1;
}
