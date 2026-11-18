// Local browser test for explicit device/account comparison (no Neon, no writes).
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.webp':'image/webp','.json':'application/json'};
const legacy={'2025:am2:1':{level:'mastered'},'2025:am2:2':{level:'review'}};
let server,browser,external=0;
function check(label,ok){console.log('COMPARE_'+label+'='+(ok?'PASS':'FAIL'));if(!ok)throw Error('ASSERTION_FAILED');}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const rel=relative(root,file);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||file===root){res.writeHead(403);res.end();return}
  try{res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file))}
  catch{res.writeHead(404);res.end()}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();external++;return route.abort()});
 await context.addInitScript(value=>localStorage.setItem('db-study-progress-v1',JSON.stringify(value)),legacy);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.name||'PAGE_ERROR'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CS03_SELECTED_QUESTION?.readLegacySnapshot);
 check('PANEL_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 check('DEVICE_SNAPSHOT',await page.evaluate(()=>Object.keys(window.CS03_SELECTED_QUESTION.readLegacySnapshot()).length===2));
 await page.evaluate(async()=>{
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const {createCs03ScopedProgress}=await import('/src/cs03-scoped-progress.mjs');
  const {previewCs03Sync}=await import('/src/cs03-sync-preview.mjs');
  const userId='a1111111-1111-4111-8111-111111111111';
  let user=null,reads=0,writes=0;
  const account={
   signUp:async()=>({}),signIn:async fields=>(user={id:userId,email:fields.email}),
   signOut:async()=>{user=null},session:async()=>{if(!user)throw Error('SIGN_IN_REQUIRED');return user},
   pull:async()=>null,save:async()=>{writes++;throw Error('WRITE_NOT_ALLOWED')},
   readLocal:()=>({}),listProgress:async()=>{reads++;return {
    '2025:am2:2':{data:{level:'learning'},revision:1},
    '2025:am2:3':{data:{level:'mastered'},revision:1}
   }}
  };
  const scoped=createCs03ScopedProgress({account});
  const panel=document.getElementById('cs03AccountPanel');
  mountCs03AccountPanel(panel,account,{
   onSignedIn:()=>scoped.bind(),onSignedOut:()=>scoped.unbind(),
   onCompareProgress:async()=>{
    const listing=await scoped.list();
    const result=previewCs03Sync({deviceRecords:window.CS03_SELECTED_QUESTION.readLegacySnapshot(),accountListing:listing});
    const n=result.counts;
    return '比較結果：端末のみ '+n.deviceOnly+'件／アカウントのみ '+n.accountOnly+'件／両方にある問題 '+n.conflicts+'件。自動上書き・自動統合は行っていません。';
   }
  });
  panel.hidden=false;
  window.__compareTest={counts:()=>({reads,writes})};
 });
 const button=page.locator('[data-cs03="compare-progress"]');
 check('DISABLED_BEFORE_LOGIN',!(await button.isEnabled()));
 await page.locator('[data-cs03="email"]').fill('tester@example.com');
 await page.locator('[data-cs03="password"]').fill('local-only');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'));
 check('ENABLED_AFTER_LOGIN',await button.isEnabled());
 check('NO_EAGER_REQUEST',await page.evaluate(()=>window.__compareTest.counts().reads===0));
 await button.click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('比較結果：端末のみ 1件／アカウントのみ 1件／両方にある問題 1件'));
 check('SUMMARY_DISPLAYED',(await page.locator('[data-cs03="record-status"]').textContent()).includes('自動上書き・自動統合は行っていません'));
 check('READ_ONCE',await page.evaluate(()=>window.__compareTest.counts().reads===1));
 check('NO_ACCOUNT_WRITES',await page.evaluate(()=>window.__compareTest.counts().writes===0));
 check('DEVICE_UNCHANGED',await page.evaluate(value=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(value),legacy));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 check('DISABLED_AFTER_LOGOUT',!(await button.isEnabled()));
 check('NO_EXTERNAL_REQUESTS',external===0);
 check('NO_SCRIPT_ERRORS',errors.length===0);
 console.log('CS03_COMPARE_BROWSER=PASS');
}catch(e){
 console.log('CS03_COMPARE_BROWSER=FAIL');
 console.log('FAIL_CLASS='+(e?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':e?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
