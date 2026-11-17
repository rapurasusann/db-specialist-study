// CS-03 live smoke: real Neon Auth JWT -> server handler -> isolated PG.
// Creates TWO disposable test-only auth users and their study rows.
// Nothing is printed from passwords, JWTs, cookies, or DB credentials.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
const require=createRequire(import.meta.url);
const {request}=require(process.env.PLAYWRIGHT_MODULE_PATH);
const AUTH='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth';
const QUESTION='2025:am2:37';
function expect(cond,name){if(!cond)throw new Error('FAIL_'+name);console.log(name+'=PASS');}
function id(){return randomBytes(8).toString('hex');}
async function signup(label) {
 const c=await request.newContext({extraHTTPHeaders:{Origin:'http://localhost:5173'},timeout:15000});
 const email='cs03-e2e-'+id()+'@example.com',password=randomBytes(32).toString('base64url')+'A1!';
 try {
   const signup=await c.post(AUTH+'/sign-up/email',{data:{name:'CS03 E2E '+label,email,password}});
   if(!signup.ok())throw new Error('SIGNUP_'+label+'_HTTP_'+signup.status());
   const res=await c.get(AUTH+'/token');
   if(!res.ok())throw new Error('TOKEN_'+label+'_HTTP_'+res.status());
   const json=await res.json();
   if(typeof json.token!=='string')throw new Error('TOKEN_'+label+'_INVALID');
   return {token:json.token,context:c};
 } catch(e){await c.dispose();throw e}
}
function apiReq(method,token,input,query='') {
 const headers=token?{authorization:'Bearer '+token}:{};
 if(input) headers['content-type']='application/json';
 return new Request('https://local.invalid/progress'+query,{method,headers,body:input?JSON.stringify(input):undefined});
}
const ctx=[];
let runtime;
try{
 runtime=createCs03Runtime();
 const A=await signup('A');ctx.push(A.context);
 const verify=createNeonJwtVerifier({jwksUrl:AUTH+'/.well-known/jwks.json',issuer:'https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech',audience:'https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech'});
 const userA=(await verify(A.token)).userId;
 const B=await signup('B');ctx.push(B.context);
 const body={examCode:'db',questionId:QUESTION,data:{studyState:'cs03-e2e-a',nonce:id()},revision:1};
 let r=await runtime.handle(apiReq('PUT',A.token,body));
 expect(r.status===200,'A_SAVE');
 r=await runtime.handle(apiReq('GET',A.token,null,'?examCode=db&questionId='+QUESTION));
 const data=(await r.json()).data;
 expect(r.status===200&&data?.data?.nonce===body.data.nonce,'A_READ_OWN');
 r=await runtime.handle(apiReq('GET',B.token,null,'?examCode=db&questionId='+QUESTION));
 expect(r.status===200&&(await r.json()).data===null,'B_CANNOT_READ_A');
 r=await runtime.handle(apiReq('GET',B.token,null,'?examCode=db&questionId='+QUESTION+'&userId='+encodeURIComponent(userA)));
 expect(r.status===200&&(await r.json()).data===null,'B_CANNOT_SPOOF_GET');
 r=await runtime.handle(apiReq('PUT',B.token,{...body,userId:'a1111111-1111-4111-8111-111111111111',revision:1,data:{studyState:'cs03-e2e-b',nonce:id()}}));
 expect(r.status===200,'B_WRITES_OWN_DESPITE_SPOOFED_USERID');
 r=await runtime.handle(apiReq('GET',A.token,null,'?examCode=db&questionId='+QUESTION));
 expect(r.status===200&&(await r.json()).data?.data?.nonce===body.data.nonce,'A_UNCHANGED_AFTER_B');
 r=await runtime.handle(apiReq('GET',null,null,'?examCode=db&questionId='+QUESTION));
 expect(r.status===401,'ANONYMOUS_DENIED');
 r=await runtime.handle(apiReq('GET','invalid.invalid.invalid',null,'?examCode=db&questionId='+QUESTION));
 expect(r.status===401,'FORGED_TOKEN_DENIED');
 console.log('CS03_LIVE_E2E=PASS');
}catch(e){
 // Deliberately do not log request, token, URL or DB credentials.
 console.error('CS03_LIVE_E2E=FAIL_'+(e instanceof Error&&/^FAIL_[A-Z_]+$/.test(e.message)?e.message:'CHECK_PRIVATE_LOGS'));
 process.exitCode=1;
}finally{
 await Promise.allSettled(ctx.map(c=>c.dispose()));
 if(runtime)await runtime.close().catch(()=>{});
}
