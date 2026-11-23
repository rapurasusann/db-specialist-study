// Real Chromium study UI E2E, entirely local mock transport; no Neon or external HTTP.
// Two isolated browser profiles share a fake account store via Playwright bindings.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const KEY='db-study-progress-v1',Q='2025:am2:1',userId='mock-account-1';
const store=new Map(),errors=[],external=[];
let rejectAccountSaves=false;
let server,browser;
function check(label,condition){console.log(label+'='+(condition?'PASS':'FAIL'));if(!condition)throw Error('ASSERT_FAILED:'+label);}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let url;
  try{url=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+(url==='/'?'/index.html':url)),rel=relative(root,file);
  if(file===root||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}
  catch{res.writeHead(404);res.end();}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 async function profile(localRecord){
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin===base)return route.continue();
   external.push('EXTERNAL_BLOCKED');return route.abort();
  });
  await context.addInitScript(({key,record})=>localStorage.setItem(key,JSON.stringify(record)),{key:KEY,record:localRecord});
  await context.exposeBinding('cs03FakeAccount',async(_source,action,id,data)=>{
   if(action==='list')return {userId,records:Object.fromEntries([...store].map(([key,row])=>[key,{data:structuredClone(row)}]))};
   if(action==='open')return structuredClone(store.get(id)??null);
   if(action==='save'){if(rejectAccountSaves)throw Error('TEST_NETWORK_WRITE_FAILURE');store.set(id,structuredClone(data));return structuredClone(data);}
   throw Error('FAKE_ACTION_NOT_ALLOWED');
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.name||'Error'));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.CS03_STUDY_PAGE?.activate && document.querySelector('#viewStudy')?.onclick);
  await page.evaluate(async()=>{
   const {createCs03StudyAutoSync}=await import('/src/cs03-study-auto-sync.mjs');
   const session={
    start:()=>window.cs03FakeAccount('list',null,null),
    open:id=>window.cs03FakeAccount('open',id,null),
    save:(id,data)=>window.cs03FakeAccount('save',id,data),
    stop:()=>{},
    status:()=>({active:true})
   };
   const auto=createCs03StudyAutoSync({session});
   const listing=await auto.login();
   window.__cs03MockAuto=auto;
   window.CS03_STUDY_PAGE.activate(listing,auto);
  });
  await page.locator('#viewStudy').click();
  await page.waitForFunction(()=>document.querySelector('#cs03StudyHint')?.textContent.includes('この問題の変更はアカウントに保存されます'));
  return {page,context};
 }
 const initialA={[Q]:{level:'review'}};
 const a=await profile(initialA);
 check('BROWSER_A_ACCOUNT_MODE',await a.page.evaluate(()=>window.CS03_STUDY_PAGE.inAccountMode()));
 check('BROWSER_A_NO_LEGACY_IMPORT',store.size===0);
 await a.page.locator('[data-level="mastered"]').click();
 await a.page.waitForFunction(()=>document.querySelector('#cs03StudyHint')?.textContent.includes('保存しました'));
 check('STUDY_CLICK_REMOTE_SAVE',store.get(Q)?.level==='mastered');
 check('LEGACY_DEVICE_A_PRESERVED',await a.page.evaluate(([key,original])=>localStorage.getItem(key)===JSON.stringify(original),[KEY,initialA]));
 const initialB={'2025:am2:2':{level:'review'}};
 const b=await profile(initialB);
 check('BROWSER_B_RESTORES_REMOTE',await b.page.evaluate(()=>document.querySelector('#history')?.textContent.includes('習得済み')));
 check('LEGACY_DEVICE_B_PRESERVED',await b.page.evaluate(([key,original])=>localStorage.getItem(key)===JSON.stringify(original),[KEY,initialB]));
 await b.page.evaluate(()=>{window.CS03_STUDY_PAGE.deactivate();window.__cs03MockAuto.logout();});
 check('BROWSER_B_SIGNOUT_RESTORES_DEVICE',await b.page.evaluate(()=>window.CS03_STUDY_PAGE.inAccountMode()===false&&document.querySelector('#history')?.textContent.includes('未学習')));
 // Browser C: failed cloud writes must retain the account draft and block logout,
 // without altering the remote record or device-only history.
 const initialC={'2025:am2:3':{level:'review'}};
 const c=await profile(initialC);
 rejectAccountSaves=true;
 await c.page.locator('[data-level="review"]').click();
 await c.page.waitForFunction(()=>document.querySelector('#cs03StudyHint')?.textContent.includes('保存に失敗しました'));
 check('FAILED_SAVE_REMOTE_UNCHANGED',store.get(Q)?.level==='mastered');
 check('FAILED_SAVE_ACCOUNT_DRAFT_RETAINED',await c.page.evaluate(()=>document.querySelector('#history')?.textContent.includes('要復習')));
 check('FAILED_SAVE_BLOCKS_LOGOUT',await c.page.evaluate(()=>{try{window.CS03_STUDY_PAGE.deactivate();return false;}catch(e){return e.message==='UNSAVED_ACCOUNT_PROGRESS';}}));
 check('FAILED_SAVE_LEGACY_DEVICE_PRESERVED',await c.page.evaluate(([key,original])=>localStorage.getItem(key)===JSON.stringify(original),[KEY,initialC]));
 check('NO_EXTERNAL_REQUESTS',external.length===0);
 check('NO_PAGE_ERRORS',errors.length===0);
 console.log('CS03_REAL_BROWSER_STUDY_SYNC=PASS');
 await a.context.close();await b.context.close();await c.context.close();
}catch(e){
 console.log('CS03_REAL_BROWSER_STUDY_SYNC=FAIL');
 console.log('FAIL_CLASS='+(
  e.message==='PLAYWRIGHT_MISSING'?'PLAYWRIGHT_MISSING':
  e.message?.startsWith('ASSERT_FAILED:')?e.message:'BROWSER_OR_ENVIRONMENT_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
