// Read-only connectivity preflight for the isolated Neon Managed Auth instance.
// Does not create users, send email, submit passwords, or touch the production branch.
import {URL} from 'node:url';
const BRANCH_AUTH='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth';
const JWKS=BRANCH_AUTH+'/.well-known/jwks.json';
function check(name,passed){
 console.log(name+'='+(passed?'PASS':'FAIL'));
 if(!passed)throw Error('AUTH_PREFLIGHT_FAILED');
}
function noRedirect(url){
 const parsed=new URL(url);
 if(parsed.origin!=='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech' ||
    parsed.pathname!=='/cs03_auth_sandbox/auth/.well-known/jwks.json')
   throw Error('AUTH_ENDPOINT_MISMATCH');
}
try{
 noRedirect(JWKS);
 const response=await fetch(JWKS,{method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000)});
 check('ISOLATED_JWKS_HTTPS',response.url===JWKS);
 check('ISOLATED_JWKS_STATUS_200',response.status===200);
 const data=await response.json();
 check('ISOLATED_JWKS_KEYS_PRESENT',Array.isArray(data.keys)&&data.keys.length>0);
 check('ISOLATED_JWKS_PUBLIC_ONLY',data.keys.every(k=>typeof k.kid==='string'&&k.kty&& !Object.hasOwn(k,'d')&&!Object.hasOwn(k,'p')&&!Object.hasOwn(k,'q')));
 console.log('CS03_NEON_AUTH_PREFLIGHT=PASS');
}catch{
 console.log('CS03_NEON_AUTH_PREFLIGHT=FAIL');
 process.exitCode=1;
}
