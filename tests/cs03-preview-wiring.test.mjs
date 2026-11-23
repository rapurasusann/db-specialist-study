import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const src=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=src('index.html'),config=src('cs03-config.js'),loader=src('src/cs03-account-preview-loader.mjs');
test('account panel starts hidden and legacy study elements remain',()=>{
 assert.match(html,/<section id="cs03AccountPanel" hidden/);
 assert.match(html,/id="cs03StudyHint" hidden/);
 assert.match(html,/id="syncControls" hidden/);
 assert.match(html,/id="study"/);
 assert.match(html,/db-study-progress-v1/);
});
test('CS03 preview is OFF by default and has no browser credentials',()=>{
 assert.match(config,/previewEnabled\s*:\s*false/);
 assert.match(config,/authUrl\s*:\s*''/);
 assert.match(config,/apiUrl\s*:\s*''/);
 assert.doesNotMatch(config,/postgresql:\/\/|postgres:\/\/|service_role|CS03_ORIGIN_SECRET/);
});
test('read-only bridge loads after main inline script and before opt-in preview',()=>{
 const bridge=html.indexOf('<script src="src/cs03-selected-question.js"></script>');
 const cfg=html.indexOf('<script src="cs03-config.js"></script>');
 const preview=html.indexOf('<script type="module" src="src/cs03-account-preview-loader.mjs"></script>');
 assert.ok(bridge>0&&cfg>bridge&&preview>cfg);
 assert.match(loader,/previewEnabled===true/);
 assert.match(loader,/await import\('\.\/cs03-account\.bundle\.js'\)/);
});
test('every executable inline script retains an exact CSP SHA-256 allowlist entry',()=>{
 const csp=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
 assert.ok(csp);
 const blocks=[...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(x=>x[1]).filter(Boolean);
 assert.ok(blocks.length>=1);
 for(const block of blocks){
  const hash=createHash('sha256').update(block,'utf8').digest('base64');
  assert.ok(csp.includes("'sha256-"+hash+"'"),'MISSING_CSP_INLINE_HASH');
 }
});
