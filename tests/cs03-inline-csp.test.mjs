import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('every inline executable script has the exact CSP SHA-256 hash',()=>{
 const meta=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
 assert.ok(meta,'CSP must be present');
 const rule=meta.match(/(?:^|;)\s*script-src ([^;]+)/)?.[1];
 assert.ok(rule,'script-src must be present');
 assert.ok(!rule.includes("'unsafe-inline'"),'inline scripts must be hash-restricted');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(Boolean);
 assert.ok(scripts.length>=2);
 for(const script of scripts){
  const hash=createHash('sha256').update(script,'utf8').digest('base64');
  assert.ok(rule.includes("'sha256-"+hash+"'"),'CSP must cover all current inline scripts');
 }
});
