'use strict';
// Run only against the isolated CS-03 Neon Auth sandbox.
// One disposable test account is created. Never log passwords, cookies, or JWTs.
const { randomBytes }=require('node:crypto');
const { request }=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
const base='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth';
const jwksUrl=base+'/.well-known/jwks.json';
const {createRemoteJWKSet,jwtVerify,decodeJwt}=await import('jose');
const {createNeonJwtVerifier}=await import('../src/neon-jwt-verifier.mjs');
const email='cs03-'+randomBytes(8).toString('hex')+'@example.com';
const password=randomBytes(36).toString('base64url')+'A1!';
const context=await request.newContext({extraHTTPHeaders:{Origin:'http://localhost:5173'},timeout:15000});
try {
 const signUp=await context.post(base+'/sign-up/email',{data:{name:'CS03 Isolated Test',email,password}});
 console.log('SIGNUP_HTTP='+signUp.status());
 if(!signUp.ok()){console.log('AUTH_E2E=BLOCKED_SIGNUP');process.exitCode=1;return;}
 const tok=await context.get(base+'/token');
 console.log('TOKEN_HTTP='+tok.status());
 if(!tok.ok()){console.log('AUTH_E2E=BLOCKED_TOKEN');process.exitCode=1;return;}
 const body=await tok.json().catch(()=>({}));
 const token=body.token;
 if(typeof token!=='string'||token.split('.').length!==3){console.log('AUTH_E2E=TOKEN_FORMAT_UNEXPECTED');process.exitCode=1;return;}
 // Signature verification is independent of any untrusted claim.
 const jwks=createRemoteJWKSet(new URL(jwksUrl));
 let verified;
 try{verified=(await jwtVerify(token,jwks,{algorithms:['RS256','ES256'],requiredClaims:['sub','iat','exp']})).payload;}
 catch{console.log('JWKS_SIGNATURE=FAIL');process.exitCode=1;return;}
 console.log('JWKS_SIGNATURE=PASS');
 console.log('SUBJECT_UUID='+(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(verified.sub||'')?'YES':'NO'));
 console.log('ISSUER='+JSON.stringify(verified.iss??null));
 console.log('AUDIENCE='+JSON.stringify(verified.aud??null));
 console.log('ISSUER_EQUALS_BRANCH_BASE='+(verified.iss===base?'YES':'NO'));
 if(typeof verified.aud!=='string'||!verified.aud){console.log('STRICT_AUDIENCE=NOT_AVAILABLE');console.log('AUTH_E2E=JWT_CONTRACT_REVIEW_REQUIRED');return;}
 try{const v=createNeonJwtVerifier({jwksUrl,issuer:base,audience:verified.aud});
  const identity=await v(token);
  console.log('EXISTING_VERIFIER='+(identity.userId===verified.sub?.toLowerCase()?'PASS':'FAIL'));
 }catch{console.log('EXISTING_VERIFIER=FAIL');process.exitCode=1;return;}
 console.log('AUTH_E2E=PASS');
}finally{await context.dispose();}
})().catch(e=>{console.error('AUTH_E2E=ERROR '+(e.code||e.name||'UNKNOWN'));process.exitCode=1});
