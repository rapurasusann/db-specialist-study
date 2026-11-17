// CS-03 deploy safety gate. No network calls; never prints secrets.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Run BEFORE any Neon deploy. It does not deploy anything.
export function assessCs03Deploy(env) {
 const failures=[];
 function requireTrue(ok,code){if(!ok)failures.push(code);}
 const expectedBranch='br-snowy-truth-a162pmdt';
 requireTrue(env.NEON_BRANCH_ID===expectedBranch,'BRANCH_ID');
 requireTrue(env.CS03_ISOLATED_BRANCH_ID===expectedBranch,'ISOLATED_MARKER');
 requireTrue(env.NEON_PROJECT_ID==='quiet-mouse-39990305','PROJECT_ID');
 requireTrue(env.CS03_DEPLOY_OPT_IN==='ISOLATED_ONLY','DEPLOY_OPT_IN');
 requireTrue(typeof env.CS03_ORIGIN_SECRET==='string'&&Buffer.byteLength(env.CS03_ORIGIN_SECRET,'utf8')>=32,'ORIGIN_SECRET');
 const raw=env.CS03_TEST_DATABASE_URL;
 let url=null;
 try{if(raw)url=new URL(raw)}catch{}
 requireTrue(!!url,'URL_FORMAT');
 if(url){
  requireTrue(['postgresql:','postgres:'].includes(url.protocol),'URL_SCHEME');
  requireTrue(url.hostname==='ep-dawn-dew-a11prveg-pooler.ap-southeast-1.aws.neon.tech'||url.hostname==='ep-dawn-dew-a11prveg.ap-southeast-1.aws.neon.tech','DB_ENDPOINT');
  requireTrue(decodeURIComponent(url.pathname)==='/cs03_auth_sandbox','DATABASE_NAME');
  requireTrue(decodeURIComponent(url.username)==='cs03_progress_api','DB_ROLE');
  requireTrue(Boolean(url.password),'DB_PASSWORD');
  requireTrue(url.searchParams.get('sslmode')==='verify-full','TLS_VERIFY_FULL');
  requireTrue(!url.searchParams.has('uselibpqcompat')&&!url.searchParams.has('sslcert')&&!url.searchParams.has('sslkey')&&!url.searchParams.has('sslrootcert'),'TLS_NO_OVERRIDES');
 }
 return {approved:failures.length===0,failures};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=assessCs03Deploy(process.env);
 // Only rejection codes; never emit URL, JWT, database password or auth details.
 console.log('CS03_DEPLOY_GATE='+(result.approved?'PASS':'BLOCKED'));
 for(const code of result.failures)console.log('BLOCKED_'+code);
 if(!result.approved)process.exitCode=1;
}
