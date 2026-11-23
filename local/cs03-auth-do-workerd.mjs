// LOCAL TEST HARNESS ONLY. Never deploy. No production auth, data or secrets.
// This local worker keeps a fixed, *test-only* Ed25519 PUBLIC key to exercise real JWT
// signature validation inside workerd. Private test key is in local check script.
import {createLocalJWKSet} from 'jose';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
import {createCs03TrustedEdgeGateway} from '../server/cs03-trusted-edge-gateway.mjs';
import {createCs03SharedQuota} from '../server/cs03-shared-quota.mjs';
import {createCs03DurableObjectQuotaTransport} from '../server/cs03-cloudflare-do-transport.mjs';
import {createCs03QuotaObjectHandler} from '../server/cs03-cloudflare-do-handler.mjs';

const ORIGIN='https://rapurasusann.github.io', SECRET='LOCAL-ONLY-CS03-NOT-FOR-DEPLOYMENT-123456789';
const ISS='https://cs03-local.example.test/issuer', AUD='cs03-local-only';
const verify=createNeonJwtVerifier({issuer:ISS,audience:AUD,jwks:createLocalJWKSet({keys:[
 {kty:'OKP',crv:'Ed25519',x:'K33r0I4uW5FcuJoMKDxiyMcFKGoNaMBqNB_4O9bJLuo',alg:'EdDSA',kid:'local-cs03-only'}
]})});
export class Cs03LocalFullQuota{
 constructor(ctx){this.handler=createCs03QuotaObjectHandler({storage:ctx.storage});}
 fetch(request){return this.handler(request);}
}
const fakeProgress=new Map();
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost'].includes(url.hostname))
   return new Response('Not Found',{status:404});
  if(!env.CS03_LOCAL_FULL_QUOTA)return new Response('Service Unavailable',{status:503});
  // Local diagnostic instrumentation only: statuses/stages, never tokens or identities.
  // Keep the production gateway's generic 503 response unchanged.
  const traceNamespace={
   idFromName:name=>env.CS03_LOCAL_FULL_QUOTA.idFromName(name),
   get:id=>{
    const stub=env.CS03_LOCAL_FULL_QUOTA.get(id);
    return {fetch:async (...args)=>{
     try{
      const response=await stub.fetch(...args);
      console.log('CS03_LOCAL_DO_HTTP_STATUS='+response.status);
      return response;
     }catch(error){
      console.error('CS03_LOCAL_DO_FETCH_FAILED='+String(error?.name??'Error'));
      throw error;
     }
    }};
   }
  };
  const atomicConsume=createCs03DurableObjectQuotaTransport({namespace:traceNamespace});
  const sharedQuota=createCs03SharedQuota({
   atomicConsume:async request=>{
    try{
     const accepted=await atomicConsume(request);
     console.log('CS03_LOCAL_QUOTA_DECISION='+(accepted?'ALLOW':'DENY'));
     return accepted;
    }catch(error){
     console.error('CS03_LOCAL_QUOTA_FAILED='+String(error?.code??'UNAVAILABLE'));
     throw error;
    }
   }
  });
  const gateway=createCs03TrustedEdgeGateway({
   verifyToken:verify,sharedQuota,
   // LOCAL ONLY: fixed test IP, never trust caller supplied forwarding headers.
   getClientIp:()=> '192.0.2.250',
   upstreamUrl:'https://cs03-local-fake-upstream.invalid/progress',
   upstreamSecret:SECRET,limits:{global:100,perIp:100,perUser:100},
   fetcher:async(dest,opts)=>{
    if(opts.headers['x-secret']!==SECRET)return Response.json({error:'Forbidden'},{status:403});
    const {userId}=await verify(opts.headers.authorization.slice(7));
    const exam=new URL(dest).searchParams.get('examCode')??'db';
    const key=userId+':'+exam;
    if(opts.method==='PUT'){
     fakeProgress.set(key,JSON.parse(opts.body));
     return Response.json({testOnly:true,saved:true,userId});
    }
    return Response.json({testOnly:true,userId,data:fakeProgress.get(key)??null});
   }
  });
  return gateway(request);
 }
};
