// Pure helper for per-subquestion answers in the existing db-study-progress-v1
// record. No storage access here: caller persists via the existing save() path.
export function updateSubquestionAnswer(record,subquestionId,value,now=new Date().toISOString()){
 if(typeof subquestionId!=='string'||!/^s[1-9][0-9]*(?:-[1-9][0-9]*)?$/.test(subquestionId))
  throw new TypeError('INVALID_SUBQUESTION_ID');
 if(typeof value!=='string')throw new TypeError('INVALID_ANSWER');
 if(record===null||typeof record!=='object'||Array.isArray(record))
  throw new TypeError('INVALID_PROGRESS_RECORD');
 const prev=record.writtenBySubquestion;
 if(prev!==undefined&&(prev===null||typeof prev!=='object'||Array.isArray(prev)))
  throw new TypeError('INVALID_SUBQUESTION_ANSWERS');
 return {...record,writtenBySubquestion:{...(prev||{}),[subquestionId]:value},updatedAt:now};
}
export function getSubquestionAnswers(record){
 if(!record||typeof record!=='object'||Array.isArray(record))return {};
 const answers=record.writtenBySubquestion;
 if(!answers||typeof answers!=='object'||Array.isArray(answers))return {};
 return Object.fromEntries(Object.entries(answers).filter(([id,value])=>
  /^s[1-9][0-9]*(?:-[1-9][0-9]*)?$/.test(id)&&typeof value==='string'));
}
