// Read-only, non-mutating browser diagnosis of isolated Neon Auth connectivity.
// Does NOT call signUp, signIn, signOut, PUT/POST or modify any Neon settings.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
const AUTH='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech';
const BASE=AUTH+'/cs03_auth_sandbox/auth';
const CONTENT={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
let server,browser;
function report(label,ok){console.log(label+'='+(ok?'PASS':'FAIL'));if(!ok)process.exitCode=1;}
try{
 if(!process.env.PLAYWRIGHT_MODULE_PATH)throw Error('PLAYWRIGHT_MISSING');
 const playwright=require(process.env.PLAYWRIGHT_MODULE_PATH);
 report('AUTH_BUNDLE_PRESENT',(await stat(resolve(ROOT,'src/cs03-account.bundle.js'))).size>1024);
 server=http.createServer(async(req,res)=>{
  let uri;
  try{uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  if(uri==='/cs03-config.js'){
   res.setHeader('Content-Type',CONTENT['.js']);
   res.end('window.DB_STUDY_CS03='+JSON.stringify({previewEnabled:true,authUrl:BASE,apiUrl:'https://api.invalid/'})+';');
   return;
  }
  const file=resolve(ROOT,'.'+(uri==='/'?'/index.html':uri));
  const rel=relative(ROOT,file);
  if(rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||file===ROOT){res.writeHead(403);res.end();return;}
  try{
   let body=await readFile(file);
   if(uri==='/'||uri==='/index.html')body=Buffer.from(body.toString().replace("connect-src 'self'","connect-src 'self' "+AUTH));
   res.setHeader('Content-Type',CONTENT[extname(file)]||'application/octet-stream');
   res.setHeader('Cache-Control','no-store');
   res.end(body);
  }catch{res.writeHead(404);res.end();}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port;
 browser=await playwright.chromium.launch({headless:true});
 for(const host of ['127.0.0.1','localhost']){
  const origin='http://'+host+':'+port;
  const context=await browser.newContext({serviceWorkers:'block'});
  const results=[];
  await context.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin===origin||u.origin===AUTH)return route.continue();
   results.push('EXTERNAL_BLOCKED');
   return route.abort();
  });
  const page=await context.newPage();
  page.on('pageerror',()=>results.push('SCRIPT_ERROR'));
  page.on('console',msg=>{if(msg.type()==='error'&&/Content Security Policy/i.test(msg.text()))results.push('CSP_BLOCKED');});
  page.on('response',resp=>{
   const u=new URL(resp.url());
   if(u.origin===AUTH)results.push('NEON_HTTP_'+resp.status());
  });
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#cs03AccountPanel').waitFor({state:'visible',timeout:15000});
  const probe=await page.evaluate(async authBase=>{
   const endpoints=['/get-session','/.well-known/jwks.json'];
   const result={};
   for(const name of endpoints){
    try{
     const response=await fetch(authBase+name,{method:'GET',credentials:'include',cache:'no-store',redirect:'manual'});
     result[name]={responseStatus:response.status,corsOk:true};
    }catch(e){result[name]={corsOk:false,errorType:e?.name==='TypeError'?'NETWORK_OR_CORS':'OTHER'};}
   }
   return result;
  },BASE);
  const tag=host==='localhost'?'LOCALHOST':'LOOPBACK_IP';
  console.log(tag+'_SESSION_REQUEST='+(probe['/get-session'].corsOk?'HTTP_'+probe['/get-session'].responseStatus:probe['/get-session'].errorType));
  console.log(tag+'_JWKS_BROWSER='+(probe['/.well-known/jwks.json'].corsOk?'HTTP_'+probe['/.well-known/jwks.json'].responseStatus:probe['/.well-known/jwks.json'].errorType));
  console.log(tag+'_PANEL_VISIBLE=PASS');
  console.log(tag+'_CSP_BLOCKED='+(results.includes('CSP_BLOCKED')?'YES':'NO'));
  console.log(tag+'_SCRIPT_ERRORS='+(results.includes('SCRIPT_ERROR')?'YES':'NO'));
  console.log(tag+'_EXTERNAL_BLOCKED='+(results.includes('EXTERNAL_BLOCKED')?'YES':'NO'));
  await context.close();
 }
 console.log('CS03_AUTH_READONLY_DIAG=COMPLETE');
}catch{
 console.log('CS03_AUTH_READONLY_DIAG=FAILED');
 process.exitCode=1;
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)await new Promise(ok=>server.close(ok));
}
