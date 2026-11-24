// CS-03 local preparation only. Creates an unsigned, secret-free index.mjs.
// Does not invoke Neon CLI, Cloudflare, a network endpoint or a deployment API.
// Usage: node scripts/cs03-stage-neon-function.mjs
import {build} from 'esbuild';
import {mkdtemp,readFile,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=resolve(root,'functions/cs03-progress.mjs');
const destination=await mkdtemp(join(tmpdir(),'cs03-function-candidate-'));
const outfile=join(destination,'index.mjs');
try{
 const result=await build({
  entryPoints:[source],bundle:true,platform:'node',target:'node24',format:'esm',
  logLevel:'silent',outfile,metafile:true,
  banner:{js:"import{createRequire as ___cr}from'module';import{fileURLToPath as ___f}from'url';import{dirname as ___d}from'path';const require=___cr(import.meta.url);const __filename=___f(import.meta.url);const __dirname=___d(__filename);"}
 });
 const inputPaths=Object.keys(result.metafile.inputs).map(s=>s.replaceAll('\\','/'));
 const required=['src/progress-api.js','src/progress-access.js','node_modules/pg/','node_modules/jose/'];
 for(const part of required)if(!inputPaths.some(s=>s.includes(part)))throw Error('BUNDLE_DEPENDENCY_MISSING:'+part);
 const raw=await readFile(outfile);
 const checksum=createHash('sha256').update(raw).digest('hex');
 if((await stat(outfile)).size<1000)throw Error('BUNDLE_INVALID_SIZE');
 console.log('CS03_NEON_STAGE_ONLY=YES');
 console.log('CS03_NEON_ARTIFACT_PATH='+outfile);
 console.log('CS03_NEON_ARTIFACT_SHA256='+checksum);
 console.log('CS03_NEON_DEPLOYMENT_APPROVED=NO');
 console.log('CS03_NEON_SECRET_EMBEDDED=NO_RUNTIME_ENV_REQUIRED');
 console.log('CS03_NEON_RELEASE=NO-GO');
}catch(error){
 console.error('CS03_NEON_STAGE_FAILED='+String(error?.message??error));
 process.exitCode=1;
}
