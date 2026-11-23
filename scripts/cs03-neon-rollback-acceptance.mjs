// CS-03 isolated Neon role-level acceptance. Explicit local execution only.
// Exercises transient test rows in ONE transaction, then ALWAYS rolls back.
// Never use this against main; never print the database URL or credentials.
import {randomUUID} from 'node:crypto';
import pg from 'pg';
const {Client}=pg;

const BRANCH='br-snowy-truth-a162pmdt';
const HOST='ep-dawn-dew-a11prveg.ap-southeast-1.aws.neon.tech';
const DB='cs03_auth_sandbox',ROLE='cs03_progress_api';
let stage='VALIDATE_TARGET';
// Only fixed stage and standardized error codes are printed; never database error messages.
const SAFE_CODES=new Set(['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','ETIMEDOUT','ERR_TLS_CERT_ALTNAME_INVALID','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT','28P01','28000','3D000','42501','23503','23505','23514','57014']);
function mark(name){stage=name;}

function assert(condition,message){if(!condition)throw Error('CS03_ACCEPTANCE_'+message);}
function validateTarget(env){
 assert(env.CS03_ISOLATED_BRANCH_ID===BRANCH,'BRANCH_MISMATCH');
 assert(!env.NEON_BRANCH_ID||env.NEON_BRANCH_ID===BRANCH,'ALTERNATE_BRANCH_MISMATCH');
 assert(typeof env.CS03_TEST_DATABASE_URL==='string','URL_MISSING');
 const u=new URL(env.CS03_TEST_DATABASE_URL);
 assert(['postgresql:','postgres:'].includes(u.protocol),'PROTOCOL_MISMATCH');
 assert(u.hostname===HOST,'HOST_MISMATCH');
 assert(decodeURIComponent(u.pathname)==='/'+DB,'DATABASE_MISMATCH');
 assert(decodeURIComponent(u.username)===ROLE,'ROLE_MISMATCH');
 assert(u.searchParams.get('sslmode')==='verify-full','TLS_VERIFY_FULL_REQUIRED');
 assert(!['uselibpqcompat','sslcert','sslkey','sslrootcert'].some(k=>u.searchParams.has(k)),'TLS_OVERRIDE_BLOCKED');
 assert(!u.searchParams.has('options'),'CONNECTION_OPTIONS_BLOCKED');
 return env.CS03_TEST_DATABASE_URL;
}
async function run(){
 mark('VALIDATE_TARGET');
 const url=validateTarget(process.env);
 const client=new Client({connectionString:url,connectionTimeoutMillis:10000,query_timeout:10000});
 const userA=randomUUID(),userB=randomUUID(),question='2026:am2:100';
 let connected=false,started=false;
 try{
  mark('CONNECT');await client.connect();connected=true;
  mark('CHECK_IDENTITY');const p=(await client.query('SELECT current_database() AS db,current_user AS role,pg_is_in_recovery() AS is_replica')).rows[0];
  assert(p.db===DB&&p.role===ROLE&&!p.is_replica,'LIVE_IDENTITY_MISMATCH');
  mark('CHECK_PRIVILEGES');const priv=(await client.query("SELECT has_table_privilege(current_user,'public.study_progress','DELETE') AS can_delete,has_table_privilege(current_user,'public.study_progress','SELECT') AS can_select,has_table_privilege(current_user,'public.study_progress','INSERT') AS can_insert,has_table_privilege(current_user,'public.study_progress','UPDATE') AS can_update")).rows[0];
  assert(priv.can_delete===false&&priv.can_select&&priv.can_insert&&priv.can_update,'LIVE_PRIVILEGES_MISMATCH');
  mark('CHECK_CATALOG');const exam=await client.query("SELECT 1 FROM public.study_exam_catalog WHERE exam_code='db'");
  assert(exam.rowCount===1,'EXAM_NOT_FOUND');
  mark('BEGIN_TRANSACTION');await client.query('BEGIN');started=true;
  await client.query("SET LOCAL statement_timeout = '8s'");
  await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
  const identity=async user=>client.query("SELECT set_config('app.verified_user_id',$1,true)",[user]);
  const see=async user=>{await identity(user);return (await client.query('SELECT user_id,data,revision FROM public.study_progress WHERE user_id IN ($1,$2) AND exam_code=$3 AND question_id=$4',[userA,userB,'db',question])).rows;};
  mark('CHECK_TEST_COLLISIONS');assert((await see(userA)).length===0,'TEST_COLLISION_A');
  assert((await see(userB)).length===0,'TEST_COLLISION_B');
  mark('INSERT_A');await identity(userA);
  const a=await client.query('INSERT INTO public.study_progress(user_id,exam_code,question_id,data,revision) VALUES ($1,$2,$3,$4::jsonb,1) RETURNING revision',[userA,'db',question,JSON.stringify({acceptance:'A',stage:'insert'})]);
  assert(a.rowCount===1&&Number(a.rows[0].revision)===1,'INSERT_A_FAILED');
  mark('READ_AND_ISOLATE_A');assert((await see(userA)).length===1,'OWNER_A_READ_FAILED');
  assert((await see(userB)).length===0,'CROSS_USER_A_VISIBLE_TO_B');
  mark('INSERT_B');await identity(userB);
  const b=await client.query('INSERT INTO public.study_progress(user_id,exam_code,question_id,data,revision) VALUES ($1,$2,$3,$4::jsonb,1) RETURNING revision',[userB,'db',question,JSON.stringify({acceptance:'B',stage:'insert'})]);
  assert(b.rowCount===1,'INSERT_B_FAILED');
  mark('UPDATE_B');const upd=await client.query('UPDATE public.study_progress SET data=$1::jsonb,revision=2,updated_at=now() WHERE user_id=$2 AND exam_code=$3 AND question_id=$4 AND revision=1 RETURNING revision',[JSON.stringify({acceptance:'B',stage:'update'}),userB,'db',question]);
  assert(upd.rowCount===1&&Number(upd.rows[0].revision)===2,'UPDATE_B_FAILED');
  mark('CHECK_ROW_ISOLATION');const brows=await see(userB);
  assert(brows.length===1&&brows[0].user_id===userB&&Number(brows[0].revision)===2,'OWNER_B_READ_FAILED');
  const arows=await see(userA);
  assert(arows.length===1&&arows[0].user_id===userA&&Number(arows[0].revision)===1,'CROSS_USER_B_VISIBLE_TO_A');
  console.log('CS03_TRANSIENT_INSERT_READ_UPDATE_RLS_PASS');
 }catch(error){
  // Preserve the original failing stage even if rollback checks run in finally.
  error.cs03Stage=stage;
  throw error;
 }finally{
  if(started){
   try{mark('ROLLBACK');await client.query('ROLLBACK');console.log('CS03_TEST_TRANSACTION_ROLLBACK_SENT');}
   catch{console.error('CS03_ROLLBACK_UNCONFIRMED');process.exitCode=1;}
  }
  if(connected){
   try{
    mark('CHECK_ROLLBACK_RESIDUE');for(const user of [userA,userB]){
     await client.query('BEGIN READ ONLY');
     try{
      await client.query("SELECT set_config('app.verified_user_id',$1,true)",[user]);
      const check=await client.query('SELECT count(*)::int AS n FROM public.study_progress WHERE user_id=$1 AND exam_code=$2 AND question_id=$3',[user,'db',question]);
      assert(check.rows[0].n===0,'ROLLBACK_RESIDUE');
     }finally{await client.query('ROLLBACK');}
    }
    console.log('CS03_TEST_ROWS_ABSENT_AFTER_ROLLBACK_PASS');
   }finally{await client.end();}
  }
 }
}
run().catch(error=>{const message=typeof error?.message==='string'?error.message:'';const label=/^CS03_ACCEPTANCE_[A-Z0-9_]+$/.test(message)?message:'CHECK_FAILED_WITHOUT_DETAILS';const code=typeof error?.code==='string'&&SAFE_CODES.has(error.code)?error.code:'UNCLASSIFIED';console.error('CS03_ISOLATED_ACCEPTANCE_STAGE='+(error?.cs03Stage??stage));console.error('CS03_ISOLATED_ACCEPTANCE_ERROR_CODE='+code);console.error('CS03_ISOLATED_ACCEPTANCE_FAILED:'+label);process.exitCode=1;});
