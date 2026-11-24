// Local-only credential boundary. No cloud writes or CLI invocation here.
import {ACCOUNT,checkAbsent} from './cs03-dark-preflight.mjs';

export function credentialContext(source){
 if(source.CLOUDFLARE_ACCOUNT_ID!==ACCOUNT)throw Error('ACCOUNT_MISMATCH');
 const token=source.CS03_CF_DEPLOY_TOKEN;
 if(typeof token!=='string'||!token||token.trim()!==token||/\s/.test(token))throw Error('DEPLOY_TOKEN_REQUIRED');
 // Reject alternate authentication rather than allowing Wrangler to choose it.
 for(const key of ['CLOUDFLARE_API_TOKEN','CF_API_TOKEN','CLOUDFLARE_API_KEY','CF_API_KEY','CLOUDFLARE_EMAIL','CF_EMAIL','CS03_CF_READ_TOKEN']){
  if(source[key])throw Error('AMBIGUOUS_CREDENTIAL');
 }
 // Explicit allowlist: no inherited dotenv overrides, API endpoints, proxy settings or secrets.
 const env={};
 for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','WINDIR','TEMP','TMP','TMPDIR','USERPROFILE','HOME','APPDATA','LOCALAPPDATA','ComSpec','PATHEXT']){
  if(typeof source[key]==='string')env[key]=source[key];
 }
 Object.assign(env,{CLOUDFLARE_ACCOUNT_ID:ACCOUNT,CLOUDFLARE_API_TOKEN:token,WRANGLER_SEND_METRICS:'false',CI:'true'});
 return {account:ACCOUNT,token,env};
}

export async function withVerifiedCredential(source,run,{fetcher=fetch}={}){
 const ctx=credentialContext(source);
 // The very same bearer is used for the account-scoped absence check and Wrangler.
 // This proves read access, not write permission; a failed deploy must never be retried automatically.
 await checkAbsent({account:ctx.account,token:ctx.token,fetcher});
 try{return await run(ctx.env);}
 finally{delete ctx.env.CLOUDFLARE_API_TOKEN;ctx.token=undefined;}
}
