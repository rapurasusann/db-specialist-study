// Recompute exact CSP SHA-256 hashes for the two executable inline scripts.
// Only the script-src hashes in the CSP meta tag may change. Run locally with Node.js.
// Does not access network, credentials, or database.
'use strict';
const {readFileSync,writeFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const {resolve}=require('node:path');
const file=resolve(__dirname,'../index.html');
const original=readFileSync(file,'utf8');
const meta=original.match(/(<meta http-equiv="Content-Security-Policy" content=")([^"]+)(")/);
if(!meta||original.match(/http-equiv="Content-Security-Policy"/g)?.length!==1)throw Error('CSP_META_NOT_UNIQUE');
const csp=meta[2];
const scriptSrc=csp.match(/script-src [^;]+/);
if(!scriptSrc)throw Error('SCRIPT_SRC_MISSING');
const oldHashes=[...scriptSrc[0].matchAll(/'sha256-([^']+)'/g)].map(m=>m[1]);
const inline=[...original.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
if(inline.length!==2||oldHashes.length!==2)throw Error('UNEXPECTED_INLINE_OR_HASH_COUNT');
// HTML input-stream preprocessing normalizes CRLF and lone CR to LF before CSP hashing.
// Windows checkouts must therefore hash browser-normalized source, not raw disk bytes.
const hashes=inline.map(s=>createHash('sha256').update(s.replace(/\r\n?/g,'\n'),'utf8').digest('base64'));
const updatedScriptSrc="script-src 'self' "+hashes.map(h=>"'sha256-"+h+"'").join(' ');
const newCsp=csp.replace(scriptSrc[0],updatedScriptSrc);
const next=original.replace(meta[0],meta[1]+newCsp+meta[3]);
if(next===original){console.log('CS03_CSP_ALREADY_VALID=YES');process.exit(0);}
if(!next.includes(newCsp)||next.replace(meta[1]+newCsp+meta[3],meta[0])!==original)throw Error('OUT_OF_SCOPE_CHANGE');
writeFileSync(file,next,'utf8');
console.log('CS03_CSP_HASHES_REPAIRED='+hashes.length);
