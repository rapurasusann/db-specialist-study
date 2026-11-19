// Local-only browser acceptance for vocabulary learning. No live API, Neon, or Actions.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {termQuestions} from '../src/term-understanding-questions.mjs';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
const legacy={'2025:am2:5':{level:'mastered',correct:true}};
let browser,server,stage='INIT',external=0;
function check(label,condition){console.log(label+'='+(condition?'PASS':'FAIL'));if(!condition)throw Error('ASSERTION_FAILED:'+label)}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 server=http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const rel=relative(root,file);
  if(rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||file===root){res.writeHead(403).end();return}
  try{res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file))}
  catch{res.writeHead(404).end()}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  if(new URL(route.request().url()).origin===origin)return route.continue();
  external++;return route.abort();
 });
 await context.addInitScript(value=>localStorage.setItem('db-study-progress-v1',JSON.stringify(value)),legacy);
 const page=await context.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e?.name||'UNKNOWN'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 stage='INITIALIZE';
 await page.waitForSelector('#viewTerms',{timeout:10000});
 const oldInit=await page.evaluate(()=>typeof document.getElementById('viewStudy')?.onclick==='function');
 check('LEGACY_PAGE_INITIALIZED',oldInit);
 check('TERMS_START_HIDDEN',await page.locator('#termPractice').isHidden());
 await page.click('#viewTerms');
 stage='OPEN';
 check('TERMS_PANEL_VISIBLE',await page.locator('#termPractice').isVisible());
 check('LEGACY_DASHBOARD_HIDDEN',await page.locator('#dashboard').isHidden());
 check('LEGACY_METRICS_HIDDEN',await page.locator('.metrics').isHidden());
 check('CATEGORY_BUTTONS',await page.locator('#termCategories button').count()===5);
 let validated=0;
 for(const group of [...new Set(termQuestions.map(q=>q.category))]){
  stage='GROUP_'+group;
  await page.getByRole('button',{name:group,exact:true}).click();
  const records=termQuestions.filter(q=>q.category===group);
  check('CATEGORY_COUNT_'+group,await page.locator('#termItems button').count()===records.length);
  for(const q of records){
   await page.locator('#termItems button').filter({hasText:q.term}).first().click();
   check('PROMPT_'+q.id,(await page.locator('#termPrompt').innerText()).includes(q.term));
   check('OPTIONS_'+q.id,await page.locator('#termChoices button').count()===4);
   const wrong=(q.answer+1)%4;
   if(q===records[0]){
    await page.locator('#termChoices button').nth(wrong).click();
    check('WRONG_FEEDBACK_'+q.id,(await page.locator('#termFeedback').innerText()).includes('不正解'));
    check('ANSWER_LOCKED_'+q.id,await page.locator('#termChoices button').nth(q.answer).isDisabled());
    await page.click('#termReset');
   }
   await page.locator('#termChoices button').nth(q.answer).click();
   check('RIGHT_FEEDBACK_'+q.id,(await page.locator('#termFeedback').innerText()).includes('正解です'));
   validated++;
  }
 }
 check('ALL_TERMS_CHECKED',validated===termQuestions.length);
 stage='RELOAD';
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('#viewTerms');
 await page.click('#viewTerms');
 const saved=await page.evaluate(()=>({
  legacy:JSON.parse(localStorage.getItem('db-study-progress-v1')||'{}'),
  terms:JSON.parse(localStorage.getItem('db-study-terms-v1')||'{}')
 }));
 check('LEGACY_RECORD_UNCHANGED',JSON.stringify(saved.legacy)===JSON.stringify(legacy));
 check('TERMS_PERSISTED',Object.keys(saved.terms).length===termQuestions.length&&Object.values(saved.terms).every(x=>x.correct===true));
 check('RELOAD_STATUS_VISIBLE',(await page.locator('#termItems button').allInnerTexts()).some(t=>t.includes('✓')));
 stage='NAVIGATE';
 await page.click('#viewStudy');
 check('PAST_QUESTIONS_VISIBLE',await page.locator('#study').isVisible());
 check('TERMS_HIDDEN_AFTER_EXIT',await page.locator('#termPractice').isHidden());
 await page.click('#viewDashboard');
 check('DASHBOARD_VISIBLE',await page.locator('#dashboard').isVisible());
 check('METRICS_RESTORED',await page.locator('.metrics').isVisible());
 check('NO_EXTERNAL_REQUESTS',external===0);
 check('NO_PAGE_SCRIPT_ERRORS',pageErrors.length===0);
 console.log('TERM_UNDERSTANDING_BROWSER=PASS');
}catch(e){
 console.log('TERM_UNDERSTANDING_BROWSER=FAIL');
 console.log('FAIL_STAGE='+stage);
 console.log('FAIL_CLASS='+String(e?.message||'UNKNOWN').split(':')[0]);
 process.exitCode=1;
}finally{
 if(browser)await browser.close();
 if(server)await new Promise(done=>server.close(done));
}
