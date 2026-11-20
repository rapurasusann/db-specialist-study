// Real-browser smoke test for isolated PM1 Q1 preview.
// Uses an installed Chrome/Edge via CDP. No npm packages, GitHub Actions or public deploy.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,access,mkdtemp,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const project=resolve(fileURLToPath(new URL('../',import.meta.url)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const path=resolve(project,'.'+decodeURIComponent(url.pathname));
  if(!path.startsWith(project+sep)||!Object.hasOwn(mime,path.slice(path.lastIndexOf('.')))){res.writeHead(404);res.end();return}
  const data=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[path.slice(path.lastIndexOf('.'))],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(data);
 }catch{res.writeHead(404);res.end()}
});
let child,profile,cdp;
const tests=[];
function check(name,fn){tests.push({name,fn})}
function browserCandidates(){
 const pf=process.env['PROGRAMFILES']||'C:\\Program Files';
 const pf86=process.env['PROGRAMFILES(X86)']||'C:\\Program Files (x86)';
 const local=process.env.LOCALAPPDATA||'';
 return [process.env.PM_BROWSER_PATH,
  join(pf,'Google','Chrome','Application','chrome.exe'),
  join(pf86,'Microsoft','Edge','Application','msedge.exe'),
  join(pf,'Microsoft','Edge','Application','msedge.exe'),
  join(local,'Google','Chrome','Application','chrome.exe')].filter(Boolean);
}
async function browserPath(){for(const p of browserCandidates()){try{await access(p);return p}catch{}}throw Error('CHROME_OR_EDGE_NOT_FOUND: set PM_BROWSER_PATH')}
class CDP{
 constructor(ws){this.ws=ws;this.sequence=0;this.pending=new Map();ws.addEventListener('message',ev=>{const v=JSON.parse(ev.data);if(!v.id)return;const p=this.pending.get(v.id);if(!p)return;this.pending.delete(v.id);if(v.error)p.reject(Error(v.error.message));else p.resolve(v.result)})}
 async send(method,params={}){const id=++this.sequence;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const result=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text+' '+result.result?.description);return result.result.value}
}
async function until(fn,timeoutMs=12000){const start=Date.now();let last;while(Date.now()-start<timeoutMs){try{const v=await fn();if(v)return v}catch(e){last=e}await sleep(120)}throw Error('TIMEOUT'+(last?': '+last.message:''))}
async function openCdp(profile){
 const path=join(profile,'DevToolsActivePort');
 const contents=await until(async()=>{const s=await readFile(path,'utf8');return s.trim().split(/\r?\n/)});
 const port=Number(contents[0]);assert.ok(port>0);
 const pages=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');const v=await r.json();return v.find(p=>p.type==='page'&&p.webSocketDebuggerUrl)});
 const ws=new WebSocket(pages.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 return new CDP(ws);
}
try{
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port;
 profile=await mkdtemp(join(tmpdir(),'db-pm1-browser-'));
 const executable=await browserPath();
 child=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--no-sandbox','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 child.once('error',e=>{console.error('BROWSER_START_FAILED',e.message)});
 cdp=await openCdp(profile);
 const url='http://127.0.0.1:'+port+'/pm-preview.html';
 await cdp.send('Page.enable');await cdp.send('Runtime.enable');
 await cdp.send('Page.navigate',{url});
 await until(()=>cdp.eval("document.querySelector('.pmStructured') !== null"));
 check('all five ordered screen sections',async()=>{
  const names=await cdp.eval("Array.from(document.querySelectorAll('.pmStructured > section > h3'),e=>e.textContent)");
  assert.deepEqual(names,['大問表示部','図・表表示部','設問選択部','選択された設問の問題文','回答欄']);
 });
 check('page navigation from 6 to 10 and bounded',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmIntro button')];for(let i=0;i<10;i++)buttons[1].click();
   const last=document.querySelector('.pmIntroText').textContent;
   const lastDisabled=buttons[1].disabled;
   for(let i=0;i<10;i++)buttons[0].click();
   return {last,lastDisabled,first:document.querySelector('.pmIntroText').textContent,firstDisabled:buttons[0].disabled}
  })()`);
  assert.match(v.last,/原本 10 ページ/);assert.match(v.last,/⑥ スーパータイプ/);assert.match(v.last,/0を含むかどうかを図に示す必要はない/);assert.match(v.last,/\(4\) レポート課題/);assert.equal(v.lastDisabled,true);
  assert.match(v.first,/原本 6 ページ/);assert.match(v.first,/【1\. 学部、学科、学期】/);assert.match(v.first,/\(4\) 一つの学科/);assert.equal(v.firstDisabled,true);
 });
 check('official page 7 one-or-more constraints are visible',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmIntro button')];
   for(let i=0;i<10;i++)buttons[0].click();
   buttons[1].click();
   return document.querySelector('.pmIntroText').textContent;
  })()`);
  assert.match(v,/原本 7 ページ/);
  assert.match(v,/一つ又は複数の教材/);
  assert.match(v,/一つ又は複数のテスト/);
  assert.match(v,/講義ごと・教材ごと/);
 });
 check('page-11 question scopes retain one-or-more attribute instructions',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmQuestionNav button')];
   const prompt=()=>document.querySelector('.pmQuestionText > p')?.textContent;
   buttons[2].click();const fig2=prompt();
   buttons[3].click();const fig3=prompt();
   return {fig2,fig3};
  })()`);
  assert.match(v.fig2,/一つまたは複数/);
  assert.match(v.fig3,/一つまたは複数/);
  for(const prompt of [v.fig2,v.fig3]){
   assert.match(prompt,/主キー/);assert.match(prompt,/外部キー/);
   assert.match(prompt,/実線/);assert.match(prompt,/破線/);
  }
 });
 check('auto and manual figure selection',async()=>{
  const v=await cdp.eval(`(()=>{
    const buttons=[...document.querySelectorAll('.pmQuestionNav button')];
    const selector=document.querySelector('.pmMaterials select');
    const material=()=>document.querySelector('.pmMaterialBody').textContent;
    buttons[2].click();const automatic=material();
    selector.value='fig1';selector.dispatchEvent(new Event('change',{bubbles:true}));const manual=material();
    buttons[3].click();return {automatic,manual,after:material(),reset:selector.value}
  })()`);
  assert.match(v.automatic,/図2/);assert.match(v.manual,/図1/);assert.match(v.after,/図3/);assert.equal(v.reset,'auto');
  const heading=await cdp.eval("document.querySelector('.pmQuestionText h4').textContent");
  assert.match(heading,/設問2：拡充後の関係スキーマ/);
 });
 check('question shortcuts change only related introduction page and keep the selected diagram',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmQuestionNav button')];
   const section=document.querySelector('.pmQuestionText');
   const go=(page)=>[...section.querySelectorAll('.pmRelatedPages button')].find(b=>b.textContent===page+'ページの大問を見る')?.click();
   const source=section.querySelector('a[href*="#page="]');
   buttons[2].click();
   const firstLinks=[...section.querySelectorAll('.pmRelatedPages button')].map(b=>b.textContent);
   go(9);
   const page9=document.querySelector('.pmIntroText').textContent.includes('原本 9 ページ');
   const fig2=document.querySelectorAll('.pmFig2ReviewTable').length;
   const sourceHref=source?.getAttribute('href');
   buttons[3].click();
   const secondLinks=[...section.querySelectorAll('.pmRelatedPages button')].map(b=>b.textContent);
   go(10);
   const page10=document.querySelector('.pmIntroText').textContent.includes('原本 10 ページ');
   const fig3=document.querySelectorAll('.pmFig3ReviewTable').length;
   return {firstLinks,page9,fig2,sourceHref,secondLinks,page10,fig3};
  })()`);
  assert.deepEqual(v.firstLinks,['8ページの大問を見る','9ページの大問を見る']);
  assert.equal(v.page9,true);assert.equal(v.fig2,1);
  assert.match(v.sourceHref,/#page=11$/);
  assert.deepEqual(v.secondLinks,['9ページの大問を見る','10ページの大問を見る']);
  assert.equal(v.page10,true);assert.equal(v.fig3,1);
 });
 check('independent answers and reload persistence',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmQuestionNav button')],ta=document.querySelector('.pmQuestionAnswer textarea');
   buttons[0].click();ta.value='TEST-111';ta.dispatchEvent(new Event('input',{bubbles:true}));
   buttons[1].click();ta.value='TEST-222';ta.dispatchEvent(new Event('input',{bubbles:true}));
   buttons[0].click();return {first:ta.value,stored:localStorage.getItem('db-study-progress-v1')}
  })()`);
  assert.equal(v.first,'TEST-111');assert.ok(v.stored?.includes('TEST-222'));
  await cdp.send('Page.reload',{ignoreCache:true});
  await until(()=>cdp.eval("document.querySelectorAll('.pmQuestionNav button').length===4 && performance.getEntriesByType('navigation')[0]?.type==='reload'"));
  const restored=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmQuestionNav button')],ta=document.querySelector('.pmQuestionAnswer textarea');
   buttons[0].click();const first=ta.value;buttons[1].click();return {first,second:ta.value}
  })()`);
  assert.deepEqual(restored,{first:'TEST-111',second:'TEST-222'});
 });
 check('figure 1 review SVG, figure 2 six PK + one FK, figure 3 review table',async()=>{
  const v=await cdp.eval(`(()=>{
   const buttons=[...document.querySelectorAll('.pmQuestionNav button')];
   const area=document.querySelector('.pmMaterialBody');
   buttons[0].click();
   const fig1={svg:area.querySelectorAll('svg').length,arrowsAndInheritance:area.querySelectorAll('svg polyline').length,text:area.textContent};
   buttons[2].click();
   const fig2={svg:area.querySelectorAll('svg').length,table:area.querySelectorAll('table').length,text:area.textContent,verifiedPk:area.querySelectorAll('table .pmPrimaryKey').length,foreignKeys:area.querySelectorAll('table .pmForeignKey').length};
   buttons[3].click();
   const fig3={svg:area.querySelectorAll('svg').length,table:area.querySelectorAll('table').length,text:area.textContent,pk:area.querySelectorAll('table .pmPrimaryKey').length,fk:area.querySelectorAll('table .pmForeignKey').length};
   return {fig1,fig2,fig3};
  })()`);
  assert.equal(v.fig1.svg,1);assert.equal(v.fig1.arrowsAndInheritance,44);assert.match(v.fig1.text,/作業中の再構成図/);
  assert.match(v.fig1.text,/最終照合は未完了/);
  assert.equal(v.fig2.svg,0);assert.equal(v.fig2.table,1);assert.match(v.fig2.text,/図2の「a」には図1の「a」と同じ字句/);assert.equal(v.fig2.verifiedPk,6);assert.equal(v.fig2.foreignKeys,1);assert.match(v.fig2.text,/未確認93属性のキー下線は省略/);assert.match(v.fig2.text,/\[ ア \]/);
  assert.equal(v.fig3.svg,0);assert.equal(v.fig3.table,1);assert.equal(v.fig3.pk,1);assert.equal(v.fig3.fk,0);assert.match(v.fig3.text,/未確認27属性/);assert.match(v.fig3.text,/\[ ツ \]/);
 });
 let failed=0;
 for(const t of tests){try{await t.fn();console.log('PASS',t.name)}catch(e){failed++;console.error('FAIL',t.name,e.message)}}
 console.log('PM_BROWSER_TEST_RESULT',JSON.stringify({total:tests.length,pass:tests.length-failed,fail:failed}));
 if(failed)process.exitCode=1;
}catch(e){console.error('PM_BROWSER_TEST_FATAL',e.stack||e);process.exitCode=1}
finally{
 try{cdp?.ws.close()}catch{}
 if(child){if(process.platform==='win32'){await new Promise(resolve=>{const p=spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});p.once('close',resolve);p.once('error',resolve)})}else child.kill('SIGTERM')}
 await new Promise(resolve=>server.close(resolve));
 if(profile)await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:200}).catch(()=>{});
}
