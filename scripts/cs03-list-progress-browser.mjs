// Local-only browser test: explicit account-wide progress count from a fake paginated API.
// Never contacts Neon or writes an existing user's legacy progress.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const legacy={'2025:am2:1':{level:'mastered',updatedAt:'2026-11-18T00:00:00Z'}};
let server,browser,external=0;
function check(name,condition){console.log(name+'='+(condition?'PASS':'FAIL'));if(!condition)throw Error('ASSERTION_FAILED');}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const rel=relative(root,file);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||file===root){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  external++;return route.abort();
 });
 await context.addInitScript(data=>localStorage.setItem('db-study-progress-v1',JSON.stringify(data)),legacy);
 const page=await context.newPage();
 const errors=[];page.on('pageerror',()=>errors.push('PAGE_ERROR'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 check('ACCOUNT_LIST_PANEL_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 await page.evaluate(async()=>{
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const {createCs03ScopedProgress}=await import('/src/cs03-scoped-progress.mjs');
  const A='a1111111-1111-4111-8111-111111111111';
  let user=null,requests=0;
  const account={
   signUp:async()=>({}),
   signIn:async fields=>(user={id:A,email:fields.email}),
   signOut:async()=>{user=null;},
   session:async()=>{if(!user)throw Error('SIGN_IN_REQUIRED');return user;},
   pull:async()=>null,save:async()=>{throw Error('NOT_ALLOWED');},
   readLocal:()=>({}),
   listProgress:async()=>{
    requests++;
    return {'2025:am2:1':{data:{level:'review'},revision:1},
            '2025:am2:2':{data:{level:'learning'},revision:1},
            '2025:am2:3':{data:{level:'unseen'},revision:1}};
   }
  };
  const scoped=createCs03ScopedProgress({account});
  const root=document.querySelector('#cs03AccountPanel');
  mountCs03AccountPanel(root,account,{
   onSignedIn:()=>scoped.bind(),onSignedOut:()=>scoped.unbind(),
   onListProgress:async()=>{
    const listing=await scoped.list();
    const records=Object.values(listing.records);
    const learned=records.filter(r=>r.data?.level&&r.data.level!=='unseen').length;
    return 'アカウント履歴 '+records.length+'件（学習済み '+learned+'件）。閲覧のみ。端末内履歴は変更しません。';
   }
  });
  window.__cs03ListTest={requests:()=>requests};
  root.hidden=false;
 });
 const button=page.locator('[data-cs03="list-progress"]');
 check('ACCOUNT_LIST_DISABLED_BEFORE_LOGIN',!(await button.isEnabled()));
 await page.locator('[data-cs03="email"]').fill('test@example.com');
 await page.locator('[data-cs03="password"]').fill('local-only');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'));
 check('ACCOUNT_LIST_ENABLED_AFTER_LOGIN',await button.isEnabled());
 check('ACCOUNT_LIST_NO_EAGER_REQUEST',await page.evaluate(()=>window.__cs03ListTest.requests()===0));
 await button.click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="record-status"]').textContent.includes('アカウント履歴 3件（学習済み 2件）'));
 check('ACCOUNT_LIST_DISPLAYS_COUNTS',(await page.locator('[data-cs03="record-status"]').textContent()).includes('端末内履歴は変更しません'));
 check('ACCOUNT_LIST_REQUEST_ONCE',await page.evaluate(()=>window.__cs03ListTest.requests()===1));
 check('ACCOUNT_LIST_LEGACY_UNCHANGED',await page.evaluate(original=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(original),legacy));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 check('ACCOUNT_LIST_DISABLED_AFTER_LOGOUT',!(await button.isEnabled()));
 check('ACCOUNT_LIST_NO_EXTERNAL_REQUESTS',external===0);
 check('ACCOUNT_LIST_NO_PAGE_ERRORS',errors.length===0);
 console.log('CS03_LIST_PROGRESS_BROWSER=PASS');
}catch(e){
 console.log('CS03_LIST_PROGRESS_BROWSER=FAIL');
 console.log('FAIL_CLASS='+(e?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':e?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
