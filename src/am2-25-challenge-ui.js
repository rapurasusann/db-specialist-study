import {BATCH_SIZE,eligibleQuestions,weightedSample,roundSummary} from './am2-25-challenge-engine.mjs?v=20261125q1';
const byId=id=>document.getElementById(id);
const nav=byId('viewQuiz25');
if(!nav)throw Error('QUIZ_25_NAV_MISSING');
const pane=document.createElement('section');
pane.id='quiz25Panel';
pane.hidden=true;
pane.style.cssText='grid-column:1/-1;border:2px solid #a5c4e4;border-radius:12px;padding:14px;background:#f4f9fe;margin-bottom:12px';
pane.innerHTML='<h2 style="margin:0 0 8px">過去問25問チャレンジ</h2><p id="quiz25Info" role="status" aria-live="polite"></p><p id="quiz25Detail" class="muted"></p><div class="toolbar"><button type="button" id="quiz25Submit" class="primary">この問題の解答を確定</button><button type="button" id="quiz25Next" hidden>次の問題へ</button><button type="button" id="quiz25Retry" hidden>間違えた問題だけ再出題</button><button type="button" id="quiz25New" hidden>新しい25問に挑戦</button><button type="button" id="quiz25Stop">終了して通常学習へ</button></div><div id="quiz25Summary" hidden aria-live="polite"></div>';
byId('study').prepend(pane);
const source=()=>eligibleQuestions(years,transcribed);
let active=false,finished=false,round=[],index=0,answers={},firstRate=null,lastBatch=[],used=new Set(),stage=1;
function text(id,value){byId(id).textContent=value}
function toggle(id,visible){byId(id).hidden=!visible}
function lock(locked){
 byId('year').disabled=locked;
 byId('filter').disabled=locked;
 for(const id of ['grade','previous','next'])byId(id).disabled=locked;
}
for(const id of ['courses','questions']){
 byId(id).addEventListener('click',event=>{
  if(active){event.preventDefault();event.stopImmediatePropagation();}
 },true);
}
function showItem(){
 const item=round[index];
 if(!item)return;
 year=item.year;courseId='am2';number=item.n;showAnswer=false;
 byId('year').value=String(item.year);byId('filter').value='all';
 byId('viewStudy').click();
 pane.hidden=false;
 lock(true);
 const done=Object.hasOwn(answers,item.id);
 text('quiz25Info','第'+stage+'ラウンド　'+(index+1)+' / '+round.length+'問　（回答済 '+Object.keys(answers).length+'問）');
 text('quiz25Detail',item.year+'年度 午前Ⅱ・問'+item.n+'　／　回答を確定すると正誤と解説を表示します');
 toggle('quiz25Submit',!done);toggle('quiz25Next',done);
 toggle('quiz25Retry',false);toggle('quiz25New',false);
 byId('quiz25Summary').hidden=true;
 if(done){
  showAnswer=true;renderAnswer();
  text('quiz25Detail',item.year+'年度 午前Ⅱ・問'+item.n+'　／　このラウンドの回答：'+answers[item.id]+'（'+(answers[item.id]===item.answer?'正解':'不正解')+'）');
 }
 for(const input of byId('choices').querySelectorAll('input'))input.disabled=done;
 byId('quiz25Next').textContent=index===round.length-1?'結果を見る':'次の問題へ';
}
function beginBatch(){
 const pool=source();
 if(!pool.length){text('quiz25Info','出題可能な午前Ⅱの問題がありません');return}
 const avoided=new Set([...used,...lastBatch]);
 const picked=weightedSample(pool,progress,BATCH_SIZE,[...avoided]);
 if(!picked.length)return;
 if(used.size+picked.length>=pool.length)used=new Set();
 for(const q of picked)used.add(q.id);
 lastBatch=picked.map(q=>q.id);
 round=picked;index=0;answers={};firstRate=null;stage=1;active=true;finished=false;showItem();
}
function finishRound(){
 const result=roundSummary(round,answers);
 if(stage===1)firstRate=result.rate;
 finished=true;
 const first='最初の25問の正答率：'+firstRate+'%（'+Math.round(firstRate*round.length/100)+' / '+round.length+'問）';
 const retry='第'+stage+'ラウンドの正答率：'+result.rate+'%（'+result.correct+' / '+result.count+'問）';
 text('quiz25Info',stage===1?first:retry);
 text('quiz25Detail',result.wrong.length?'不正解の'+result.wrong.length+'問を繰り返し学習できます。':'このセットの全問を正解しました。新しい25問に進めます。');
 const summary=byId('quiz25Summary');
 summary.hidden=false;
 summary.replaceChildren();
 const p=document.createElement('p');
 p.textContent=stage===1?'初回正答率：'+result.rate+'%':first+' ／ 今回の再挑戦：'+result.rate+'%';
 summary.append(p);
 if(result.wrong.length){
  const details=document.createElement('p');details.textContent='再出題対象：'+result.wrong.map(x=>x.year+'年度問'+x.n).join('、');summary.append(details);
 }
 toggle('quiz25Submit',false);toggle('quiz25Next',false);
 toggle('quiz25Retry',result.wrong.length>0);toggle('quiz25New',result.wrong.length===0);
 // Store missed questions from the finished round without losing the answers for the summary.
 pending=result.wrong;
}
let pending=[];
function resetToNormal(){
 active=false;finished=false;round=[];answers={};pending=[];pane.hidden=true;
 lock(false);
 byId('viewStudy').click();
}
nav.addEventListener('click',()=>{
 if(active){if(finished){byId('viewStudy').click();pane.hidden=false;lock(true)}else showItem();return;}
 beginBatch();
});
byId('quiz25Submit').addEventListener('click',()=>{
 if(!active||!round.length)return;
 const item=round[index];
 if(Object.hasOwn(answers,item.id))return;
 if(year!==item.year||courseId!=='am2'||number!==item.n){showItem();return}
 if(!['ア','イ','ウ','エ'].includes(sessionSelected)){
  text('quiz25Detail','ア・イ・ウ・エのいずれかを選んでから確定してください。');
  return;
 }
 answers[item.id]=sessionSelected;
 gradeCurrentAnswer(false);
 showAnswer=true;renderAnswer();
 for(const input of byId('choices').querySelectorAll('input'))input.disabled=true;
 text('quiz25Detail',item.year+'年度 午前Ⅱ・問'+item.n+'　／　'+(answers[item.id]===item.answer?'正解':'不正解')+'。正解：'+item.answer);
 toggle('quiz25Submit',false);toggle('quiz25Next',true);
 byId('quiz25Next').textContent=index===round.length-1?'結果を見る':'次の問題へ';
 text('quiz25Info','第'+stage+'ラウンド　'+(index+1)+' / '+round.length+'問　（回答済 '+Object.keys(answers).length+'問）');
});
byId('quiz25Next').addEventListener('click',()=>{
 if(!active||!round.length||!Object.hasOwn(answers,round[index].id))return;
 if(index+1<round.length){index++;showItem()}else finishRound();
});
byId('quiz25Retry').addEventListener('click',()=>{
 if(!active||!pending.length)return;
 round=pending;pending=[];answers={};index=0;stage++;finished=false;showItem();
});
byId('quiz25New').addEventListener('click',()=>{
 if(!active||pending.length)return;
 beginBatch();
});
byId('quiz25Stop').addEventListener('click',resetToNormal);
nav.disabled=false;
