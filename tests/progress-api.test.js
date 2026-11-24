'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createProgressHandler}=require('../src/progress-api');
const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
function mockDb({noRows=false,throwOnSelect=false,listRows}={}) {
  const calls=[];
  const client={
    query:async(sql,values)=>{
      calls.push({sql,values});
      if(throwOnSelect&&/^SELECT data/.test(sql))throw new Error('secret database failure');
      if(/^SELECT data/.test(sql))return {rows:noRows?[]:[{revision:1,data:{ok:true}}]};
      if(/^SELECT question_id, data, revision/.test(sql))return {rows:listRows??(noRows?[]:[{question_id:'2025:am2:1',data:{level:'learning'},revision:1},{question_id:'2025:am2:2',data:{level:'review'},revision:2}])};
      if(/^INSERT INTO|^UPDATE public.study_progress/.test(sql))return {rows:noRows?[]:[{revision:1,data:{ok:true}}]};
      return {rows:[]};
    },
    release:()=>calls.push({sql:'RELEASE'})
  };
  return {calls,pool:{connect:async()=>client}};
}
function setup(opts) {
 const db=mockDb(opts);
 const verifyToken=async token=>{
   if(token==='valid-a')return {userId:A};
   if(token==='valid-b')return {userId:B};
   throw new Error('INVALID_TOKEN');
 };
 return {...db,handle:createProgressHandler({verifyToken,pool:db.pool})};
}
function req(method,token,body,search='?examCode=db&questionId=2025:am2:6') {
 const headers=token?{'authorization':'Bearer '+token}:{};
 if(body!==undefined)headers['content-type']='application/json';
 return new Request('https://localhost/progress'+search,{
   method,headers,body:body===undefined?undefined:JSON.stringify(body)
 });
}
test('A GET opens transaction and binds verified A before parameterized SELECT',async()=>{
 const {handle,calls}=setup();
 const res=await handle(req('GET','valid-a'));
 assert.equal(res.status,200);
 assert.deepEqual(calls.map(c=>c.sql),['BEGIN',"SELECT set_config('app.verified_user_id', $1, true)",'SELECT data, revision, updated_at FROM public.study_progress WHERE user_id=$1 AND exam_code=$2 AND question_id=$3','COMMIT','RELEASE']);
 assert.deepEqual(calls[1].values,[A]);
 assert.deepEqual(calls[2].values,[A,'db','2025:am2:6']);
});
test('B GET with userId=A cannot read A via request override',async()=>{
 const {handle,calls}=setup();
 const res=await handle(req('GET','valid-b',undefined,'?examCode=db&questionId=2025:am2:6&userId='+A));
 assert.equal(res.status,200);
 assert.equal(calls[1].values[0],B);assert.equal(calls[2].values[0],B);
});
test('A PUT with userId=B writes under verified A only',async()=>{
 const {handle,calls}=setup();
 const res=await handle(req('PUT','valid-a',{examCode:'db',questionId:'2025:am2:6',userId:B,data:{ok:true},revision:1}));
 assert.equal(res.status,200);
 const write=calls.find(x=>/^INSERT INTO/.test(x.sql));
 assert.deepEqual(write.values,[A,'db','2025:am2:6','{"ok":true}']);
});
test('anonymous request never opens a DB connection',async()=>{
 const {handle,calls}=setup();
 assert.equal((await handle(req('GET'))).status,401);
 assert.equal(calls.length,0);
});
test('invalid JWT request never opens a DB connection',async()=>{
 const {handle,calls}=setup();
 assert.equal((await handle(req('PUT','bad',{examCode:'db',questionId:'2025:am2:6',data:{},revision:1}))).status,401);
 assert.equal(calls.length,0);
});
test('invalid input rejected without DB connection',async()=>{
 const {handle,calls}=setup();
 assert.equal((await handle(req('GET','valid-a',undefined,'?examCode=db&questionId=../bad'))).status,400);
 assert.equal(calls.length,0);
});
test('revision conflict rolls back transaction',async()=>{
 const {handle,calls}=setup({noRows:true});
 assert.equal((await handle(req('PUT','valid-a',{examCode:'db',questionId:'2025:am2:6',data:{},revision:1}))).status,409);
 assert.equal(calls.at(-2).sql,'ROLLBACK');assert.equal(calls.at(-1).sql,'RELEASE');
});
test('database failure rolls back and hides internal details',async()=>{
 const {handle,calls}=setup({throwOnSelect:true});
 const response=await handle(req('GET','valid-a'));
 assert.equal(response.status,503);
 assert.ok(!(await response.text()).includes('secret database failure'));
 assert.equal(calls.at(-2).sql,'ROLLBACK');
});
test('unsupported route never uses DB',async()=>{
 const {handle,calls}=setup();
 assert.equal((await handle(new Request('https://localhost/other'))).status,404);
 assert.equal(calls.length,0);
});
test('invalid method never uses DB',async()=>{
 const {handle,calls}=setup();
 assert.equal((await handle(new Request('https://localhost/progress',{method:'DELETE'}))).status,404);
 assert.equal(calls.length,0);
});

