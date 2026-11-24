// CS-03 isolated Durable Object quota engine (not wired to public traffic).
// Requires SQLite-backed Durable Object storage with transactionSync and sql.exec.
// Atomic, all-or-none fixed-window quotas. Never logs quota identities or secrets.
export function consumeCs03SqliteQuota(storage, {keys,now,windowMs}={}){
 if(typeof storage?.transactionSync!=='function'||typeof storage?.sql?.exec!=='function'||
    !Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(windowMs)||windowMs<1000||
    !Array.isArray(keys)||keys.length!==3||
    new Set(keys.map(x=>x?.key)).size!==3||
    keys.some(x=>typeof x?.key!=='string'||!/^cs03:(?:global|ip:[^\s]{1,64}|user:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.test(x.key)||
      !Number.isSafeInteger(x?.limit)||x.limit<1))
   throw Error('QUOTA_INVALID');
 const bucket=Math.floor(now/windowMs);
 // transactionSync performs the read-check-write as one SQLite transaction.
 // No await inside the transaction and no partial consumption on denial.
 return storage.transactionSync(()=>{
  storage.sql.exec('CREATE TABLE IF NOT EXISTS quota (key TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(key,bucket))');
  const states=keys.map(({key,limit})=>({
   key,limit,count:Number(storage.sql.exec('SELECT count FROM quota WHERE key=? AND bucket=?',key,bucket).toArray()[0]?.count??0)
  }));
  if(states.some(x=>!Number.isSafeInteger(x.count)||x.count<0))throw Error('QUOTA_INVALID');
  if(states.some(x=>x.count>=x.limit))return false;
  for(const {key} of states)
   storage.sql.exec('INSERT INTO quota (key,bucket,count) VALUES (?,?,1) ON CONFLICT(key,bucket) DO UPDATE SET count=count+1',key,bucket);
  // Keep only the current and previous window; storage is bounded over time.
  // This remains a development implementation until real DO and quota-cost tests pass.
  storage.sql.exec('DELETE FROM quota WHERE bucket < ?',bucket-1);
  return true;
 });
}
