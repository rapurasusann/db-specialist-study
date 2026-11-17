'use strict';
// Run only against the isolated CS-03 Neon Auth sandbox.
// One disposable test account is created. Never log passwords, cookies, or JWTs.
const { randomBytes }=require('node:crypto');
const { request }=require(process.env.PLAYWRIGHT_MODULE_PATH);
(async()=>{
const base='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth';
const jwksUrl=base+'/.well-known/jwks.json';
const {createRemoteJWKSet,jwtVerify,decodeProtectedHeader}=await import('jose');
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
 catch(e){
  console.log('JWKS_SIGNATURE=FAIL');
  const header=decodeProtectedHeader(token);
  console.log('TOKEN_ALGORITHM='+String(header.alg||'MISSING'));
  console.log('TOKEN_HAS_KEY_ID='+(typeof header.kid==='string'?'YES':'NO'));
  const response=await context.get(jwksUrl).catch(()=>null);
  console.log('JWKS_HTTP='+(response?.status()??'NETWORK_ERROR'));
  if(response?.ok()){
    const document=await response.json().catch(()=>({}));
    const keys=Array.isArray(document.keys)?document.keys:[];
    console.log('JWKS_KEY_COUNT='+keys.length);
    console.log('JWKS_KEY_TYPES='+[...new Set(keys.map(k=>k.kty).filter(x=>typeof x==='string'))].join(','));
    console.log('JWKS_KEY_ALGORITHMS='+[...new Set(keys.map(k=>k.alg).filter(x=>typeof x==='string'))].join(','));
    console.log('JWKS_KID_MATCH='+(keys.some(k=>typeof header.kid==='string'&&k.kid===header.kid)?'YES':'NO'));
  }
  console.log('JOSE_ERROR_CODE='+String(e.code||'NONE'));
  console.log('AUTH_E2E=JWT_SIGNATURE_DIAGNOSIS_REQUIRED');
  process.exitCode=1;return;
}
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
