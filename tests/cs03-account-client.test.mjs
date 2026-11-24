import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03AccountClient} from '../src/cs03-account-client.mjs';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),map};};
function fixture(){
 let user=A,token='jwt-a',calls=[];
 const records=new Map();
 const storage=memory();
 const authClient={
  signUp:{email:async fields=>({data:{user:{id:A},fields}})},
  signIn:{email:async()=>({data:{user:{id:user}}})},
  getSession:async()=>({data:{user:{id:user}}}),
  token:async()=>({data:{token}}),
  signOut:async()=>({data:{success:true}})
 };
 const fetcher=async (url,opt)=>{
  calls.push({url:String(url),method:opt.method,headers:opt.headers,credentials:opt.credentials});
  const userId=opt.headers.authorization==='Bearer jwt-b'?B:A;
  const recordId=opt.method==='GET'?new URL(url).searchParams.get('questionId'):JSON.parse(opt.body).questionId;
  const key=userId+':'+recordId;
  const prior=records.get(key);
  if(opt.method==='GET')return Response.json({data:prior?{data:prior.data,revision:prior.revision,updated_at:'2026-11-18T00:00:00Z'}:null});
  const body=JSON.parse(opt.body);
  if(body.revision!==(prior?.revision??0)+1)return Response.json({error:'Conflict'},{status:409});
  const next={revision:(prior?.revision??0)+1,data:body.data};
  records.set(key,next);
  return Response.json({data:{data:next.data,revision:next.revision,updated_at:'2026-11-18T00:00:00Z'}});
 };
 const client=createCs03AccountClient({authClient,apiUrl:'https://api.example.invalid/',fetcher,storage});
 return {client,storage,calls,changeUser:id=>{user=id;token=id===B?'jwt-b':'jwt-a'}};
}
test('signup uses email/password with name without storing credentials',async()=>{
 const f=fixture();
 const result=await f.client.signUp({email:'abc@example.com',password:'secret',name:'Learner'});
 assert.equal(result.user.id,A);
 assert.equal(f.storage.map.size,0);
});
test('sign-in and restored session return verified session user',async()=>{
 const f=fixture();
 assert.equal((await f.client.signIn({email:'a@example.com',password:'secret'})).id,A);
 assert.equal((await f.client.session()).id,A);
});
test('PUT stores account-specific revision and GET restores it',async()=>{
 const f=fixture();
 const data={level:'learning',updatedAt:'2026-11-18T00:00:00Z'};
 const first=await f.client.save('2025:am2:4',data);
 assert.equal(first.revision,1);
 assert.equal(f.client.readLocal(A)['2025:am2:4'].data.level,'learning');
 const second=await f.client.pull('2025:am2:4');
 assert.equal(second.revision,1);
 assert.equal(f.calls[0].headers.authorization,'Bearer jwt-a');
 assert.equal(f.calls[0].credentials,'omit');
 assert.equal(f.calls[1].method,'GET');
});
test('second write increments revision',async()=>{
 const f=fixture();
 await f.client.save('2025:am2:4',{level:'learning'});
 const second=await f.client.save('2025:am2:4',{level:'mastered'});
 assert.equal(second.revision,2);
});
test('different account does not reuse previous user local progress',async()=>{
 const f=fixture();
 await f.client.save('2025:am2:4',{level:'mastered'});
 f.changeUser(B);
 assert.deepEqual(f.client.readLocal(B),{});
 const other=await f.client.save('2025:am2:5',{level:'learning'});
 assert.equal(other.revision,1);
 assert.ok(f.client.readLocal(A)['2025:am2:4']);
 assert.ok(f.client.readLocal(B)['2025:am2:5']);
 assert.equal(f.calls.at(-1).headers.authorization,'Bearer jwt-b');
});
test('conflicting write pulls server progress and refuses silent overwrite',async()=>{
 const f=fixture();
 await f.client.save('2025:am2:4',{level:'learning'});
 f.storage.setItem(f.client.storageKey(A),JSON.stringify({'2025:am2:4':{revision:0,data:{level:'unseen'}}}));
 await assert.rejects(f.client.save('2025:am2:4',{level:'mastered'}),/REVISION_CONFLICT_REFRESHED/);
 assert.equal(f.client.readLocal(A)['2025:am2:4'].data.level,'learning');
});
test('invalid record rejected before HTTP',async()=>{
 const f=fixture();
 await assert.rejects(f.client.save('../invalid',{level:'known'}),/INVALID_RECORD/);
 assert.equal(f.calls.length,0);
});
test('token and password are not persisted in progress storage',async()=>{
 const f=fixture();
 await f.client.save('2025:am2:4',{level:'known'});
 assert.doesNotMatch([...f.storage.map.values()].join(''),/jwt-a/);
});
test('reject unsafe API targets including HTTP and query endpoints',()=>{
 const minimal={signUp:{email(){}},signIn:{email(){}},getSession(){},token(){},signOut(){}};
 for(const url of ['http://api.example.invalid/','https://user:pw@api.example.invalid/','https://api.example.invalid/?token=abc'])
  assert.throws(()=>createCs03AccountClient({authClient:minimal,apiUrl:url}),/API_NOT_CONFIGURED/);
});

