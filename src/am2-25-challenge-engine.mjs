/* Weighted draw and results for the 25-question past-exam challenge.
 * Pure functions; never mutate existing progress or question data.
 */
export const BATCH_SIZE=25;
export function eligibleQuestions(years,transcribed){
 const found=[];
 for(let year=2016;year<=2025;year++){
  const entry=years[year],course=entry?.courses?.find(c=>c.id==='am2');
  if(!course||!Array.isArray(course.answers))continue;
  for(let n=1;n<=course.count;n++){
   const question=entry.questions?.['am2:'+n]||transcribed[year+':am2:'+n];
   if(!question?.stem||!question.options||!['ア','イ','ウ','エ'].every(k=>Object.hasOwn(question.options,k))||!['ア','イ','ウ','エ'].includes(course.answers[n-1]))continue;
   const id=year+':am2:'+n;
   found.push({id,year,n,answer:course.answers[n-1]});
  }
 }
 return found;
}
export function studyWeight(record={}){
 // Review mistakes immediately; mastered questions remain possible but rare.
 if(record.level==='review'||record.correct===false&&record.level!=='mastered')return 14;
 if(!record.level && !(Number(record.attempts)>0))return 10;
 if(record.level==='mastered'||record.correct===true&&Number(record.streak)>=2)return 0.25;
 if(record.level==='learning')return 4;
 return 6;
}
export function weightedSample(pool,progress,size=BATCH_SIZE,avoid=[],random=Math.random){
 const excluded=new Set(avoid);
 const distinct=[...new Map(pool.map(q=>[q.id,q])).values()];
 // Prefer unseen questions between batches; relax that constraint only if necessary.
 const fresh=distinct.filter(q=>!excluded.has(q.id));
 const candidates=fresh.length>=size?fresh:distinct;
 const scored=candidates.map(q=>{
  const w=studyWeight(progress[q.id]||{});
  const u=Math.max(Number.MIN_VALUE,Math.min(1-Number.EPSILON,random()));
  return {q,key:-Math.log(u)/w};
 });
 scored.sort((a,b)=>a.key-b.key);
 return scored.slice(0,Math.min(size,scored.length)).map(x=>x.q);
}
export function roundSummary(round,answers){
 const results=round.map(q=>({question:q,selected:answers[q.id]??null,correct:answers[q.id]===q.answer}));
 return {count:results.length,correct:results.filter(x=>x.correct).length,wrong:results.filter(x=>!x.correct).map(x=>x.question),rate:results.length?Math.round(results.filter(x=>x.correct).length/results.length*100):0};
}
