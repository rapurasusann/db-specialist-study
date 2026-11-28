// Normalized metadata only; provider adapter must enumerate all routes/domains.
import {isDeepStrictEqual} from 'node:util';
const secret='CS03_GATEWAY_SECRET';
function dark(s){
 return s?.workersDev===false && s.preview===false &&
 Array.isArray(s.routes) && s.routes.length===0 &&
 Array.isArray(s.domains) && s.domains.length===0 &&
 s.inventoryComplete===true && Array.isArray(s.bindings) &&
 s.bindings.every(b=>typeof b.name==='string' && typeof b.type==='string') &&
 new Set(s.bindings.map(b=>b.name)).size===s.bindings.length &&
 !s.bindings.some(b=>b.name==='CS03_BROWSER_JWT_MODE') &&
 s.bindings.some(b=>b.name==='CS03_QUOTA' && b.type==='durable_object_namespace' && b.class_name==='Cs03QuotaNotDeployed' && typeof b.namespace_id==='string' && b.namespace_id.length>0);
}
export function compareDarkWorker(before,after){
 if(!dark(before)||!dark(after)||before.bindings.some(b=>b.name===secret))return false;
 const added=after.bindings.filter(b=>b.name===secret);
 if(added.length!==1||added[0].type!=='secret_text')return false;
 const sort=b=>[...b].sort((a,c)=>a.name.localeCompare(c.name));
 return isDeepStrictEqual(sort(before.bindings),sort(after.bindings.filter(b=>b.name!==secret)));
}
