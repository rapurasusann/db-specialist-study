// Offline-only Neon Function bundle acceptance. No Neon CLI, deploy, credentials or network.
// Uses the repository's existing esbuild package; builds into an OS temporary directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root=fileURLToPath(new URL('../',import.meta.url));
test('Node24 ESM bundle contains the CommonJS progress handler and remains fail-closed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'cs03-neon-offline-bundle-'));
 const outfile=join(dir,'index.mjs');
 try{
  // Neon documents node platform / node24 / ESM with a createRequire banner
  // for dependencies that use dynamic require (e.g. pg).
  const result=await build({
   entryPoints:[resolve(root,'functions/cs03-progress.mjs')],
   bundle:true,platform:'node',target:'node24',format:'esm',outfile,
   logLevel:'silent',metafile:true,
   banner:{js:"import{createRequire as ___cr}from'module';import{fileURLToPath as ___f}from'url';import{dirname as ___d}from'path';const require=___cr(import.meta.url);const __filename=___f(import.meta.url);const __dirname=___d(__filename);"}
  });
  const inputs=Object.keys(result.metafile.inputs).map(x=>x.replaceAll('\\','/'));
  assert.ok(inputs.some(x=>x.endsWith('src/progress-api.js')),'progress API must be bundled');
  assert.ok(inputs.some(x=>x.endsWith('src/progress-access.js')),'access control must be bundled');
  assert.ok(inputs.some(x=>x.includes('node_modules/pg/')),'pg must be bundled');
  assert.ok(inputs.some(x=>x.includes('node_modules/jose/')),'jose must be bundled');
  const output=await readFile(outfile,'utf8');
  assert.ok(output.length>1000);
  // Module import must work without a private env, remote JWKS or DB connection.
  const handler=(await import(pathToFileURL(outfile).href)).default;
  assert.equal(typeof handler?.fetch,'function');
  const origin='https://rapurasusann.github.io';
  const endpoint='https://isolated-function.invalid';
  const base={origin,authorization:'Bearer local-test-only-token'};
  const rootReply=await handler.fetch(new Request(endpoint+'/',{headers:base}));
  assert.equal(rootReply.status,404,'root URL is not currently a /progress API');
  const denied=await handler.fetch(new Request(endpoint+'/progress?examCode=db',{headers:base}));
  assert.equal(denied.status,401,'missing x-secret must never access database');
  assert.equal(denied.headers.get('cache-control'),'no-store');
 }finally{await rm(dir,{recursive:true,force:true});}
});
