import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,relative,extname,sep} from 'node:path';
import {spawn} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.woff2':'font/woff2'};
function run(args,env=process.env){return new Promise((ok,fail)=>{const child=spawn(process.execPath,args,{cwd:root,env,stdio:'inherit'});child.once('error',fail);child.once('exit',(code,signal)=>code===0?ok():fail(new Error('TEST_FAILED '+code+' '+signal)));});}
await import('playwright').catch(()=>{throw new Error('Playwright must already be installed locally; no automatic installation performed');});
await run(['--test','tests/am2-archive-structure.test.mjs','tests/am2-archive-grading.test.mjs','tests/am2-archive-figures.test.mjs']);
const server=createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file=resolve(root,'.'+(path==='/'?'/index.html':path)),rel=relative(root,file);
 if(rel==='..'||rel.startsWith('..'+sep)||rel.split(sep).some(x=>x.startsWith('.'))||!mime[extname(file)]){res.writeHead(403).end();return;}
 if(!(await stat(file)).isFile()){res.writeHead(404).end();return;}
 const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)],'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404).end();}});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
try{await run(['scripts/test-am2-archive-browser.mjs'],{...process.env,ARCHIVE_TEST_URL:'http://127.0.0.1:'+server.address().port+'/'});console.log('AM2_ARCHIVE_LOCAL_SUITE_PASS');}finally{await new Promise(ok=>server.close(ok));}