test('paginated account list is read-only and preserves legacy/device cache',async()=>{
 const A='a1111111-1111-4111-8111-111111111111';
 const storage=memory();
 storage.setItem('db-study-progress-v1',JSON.stringify({'2025:am2:1':{level:'mastered'}}));
 const calls=[];
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:A}}}),token:async()=>({data:{token:'jwt-a'}})};
 const fetcher=async url=>{
  calls.push(String(url));
  const cursor=new URL(url).searchParams.get('cursor');
  if(cursor===null)return Response.json({data:{records:[{question_id:'2025:am2:1',data:{level:'review'},revision:1,updated_at:'2026-11-18T00:00:00Z'}],nextCursor:'2025:am2:1'}});
  return Response.json({data:{records:[{question_id:'2025:am2:2',data:{level:'learning'},revision:2,updated_at:'2026-11-18T01:00:00Z'}],nextCursor:null}});
 };
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',fetcher,storage});
 const result=await client.listProgress();
 assert.equal(calls.length,2);
 assert.equal(result['2025:am2:1'].data.level,'review');
 assert.equal(result['2025:am2:2'].revision,2);
 assert.equal(client.readLocal(A)['2025:am2:1'],undefined);
 assert.equal(JSON.parse(storage.getItem('db-study-progress-v1'))['2025:am2:1'].level,'mastered');
});
test('account list rejects repeated cursor rather than looping indefinitely',async()=>{
 const A='a1111111-1111-4111-8111-111111111111';
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:A}}}),token:async()=>({data:{token:'jwt-a'}})};
 const fetcher=async()=>Response.json({data:{records:[{question_id:'2025:am2:1',data:{level:'review'},revision:1}],nextCursor:'2025:am2:1'}});
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',fetcher});
 await assert.rejects(client.listProgress(),/PROGRESS_LIST_INVALID/);
});
test('account list rejects malformed record without caching data',async()=>{
 const A='a1111111-1111-4111-8111-111111111111',storage=memory();
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:A}}}),token:async()=>({data:{token:'jwt-a'}})};
 const fetcher=async()=>Response.json({data:{records:[{question_id:'../secret',data:{level:'review'},revision:1}],nextCursor:null}});
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',fetcher,storage});
 await assert.rejects(client.listProgress(),/PROGRESS_LIST_INVALID/);
 assert.equal(storage.map.size,0);
});


function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
test('account change during token retrieval blocks outgoing progress request',async()=>{
 let active=A,requests=0;const pending=deferred();
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
  signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:active}}}),
  token:()=>pending.promise};
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',
  fetcher:async()=>{requests++;return Response.json({data:null});}});
 const job=client.pull('2025:am2:4');
 // Let session() and the second identity check complete before token resolves.
 await new Promise(resolve=>setImmediate(resolve));
 active=B;pending.resolve({data:{token:'jwt-a'}});
 await assert.rejects(job,/ACCOUNT_CHANGED/);
 assert.equal(requests,0);
});
test('account change during GET response rejects stale progress without local writes',async()=>{
 let active=A;const pending=deferred(),storage=memory();
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
  signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:active}}}),
  token:async()=>({data:{token:'jwt-a'}})};
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',
  storage,fetcher:()=>pending.promise});
 const job=client.pull('2025:am2:4');
 await new Promise(resolve=>setImmediate(resolve));
 active=B;pending.resolve(Response.json({data:{data:{level:'mastered'},revision:1,updated_at:'2026-11-24T00:00:00Z'}}));
 await assert.rejects(job,/ACCOUNT_CHANGED/);
 assert.equal(storage.map.size,0);
});
test('account change during PUT response rejects stale cache update',async()=>{
 let active=A;const pending=deferred(),storage=memory();
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
  signOut:async()=>({data:{}}),getSession:async()=>({data:{user:{id:active}}}),
  token:async()=>({data:{token:'jwt-a'}})};
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',
  storage,fetcher:()=>pending.promise});
 const job=client.save('2025:am2:4',{level:'review'});
 await new Promise(resolve=>setImmediate(resolve));
 active=B;pending.resolve(Response.json({data:{data:{level:'review'},revision:1,updated_at:'2026-11-24T00:00:00Z'}}));
 await assert.rejects(job,/ACCOUNT_CHANGED/);
 assert.equal(storage.map.size,0);
});

test('conflict refresh never follows a newly selected account',async()=>{
 let active=A,checks=0,conflict=false;const calls=[],storage=memory();
 const auth={signUp:{email:async()=>({data:{}})},signIn:{email:async()=>({data:{}})},
  signOut:async()=>({data:{}}),getSession:async()=>{
   if(conflict && ++checks===2)active=B;
   return {data:{user:{id:active}}};
  },token:async()=>({data:{token:active===A?'jwt-a':'jwt-b'}})};
 const client=createCs03AccountClient({authClient:auth,apiUrl:'https://api.example.invalid/',storage,
  fetcher:async(url,opt)=>{calls.push(opt.method);conflict=true;
   return Response.json({error:'Conflict'},{status:409});}});
 await assert.rejects(client.save('2025:am2:4',{level:'review'}),/ACCOUNT_CHANGED/);
 assert.deepEqual(calls,['PUT']);
 assert.equal(storage.map.size,0);
});
