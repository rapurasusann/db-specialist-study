// CS-03 isolated study hint browser acceptance. No Neon traffic or account writes.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const legacy={'2025:am2:1':{level:'mastered'}};
let browser,server,external=0,stage='INIT',pageRef=null;
function check(name,valid){console.log(name+'='+(valid?'PASS':'FAIL'));if(!valid)throw Error('ASSERTION_FAILED');}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path)),rel=relative(root,file);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||file===root){res.writeHead(403);res.end();return}
  try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file))}
  catch{res.writeHead(404);res.end()}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  external++;return route.abort();
 });
 await context.addInitScript(r=>localStorage.setItem('db-study-progress-v1',JSON.stringify(r)),legacy);
 const page=await context.newPage(),errors=[];
 pageRef=page;
 page.on('pageerror',e=>errors.push(e.name||'PAGE_ERROR'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CS03_SELECTED_QUESTION?.read);
 check('HINT_HIDDEN_BY_DEFAULT',!(await page.locator('#cs03StudyHint').isVisible()));
 check('ACCOUNT_PANEL_HIDDEN_BY_DEFAULT',!(await page.locator('#cs03AccountPanel').isVisible()));
 await page.evaluate(async()=>{
  const {createCs03StudyHint}=await import('/src/cs03-study-hint.mjs');
  const {mountCs03AccountPanel}=await import('/src/cs03-account-ui.mjs');
  const {createCs03ScopedProgress}=await import('/src/cs03-scoped-progress.mjs');
  let user=null,reads=0,writes=0;
  const id='a1111111-1111-4111-8111-111111111111';
  const account={
   signUp:async()=>({}),signIn:async f=>(user={id,email:f.email}),
   signOut:async()=>{user=null},session:async()=>{if(!user)throw Error('SIGN_IN_REQUIRED');return user},
   readLocal:()=>({}),pull:async q=>{reads++;return q==='2025:am2:1'?{data:{level:'review'},revision:1}:null},
   save:async()=>{writes++;throw Error('NO_WRITES_ALLOWED')}
  };
  const scoped=createCs03ScopedProgress({account});
  const hint=createCs03StudyHint({root:document.getElementById('cs03StudyHint'),
     selectedId:()=>window.CS03_SELECTED_QUESTION.read()});
  Object.defineProperty(window,'CS03_STUDY_HINT',{value:hint,configurable:false});
  const panel=document.getElementById('cs03AccountPanel');
  mountCs03AccountPanel(panel,account,{
   onSignedIn:()=>{hint.clear();return scoped.bind()},
   onSignedOut:()=>{hint.clear();scoped.unbind()},
   onLoadProgress:async()=>{
    const q=window.CS03_SELECTED_QUESTION.read();
    const record=await scoped.pull(q);hint.clear();if(record)hint.show(q,record);
    return '読み込み完了';
   }
  });
  window.__hintTest={stats:()=>({reads,writes})};
  panel.hidden=false;
 });
 check('HINT_REMAINS_HIDDEN_UNTIL_EXPLICIT_READ',!(await page.locator('#cs03StudyHint').isVisible()));
 await page.locator('[data-cs03="email"]').fill('test@example.com');
 await page.locator('[data-cs03="password"]').fill('sample-only');
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'));
 check('NO_EAGER_READ',await page.evaluate(()=>window.__hintTest.stats().reads===0));
 // Hint is deliberately inside the study view, not the dashboard.
 stage='OPEN_STUDY';
 await page.locator('#viewStudy').click();
 const study=await page.locator('#study').evaluate(el=>({hidden:el.hidden,classes:el.className,display:getComputedStyle(el).display,mode:document.querySelector('#viewStudy')?.className}));
 check('STUDY_MODE_SELECTED',study.mode!==undefined && !study.mode.includes('primary'));
 check('STUDY_VIEW_VISIBLE',study.hidden===false&&!study.classes.split(/\s+/).includes('hide')&&study.display!=='none');
 stage='LOAD_ACCOUNT_HISTORY';
 await page.locator('[data-cs03="load-progress"]').click();
 await page.waitForFunction(()=>document.getElementById('cs03StudyHint').textContent.includes('要復習'),null,{timeout:4500});
 check('HINT_SHOWS_REMOTE_LEVEL',await page.locator('#cs03StudyHint').isVisible());
 check('HINT_READ_ONLY_TEXT',(await page.locator('#cs03StudyHint').textContent()).includes('閲覧専用'));
 check('ACCOUNT_READ_ONCE',await page.evaluate(()=>window.__hintTest.stats().reads===1));
 check('DEVICE_RECORD_UNCHANGED_AFTER_READ',await page.evaluate(r=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(r),legacy));
 stage='NAVIGATE_NEXT';
 await page.evaluate(()=>document.getElementById('next').click());
 check('HINT_HIDDEN_AFTER_NAVIGATION',!(await page.locator('#cs03StudyHint').isVisible()));
 stage='NAVIGATE_BACK';
 await page.evaluate(()=>document.getElementById('previous').click());
 await page.locator('[data-cs03="load-progress"]').click();
 await page.waitForFunction(()=>document.getElementById('cs03StudyHint').textContent.includes('要復習'));
 stage='LOGOUT';
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン');
 check('HINT_HIDDEN_AFTER_LOGOUT',!(await page.locator('#cs03StudyHint').isVisible()));
 check('NO_ACCOUNT_WRITES',await page.evaluate(()=>window.__hintTest.stats().writes===0));
 check('DEVICE_RECORD_UNCHANGED_AFTER_LOGOUT',await page.evaluate(r=>localStorage.getItem('db-study-progress-v1')===JSON.stringify(r),legacy));
 check('NO_EXTERNAL_REQUESTS',external===0);
 check('NO_PAGE_ERRORS',errors.length===0);
 console.log('CS03_STUDY_HINT_BROWSER=PASS');
}catch(e){
 console.log('CS03_STUDY_HINT_BROWSER=FAIL');
 console.log('FAIL_CLASS='+(e?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':e?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 console.log('FAIL_STAGE='+stage);
 if(pageRef){
  console.log('DIAG_PAGE_CLOSED='+(pageRef.isClosed()?'YES':'NO'));
  if(!pageRef.isClosed()){
   try{
    const d=await pageRef.evaluate(()=>({
     studyClass:document.getElementById('study')?.className||'',
     studyDisplay:document.getElementById('study')?getComputedStyle(document.getElementById('study')).display:'MISSING',
     viewClass:document.getElementById('viewStudy')?.className||'',
     hintPresent:Boolean(document.getElementById('cs03StudyHint')),
     hintNonempty:Boolean(document.getElementById('cs03StudyHint')?.textContent),
     recordStatus:document.querySelector('[data-cs03="record-status"]')?.textContent||''
    }));
    console.log('DIAG_STUDY_HAS_HIDE='+(d.studyClass.split(/\\s+/).includes('hide')?'YES':'NO'));
    console.log('DIAG_STUDY_DISPLAY_NONE='+(d.studyDisplay==='none'?'YES':'NO'));
    console.log('DIAG_VIEW_STUDY_PRIMARY='+(d.viewClass.includes('primary')?'YES':'NO'));
    console.log('DIAG_HINT_PRESENT='+(d.hintPresent?'YES':'NO'));
    console.log('DIAG_HINT_NONEMPTY='+(d.hintNonempty?'YES':'NO'));
    console.log('DIAG_LOAD_FINISHED='+(d.recordStatus.includes('読み込み完了')?'YES':'NO'));
   }catch{console.log('DIAG_EVALUATION_FAILED=YES')}
  }
 }
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}