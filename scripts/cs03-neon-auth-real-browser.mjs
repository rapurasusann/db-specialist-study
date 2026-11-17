// Isolated Neon Auth browser E2E. Explicit opt-in; creates one disposable user.
// No DB progress API, no production branch and no GitHub Actions.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
const require=createRequire(import.meta.url);
const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
const AUTH='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech';
const AUTH_BASE=AUTH+'/cs03_auth_sandbox/auth';
const CONFIG={previewEnabled:true,authUrl:AUTH_BASE,apiUrl:'https://api.invalid/'};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
let server,browser,external=0;
function check(name,pass){console.log(name+'='+(pass?'PASS':'FAIL'));if(!pass)throw Error('ASSERTION_FAILED');}
try{
 if(process.env.CS03_REAL_AUTH_OPT_IN!=='ISOLATED_TEST_USER')throw Error('OPT_IN_REQUIRED');
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_REQUIRED');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 check('BROWSER_BUNDLE_BUILT',(await stat(resolve(ROOT,'src/cs03-account.bundle.js'))).size>1024);
 server=http.createServer(async(req,res)=>{
  let uri;
  try{uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  if(uri==='/cs03-config.js'){
   res.setHeader('Content-Type',MIME['.js']);
   res.end('window.DB_STUDY_CS03='+JSON.stringify(CONFIG)+';');
   return;
  }
  const file=resolve(ROOT,'.'+(uri==='/'?'/index.html':uri));
  const rel=relative(ROOT,file);
  if(rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||file===ROOT){res.writeHead(403);res.end();return;}
  try{
   let body=await readFile(file);
   if(uri==='/'||uri==='/index.html'){
    let html=body.toString('utf8');
    // Only the loopback test response allows the fixed Neon Auth endpoint.
    html=html.replace("connect-src 'self'","connect-src 'self' "+AUTH);
    body=Buffer.from(html);
   }
   res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');
   res.end(body);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin||url.origin===AUTH)return route.continue();
  external++;
  return route.abort();
 });
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.name||'PageError'));
 await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
 await page.locator('#cs03AccountPanel').waitFor({state:'visible',timeout:15000});
 check('NEON_AUTH_PANEL_VISIBLE',await page.locator('#cs03AccountPanel').isVisible());
 const email='cs03-'+randomBytes(10).toString('hex')+'@example.com';
 const password='T7!'+randomBytes(24).toString('base64url');
 await page.locator('[data-cs03="email"]').fill(email);
 await page.locator('[data-cs03="name"]').fill('CS03 isolated test');
 await page.locator('[data-cs03="password"]').fill(password);
 await page.locator('[data-cs03="signup"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="status"]').textContent.includes('登録要求'),{timeout:15000}).catch(()=>{});
 const status=await page.locator('[data-cs03="status"]').textContent();
 check('NEON_AUTH_REAL_SIGNUP',status.includes('登録要求'));
 await page.locator('[data-cs03="password"]').fill(password);
 await page.locator('[data-cs03="login"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'),{timeout:15000}).catch(()=>{});
 check('NEON_AUTH_REAL_LOGIN',(await page.locator('[data-cs03="identity"]').textContent()).includes('ログイン中'));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#cs03AccountPanel').waitFor({state:'visible',timeout:15000});
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent.includes('ログイン中'),{timeout:15000}).catch(()=>{});
 check('NEON_AUTH_SESSION_RESTORED',(await page.locator('[data-cs03="identity"]').textContent()).includes('ログイン中'));
 await page.locator('[data-cs03="logout"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-cs03="identity"]').textContent==='未ログイン',{timeout:15000}).catch(()=>{});
 check('NEON_AUTH_REAL_LOGOUT',(await page.locator('[data-cs03="identity"]').textContent())==='未ログイン');
 check('ONLY_ISOLATED_AUTH_NETWORK',external===0);
 check('NO_BROWSER_RUNTIME_ERRORS',errors.length===0);
 console.log('CS03_NEON_AUTH_REAL_E2E=PASS');
 console.log('TEST_USER_CREATED=YES');
}catch(error){
 console.log('CS03_NEON_AUTH_REAL_E2E=FAIL');
 console.log('FAIL_CLASS='+(
  error?.message==='OPT_IN_REQUIRED'?'OPT_IN_REQUIRED':
  error?.message==='PLAYWRIGHT_REQUIRED'?'PLAYWRIGHT_REQUIRED':
  error?.message==='ASSERTION_FAILED'?'ASSERTION_FAILED':'BROWSER_AUTH_OR_NETWORK_ERROR'));
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(done=>server.close(done));
}
