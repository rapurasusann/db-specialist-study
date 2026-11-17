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
 assert.doesNotMatch([...f.storage.map.values()].join(''),'jwt-a');
});
test('reject unsafe API targets including HTTP and query endpoints',()=>{
 const minimal={signUp:{email(){}},signIn:{email(){}},getSession(){},token(){},signOut(){}};
 for(const url of ['http://api.example.invalid/','https://user:pw@api.example.invalid/','https://api.example.invalid/?token=abc'])
  assert.throws(()=>createCs03AccountClient({authClient:minimal,apiUrl:url}),/API_NOT_CONFIGURED/);
});
