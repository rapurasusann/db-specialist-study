// CS-03 isolated server runtime. Never import into a browser or deploy to main.
// All settings are supplied by the server's private environment.
import pg from 'pg';
import {createNeonJwtVerifier} from '../src/neon-jwt-verifier.mjs';
// Static CJS import lets esbuild include the progress API and its access layer.
// Dynamic createRequire() would leave a relative require outside the Function bundle.
import progressApi from '../src/progress-api.js';
const {createProgressHandler}=progressApi;
const ISOLATED_BRANCH='br-snowy-truth-a162pmdt';
const TEST_DB='cs03_auth_sandbox';
const ISSUER='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech';
const JWKS='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth/.well-known/jwks.json';

export function createCs03Runtime(env=process.env, options={}) {
  if(env.CS03_ISOLATED_BRANCH_ID!==ISOLATED_BRANCH ||
     (env.NEON_BRANCH_ID && env.NEON_BRANCH_ID!==ISOLATED_BRANCH) ||
     !env.CS03_TEST_DATABASE_URL) throw new Error('CS03_ISOLATED_CONFIG_REQUIRED');
  const parsed=new URL(env.CS03_TEST_DATABASE_URL);
  if(parsed.protocol!=='postgresql:' && parsed.protocol!=='postgres:') throw new Error('CS03_DATABASE_PROTOCOL_INVALID');
  if(decodeURIComponent(parsed.pathname)!=='/'+TEST_DB ||
     parsed.username!=='cs03_progress_api' ||
     !parsed.hostname.endsWith('.ap-southeast-1.aws.neon.tech') ||
     parsed.hostname.indexOf('ep-dawn-dew-a11prveg')!==0)
    throw new Error('CS03_DATABASE_TARGET_MISMATCH');
  // Explicitly require certificate and hostname verification with pg/pg-connection-string.
  if(parsed.searchParams.get('sslmode')!=='verify-full' ||
     parsed.searchParams.has('uselibpqcompat') || parsed.searchParams.has('sslcert') ||
     parsed.searchParams.has('sslkey') || parsed.searchParams.has('sslrootcert'))
    throw new Error('CS03_SSL_VERIFY_FULL_REQUIRED');
  const verifyToken=createNeonJwtVerifier({
    jwksUrl:JWKS,issuer:ISSUER,audience:ISSUER
  });
  // Connection strings and credentials stay in server environment.
  const pool=options.pool??new pg.Pool({connectionString:env.CS03_TEST_DATABASE_URL,max:2});
  return {handle:createProgressHandler({verifyToken,pool}),close:()=>pool.end()};
}
