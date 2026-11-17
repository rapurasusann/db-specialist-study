// CS-03 isolated browser smoke test: local-only, no Neon API or auth calls.
// Requires a previously installed Playwright package and Chromium browser.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const root=resolve(new URL('../',import.meta.url).pathname);
// On Windows, fileURLToPath is required for drive-letter paths.
import {fileURLToPath} from 'node:url';
const site=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
let server,browser;
function report(name,ok){console.log(name+'='+(ok?'PASS':'FAIL'));if(!ok)throw Error('SMOKE_ASSERTION_FAILED');}
try{
 const packagePath=process.env.PLAYWRIGHT_MODULE_PATH;
 if(!packagePath)throw Error('PLAYWRIGHT_NOT_CONFIGURED');
 const playwright=require(packagePath);
 const bundle=resolve(site,'src/cs03-account.bundle.js');
 report('BUNDLE_EXISTS',(await stat(bundle)).size>1024);
 server=http.createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  const path=resolve(site,'.'+decodeURIComponent(name==='/'?'/index.html':name));
  const rel=relative(site,path);
  if(rel.startsWith('..')||resolve(path)===resolve(site)){res.writeHead(403);res.end();return;}
  try{
   const data=await readFile(path);
   res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');
   res.end(data);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===base)return route.continue();
  return route.abort();
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(250);
 report('PAGE_TITLE',(await page.title()).includes('DB合格ノート'));
 report('LEGACY_STUDY_VISIBLE',await page.locator('#viewStudy').isVisible());
 report('LEGACY_BACKUP_VISIBLE',await page.locator('#backup').isVisible());
 report('ACCOUNT_PANEL_DEFAULT_HIDDEN',!(await page.locator('#cs03AccountPanel').isVisible()));
 report('PREVIEW_DISABLED',await page.evaluate(()=>window.DB_STUDY_CS03?.previewEnabled===false));
 report('NO_PAGE_SCRIPT_ERRORS',errors.length===0);
 console.log('CS03_BROWSER_SMOKE=PASS');
}catch(error){
 // No stack traces from browser page, which could include unexpected user data.
 console.log('CS03_BROWSER_SMOKE=FAIL');
 console.log('FAIL_CLASS='+(
  error?.message==='PLAYWRIGHT_NOT_CONFIGURED'?'PLAYWRIGHT_NOT_CONFIGURED':
  error?.message==='SMOKE_ASSERTION_FAILED'?'SMOKE_ASSERTION_FAILED':'ENVIRONMENT_OR_BROWSER_ERROR'
 ));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(resolve=>server.close(resolve));
}
