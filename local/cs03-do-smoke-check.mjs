// Offline/local-only workerd check. Start local Wrangler on 127.0.0.1:8789 first.
import assert from 'node:assert/strict';
const endpoint='http://127.0.0.1:8789/__local/cs03/quota';
const keys=[
 {key:'cs03:global',limit:60},
 {key:'cs03:ip:192.0.2.155',limit:20},
 {key:'cs03:user:cccccccc-cccc-4ccc-8ccc-cccccccccccc',limit:10}
];
const payload={keys,now:Date.now(),windowMs:60000};
let allowed=0,blocked=0;
for(let i=0;i<11;i++){
 const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(5000)});
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(typeof body.accepted,'boolean');
 if(body.accepted)allowed++;else blocked++;
}
assert.equal(allowed,10);
assert.equal(blocked,1);
console.log('CS03_WORKER_LOCAL_SQLITE_PASS accepted='+allowed+' blocked='+blocked);
