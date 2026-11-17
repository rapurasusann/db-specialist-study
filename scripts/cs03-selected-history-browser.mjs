// Local-only UI integration test for selected-question account history.
// No Neon requests, no deployment, no existing user progress modifications.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const original={'2025:am2:1':{level:'mastered',updatedAt:'2026-11-18T00:00:00.000Z'}};
let server,browser,external=0;
function pass(name,ok){console.log(name+'='+(ok?'PASS':'FAIL'));if(!ok)throw Error('ASSERTION_FAILED');}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let decoded;
  try{decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
  const rel=relative(root,file);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||file===root){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  external++;return route.abort();
 });
 await context.addInitScript(records=>{localStorage.setItem('db-study-progress-v1',JSON.stringify(records));},original);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.name||'PAGE_ERROR'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CS03_SELECTED_QUESTION?.read);
 pass('HISTORY_PANEL_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 pass('BRIDGE_CURRENT_QUESTION',await page.evaluate(()=>window.CS03_SELECTED_QUESTION.read()==='2025:am2:1'));
 await page.evaluate(async()=>{
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const {createCs03ScopedProgress}=await import('/src/cs03-scoped-progress.mjs');
  const uuid='a1111111-1111-4111-8111-111111111111';
  let user=null;
  const log=[];
  const records=new Map([['2025:am2:1',{data:{level:'review'},revision:1}],['2025:am2:2',{data:{level:'learning'},revision:1}]]);
  const account={
   signUp:async()=>({}),signIn:async fields=>(user={id:uuid,email:fields.email}),
   signOut:async()=>{user=null;},
   session:async()=>{if(!user)throw Error('SIGN_IN_REQUIRED');return user;},
   readLocal:()=>({}),
   pull:async id=>{log.push(id);return records.get(id)??null;},
   save:async()=>{throw Error('READ_ONLY_TEST');}
  };
  const scoped=createCs03ScopedProgress({account});
  const panel=document.querySelector('#cs03AccountPanel');
  mountCs03AccountPanel(panel,account,{
   onSignedIn:()=>scoped.bind(),onSignedOut:()=>scoped.unbind(),
   onLoadProgress:async()=>{
    const id=window.CS03_SELECTED_QUESTION.read();
    const item=await scoped.pull(id);
    return id+'：'+(item?.level||'履歴なし')+'（閲覧のみ）';
   }
  });
  window.__cs03ReadTest={log,uuid};
  panel.hidden=false;
 });
 pass('HISTORY_BUTTON_DISABLED_UNTIL_LOGIN',!(await page.locator('[data-cs03="load-progress"]').isEnabled()));
 await page.locator('[data-cs03="email"]').fill('tester@example.com');
 await page.locator('[data-cs03="password"]').fill('sample-pass');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'));
 pass('HISTORY_BUTTON_ENABLED_AFTER_LOGIN',await page.locator('[data-cs03="load-progress"]').isEnabled());
 await page.locator('[data-cs03="load-progress"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('2025:am2:1：review'));
 pass('HISTORY_READ_SELECTED_QUESTION',(await page.locator('[data-cs03="record-status"]').textContent()).includes('閲覧のみ'));
 pass('HISTORY_REQUEST_ONCE',await page.evaluate(()=>window.__cs03ReadTest.log.length===1));
 pass('LEGACY_PROGRESS_UNCHANGED',await page.evaluate(v=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(v),original));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 pass('HISTORY_BUTTON_DISABLED_AFTER_LOGOUT',!(await page.locator('[data-cs03="load-progress"]').isEnabled()));
 pass('NO_NEON_REQUESTS',external===0);
 pass('NO_SCRIPT_ERRORS',errors.length===0);
 console.log('CS03_SELECTED_HISTORY_BROWSER=PASS');
}catch(e){
 console.log('CS03_SELECTED_HISTORY_BROWSER=FAIL');
 console.log('FAIL_CLASS='+(e?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':e?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
