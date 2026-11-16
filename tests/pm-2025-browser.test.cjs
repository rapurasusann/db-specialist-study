'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];const results=[];
 fs.mkdirSync('artifacts/pm-browser',{recursive:true});
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(device+': '+e.message));
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.locator('#viewStudy').click();
  for(const [course,count,figures] of [['午前Ⅱ',1,0],['午後Ⅰ',3,12],['午後Ⅱ',2,23]]){
   await page.locator('#courses button').filter({hasText:course+'（'}).click();
   for(let n=1;n<=count;n++){
    await page.locator('#questions button').filter({hasText:new RegExp('^'+n+'$')}).click();
    const title=await page.locator('#currentTitle').innerText();
    const text=await page.locator('#questionText').innerText();
    const figs=await page.locator('#questionText figure.pm-original-diagram').count();
    assert.ok(text.length>150,device+' '+title+' missing question text');
    if(course!=='午前Ⅱ')assert.ok(figs>0,device+' '+title+' missing diagrams');
    const images=await page.locator('#questionText figure.pm-original-diagram image').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
    for(const url of images)assert.ok(url&&url.startsWith('pages/'),device+' '+title+' bad image URL');
    if(n===1||n===count)await page.screenshot({path:'artifacts/pm-browser/'+device+'-'+(course==='午前Ⅱ'?'am2':course==='午後Ⅰ'?'pm1':'pm2')+'-'+n+'.png',fullPage:true});
    results.push({device,title,figures:figs});
   }
  }
  await page.close();
 }
 await browser.close();
 assert.deepEqual(errors,[],'browser JavaScript errors');
 fs.writeFileSync('artifacts/pm-browser/results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({passed:results.length,errors,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
