import {termQuestions} from './term-understanding-questions.js?v=20261124ex1';
// Isolated vocabulary practice: never read or modify legacy question progress.
const recordsKey='db-study-terms-v1';
const button=document.createElement('button');
button.id='viewTerms';button.type='button';button.textContent='単語理解';
document.getElementById('viewStudy')?.insertAdjacentElement('afterend',button);
const panel=document.createElement('section');
panel.id='termPractice';panel.hidden=true;panel.setAttribute('aria-label','単語理解');
panel.innerHTML='<h2>単語理解</h2><div id="termMetrics" class="termMetrics" aria-live="polite"></div><div class="termPracticeLayout"><aside class="termSidebar"><h2>分野</h2><nav id="termCategories" aria-label="分野"></nav><label class="muted" for="termFilter">問題の絞り込み</label><select id="termFilter"><option value="all">すべての問題</option><option value="unseen">未学習のみ</option><option value="review">要復習のみ</option><option value="learning">学習中のみ</option><option value="mastered">習得済みのみ</option></select><p id="termSummary" class="muted"></p><nav id="termItems" aria-label="学ぶ用語"></nav><p class="muted">灰：未学習／赤：要復習／黄：学習中／緑：習得済み</p></aside><div class="termPracticeQuestion"><h2>問題文・選択肢</h2><p class="muted">正しい説明を選んでください。青い点線の用語はマウスを合わせるかタップすると解説が表示されます。</p><p class="muted" id="termPosition"></p><h3 id="termPrompt"></h3><div id="termChoices"></div><div id="termFeedback" role="status" aria-live="polite" hidden></div><div class="toolbar separate"><button type="button" id="termReveal">回答・解説を表示</button><button type="button" id="termPrev">前の問題</button><button type="button" id="termNext" class="primary">次の問題</button><button type="button" id="termReset">この用語をもう一度</button></div></div></div>';
document.getElementById('study')?.insertAdjacentElement('afterend',panel);
const css=document.createElement('style');
css.textContent="#termPractice[hidden],.metrics[hidden]{display:none!important}#termPractice .termPracticeLayout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:14px;margin-top:14px}#termPractice .termSidebar,#termPractice .termPracticeQuestion{min-width:0;border:1px solid #dae4ee;padding:14px;border-radius:12px;background:#fff}#termPractice .termMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}#termPractice .termMetric{padding:12px;border:1px solid #dae4ee;border-radius:10px;background:#fff}#termPractice .termMetric strong{display:block;font-size:1.45rem;margin-top:5px}#termCategories,#termItems{display:grid;align-content:start;gap:6px;margin-bottom:12px}#termCategories button,#termItems button{justify-content:flex-start;text-align:left;white-space:normal}#termCategories button.active{background:#dceefa;border-color:#4a93c5;font-weight:650}#termItems button.active{outline:2px solid #0e6ea9;outline-offset:-2px;font-weight:650}#termItems button.unseen{background:#f2f5f9}#termItems button.review{background:#ffe3df;border-color:#e7a19a}#termItems button.learning{background:#fff2cf;border-color:#e6c77a}#termItems button.mastered{background:#d5f4e6;border-color:#7bbd9b}#termFilter{width:100%;margin-top:5px}#termPractice h3{font-size:1.05rem}#termChoices{display:grid;gap:9px}#termChoices .termChoice{display:flex;align-items:center;gap:10px;line-height:1.5;padding:10px;border:1px solid #aac0d4;border-radius:9px;background:#fbfdff;cursor:pointer}#termChoices .termChoice>button{flex:0 0 auto;min-width:42px}#termChoices .termChoice>div{min-width:0;flex:1}#termChoices .termChoice.correct{background:#d7f3e2;border-color:#3d8f63}#termChoices .termChoice.incorrect{background:#ffe4df;border-color:#be6f68}#termChoices .termChoice[aria-disabled=true]{cursor:default}#termFeedback{margin-top:14px;padding:12px;background:#eef5fc;border-radius:8px;white-space:pre-line;line-height:1.8}#termSummary{margin-top:10px}@media(max-width:700px){#termPractice .termPracticeLayout{grid-template-columns:1fr}#termPractice .termMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}#termCategories,#termItems{display:flex;flex-wrap:wrap}#termCategories button,#termItems button{flex:1 1 115px}}";
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
const stateLabels={unseen:'未学習',review:'要復習',learning:'学習中',mastered:'習得済み'};
function questionState(q){const r=records[q.id];return !r||!(Number(r.attempts)>0)?'unseen':r.correct!==true?'review':Number(r.streak)>=2?'mastered':'learning'}
function counts(qs){const c={unseen:0,review:0,learning:0,mastered:0};for(const q of qs)c[questionState(q)]++;return c}
function renderText(target,text,used,exclude=''){if(typeof window.DBStudyRenderGlossaryText==='function')window.DBStudyRenderGlossaryText(target,text,{used,exclude});else target.textContent=text}
function filtered(){const f=$('termFilter').value;return subset().filter(q=>f==='all'||questionState(q)===f)}
function updateProgress(){
 const all=counts(termQuestions),total=termQuestions.length,done=total-all.unseen;
 const metrics=$('termMetrics');metrics.replaceChildren();
 for(const [name,value] of [['全問題数',total+'問'],['学習済み',done+' / '+total+'問'],['未学習（残り）',all.unseen+'問'],['習得済み',all.mastered+'問']]){
  const box=document.createElement('div');box.className='termMetric';const label=document.createElement('span');label.className='muted';label.textContent=name;const v=document.createElement('strong');v.textContent=value;box.append(label,v);metrics.append(box)
 }
 $('termCategories').replaceChildren();
 for(const name of [...new Set(termQuestions.map(q=>q.category))]){
  const qs=termQuestions.filter(q=>q.category===name),c=counts(qs);
  const b=document.createElement('button');b.type='button';b.textContent=name+'（'+(qs.length-c.unseen)+'/'+qs.length+'問）';b.title='学習済み／全問題数';
  if(category===name){b.className='active';b.setAttribute('aria-current','true')}
  b.addEventListener('click',()=>{category=name;index=0;$('termFilter').value='all';render()});$('termCategories').append(b)
 }
 const questions=subset(),c=counts(questions);
 $('termSummary').textContent='全'+questions.length+'問／学習済み'+(questions.length-c.unseen)+'問／残り'+c.unseen+'問／習得済み'+c.mastered+'問';
 $('termItems').replaceChildren();
 const visible=filtered();
 for(const question of visible){
  const i=questions.indexOf(question),state=questionState(question),b=document.createElement('button');b.type='button';b.className=state+(i===index?' active':'');b.textContent=(i+1)+'. '+question.term+'（'+stateLabels[state]+'）';
  if(i===index)b.setAttribute('aria-current','true');
  b.addEventListener('click',()=>{index=i;render()});$('termItems').append(b)
 }
 if(!visible.length){const note=document.createElement('p');note.className='muted';note.textContent='該当する問題はありません。';$('termItems').append(note)}
 const at=visible.indexOf(current());$('termPrev').disabled=at<=0;$('termNext').disabled=at<0||at>=visible.length-1;
}
function render(){
 const questions=subset();if(index<0||index>=questions.length)index=0;
 const q=current();answered=false;updateProgress();
 const visible=filtered(),at=visible.indexOf(q);
 $('termPosition').textContent=category+' '+(index+1)+' / '+questions.length+'問'+(at>=0&&$('termFilter').value!=='all'?'（絞り込み '+(at+1)+' / '+visible.length+'）':'');
 const used=new Set();renderText($('termPrompt'),q.term+'の説明として正しいのは次のうちどれでしょうか？',used,q.term);
 $('termChoices').replaceChildren();
 q.choices.forEach((choice,i)=>{
  const row=document.createElement('div');row.className='termChoice';
  const b=document.createElement('button');b.type='button';b.textContent='アイウエ'[i];b.setAttribute('aria-label','アイウエ'[i]+' '+choice);
  const detail=document.createElement('div');renderText(detail,choice,used,q.term);
  b.addEventListener('click',e=>{e.stopPropagation();answer(i)});
  row.addEventListener('click',e=>{if(!e.target.closest('.glossary-term'))answer(i)});
  row.append(b,detail);$('termChoices').append(row)
 });
 $('termFeedback').hidden=true;$('termFeedback').textContent='';$('termReveal').disabled=false;
}
function finish(q,choice,record){
 answered=true;
 if(record)saveResult(q,choice===q.answer);
 $('termReveal').disabled=true;
 const used=new Set();renderText($('termPrompt'),q.term+'の説明として正しいのは次のうちどれでしょうか？',used);
 [...$('termChoices').children].forEach((row,i)=>{
  row.setAttribute('aria-disabled','true');row.firstElementChild.disabled=true;
  if(i===q.answer)row.classList.add('correct');else if(record&&i===choice)row.classList.add('incorrect');
  renderText(row.lastElementChild,q.choices[i],used)
 });
 const f=$('termFeedback');
 renderText(f,(record?(choice===q.answer?'正解です。':'不正解です。正解は「'+'アイウエ'[q.answer]+'」です。'):'正解は「'+'アイウエ'[q.answer]+'」です。')+'\n\n'+q.explanation+(record?'':'\n\n※解説だけを表示した場合、学習の正答記録には加算しません。'),new Set());
 f.hidden=false;updateProgress();
 // A question may leave the selected filter after answering; allow navigation
 // to the next matching question instead of trapping the learner.
 const visible=filtered();if(visible.length&&!visible.includes(q)){$('termNext').disabled=false}
}
function answer(choice){if(!answered)finish(current(),choice,true)}
$('termReveal').addEventListener('click',()=>{if(!answered)finish(current(),null,false)});
function move(delta){
 const questions=subset(),visible=filtered(),at=visible.indexOf(current());
 const target=at<0?(delta>0?visible.find(q=>questions.indexOf(q)>index)||visible[0]:null):visible[at+delta];
 if(target){index=questions.indexOf(target);render()}
}
$('termPrev').addEventListener('click',()=>move(-1));
$('termNext').addEventListener('click',()=>move(1));
$('termReset').addEventListener('click',render);
$('termFilter').addEventListener('change',()=>{const qs=filtered();if(qs.length&&!qs.includes(current()))index=subset().indexOf(qs[0]);render()});
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
window.DBStudyOpenTerm=id=>{const q=termQuestions.find(x=>x.id===id);if(!q)return false;category=q.category;index=termQuestions.filter(x=>x.category===category).findIndex(x=>x.id===id);$('termFilter').value='all';button.click();return true};
const targetId = new URLSearchParams(window.location.search).get('term');
if(targetId){
 const target=termQuestions.find(q=>q.id===targetId);
 if(target){
  category=target.category;
  index=termQuestions.filter(q=>q.category===category).findIndex(q=>q.id===targetId);
  showTerms();
 }
}
