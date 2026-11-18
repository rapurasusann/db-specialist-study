// Isolated mobile/desktop browser regression checks. No account or live DB requests.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.css':'text/css','.json':'application/json'};
let server,browser,external=0;
let count=0;
function check(label,good){console.log('MOBILE_'+label+'='+(good?'PASS':'FAIL'));if(!good)throw Error('ASSERTION_FAILED:'+label);count++;}
try {
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
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===origin)return route.continue();
    external++;return route.abort();
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#viewStudy').click();
  check('BAR_VISIBLE',await page.locator('#mobileStudyControls').isVisible());
  check('BAR_FIXED',await page.locator('#mobileStudyControls').evaluate(e=>getComputedStyle(e).position==='fixed'));
  await page.evaluate(()=>{courseId='am2';number=3;showAnswer=false;renderStudy();});
  check('Q3_STEM_CLEAN',!(await page.locator('#questionText').textContent()).includes('図の読み替え'));
  check('Q3_SVG_VISIBLE',await page.locator('[data-study-diagram="am2-q3"] svg').isVisible());
  check('Q3_NO_CROPPED_IMAGE',await page.locator('#questionText svg image').count()===0);
  check('ORIGINAL_PDF_VIEWER_RETAINED',await page.locator('#pageImage').count()===1);
  check('Q3_MOBILE_QUESTION', (await page.locator('#mobileStudyQuestion').textContent()).includes('問3'));
  await page.locator('[data-mobile-choice="ア"]').click();
  check('CHOICE_SYNCHRONIZED',await page.locator('#choices input[value="ア"]').isChecked());
  await page.locator('#mobileStudyGrade').click();
  check('GRADE_RECORDED',await page.evaluate(()=>!!progress['2025:am2:3'] && progress['2025:am2:3'].attempts===1));
  await page.locator('#mobileStudyNext').click();
  check('NEXT_Q4',(await page.locator('#currentTitle').textContent()).includes('問4'));
  check('NEXT_SELECTION_RESET',!(await page.locator('[data-mobile-choice="ア"]').getAttribute('aria-pressed')==='true'));
  check('NEXT_SCROLL_TOP',await page.evaluate(()=>{const title=document.getElementById('currentTitle').getBoundingClientRect();return title.top>-50&&title.top<window.innerHeight/2;}));
  await page.locator('#mobileStudyPrev').click();
  check('PREVIOUS_Q3',(await page.locator('#currentTitle').textContent()).includes('問3'));
  await page.locator('#mobileStudySolution').click();
  check('SOLUTION_REVEALED',await page.locator('#solution').isVisible());
  check('DATA_PERSISTED',await page.evaluate(()=>JSON.parse(localStorage.getItem('db-study-progress-v1'))['2025:am2:3'].attempts===1));
  await page.locator('#viewDashboard').click();
  check('DASHBOARD_BAR_HIDDEN',!(await page.locator('#mobileStudyControls').isVisible()));
  await page.setViewportSize({width:1280,height:800});
  await page.locator('#viewStudy').click();
  check('DESKTOP_BAR_HIDDEN',!(await page.locator('#mobileStudyControls').isVisible()));
  check('DESKTOP_TWO_COLUMN',await page.locator('.exam').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length===2));
  check('NO_EXTERNAL_REQUESTS',external===0);
  check('NO_PAGE_ERRORS',errors.length===0);
  console.log('MOBILE_STUDY_BROWSER_CHECKS='+count);
  console.log('MOBILE_STUDY_BROWSER=PASS');
}catch(e){
  console.log('MOBILE_STUDY_BROWSER=FAIL');
  console.log('FAIL_CLASS='+(e?.message||'BROWSER_OR_ENVIRONMENT_ERROR').slice(0,170));
  process.exitCode=1;
}finally{
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(done=>server.close(done));
}