test('second write requires the exact next revision',async()=>{
 const {handle,calls}=setup();
 const response=await handle(req('PUT','valid-a',{examCode:'db',questionId:'2025:am2:6',data:{ok:true},revision:2}));
 assert.equal(response.status,200);
 const update=calls.find(c=>/^UPDATE public.study_progress/.test(c.sql));
 assert.ok(update);assert.deepEqual(update.values,[A,'db','2025:am2:6','{"ok":true}',2]);
 assert.match(update.sql,/revision=\$5-1/);
});

test('bad oversized JSON is rejected before DB access',async()=>{
 const {handle,calls}=setup();
 const response=await handle(req('PUT','valid-a',{examCode:'db',questionId:'2025:am2:6',data:{text:'x'.repeat(21000)},revision:1}));
 assert.equal(response.status,400);assert.equal(calls.length,0);
});

test('list page validates JWT and scopes SQL to authenticated user A',async()=>{
 const {handle,calls}=setup();
 const res=await handle(req('GET','valid-a',undefined,'?examCode=db&limit=1&userId='+B));
 assert.equal(res.status,200);
 const value=(await res.json()).data;
 assert.equal(value.records.length,1);
 assert.equal(value.nextCursor,'2025:am2:1');
 const query=calls.find(c=>/^SELECT question_id, data, revision/.test(c.sql));
 assert.ok(query);
 assert.deepEqual(query.values,[A,'db','',2]);
 assert.match(query.sql,/user_id=\$1/);
 assert.match(query.sql,/ORDER BY question_id LIMIT \$4/);
});
test('list cursor and exact page end return no next cursor',async()=>{
 const {handle,calls}=setup({noRows:true});
 const res=await handle(req('GET','valid-b',undefined,'?examCode=db&limit=100&cursor=2025%3Aam2%3A3'));
 assert.equal(res.status,200);
 assert.deepEqual((await res.json()).data,{records:[],nextCursor:null});
 assert.deepEqual(calls.find(c=>/^SELECT question_id/.test(c.sql)).values,[B,'db','2025:am2:3',101]);
});
test('list rejected for anonymous users without database access',async()=>{
 const {handle,calls}=setup();
 const res=await handle(req('GET',null,undefined,'?examCode=db&limit=20'));
 assert.equal(res.status,401);
 assert.equal(calls.length,0);
});
test('untrusted list input is rejected without database access',async()=>{
 for(const query of ['?examCode=db&limit=101','?examCode=db&limit=0','?examCode=db&limit=1.5','?examCode=../bad&limit=1','?examCode=db&cursor=2025%3Aam2%3A101']){
  const {handle,calls}=setup();
  assert.equal((await handle(req('GET','valid-a',undefined,query))).status,400,query);
  assert.equal(calls.length,0,query);
 }
});

test('list byte budget splits multibyte rows without skipping the first unreturned row',async()=>{
 const rows=Array.from({length:5},(_,i)=>({question_id:'2025:am2:'+(i+1),data:{text:'漢'.repeat(5300)},revision:1,updated_at:'2026-11-24T00:00:00Z'}));
 const {handle}=setup({listRows:rows});
 const res=await handle(req('GET','valid-a',undefined,'?examCode=db&limit=100'));
 assert.equal(res.status,200);
 const raw=await res.text();
 assert.ok(Buffer.byteLength(raw,'utf8')<=60000);
 const page=JSON.parse(raw).data;
 assert.deepEqual(page.records,rows.slice(0,3));
 assert.equal(page.nextCursor,rows[2].question_id);
 const second=setup({listRows:rows.slice(3)});
 const next=await second.handle(req('GET','valid-a',undefined,'?examCode=db&limit=100&cursor='+encodeURIComponent(page.nextCursor)));
 assert.deepEqual((await next.json()).data,{records:rows.slice(3),nextCursor:null});
 assert.deepEqual(second.calls.find(c=>/^SELECT question_id/.test(c.sql)).values,[A,'db',page.nextCursor,101]);
});
test('single unfit stored row fails closed instead of emitting empty nonterminal page',async()=>{
 const {handle,calls}=setup({listRows:[{question_id:'2025:am2:1',data:{text:'x'.repeat(60000)},revision:1}]});
 const res=await handle(req('GET','valid-a',undefined,'?examCode=db&limit=100'));
 assert.equal(res.status,503);
 assert.deepEqual(await res.json(),{error:'Service Unavailable'});
 assert.equal(calls.at(-2).sql,'ROLLBACK');
});
