// Offline-only CS-03 config diagnostics. No auth sign-up and no DB connection.
// Never display connection strings, credentials, hostnames, or token values.
import {createCs03Runtime} from '../server/cs03-runtime.mjs';
function result(label,ok){console.log(label+'='+(ok?'PASS':'FAIL'));return ok;}
let url;
try{
 const raw=process.env.CS03_TEST_DATABASE_URL;
 if(!raw){console.log('URL_PRESENT=FAIL');process.exitCode=1;}
 else {url=new URL(raw);result('URL_PARSE',true);}
} catch{console.log('URL_PARSE=FAIL');process.exitCode=1;}
if(url){
 let ok=true;
 ok=result('BRANCH_MARKER',process.env.CS03_ISOLATED_BRANCH_ID==='br-snowy-truth-a162pmdt')&&ok;
 ok=result('OPTIONAL_NEON_BRANCH',!process.env.NEON_BRANCH_ID||process.env.NEON_BRANCH_ID==='br-snowy-truth-a162pmdt')&&ok;
 ok=result('SCHEME',url.protocol==='postgresql:'||url.protocol==='postgres:')&&ok;
 ok=result('DB_NAME',decodeURIComponent(url.pathname)==='/cs03_auth_sandbox')&&ok;
 ok=result('ROLE_NAME',decodeURIComponent(url.username)==='cs03_progress_api')&&ok;
 ok=result('ENDPOINT_PREFIX',url.hostname.startsWith('ep-dawn-dew-a11prveg'))&&ok;
 ok=result('ENDPOINT_REGION',url.hostname.endsWith('.ap-southeast-1.aws.neon.tech'))&&ok;
 ok=result('PASSWORD_PRESENT',Boolean(url.password))&&ok;
 ok=result('SSL_VERIFY_FULL',url.searchParams.get('sslmode')==='verify-full'&&!url.searchParams.has('uselibpqcompat')&&!url.searchParams.has('sslcert')&&!url.searchParams.has('sslkey')&&!url.searchParams.has('sslrootcert'))&&ok;
 if(ok){
  try{
   const runtime=createCs03Runtime(process.env,{pool:{connect:async()=>{throw Error('NO_DATABASE_ACCESS_IN_DIAGNOSTIC')},end:async()=>{}}});
   ok=result('RUNTIME_INIT',typeof runtime.handle==='function')&&ok;
  }catch(e){process.exitCode=1;console.log('RUNTIME_INIT=FAIL');console.log('RUNTIME_FAILURE_CLASS='+(/^CS03_[A-Z_]+$/.test(e?.message??'')?e.message:'OTHER'));}
 } else {process.exitCode=1;console.log('RUNTIME_INIT=SKIPPED');}
}
