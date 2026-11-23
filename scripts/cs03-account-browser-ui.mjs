// Browser interaction test for the isolated CS-03 account panel.
// Only local HTTP and fake auth; no Neon, emails, API, or production writes.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
const original={'2025:am2:1':{level:'mastered',updatedAt:'2026-11-18T00:00:00.000Z'}};
let browser,server,external=0;
function verify(name,yes){console.log(name+'='+(yes?'PASS':'FAIL'));if(!yes)throw new Error('ASSERTION_FAILED');}
try{
 const modulePath=process.env.PLAYWRIGHT_MODULE_PATH;
 if(!modulePath)throw new Error('PLAYWRIGHT_MISSING');
 const playwright=require(modulePath);
 server=http.createServer(async(req,res)=>{
  let decoded;
  try{decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
  const rel=relative(root,file);
  if(rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||rel.startsWith('..'+String.fromCharCode(92))||rel.startsWith('/')||file===root){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin!==origin){external++;return route.abort();}
  return route.continue();
 });
 await context.addInitScript(value=>{
  localStorage.setItem('db-study-progress-v1',JSON.stringify(value));
 },original);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',err=>errors.push(String(err.message||'ERROR')));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.DB_STUDY_CS03?.previewEnabled===false);
 verify('ACCOUNT_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 // Use the actual browser UI module against an isolated fake account.
 await page.evaluate(async()=>{
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const root=document.querySelector('#cs03AccountPanel');
  const log=[];let user=null;
  const mock={
   signUp:async fields=>{log.push({op:'signup',email:fields.email,name:fields.name,passwordPresent:!!fields.password});return {user:{id:'test-user'}};},
   signIn:async fields=>{log.push({op:'login',email:fields.email,passwordPresent:!!fields.password});user={id:'test-user',email:fields.email};return user;},
   signOut:async()=>{log.push({op:'logout'});user=null;},
   session:async()=>{if(!user)throw new Error('SIGN_IN_REQUIRED');return user;}
  };
  window.__cs03BrowserTest={log,ui:mountCs03AccountPanel(root,mock)};
  root.hidden=false;
 });
 verify('ACCOUNT_PANEL_VISIBLE',await page.locator('#cs03AccountPanel').isVisible());
 await page.locator('[data-cs03="email"]').fill('  tester@example.com  ');
 await page.locator('[data-cs03="name"]').fill('Learner');
 await page.locator('[data-cs03="password"]').fill('test-only-password');
 await page.locator('[data-cs03="signup"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="status"]').textContent.includes('登録要求'));
 verify('SIGNUP_UI',await page.evaluate(()=>window.__cs03BrowserTest.log.length===1&&window.__cs03BrowserTest.log[0].email==='tester@example.com'));
 verify('PASSWORD_CLEARED_AFTER_SIGNUP',await page.locator('[data-cs03="password"]').inputValue()==='');
 await page.locator('[data-cs03="password"]').fill('test-only-password');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('tester@example.com'));
 verify('LOGIN_UI',await page.locator('[data-cs03="logout"]').isEnabled());
 verify('LOGIN_DISABLES_FORM',!(await page.locator('[data-cs03="login"]').isEnabled()));
 await page.evaluate(()=>window.__cs03BrowserTest.ui.refresh());
 verify('SESSION_REFRESH_UI',(await page.locator('[data-cs03="status"]').textContent()).includes('ログイン状態'));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 verify('LOGOUT_UI',await page.locator('[data-cs03="login"]').isEnabled());
 verify('LEGACY_RECORD_UNCHANGED',await page.evaluate(value=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(value),original));
 verify('NO_EXTERNAL_REQUESTS',external===0);
 verify('NO_PAGE_ERRORS',errors.length===0);
 console.log('CS03_ACCOUNT_BROWSER_UI=PASS');
}catch(error){
 console.log('CS03_ACCOUNT_BROWSER_UI=FAIL');
 console.log('FAIL_CLASS='+(error?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':error?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
