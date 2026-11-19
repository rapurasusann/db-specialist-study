// Isolated adapter for per-subquestion drafts. No legacy progress writes.
// Integrate into the existing backup format only after compatibility tests.
export const PM_DRAFT_KEY='db-study-pm-subquestion-drafts-v1';
export function createPmDraftStore(storage,storageKey=PM_DRAFT_KEY){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')throw Error('STORAGE_REQUIRED');
 function readAll(){
  try{
   const parsed=JSON.parse(storage.getItem(storageKey)||'{}');
   if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return {};
   return parsed;
  }catch{return {}}
 }
 function load(questionKey){
  const doc=readAll()[questionKey];
  if(!doc||typeof doc!=='object'||Array.isArray(doc))return {};
  return Object.fromEntries(Object.entries(doc).filter(([id,answer])=>typeof id==='string'&&typeof answer==='string'));
 }
 function save(questionKey,subquestionId,answer){
  if(typeof questionKey!=='string'||!questionKey||typeof subquestionId!=='string'||!subquestionId||typeof answer!=='string')throw Error('INVALID_PM_ANSWER');
  const all=readAll();
  const updated={...all,[questionKey]:{...load(questionKey),[subquestionId]:answer}};
  storage.setItem(storageKey,JSON.stringify(updated));
 }
 return {load,save};
}
