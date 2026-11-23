'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const BASE='http://127.0.0.1:8767/';
const targets=[
 {course:'午後Ⅰ',number:1,count:3,picker:'.pm1-study-figure-select',status:'.pm1-study-page-status',next:'次の本文ページ',expected:'pm1'},
 {course:'午後Ⅰ',number:2,count:4,picker:'.pm2-study-figure-select',status:'.pm2-study-page-status',next:'次の本文ページ',expected:'pm1'},
 {course:'午後Ⅰ',number:3,count:5,picker:'.afg-figure-select',status:'.afg-status',next:'次の本文区分',expected:'pm1'},
 {course:'午後Ⅱ',number:1,count:14,picker:'.afg-figure-select',status:'.afg-status',next:'次の本文区分',expected:'pm2'},
 {course:'午後Ⅱ',number:2,count:9,picker:'.afg-figure-select',status:'.afg-status',next:'次の本文区分',expected:'pm2'}
];
const targetTotal=targets.reduce((n,t)=>n+t.count,0);
async function navigate(page,t){
 await page.locator('#viewStudy').click();
 await page.locator('#courses button').filter({hasText:t.course+'（'}).click();
 await page.locator('#questions button').filter({hasText:new RegExp('^'+t.number+'$')}).click();
 await page.locator(t.picker).waitFor();
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 const results=[], errors=[], unique=new Set();
 try{
  for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
   const context=await browser.newContext({viewport}); const page=await context.newPage();
   page.on('pageerror',e=>errors.push(device+':'+e.message));
   for(const t of targets){
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await navigate(page,t);
    const figs=page.locator('#questionText figure.pm-original-diagram');
    assert.equal(await figs.count(),t.count,`${device} ${t.course} ${t.number}: figure count`);
    assert.equal(await page.locator(t.picker+' option').count(),t.count,'picker count');
    const paths=await figs.locator('svg image').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
    assert.equal(paths.length,t.count,'image element count');
    for(const src of paths){
      assert.match(src,new RegExp('^pages/'+t.expected+'_qs_\\d{2}\\.webp$'),'unexpected asset path: '+src);
      unique.add(src);
      const res=await context.request.get(BASE+src,{timeout:10000});
      assert.equal(res.status(),200,`image HTTP status: ${src}`);
      const buf=await res.body();
      assert.ok(buf.length>1500,`image suspiciously short: ${src} bytes=${buf.length}`);
      assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF',`not RIFF/WebP: ${src}`);
      assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP',`not WebP: ${src}`);
    }
    for(let i=0;i<t.count;i++){
      await page.locator(t.picker).selectOption(String(i));
      assert.equal(await figs.nth(i).isVisible(),true,`${device} ${t.course} ${t.number}: figure ${i} not visible`);
      assert.equal(await figs.locator('.pm-diagram-viewport:visible').count(),1,`visible original figure viewport count`);
    }
    const before=await page.locator(t.status).innerText();
    await page.getByRole('button',{name:t.next}).click();
    const after=await page.locator(t.status).innerText();
    assert.notEqual(after,before,`body navigation failed for ${t.course} ${t.number}`);
    results.push({device,question:`${t.course} 問${t.number}`,images:paths.length,manualSwitch:'PASS',bodyNavigation:'PASS'});
   }
   await context.close();
  }
  assert.deepEqual(errors,[],'JavaScript page errors');
  assert.ok(unique.size>=20&&unique.size<=targetTotal,`unexpected unique asset count: ${unique.size}`);
  console.log(JSON.stringify({status:'PASS',devices:2,questions:5,figureChecks:targetTotal*2,uniqueWebpAssets:unique.size,results,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error('AFTERNOON_ORIGINAL_ASSETS_E2E_FAIL',e);process.exitCode=1;});
