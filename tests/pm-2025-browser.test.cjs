'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {readFile}=require('node:fs/promises');
const {createServer}=require('node:http');
const {resolve,extname,sep}=require('node:path');
const root=resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
 const p=resolve(root,relative);
 if(!p.startsWith(root+sep))throw Error('outside root');
 const bytes=await readFile(p);
 res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
(async () => {
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const origin='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
 browser=await chromium.launch({headless:true,channel:'msedge'});

 const errors=[];const results=[];
 fs.mkdirSync('artifacts/pm-browser',{recursive:true});
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1,serviceWorkers:'block'});
  await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  page.on('pageerror',e=>errors.push(device+': '+e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#viewStudy').click();
  // Regression: leaving a non-glossary region must never call contains() on null.
  await page.locator('#questionText').dispatchEvent('pointerout',{pointerType:'mouse',relatedTarget:null,bubbles:true});
  assert.deepEqual(errors,[],device+' glossary pointerout on non-term area caused JS error');
  for(const [course,count,figures] of [['午前Ⅱ',1,0],['午後Ⅰ',3,12],['午後Ⅱ',2,23]]){
   await page.locator('#courses button').filter({hasText:course+'（'}).click();
   for(let n=1;n<=count;n++){
    await page.locator('#questions button').filter({hasText:new RegExp('^'+n+'$')}).click();
    const title=await page.locator('#currentTitle').innerText();
    const text=await page.locator('#questionText').innerText();
    const figs=await page.locator('#questionText figure.pm-original-diagram').count();
    assert.ok(text.length>150,device+' '+title+' missing question text');
    assert.ok(!/\\bundefined\\b/.test(text),device+' '+title+' contains undefined text');
    if(course!=='午前Ⅱ')assert.ok(figs>0,device+' '+title+' missing diagrams');
    const images=await page.locator('#questionText figure.pm-original-diagram image').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
    for(const url of images)assert.ok(url&&url.startsWith('pages/'),device+' '+title+' bad image URL');
    if(figs>0){
     const fig=page.locator('#questionText figure.pm-original-diagram:visible').first();
     const zoom=fig.locator('button.pm-diagram-zoom');
     assert.equal(await zoom.count(),1,device+' '+title+' zoom control missing');
     assert.equal(await zoom.getAttribute('aria-expanded'),'false');
     await zoom.click();
     assert.equal(await zoom.getAttribute('aria-expanded'),'true');
     const dimensions=await fig.evaluate(el=>{
       const viewport=el.querySelector('.pm-diagram-viewport');
       return {scrollWidth:viewport.scrollWidth,clientWidth:viewport.clientWidth};
     });
     assert.ok(dimensions.scrollWidth>dimensions.clientWidth,device+' '+title+' figure did not expand to scroll');
     if(device==='mobile'&&n===1)await fig.screenshot({path:'artifacts/pm-browser/'+(course==='午後Ⅰ'?'pm1':'pm2')+'-mobile-zoom.png'});
     await zoom.click();
     assert.equal(await zoom.getAttribute('aria-expanded'),'false');
    }
    if(n===1||n===count)await page.screenshot({path:'artifacts/pm-browser/'+device+'-'+(course==='午前Ⅱ'?'am2':course==='午後Ⅰ'?'pm1':'pm2')+'-'+n+'.png',fullPage:true});
    results.push({device,title,figures:figs});
   }
  }
  await page.close();
 }
 assert.deepEqual(errors,[],'browser JavaScript errors');
 fs.writeFileSync('artifacts/pm-browser/results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({passed:results.length,errors,results},null,2));
 }finally{
  try{if(browser)await browser.close()}finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
