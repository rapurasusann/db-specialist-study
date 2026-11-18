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
 page.on('pageerror',e=>errors.push({name:e?.name||'UNKNOWN',message:String(e?.message||'').slice(0,180),stack:String(e?.stack||'').slice(0,500)}));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CS03_SELECTED_QUESTION?.read);
 // The legacy page must initialize before an account preview can be accepted.
 // Report only error names and HTML line numbers, never potentially sensitive messages.
 const initialized=await page.evaluate(()=>({
  handler:typeof document.getElementById('viewStudy')?.onclick==='function',
  renderMode:typeof window.renderMode==='function',
  courses:document.getElementById('coursebars')?.children.length||0,
  loaded:document.readyState,
  legacyInlineSyntax:(()=>{try{const inline=[...document.scripts].find(x=>!x.src&&x.textContent.includes('function renderMode()'));if(!inline)return 'MISSING';new Function(inline.textContent);return 'VALID'}catch{return 'INVALID'}})()
 }));
 console.log('LEGACY_INIT_HANDLER='+(initialized.handler?'PASS':'FAIL'));
 console.log('LEGACY_INIT_RENDER_FUNCTION='+(initialized.renderMode?'YES':'NO'));
 console.log('LEGACY_INIT_DASHBOARD_ROWS='+initialized.courses);
 console.log('LEGACY_PAGEERROR_COUNT='+errors.length);
 console.log('LEGACY_INLINE_SYNTAX='+initialized.legacyInlineSyntax);
 for(let i=0;i<Math.min(errors.length,3);i++){
  const item=errors[i];
  console.log('LEGACY_PAGEERROR_'+i+'_TYPE='+item.name);
  // Error classes and source locations only; do not print arbitrary error messages or secrets.
  console.log('LEGACY_PAGEERROR_'+i+'_CLASS='+(item.message.match(/^(?:Uncaught )?(?:SyntaxError|ReferenceError|TypeError|RangeError|EvalError|Error)/)?.[0]||'OTHER'));
  const location=item.stack.match(/(?:index\.html|[A-Za-z0-9._-]+\.js):\d+:\d+/)?.[0];
  console.log('LEGACY_PAGEERROR_'+i+'_AT='+(location||'UNKNOWN'));
  const hint=item.message.match(/(?:is not defined|Cannot read properties of|Unexpected token|already been declared|Cannot access|is not a function)/)?.[0];
  console.log('LEGACY_PAGEERROR_'+i+'_HINT='+(hint||'OTHER'));
 }
 if(!initialized.handler)throw Error('LEGACY_INITIALIZATION_FAILED');
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
 const study=await page.evaluate(()=>{
  const button=document.getElementById('viewStudy');
  const element=document.getElementById('study');
  const before={className:element.className,display:getComputedStyle(element).display};
  button.click();
  const after={className:element.className,display:getComputedStyle(element).display};
  return {hidden:element.hidden,classes:after.className,display:after.display,mode:button.className,before,after,
   hasHandler:typeof button.onclick==='function'};
 });
 console.log('STUDY_BUTTON_HANDLER='+(study.hasHandler?'YES':'NO'));
 console.log('STUDY_HIDE_BEFORE='+(study.before.className.split(/\s+/).includes('hide')?'YES':'NO'));
 console.log('STUDY_HIDE_AFTER='+(study.after.className.split(/\s+/).includes('hide')?'YES':'NO'));
 check('STUDY_MODE_SELECTED',study.mode!==undefined && study.mode.includes('primary'));
 console.log('STUDY_HIDE_CLASS='+(study.classes.split(/\s+/).includes('hide')?'YES':'NO'));
 console.log('STUDY_COMPUTED_DISPLAY='+(['none','grid','block'].includes(study.display)?study.display:'OTHER'));
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
 console.log('FAIL_CLASS='+(e?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':e?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':e?.message==='LEGACY_INITIALIZATION_FAILED'?'LEGACY_INITIALIZATION_FAILED':'BROWSER_OR_ENVIRONMENT_ERROR'));
 console.log('FAIL_STAGE='+stage);
 if(pageRef){
  console.log('DIAG_PAGE_CLOSED='+(pageRef.isClosed()?'YES':'NO'));
  if(!pageRef.isClosed()){
   try{
    const d=await pageRef.evaluate(()=>({
     studyClass:document.getElementById('study')?.className||'',
     studyHidden:document.getElementById('study')?.hidden===true,
     studyInlineDisplay:document.getElementById('study')?.style.display||'',
     studyMatchedRules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].filter(rule=>rule.type===CSSRule.STYLE_RULE&&rule.selectorText?.split(',').some(selector=>{try{return document.getElementById('study')?.matches(selector.trim())}catch{return false}})).map(rule=>({selector:rule.selectorText,display:rule.style.display}))}catch{return []}}).filter(rule=>rule.display),
     studyTag:document.getElementById('study')?.tagName||'',
     studyDuplicateIds:document.querySelectorAll('#study').length,
     studyParentHidden:[...(()=>{const nodes=[];let p=document.getElementById('study')?.parentElement;while(p&&nodes.length<8){nodes.push({tag:p.tagName,hidden:p.hidden===true,display:getComputedStyle(p).display});p=p.parentElement}return nodes})()].some(x=>x.hidden||x.display==='none'),
     studyDisplay:document.getElementById('study')?getComputedStyle(document.getElementById('study')).display:'MISSING',
     viewClass:document.getElementById('viewStudy')?.className||'',
     hintPresent:Boolean(document.getElementById('cs03StudyHint')),
     hintNonempty:Boolean(document.getElementById('cs03StudyHint')?.textContent),
     recordStatus:document.querySelector('[data-cs03="record-status"]')?.textContent||''
    }));
    console.log('DIAG_STUDY_HIDDEN_ATTR='+(d.studyHidden?'YES':'NO'));
    console.log('DIAG_STUDY_INLINE_NONE='+(d.studyInlineDisplay==='none'?'YES':'NO'));
    console.log('DIAG_STUDY_DUPLICATE_ID='+(d.studyDuplicateIds!==1?'YES':'NO'));
    console.log('DIAG_STUDY_PARENT_HIDDEN='+(d.studyParentHidden?'YES':'NO'));
    console.log('DIAG_STUDY_MATCHED_DISPLAY_RULES='+(d.studyMatchedRules.map(x=>x.selector+':'+x.display).join(',')||'NONE').slice(0,240));
    console.log('DIAG_STUDY_HAS_HIDE='+(d.studyClass.split(/\s+/).includes('hide')?'YES':'NO'));
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