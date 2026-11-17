// CS-03 read-only live TLS verification. No auth users or learning rows created.
// Fail closed unless targeting the dedicated isolated branch, database and role.
import pg from 'pg';
import {checkServerIdentity} from 'node:tls';
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
let runtime,pool;
function check(name,condition){console.log(name+'='+(condition?'PASS':'FAIL'));if(!condition)throw new Error('CHECK_FAILED');}
try{
 runtime=createCs03Runtime();
 console.log('RUNTIME_CONFIG=PASS');
 pool=new pg.Pool({connectionString:process.env.CS03_TEST_DATABASE_URL,max:1,connectionTimeoutMillis:12000});
 const client=await pool.connect();
 try{
   const {rows}=await client.query(`SELECT current_database() AS db, current_user AS role,
      (SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()) AS ssl_active`);
   check('DATABASE_IDENTITY',rows.length===1&&rows[0].db==='cs03_auth_sandbox');
   check('ROLE_IDENTITY',rows[0].role==='cs03_progress_api');
   // pg_stat_ssl sees the backend connection, which may be behind Neon's proxy.
   // Verify the actual node-postgres client socket instead.
   const stream=client.connection?.stream;
   const host=new URL(process.env.CS03_TEST_DATABASE_URL).hostname;
   check('CLIENT_TLS_ENCRYPTED',stream?.encrypted===true);
   check('CLIENT_TLS_CERT_AUTHORIZED',stream?.authorized===true && !stream?.authorizationError);
   const peer=stream?.getPeerCertificate?.();
   check('CLIENT_TLS_PEER_CERT',Boolean(peer && Object.keys(peer).length));
   check('CLIENT_TLS_HOSTNAME',Boolean(peer && !checkServerIdentity(host,peer)));
   console.log('PG_BACKEND_SSL='+ (rows[0].ssl_active===true?'TRUE':rows[0].ssl_active===false?'FALSE':'UNKNOWN'));
   console.log('PG_BACKEND_SSL_IS_NOT_CLIENT_TLS_PROOF=YES');
   console.log('CS03_TLS_LIVE=PASS');
 }finally{client.release();}
}catch(e){
  // Never log arbitrary errors, since some drivers include connection strings.
  console.log('CS03_TLS_LIVE=FAIL');
  console.log('FAIL_CLASS='+(
    e instanceof Error && /^CS03_[A-Z_]+$/.test(e.message)
      ? e.message
      : e instanceof Error && e.message==='CHECK_FAILED'?'CHECK_FAILED':'CONNECTION_OR_QUERY_ERROR'));
  process.exitCode=1;
}finally{
 if(pool)await pool.end().catch(()=>{});
 if(runtime)await runtime.close().catch(()=>{});
}
