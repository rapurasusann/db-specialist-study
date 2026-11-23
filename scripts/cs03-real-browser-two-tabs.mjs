// Real Chromium same-origin two-tab lock check; loopback-only, no external requests.
// Requires existing PLAYWRIGHT_MODULE_PATH and installed Chromium. Does not enable
// the account preview, connect to Neon, change git configuration or deploy.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const USER='a1111111-1111-4111-8111-111111111111';
let server,browser;
const errors=[],external=[];
function check(label,success){
 console.log(label+'='+(success?'PASS':'FAIL'));
 if(!success)throw Error('ASSERT_FAILED:'+label);
}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}
  catch{res.writeHead(400);res.end();return;}
  if(pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end('<!doctype html><meta charset="utf-8"><title>CS03 local tab lock test</title>');return;}
  const filename=resolve(root,'.'+pathname),rel=relative(root,filename);
  if(filename===root||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')){
   res.writeHead(403);res.end();return;
  }
  if(!['.mjs','.js'].includes(extname(filename))){res.writeHead(404);res.end();return;}
  try{res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});res.end(await readFile(filename));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===base)return route.continue();
  external.push('BLOCKED_EXTERNAL');return route.abort();
 });
 const [a,b]=await Promise.all([context.newPage(),context.newPage()]);
 for(const page of [a,b]){
  page.on('pageerror',()=>errors.push('PAGE_ERROR'));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.evaluate(async userId=>{
   const [{createCs03TabOwnership},{createCs03StudyAutoSync},{createCs03DraftStore}]=await Promise.all([
    import('/src/cs03-tab-ownership.mjs'),import('/src/cs03-study-auto-sync.mjs'),import('/src/cs03-draft-store.mjs')
   ]);
   const session={start:async()=>({userId,records:{}}),open:async()=>null,
    save:async()=>{throw Error('SIMULATED_NETWORK_FAILURE')},stop:()=>{},status:()=>({active:true})};
   const auto=createCs03StudyAutoSync({session,
    tabOwnership:createCs03TabOwnership({locks:navigator.locks}),
    draftStore:createCs03DraftStore({storage:localStorage})});
   Object.defineProperty(window,'cs03LocalOnlyAuto',{value:auto,configurable:false});
  },USER);
 }
 check('REAL_WEB_LOCKS_AVAILABLE',await a.evaluate(()=>typeof navigator.locks?.request==='function'));
 await a.evaluate(()=>window.cs03LocalOnlyAuto.login());
 check('TAB_A_LOGGED_IN',await a.evaluate(()=>window.cs03LocalOnlyAuto.state().active));
 const blocked=await b.evaluate(async()=>{
  try{await window.cs03LocalOnlyAuto.login();return false;}
  catch(e){return e.message==='CS03_ACCOUNT_OPEN_IN_ANOTHER_TAB';}
 });
 check('TAB_B_SAME_ACCOUNT_REJECTED',blocked);
 await a.evaluate(async()=>{
  const auto=window.cs03LocalOnlyAuto;
  await auto.open('2025:am2:4');
  try{await auto.edit('2025:am2:4',{level:'mastered'});}catch(e){
   if(e.message!=='SIMULATED_NETWORK_FAILURE')throw e;
  }
 });
 const bCannotClear=await b.evaluate(()=>({
  saved:JSON.parse(localStorage.getItem('db-study-cs03-unsaved-v1-'+
   'a1111111-1111-4111-8111-111111111111'))?.records?.['2025:am2:4']?.level,
  active:window.cs03LocalOnlyAuto.state().active
 }));
 check('TAB_B_CANNOT_CLEAR_A_DRAFT',bCannotClear.saved==='mastered'&&!bCannotClear.active);
 await a.close();
 await b.evaluate(()=>window.cs03LocalOnlyAuto.login());
 check('TAB_B_REACQUIRES_AFTER_A_CLOSE',await b.evaluate(()=>{
  const state=window.cs03LocalOnlyAuto.state();
  return state.active&&state.blocked.includes('2025:am2:4');
 }));
 check('RECOVERED_DRAFT_IS_REVIEW_ONLY',await b.evaluate(()=>window.cs03LocalOnlyAuto.exportPending().records['2025:am2:4'].level==='mastered'));
 check('NO_EXTERNAL_REQUESTS',external.length===0);
 check('NO_PAGE_ERRORS',errors.length===0);
 await context.close();
 console.log('CS03_REAL_BROWSER_TWO_TABS=PASS');
}catch(error){
 console.log('CS03_REAL_BROWSER_TWO_TABS=FAIL');
 const code=error?.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':
  error?.message?.startsWith('ASSERT_FAILED:')?error.message:
  'BROWSER_OR_ENVIRONMENT_ERROR';
 console.log('FAIL_CLASS='+code);
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
}
