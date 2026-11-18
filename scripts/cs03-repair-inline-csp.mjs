// Align the existing strict CSP with the exact executable inline script bytes.
// No network activity, no policy relaxation and no changes outside index.html.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file=new URL('../index.html',import.meta.url);
const html=readFileSync(file,'utf8');
const meta=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
if(!meta)throw Error('CSP_META_MISSING');
const original=meta[1];
const parts=original.match(/(?:^|;)\s*script-src ([^;]+)(?=;|$)/);
if(!parts)throw Error('SCRIPT_SRC_MISSING');
const policy=parts[1];
if(!policy.includes("'self'")||policy.includes("'unsafe-inline'")||policy.includes("'unsafe-eval'"))throw Error('UNSAFE_SCRIPT_POLICY');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
if(scripts.length!==2)throw Error('UNEXPECTED_INLINE_SCRIPT_COUNT');
const tokens=scripts.map(script=>"'sha256-"+createHash('sha256').update(script,'utf8').digest('base64')+"'");
const newPolicy="'self' "+tokens.join(' ');
const nextMeta=original.replace(parts[0],parts[0].replace('script-src '+policy,'script-src '+newPolicy));
if(nextMeta===original){console.log('CSP_HASHES_ALREADY_CURRENT=YES');process.exit(0)}
const updated=html.replace(meta[0],meta[0].replace(original,nextMeta));
if(updated===html||updated.includes("'unsafe-inline'"))throw Error('CSP_REPAIR_FAILED');
writeFileSync(file,updated,'utf8');
console.log('CSP_INLINE_HASHES_RECALCULATED='+tokens.length);
console.log('CSP_STRICT_POLICY_PRESERVED=YES');
