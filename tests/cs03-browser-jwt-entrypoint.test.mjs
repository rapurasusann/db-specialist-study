import test from 'node:test';
import assert from 'node:assert/strict';
import entry,{createCs03BrowserJwtEntrypoint,Cs03QuotaNotDeployed}
 from '../server/cs03-browser-jwt-entrypoint.mjs';
const request=(cf=true)=>{
 const r=new Request('https://candidate.invalid/progress?examCode=db',{headers:{
  origin:'https://rapurasusann.github.io','cf-connecting-ip':'192.0.2.9'
 }});
 if(cf)Object.defineProperty(r,'cf',{value:{colo:'NRT'}});
 return r;
};
test('browser JWT entrypoint fails closed by default and without complete bindings',async()=>{
 for(const env of [{},{CS03_BROWSER_JWT_MODE:'production'},
  {CS03_BROWSER_JWT_MODE:'isolated-review-only'}]){
  const r=await entry.fetch(request(),env);
  assert.equal(r.status,503);
  assert.equal(r.headers.get('cache-control'),'no-store');
 }
 assert.equal(typeof Cs03QuotaNotDeployed,'function');
});
test('review-only browser entrypoint requires Cloudflare metadata before gateway',async()=>{
 let created=0,calls=0;
 const guarded=createCs03BrowserJwtEntrypoint({createGateway:()=>{
  created++;return async()=>{calls++;return Response.json({testOnly:true});};
 }});
 const env={CS03_BROWSER_JWT_MODE:'isolated-review-only'};
 assert.equal((await guarded.fetch(request(false),env)).status,503);
 assert.equal(created,0);
 assert.equal(calls,0);
 assert.equal((await guarded.fetch(request(),env)).status,200);
 assert.equal(created,1);
 assert.equal(calls,1);
});
test('invalid browser gateway factory is rejected',()=>{
 assert.throws(()=>createCs03BrowserJwtEntrypoint({createGateway:null}),/CS03_BROWSER_FACTORY_INVALID/);
});
