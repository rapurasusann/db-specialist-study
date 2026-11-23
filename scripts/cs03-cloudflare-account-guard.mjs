// CS-03 dedicated Cloudflare account check. Offline only; NEVER deploys.
// Account IDs are resource identifiers, NOT authentication credentials.
// This check cannot prevent an operator from bypassing it with a raw wrangler command.
export const CS03_CLOUDFLARE_ACCOUNT_ID='9829f590b4afea346993621ca3a0c13f';
const ACCOUNT=/^[a-f0-9]{32}$/;
export function inspectCs03CloudflareAccount({env={},config=null}={}){
 const issues=[];
 if(!env||typeof env!=='object'||Array.isArray(env))return Object.freeze(['CLOUDFLARE_ACCOUNT_ENV_INVALID']);
 const a=env.CLOUDFLARE_ACCOUNT_ID;
 const b=env.CF_ACCOUNT_ID;
 const present=[a,b].filter(value=>value!==undefined&&value!==null&&value!=='');
 if(present.length===0)issues.push('CS03_DEDICATED_CLOUDFLARE_ACCOUNT_MISSING');
 if(present.some(value=>typeof value!=='string'||!ACCOUNT.test(value)||
  value!==CS03_CLOUDFLARE_ACCOUNT_ID))
  issues.push('CS03_DEDICATED_CLOUDFLARE_ACCOUNT_MISMATCH');
 if(a&&b&&a!==b)issues.push('CS03_CLOUDFLARE_ACCOUNT_ENV_CONFLICT');
 if(config!==null){
  if(!config||typeof config!=='object'||Array.isArray(config))
   issues.push('CS03_WRANGLER_CONFIG_INVALID');
  else{
   if(config.account_id!==undefined&&config.account_id!==CS03_CLOUDFLARE_ACCOUNT_ID)
    issues.push('CS03_WRANGLER_ACCOUNT_MISMATCH');
   if(config.zone_id!==undefined||config.route!==undefined||config.routes!==undefined)
    issues.push('CS03_UNAPPROVED_PUBLIC_ROUTE');
  }
 }
 return Object.freeze(issues);
}
