import { chromium } from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';
 const p=resolve(root,relative);
 if(!p.startsWith(resolve(root)+sep))throw Error('outside root');
 const bytes=await readFile(p);res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const results=[],errors=[],coverage=[];
let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [1440,768,390]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
  const page=await context.newPage();
  let current='startup';
  page.on('pageerror',e=>errors.push({width,current,error:e.message}));
  await page.goto(origin+'/');
  await page.locator('#viewQuiz25').waitFor();
  await page.waitForFunction(()=>!document.getElementById('viewQuiz25').disabled&&Array.from(document.getElementById('year').options).filter(o=>!o.disabled).length>=10);
  async function inspect(mode,id,selector){
   current=mode+':'+id;
   const metrics=await page.locator(selector).evaluate(el=>{
    const svgs=[...el.querySelectorAll('svg')];
    const figures=[...el.querySelectorAll('figure')];
    const issues=[];
    for(const svg of svgs){
     if(svg.hasAttribute('data-unresolved-association-label'))issues.push('Unresolved association label placement');
     const box=svg.getBoundingClientRect();
     if(!box.width||!box.height){issues.push('zero-size SVG');continue}
     const labels=[...svg.querySelectorAll('text')].map(t=>{const b=t.getBoundingClientRect();return {text:t.textContent,x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height}});
     for(const l of labels)if(l.w&&l.h&&(l.x<box.left-2||l.r>box.right+2||l.y<box.top-2||l.b>box.bottom+2))issues.push('SVG label outside bounds: '+l.text);
     for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
      const a=labels[i],b=labels[j];if(Math.min(a.r,b.r)-Math.max(a.x,b.x)>2&&Math.min(a.b,b.b)-Math.max(a.y,b.y)>2)issues.push('SVG text overlap: '+a.text+' / '+b.text);
     }
    }
    // Distinct answer choices may intentionally have identical text and nodes.
    // Compare structure within the same semantic region, not across choices.
    const keys=figures.map(f=>{
     const choice=f.closest('.optionText');
     const slot=choice?'choice:'+Array.from(el.querySelectorAll('.optionText')).indexOf(choice):'stem';
     const geometry=[...f.querySelectorAll('svg line,svg path,svg rect,svg circle,svg polygon,svg text')].filter(n=>!n.closest('defs')).map(n=>[n.tagName,[...n.attributes].filter(a=>!['marker-start','marker-end','id'].includes(a.name)).map(a=>[a.name,a.value]).sort(),n.textContent]);
     return slot+'|'+f.textContent.trim()+'|'+JSON.stringify(geometry);
    });
    for(const k of new Set(keys))if(keys.filter(x=>x===k).length>1)issues.push('possible duplicate figure: '+k.slice(0,100));
    return {figures:figures.length,svgs:svgs.length,issues};
   });
   results.push({width,mode,id,...metrics});
  }
  await page.locator('#viewStudy').click();
  for(let y=2016;y<=2025;y++){
   await page.locator('#year').selectOption(String(y));
   await page.locator('#courses .course').filter({hasText:'午前Ⅱ'}).click();
   for(let n=1;n<=25;n++){
    await page.locator('#questions .qbtn').filter({hasText:new RegExp('^'+n+'$')}).click();
    await inspect('normal',y+':'+n,'#questionText');
   }
  }
  const visited=new Set();
  for(let batch=0;batch<10;batch++){
   await page.locator('#viewQuiz25').click();
   const buttons=page.locator('#quiz25Jump button');
   if(await buttons.count()!==25)throw Error('unexpected batch size');
   for(let n=0;n<25;n++){
    const id=await buttons.nth(n).getAttribute('title');
    await buttons.nth(n).click();
    await inspect('challenge',id,'#quiz25Screen .questionText');
    visited.add(id);
   }
   await page.locator('#quiz25Exit').click();
  }
  coverage.push({width,normal:results.filter(r=>r.width===width&&r.mode==='normal').length,challengeUnique:visited.size});
  await context.close();
 }
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));await writeFile(resolve(root,'am2-browser-audit.json'),JSON.stringify({coverage,errors,results},null,2));}
const flagged=results.filter(r=>r.issues.length);
console.log(JSON.stringify({coverage,pageErrors:errors.length,flagged:flagged.length},null,2));
if(errors.length||flagged.length||coverage.some(c=>c.normal!==250||c.challengeUnique!==250))process.exitCode=1;
