import {termQuestions} from './term-understanding-questions.js';
// Isolated vocabulary practice: never read or modify legacy question progress.
const recordsKey='db-study-terms-v1';
const button=document.createElement('button');
button.id='viewTerms';button.type='button';button.textContent='単語理解';
document.getElementById('viewStudy')?.insertAdjacentElement('afterend',button);
const panel=document.createElement('section');
panel.id='termPractice';panel.hidden=true;panel.setAttribute('aria-label','単語理解');
panel.innerHTML='<h2>単語理解</h2><p class="muted">一度に1つの用語を学びます。正しい説明を4つの選択肢から選んでください。</p><div class="toolbar" id="termCategories"></div><div class="termPracticeLayout"><nav id="termItems" aria-label="学ぶ用語"></nav><div class="termPracticeQuestion"><p class="muted" id="termPosition"></p><h3 id="termPrompt"></h3><div id="termChoices"></div><div id="termFeedback" role="status" aria-live="polite" hidden></div><div class="toolbar separate"><button type="button" id="termReveal">回答・解説を表示</button><button type="button" id="termNext">次の用語</button><button type="button" id="termReset">この用語をもう一度</button></div></div></div><p id="termSummary" class="muted"></p>';
document.getElementById('study')?.insertAdjacentElement('afterend',panel);
const css=document.createElement('style');
css.textContent='#termPractice[hidden],.metrics[hidden]{display:none!important}#termPractice .termPracticeLayout{display:grid;grid-template-columns:210px minmax(0,1fr);gap:14px;margin-top:14px}#termItems{display:grid;align-content:start;gap:6px}#termItems button{justify-content:flex-start;text-align:left}#termItems button.active{background:#dceefa;border-color:#4a93c5;font-weight:650}#termPractice .termPracticeQuestion{min-width:0;border:1px solid #d5e2ed;padding:14px;border-radius:12px;background:#fbfdff}#termPractice h3{font-size:1.05rem}#termChoices{display:grid;gap:9px}#termChoices button{justify-content:flex-start;white-space:normal;text-align:left;line-height:1.5;padding:12px;min-height:48px}#termChoices button.correct{background:#d7f3e2;border-color:#3d8f63}#termChoices button.incorrect{background:#ffe4df;border-color:#be6f68}#termFeedback{margin-top:14px;padding:12px;background:#eef5fc;border-radius:8px;white-space:pre-line;line-height:1.8}#termSummary{margin-top:14px}@media(max-width:700px){#termPractice .termPracticeLayout{grid-template-columns:1fr}#termItems{display:flex;flex-wrap:wrap}#termItems button{flex:1 1 115px}}';
document.head.append(css);
const $=id=>document.getElementById(id);
let category='正規形',index=0,answered=false,records={};
try{const saved=JSON.parse(localStorage.getItem(recordsKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved}catch{}
const subset=()=>termQuestions.filter(q=>q.category===category);
const current=()=>subset()[index];
function saveResult(question,correct){
 const previous=records[question.id]||{};
 records[question.id]={attempts:Math.min(100000,(Number(previous.attempts)||0)+1),correct,streak:correct?Math.min(100000,(Number(previous.streak)||0)+1):0,updatedAt:new Date().toISOString()};
 try{localStorage.setItem(recordsKey,JSON.stringify(records))}catch{/* questions remain usable without storage */}
}
function render(){
 const questions=subset();if(index>=questions.length)index=0;
 const q=current();answered=false;
 $('termCategories').replaceChildren();
 for(const name of [...new Set(termQuestions.map(q=>q.category))]){
  const b=document.createElement('button');b.type='button';b.textContent=name;
  if(category===name)b.className='primary';
  b.addEventListener('click',()=>{category=name;index=0;render()});
  $('termCategories').append(b);
 }
 $('termItems').replaceChildren();
 questions.forEach((question,i)=>{
  const b=document.createElement('button');b.type='button';
  b.textContent=question.term+(records[question.id]?.correct===true?' ✓':'');
  if(i===index)b.className='active';
  b.addEventListener('click',()=>{index=i;render()});
  $('termItems').append(b);
 });
 $('termPosition').textContent=category+' '+(index+1)+' / '+questions.length;
 $('termPrompt').textContent=q.term+'の説明として正しいのは次のうちどれでしょうか？';
 $('termChoices').replaceChildren();
 q.choices.forEach((choice,i)=>{
  const b=document.createElement('button');b.type='button';b.textContent='アイウエ'[i]+'　'+choice;
  b.addEventListener('click',()=>answer(i));
  $('termChoices').append(b);
 });
 $('termFeedback').hidden=true;$('termFeedback').textContent='';
 $('termReveal').disabled=false;
 const done=questions.filter(x=>records[x.id]?.correct===true).length;
 $('termSummary').textContent='この分野の直近正解：'+done+' / '+questions.length+'用語（端末内保存・過去問履歴とは別）';
}
function answer(choice){
 if(answered)return;
 answered=true;
 const q=current(),correct=choice===q.answer;
 $('termReveal').disabled=true;
 saveResult(q,correct);
 // Refresh the selected term status immediately without changing the chosen question.
 const activeTerm=$('termItems').children[index];
 if(activeTerm)activeTerm.textContent=q.term+(correct?' ✓':'');
 [...$('termChoices').children].forEach((button,i)=>{
  button.disabled=true;
  if(i===q.answer)button.classList.add('correct');
  else if(i===choice)button.classList.add('incorrect');
 });
 const f=$('termFeedback');
 f.textContent=(correct?'正解です。':'不正解です。正解は「'+'アイウエ'[q.answer]+'」です。')+'\n\n'+q.explanation;
 f.hidden=false;
 $('termSummary').textContent='この分野の直近正解：'+subset().filter(x=>records[x.id]?.correct===true).length+' / '+subset().length+'用語（端末内保存・過去問履歴とは別）';
}
$('termReveal').addEventListener('click',()=>{
 if(answered)return;
 answered=true;
 const q=current();
 for(const [i,choice] of [...$('termChoices').children].entries()){
  choice.disabled=true;
  if(i===q.answer)choice.classList.add('correct');
 }
 const f=$('termFeedback');
 f.textContent='正解は「'+'アイウエ'[q.answer]+'」です。\n\n'+q.explanation+'\n\n※解説だけを表示した場合、学習の正答記録には加算しません。';
 f.hidden=false;
 $('termReveal').disabled=true;
});
$('termNext').addEventListener('click',()=>{index=(index+1)%subset().length;render()});
$('termReset').addEventListener('click',render);
const metrics=document.querySelector('.metrics');
const showTerms=()=>{
 panel.hidden=false;
 $('dashboard').classList.add('hide');
 $('study').classList.add('hide');
 if(metrics)metrics.hidden=true;
 $('viewDashboard').classList.remove('primary');
 $('viewStudy').classList.remove('primary');
 button.classList.add('primary');
 render();
};
const leaveTerms=()=>{
 panel.hidden=true;if(metrics)metrics.hidden=false;button.classList.remove('primary');
};
button.addEventListener('click',showTerms);
// Registered after the legacy handlers: preserve the legacy mode chosen by each button.
$('viewStudy').addEventListener('click',leaveTerms);
$('viewDashboard').addEventListener('click',leaveTerms);
// Open a matching vocabulary question when linked from a past-exam question.
window.DBStudyOpenTerm=id=>{const q=termQuestions.find(x=>x.id===id);if(!q)return false;category=q.category;index=termQuestions.filter(x=>x.category===category).findIndex(x=>x.id===id);button.click();return true};
const targetId = new URLSearchParams(window.location.search).get('term');
if(targetId){
 const target=termQuestions.find(q=>q.id===targetId);
 if(target){
  category=target.category;
  index=termQuestions.filter(q=>q.category===category).findIndex(q=>q.id===targetId);
  showTerms();
 }
}
