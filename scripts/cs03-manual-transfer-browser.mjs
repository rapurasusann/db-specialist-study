// Browser test for explicitly copying one legacy question to an account.
// Local fake account API only. No external requests, no real users or DB writes.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const legacy={'2025:am2:1':{level:'mastered',updatedAt:'2026-11-18T00:00:00.000Z'}};
let server,browser,blocked=0;
function verify(label,ok){console.log(label+'='+(ok?'PASS':'FAIL'));if(!ok)throw Error('ASSERTION_FAILED');}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const path=resolve(ROOT,'.'+(pathname==='/'?'/index.html':pathname));
  const rel=relative(ROOT,path);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||path===ROOT){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',MIME[extname(path)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  blocked++;return route.abort();
 });
 await context.addInitScript(data=>localStorage.setItem('db-study-progress-v1',JSON.stringify(data)),legacy);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',()=>errors.push('PAGE_ERROR'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.CS03_SELECTED_QUESTION?.readLegacy==='function');
 verify('MANUAL_TRANSFER_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 await page.evaluate(async()=>{
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const {createCs03ScopedProgress}=await import('/src/cs03-scoped-progress.mjs');
  const {createCs03ManualTransfer}=await import('/src/cs03-manual-transfer.mjs');
  const id='a1111111-1111-4111-8111-111111111111';
  const remote=new Map(),operations=[];
  let user=null,approve=true;
  const account={
   signUp:async()=>({}),
   signIn:async fields=>(user={id,email:fields.email}),
   signOut:async()=>{user=null;},
   session:async()=>{if(!user)throw Error('SIGN_IN_REQUIRED');return user;},
   readLocal:()=>({}),
   pull:async q=>{operations.push('pull');return remote.get(q)??null;},
   save:async(q,data)=>{operations.push('save');if(remote.has(q))throw Error('REVISION_CONFLICT_REFRESHED');remote.set(q,{data:structuredClone(data),revision:1});return remote.get(q);}
  };
  const scoped=createCs03ScopedProgress({account});
  const transfer=createCs03ManualTransfer({scoped,
   readLegacy:q=>window.CS03_SELECTED_QUESTION.readLegacy(q),
   confirmTransfer:async()=>{operations.push('confirm');return approve;}
  });
  const panel=document.querySelector('#cs03AccountPanel');
  mountCs03AccountPanel(panel,account,{
   onSignedIn:()=>scoped.bind(),onSignedOut:()=>scoped.unbind(),
   onTransferProgress:async()=>{
    const result=await transfer.transfer(window.CS03_SELECTED_QUESTION.read());
    return result.copied?'ACCOUNT_SAVE_COMPLETED':'ACCOUNT_SAVE_CANCELLED';
   }
  });
  window.__cs03Manual={operations,remote,setApproval:yes=>approve=yes};
  panel.hidden=false;
 });
 const button=page.locator('[data-cs03="transfer-progress"]');
 verify('MANUAL_TRANSFER_DISABLED_BEFORE_LOGIN',!(await button.isEnabled()));
 await page.locator('[data-cs03="email"]').fill('tester@example.com');
 await page.locator('[data-cs03="password"]').fill('test-only');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'));
 verify('MANUAL_TRANSFER_ENABLED_AFTER_LOGIN',await button.isEnabled());
 await page.evaluate(()=>window.__cs03Manual.setApproval(false));
 await button.click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('ACCOUNT_SAVE_CANCELLED'));
 verify('CANCELLATION_NO_REMOTE_WRITE',await page.evaluate(()=>window.__cs03Manual.remote.size===0));
 await page.evaluate(()=>window.__cs03Manual.setApproval(true));
 await button.click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('ACCOUNT_SAVE_COMPLETED'));
 verify('ONE_QUESTION_SAVED',await page.evaluate(()=>window.__cs03Manual.remote.size===1&&window.__cs03Manual.remote.get('2025:am2:1')?.data?.level==='mastered'));
 verify('LEGACY_PROGRESS_STAYS_UNCHANGED',await page.evaluate(data=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(data),legacy));
 await button.click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('既存の履歴'));
 verify('DUPLICATE_REMOTE_OVERWRITE_REFUSED',await page.evaluate(()=>window.__cs03Manual.remote.get('2025:am2:1')?.revision===1));
 verify('ONLY_ONE_REMOTE_SAVE',await page.evaluate(()=>window.__cs03Manual.operations.filter(x=>x==='save').length===1));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 verify('MANUAL_TRANSFER_DISABLED_AFTER_LOGOUT',!(await button.isEnabled()));
 verify('NO_EXTERNAL_REQUESTS',blocked===0);
 verify('NO_BROWSER_ERRORS',errors.length===0);
 console.log('CS03_MANUAL_TRANSFER_BROWSER=PASS');
}catch(error){
 console.log('CS03_MANUAL_TRANSFER_BROWSER=FAIL');
 console.log('FAIL_CLASS='+(error?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':error?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
