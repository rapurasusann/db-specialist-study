import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.ARCHIVE_TEST_URL||'http://127.0.0.1:8766/';
const url=new URL(base);
assert.ok(['127.0.0.1','localhost','[::1]'].includes(url.hostname),'local server only');
const browser=await chromium.launch({headless:true});
try {
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 try {
 await context.route('**/*',r=>new URL(r.request().url()).origin===url.origin?r.continue():r.abort());
 const page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'load'});
 await page.locator('#viewStudy').click();
 let count=0;
 for(let y=2016;y<=2024;y++){
  const d=JSON.parse(readFileSync(new URL('../data/am2-'+y+'-reviewed-partial.json',import.meta.url),'utf8'));
  await page.locator('#year').selectOption(String(y));
  await page.locator('#courses button').filter({hasText:'午前Ⅱ'}).click();
  await page.locator('#filter').selectOption('all');
  for(let n=1;n<=25;n++){
   const q=d.questions['am2:'+n],tag=y+':'+n;
   await page.locator('#questions button').filter({hasText:new RegExp('^'+n+'$')}).click();
   assert.ok((await page.locator('#questionText h3').innerText()).includes(q.stem),tag+' stem');
   assert.equal(await page.locator('#questionText .optionText').count(),4,tag+' choices');
   assert.equal(await page.locator('#questionText svg').count(),[...(q.figures||[]),...Object.values(q.optionFigures||{}).flat()].filter(f=>['uml','graph'].includes(f.type)).length,tag+' SVG');
   assert.equal(await page.locator('#localViewer').isVisible(),false,tag+' original viewer');
   await page.locator('#choices input[value="'+q.answer+'"]').check();
   await page.locator('#grade').evaluate(e=>e.click());
   assert.match(await page.locator('#gradeResult').textContent(),/^正解。/,tag+' grading');
   await page.locator('#reveal').evaluate(e=>e.click());
   assert.ok((await page.locator('#answerHint').textContent()).includes(q.explanation),tag+' explanation');
   count++;
  }
 }
 await page.locator('#year').selectOption('2025');
 await page.locator('#courses button').filter({hasText:'午前Ⅱ'}).click();
 assert.equal(await page.locator('#localViewer').evaluate(e=>e.classList.contains('archive-hide-original')),false);
 await page.locator('#courses button').filter({hasText:'午後Ⅰ'}).click();
 assert.match(await page.locator('#currentTitle').textContent(),/2025.*午後Ⅰ/);
 assert.equal(await page.locator('#localViewer').evaluate(e=>e.classList.contains('archive-hide-original')),false);
 assert.deepEqual(errors,[]);
 console.log('ARCHIVE_BROWSER_PASS',viewport.width,count);
 }finally{await context.close();}
}
}finally{await browser.close();}
