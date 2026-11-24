import test from 'node:test';
import assert from 'node:assert/strict';
import {createCs03CrossBrowserSession} from '../src/cs03-cross-browser-session.mjs';

const A='a1111111-1111-4111-8111-111111111111';
const B='b2222222-2222-4222-8222-222222222222';
const Q='2025:am2:4';
function setup(){
 const server=new Map();
 let activeUser=A;
 function makeBrowser(){
  const cache=new Map(),seen=[];
  let lastUser=activeUser,enabled=true;
  const account={
   session:async()=>({id:activeUser}),
   readLocal:id=>Object.fromEntries([...(cache.get(id)||new Map())].map(([key,value])=>[key,structuredClone(value)])),
   pull:async id=>{
    lastUser=activeUser;
    const row=server.get(lastUser+':'+id);
    const local=cache.get(lastUser)||new Map();
    if(row)local.set(id,structuredClone(row));
    cache.set(lastUser,local);
    return row?structuredClone(row):null;
   },
   listProgress:async()=>{
    const rows={};
    for(const [key,value] of server)if(key.startsWith(activeUser+':'))rows[key.slice(activeUser.length+1)]=structuredClone(value);
    return rows;
   },
   save:async(id,data)=>{
    lastUser=activeUser;
    if(!enabled)throw Error('REVISION_CONFLICT_REFRESHED');
    const key=lastUser+':'+id;
    const previous=server.get(key);
    const localRevision=cache.get(lastUser)?.get(id)?.revision??0;
    if((previous?.revision??0)!==localRevision)throw Error('REVISION_CONFLICT_REFRESHED');
    const row={data:structuredClone(data),revision:localRevision+1};
    server.set(key,structuredClone(row));
    const local=cache.get(lastUser)||new Map();local.set(id,structuredClone(row));cache.set(lastUser,local);
    return structuredClone(row);
   }
  };
  const sync=createCs03CrossBrowserSession({account,onRemoteRecord:(id,data)=>seen.push({id,data})});
  return {sync,seen,cache,block:()=>enabled=false};
 }
 return {makeBrowser,server,as:id=>{activeUser=id}};
}
test('two browsers using same user can save then restore the exact question record',async()=>{
 const f=setup(),chrome=f.makeBrowser(),edge=f.makeBrowser();
 assert.deepEqual((await chrome.sync.start()).records,{});
 assert.equal(await chrome.sync.open(Q),null);
 await chrome.sync.save(Q,{level:'learning',seenAnswer:true});
 assert.equal((await edge.sync.start()).records[Q].data.level,'learning');
 assert.deepEqual(await edge.sync.open(Q),{level:'learning',seenAnswer:true});
 assert.deepEqual(edge.seen,[{id:Q,data:{level:'learning',seenAnswer:true}}]);
 await edge.sync.save(Q,{level:'mastered'});
 // A must load the newer server value before another write.
 await assert.rejects(chrome.sync.save(Q,{level:'review'}),/REVISION_CONFLICT_REFRESHED/);
 await assert.rejects(chrome.sync.save(Q,{level:'review'}),/REMOTE_READ_REQUIRED/);
 assert.equal((await chrome.sync.open(Q)).level,'mastered');
 assert.equal(f.server.get(A+':'+Q).revision,2);
});
test('never writes until user explicitly opens the remote question',async()=>{
 const f=setup(),browser=f.makeBrowser();
 await browser.sync.start();
 await assert.rejects(browser.sync.save(Q,{level:'mastered'}),/REMOTE_READ_REQUIRED/);
 assert.equal(f.server.size,0);
});
test('switching users refuses writes and preserves original user data',async()=>{
 const f=setup(),browser=f.makeBrowser();
 await browser.sync.start();await browser.sync.open(Q);
 f.as(B);
 await assert.rejects(browser.sync.save(Q,{level:'mastered'}),/ACCOUNT_CHANGED/);
 assert.equal(f.server.size,0);
 browser.sync.stop();
 await browser.sync.start();await browser.sync.open(Q);await browser.sync.save(Q,{level:'review'});
 assert.equal(f.server.get(B+':'+Q).data.level,'review');
 assert.equal(f.server.has(A+':'+Q),false);
});
test('logout stops saving and does not clear server or legacy device records',async()=>{
 const f=setup(),browser=f.makeBrowser(),legacy={[Q]:{level:'mastered'}};
 await browser.sync.start();await browser.sync.open(Q);await browser.sync.save(Q,{level:'review'});
 browser.sync.stop();
 await assert.rejects(browser.sync.save(Q,{level:'learning'}),/SYNC_NOT_ACTIVE/);
 assert.equal(f.server.get(A+':'+Q).data.level,'review');
 assert.equal(legacy[Q].level,'mastered');
});
test('server data from one user never appears in another user listing',async()=>{
 const f=setup(),a=f.makeBrowser();
 await a.sync.start();await a.sync.open(Q);await a.sync.save(Q,{level:'mastered'});
 a.sync.stop();f.as(B);
 const b=f.makeBrowser();
 assert.deepEqual((await b.sync.start()).records,{});
 assert.equal(await b.sync.open(Q),null);
});
test('mutating returned data cannot alter the server snapshot',async()=>{
 const f=setup(),browser=f.makeBrowser();
 await browser.sync.start();await browser.sync.open(Q);
 const input={level:'learning',nested:{seen:true}};
 const result=await browser.sync.save(Q,input);
 input.nested.seen=false;result.nested.seen=false;
 assert.equal(f.server.get(A+':'+Q).data.nested.seen,true);
});
