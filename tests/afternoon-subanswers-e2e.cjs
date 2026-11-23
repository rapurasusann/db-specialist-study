'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');

const targets = [
  {course:'午後Ⅰ', n:1, count:2, picker:'.pm1-study-choices', answer:'.pm1-subanswer-input'},
  {course:'午後Ⅰ', n:2, count:3, picker:'.pm2-study-choices', answer:'.pm2-subanswer-input'},
  {course:'午後Ⅰ', n:3, count:3, picker:'.afg-choices', answer:'.afg-answer'},
  {course:'午後Ⅱ', n:1, count:3, picker:'.afg-choices', answer:'.afg-answer'},
  {course:'午後Ⅱ', n:2, count:2, picker:'.afg-choices', answer:'.afg-answer'}
];

async function navigate(page, t) {
  await page.locator('#viewStudy').click();
  await page.locator('#courses button').filter({hasText:t.course+'（'}).click();
  await page.locator('#questions button').filter({hasText:new RegExp('^'+t.n+'$')}).click();
  await page.locator(t.picker+' button').first().waitFor();
  assert.equal(await page.locator(t.picker+' button').count(),t.count,`${t.course} Q${t.n}: question count`);
}
async function choose(page,t,i){await page.locator(t.picker+' button').nth(i-1).click();}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1366,height:850}}); // isolated from normal user browser data
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const records=[];
  try {
    for(const t of targets){
      await page.goto('http://127.0.0.1:8767/',{waitUntil:'domcontentloaded'});
      await navigate(page,t);
      const tokens=[];
      for(let i=1;i<=t.count;i++){
        await choose(page,t,i);
        const token=`E2E-${t.course}-${t.n}-${i}-20261123`;
        tokens.push(token);
        await page.locator(t.answer).fill(token);
        assert.equal(await page.locator(t.answer).inputValue(),token);
      }
      for(let i=t.count;i>=1;i--){
        await choose(page,t,i);
        assert.equal(await page.locator(t.answer).inputValue(),tokens[i-1],`${t.course} Q${t.n} part${i}: switch persistence`);
      }
      await page.reload({waitUntil:'domcontentloaded'});
      await navigate(page,t);
      for(let i=1;i<=t.count;i++){
        await choose(page,t,i);
        assert.equal(await page.locator(t.answer).inputValue(),tokens[i-1],`${t.course} Q${t.n} part${i}: reload persistence`);
      }
      records.push({question:`${t.course} 問${t.n}`,parts:t.count,switch:'PASS',reload:'PASS'});
    }
    // Finally re-open each question to ensure another question hasn't overwritten its answers.
    for(const t of targets){
      await page.goto('http://127.0.0.1:8767/',{waitUntil:'domcontentloaded'});
      await navigate(page,t);
      for(let i=1;i<=t.count;i++){
        await choose(page,t,i);
        assert.equal(await page.locator(t.answer).inputValue(),`E2E-${t.course}-${t.n}-${i}-20261123`,`${t.course} Q${t.n} part${i}: cross-question isolation`);
      }
    }
    assert.deepEqual(errors,[],'browser page errors');
    console.log(JSON.stringify({passed:targets.length,partsChecked:targets.reduce((n,t)=>n+t.count,0),switch:'PASS',reload:'PASS',crossQuestionIsolation:'PASS',isolatedBrowserContext:true,errors,records},null,2));
  } finally {await context.close();await browser.close();}
})().catch(e=>{console.error('AFTERNOON_SUBANSWERS_E2E_FAIL',e);process.exitCode=1;});
