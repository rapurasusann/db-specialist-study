// Offline inspection of a deliberately non-deployable CS-03 review template.
// This is NOT a Cloudflare billing control or proof of fail-closed route settings.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const template=fileURLToPath(new URL('../docs/cs03-worker-config-review-only.json.example',import.meta.url));
const browserTemplate=fileURLToPath(new URL('../docs/cs03-browser-worker-config-review-only.json.example',import.meta.url));
export function inspectCs03WorkerReviewConfig(config,{browser=false}={}){
 const blockers=[];
 if(!config||typeof config!=='object'||Array.isArray(config))return ['INVALID_CONFIG'];
 if(config.main!==(browser?'./server/cs03-browser-jwt-entrypoint.mjs':'./server/cs03-gateway-production-adapter.mjs'))blockers.push('GUARDED_WORKER_ENTRYPOINT_REQUIRED');
 if(config.name!==(browser?'cs03-browser-isolated-candidate-not-approved':'cs03-isolated-candidate-not-approved'))blockers.push('REVIEW_ONLY_WORKER_NAME_REQUIRED');
 if(config.workers_dev!==false)blockers.push('WORKERS_DEV_MUST_BE_DISABLED');
 if(config.preview_urls!==false)blockers.push('PREVIEW_URLS_MUST_BE_DISABLED');
 if('routes' in config||'route' in config)blockers.push('ROUTES_MUST_BE_ABSENT');
 if('account_id' in config||'zone_id' in config)blockers.push('ACCOUNT_AND_ZONE_MUST_NOT_BE_EMBEDDED');
 if('vars' in config||'secrets' in config)blockers.push('SECRETS_AND_VARS_MUST_NOT_BE_EMBEDDED');
 // Free Workers have a platform CPU cap. Wrangler limits are for Standard Usage only;
 // a config CPU override must not be mistaken for a Free-tier spending control.
 if('limits' in config)blockers.push('FREE_TIER_CPU_OVERRIDE_NOT_A_SPENDING_CONTROL');
 const bindings=config.durable_objects?.bindings;
 if(!Array.isArray(bindings)||bindings.length!==1||bindings[0]?.name!=='CS03_QUOTA'||
    bindings[0]?.class_name!=='Cs03QuotaNotDeployed')
  blockers.push('ISOLATED_DO_BINDING_REQUIRED');
 const classes=config.migrations?.flatMap(m=>m.new_sqlite_classes??[]);
 if(!Array.isArray(classes)||!classes.includes('Cs03QuotaNotDeployed'))
  blockers.push('SQLITE_DO_MIGRATION_REQUIRED');
 // Static template validation is not deployment approval or live safety proof.
 return blockers;
}
export function inspectCs03WorkerReviewTemplate(){
 return inspectCs03WorkerReviewConfig(JSON.parse(readFileSync(template,'utf8')));
}

export function inspectCs03BrowserWorkerReviewTemplate(){
 return inspectCs03WorkerReviewConfig(JSON.parse(readFileSync(browserTemplate,'utf8')),{browser:true});
}
