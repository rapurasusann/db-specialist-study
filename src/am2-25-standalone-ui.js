import {prepareRelatedTermRegion,renderRelatedTermLinks} from './related-term-study-links.js?v=20261126shared1';
import {BATCH_SIZE,eligibleQuestions,weightedSample,roundSummary} from './am2-25-challenge-engine.mjs?v=20261125q1';
import {renderChallengeFigure} from './am2-25-standalone-figures.mjs?v=20261126notation2';

/* Independent practice screen. This module never calls renderStudy,
 * switches the global year/course/question, or accesses the old answer pane.
 */
const $=id=>document.getElementById(id);
const nav=$('viewQuiz25');
if(!nav)throw Error('QUIZ25_NAV_MISSING');
const screen=document.createElement('section');
screen.id='quiz25Screen';
screen.hidden=true;
screen.setAttribute('aria-label','25問チャレンジ専用画面');
screen.innerHTML=`
<div class="quiz25Top">
 <div><h2>午前Ⅱ・25問チャレンジ</h2><p id="quiz25Status" role="status" aria-live="polite"></p></div>
 <button type="button" id="quiz25Exit">学習メニューに戻る</button>
</div>
<div id="quiz25Work">
 <div class="quiz25Meter"><div id="quiz25MeterFill"></div></div>
 <div class="quiz25Layout">
  <aside class="quiz25Sidebar panel" aria-label="問題一覧">
   <h3>問題一覧</h3>
   <div id="quiz25Jump" class="quiz25Jump qgrid" role="group" aria-label="チャレンジの問題一覧"></div>
   <p class="muted">灰色：未回答 ／ 青：選択中 ／ 緑：正解 ／ 赤：不正解</p>
  </aside>
  <div class="quiz25Main">
  <div id="quiz25RelatedTerms"></div>
  <div class="quiz25Columns exam">
  <div class="pdfpane questionpane">
   <div class="pdfbar"><strong>問題文・選択肢</strong><a id="quiz25Original" target="_blank" rel="noopener noreferrer">公式原本PDF</a></div>
   <div class="questionText">
    <p class="quiz25Source" id="quiz25Source"></p>
    <h3 id="quiz25Title"></h3>
    <div id="quiz25Stem" class="quiz25Stem"></div>
    <div id="quiz25Figures"></div>
    <div id="quiz25OptionText"></div>
   </div>
   <div id="quiz25OriginalViewer" hidden><div class="localNote">IPA公式問題冊子の原本画像です。</div><div class="pageNav"><button type="button" id="quiz25PagePrev">前ページ</button><span id="quiz25PageStatus"></span><button type="button" id="quiz25PageNext">次ページ</button><button type="button" id="quiz25PageMark">開始ページを補正して保存</button></div><img id="quiz25PageImage" alt="IPA公式過去問のページ画像" loading="lazy" style="width:100%;height:auto"></div>
  </div>
  <div class="answer quiz25AnswerCard">
   <h2>解答・理解度</h2>
   <fieldset id="quiz25Choices" class="choice"><legend class="quiz25SrOnly">ア・イ・ウ・エから解答を選択</legend></fieldset>
   <button type="button" class="primary quiz25Submit" id="quiz25Submit">解答を判定</button>
   <div id="quiz25GradeResult" class="muted separate" role="status"></div>
   <div class="toolbar separate"><button type="button" id="quiz25Reveal" class="primary">答えを見る</button><a id="quiz25OfficialAnswer" target="_blank" rel="noopener noreferrer">公式解答PDF</a></div>
   <div id="quiz25Feedback" role="status" aria-live="polite" hidden></div>
   <div id="quiz25AnswerViewer" hidden><img id="quiz25AnswerImage" alt="IPA公式解答例" loading="lazy" style="width:100%;height:auto"></div>
   <h2 style="margin-top:18px">この問題の理解度</h2>
   <div class="levels" id="quiz25Levels"><button type="button" data-quiz25-level="review">要復習</button><button type="button" data-quiz25-level="learning">学習中</button><button type="button" data-quiz25-level="mastered">習得済み</button></div>
   <p class="muted" id="quiz25History"></p>
   <p class="muted">未回答でも次へ進めます。問題番号からいつでも戻れます。</p>
  
 <div class="quiz25Controls bottom">
  <button type="button" id="quiz25Back">前の問題へ</button>
  <button type="button" class="primary" id="quiz25Next">次の問題へ</button>
 </div>
 </div>
 </div>
 </div>
 </div>
</div>
<section id="quiz25Result" hidden aria-live="polite">
 <h3>チャレンジ結果</h3>
 <p id="quiz25Score" class="quiz25Score"></p>
 <p id="quiz25ResultDetail"></p>
 <div id="quiz25ResultItems"></div>
 <div class="quiz25Controls">
  <button type="button" class="primary" id="quiz25Retry" hidden>不正解・未回答のみ再出題</button>
  <button type="button" class="primary" id="quiz25New" hidden>新しい25問に挑戦</button>
 </div>
</section>
<div id="quiz25Mobile" class="mobileStudyControls" role="group" aria-label="スマートフォン用の解答と問題移動" hidden>
 <div class="mobileStudyHeader"><strong id="quiz25MobileQuestion"></strong><span id="quiz25MobileStatus" aria-live="polite"></span></div>
 <div class="mobileStudyChoices" id="quiz25MobileChoices"></div>
 <div class="mobileStudyNav"><button type="button" id="quiz25MobileBack">前の問題</button><button type="button" id="quiz25MobileReveal">解答を見る</button><button type="button" class="primary" id="quiz25MobileNext">次の問題</button></div>
</div>`;
const css=document.createElement('style');
css.textContent=`
#quiz25Screen[hidden],#quiz25Work[hidden],#quiz25Result[hidden]{display:none!important}
#quiz25Screen{margin:15px 0 24px}
#quiz25Screen .quiz25Top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:16px;background:#e9f4fd;border:1px solid #c6def1;border-radius:12px}
#quiz25Screen .quiz25Top h2{margin:0}
#quiz25Screen .quiz25Top p{margin:6px 0 0}
#quiz25Screen .quiz25Layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:14px;margin-top:14px;align-items:start}
#quiz25Screen .quiz25Sidebar{min-width:0;background:#fff;border:1px solid #d5e2ed;border-radius:12px;padding:15px}
#quiz25Screen .quiz25Sidebar h3{margin:0 0 12px}
#quiz25Screen .quiz25Sidebar .muted{margin:12px 0 0;line-height:1.6}
#quiz25Screen .quiz25Main{min-width:0}
#quiz25Screen .quiz25Columns{margin-top:0;align-items:start}
#quiz25Screen .quiz25Card{min-width:0;border:1px solid #d5e2ed;border-radius:12px;background:#fff;padding:17px}
#quiz25Screen .quiz25Card h3{margin-top:0}
#quiz25Screen .quiz25Source{font-size:.86rem;color:#4c6478}
/* The shared questionText pre-wrap also preserves template indentation.
   Preserve whitespace only in actual question and option content. */
#quiz25Screen .questionText{white-space:normal}
#quiz25Screen .quiz25Source{margin:0 0 10px}
#quiz25Screen #quiz25Title{margin:0 0 10px}
#quiz25Screen .quiz25Stem{white-space:pre-wrap;line-height:1.8}
#quiz25Screen #quiz25Figures:empty{display:none}
#quiz25Screen #quiz25Original{margin-top:0}
#quiz25Screen .questionpane{min-height:0}
#quiz25Screen #quiz25Figures{overflow-x:auto}
#quiz25Screen #quiz25Original{display:inline-block;margin-top:0}
#quiz25Screen #quiz25Choices{border:0;padding:0;min-width:0}
#quiz25Screen .quiz25Option{display:inline-flex;align-items:center;gap:4px}
#quiz25Screen .quiz25Option:has(input:checked){background:#e7f3fd;border-color:#267eb6}
#quiz25Screen .quiz25Option:has(input:disabled){cursor:default}
#quiz25Screen .quiz25Option input{margin-top:5px;flex-shrink:0}
#quiz25Screen .quiz25Option b{min-width:1.3em}
#quiz25Screen .quiz25Submit{width:auto}
#quiz25Screen #quiz25Feedback{background:#edf6ee;padding:13px;border:1px solid #b7d8c1;border-radius:9px;white-space:pre-wrap;line-height:1.7}
#quiz25Screen #quiz25Feedback[hidden]{display:none}
#quiz25Screen .quiz25Controls{display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;margin:16px 0}
#quiz25Screen .quiz25Jump{margin-top:12px}
#quiz25Screen .quiz25Jump button{min-width:0;min-height:43px;padding:7px 0}
#quiz25Screen .quiz25Jump button.quiz25Here{outline:3px solid #224f7c;outline-offset:1px}
#quiz25Screen .quiz25Jump button.quiz25Right{background:#d6f1df}
#quiz25Screen .quiz25Jump button.quiz25Wrong{background:#fce1df}
#quiz25Screen .quiz25Jump button.quiz25Draft{background:#dceeff}
#quiz25Screen .quiz25Meter{height:9px;background:#e8edf2;border-radius:8px;margin-top:15px;overflow:hidden}
#quiz25Screen #quiz25MeterFill{height:100%;background:#15837a;width:0}
#quiz25Screen #quiz25Result{background:white;border:1px solid #d5e2ed;border-radius:12px;padding:20px;margin-top:14px}
#quiz25Screen .quiz25Score{font-size:1.55rem;font-weight:bold}
#quiz25Screen .quiz25SrOnly{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
#quiz25Screen .quiz25ChoiceFigure{max-width:100%;overflow-x:auto}
#quiz25MobileQuestion{flex:none;color:#163a58}
#quiz25MobileStatus{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;text-align:right}
@media(max-width:650px){#quiz25Screen:has(#quiz25Mobile:not([hidden])){padding-bottom:155px}}
@media(max-width:920px){#quiz25Screen .quiz25Layout{grid-template-columns:1fr}}
@media(max-width:600px){#quiz25Screen .quiz25Sidebar{padding:12px}}
`;
document.head.append(css);
$('study').after(screen);
window.DBStudyAttachChoiceElimination?.($('quiz25OptionText'));
prepareRelatedTermRegion($('quiz25RelatedTerms'));

let active=false,complete=false,round=[],position=0,drafts={},answers={},stage=1,initialResult=null,retry=[],previous=[],used=new Set(),revealed=new Set(),answerSeen=new Set(),orders=new Map(),originalPage=1;
const set=(id,value)=>{$(id).textContent=value};
const show=(id,visible)=>{$(id).hidden=!visible};
function recordAnswer(item,correct){
 const prev=progress[item.id]||{};
 const streak=correct?(answerSeen.has(item.id)?Number(prev.streak)||0:(Number(prev.streak)||0)+1):0;
 progress[item.id]={...prev,correct,level:correct?'learning':'review',attempts:(Number(prev.attempts)||0)+1,streak,updatedAt:new Date().toISOString()};
 save();
 renderMetrics();
}
function commitCurrent(){
 const item=round[position],selected=item&&drafts[item.id];
 if(!item||Object.hasOwn(answers,item.id)||!['ア','イ','ウ','エ'].includes(selected))return;
 answers[item.id]=selected;recordAnswer(item,selected===item.answer);
}
function renderHistory(item){
 const r=progress[item.id]||{};
 set('quiz25History','現在：'+({review:'要復習',learning:'学習中',mastered:'習得済み'}[r.level]||'未学習')+(r.seenAnswer?' ／ 解答参照済み':'')+(r.updatedAt?' ／ 最終記録：'+new Date(r.updatedAt).toLocaleString('ja-JP'):''));
 for(const b of $('quiz25Levels').querySelectorAll('button'))b.classList.toggle('sel',b.dataset.quiz25Level===r.level);
}
$('quiz25Reveal').addEventListener('click',()=>{
 if(!active||complete)return;
 const item=round[position];
 if(revealed.has(item.id))revealed.delete(item.id);
 else{revealed.add(item.id);answerSeen.add(item.id);progress[item.id]={...progress[item.id],seenAnswer:true,updatedAt:new Date().toISOString()};save();}
 renderAnswerPanel(item);
 renderMobile();
});
$('quiz25Levels').addEventListener('click',e=>{
 const level=e.target.closest('button')?.dataset.quiz25Level;
 if(!active||complete||!['review','learning','mastered'].includes(level))return;
 const item=round[position];progress[item.id]={...progress[item.id],level,updatedAt:new Date().toISOString()};save();renderMetrics();renderHistory(item);
});
function getQuestion(item){
 return years[item.year]?.questions?.['am2:'+item.n]||transcribed[item.id]||null;
}
function resetOtherScreens(){
 $('dashboard').classList.add('hide');
 $('study').classList.add('hide');
 for(const id of ['termPractice','stepUpPractice']){const el=$(id);if(el)el.hidden=true;}
 const metrics=document.querySelector('.metrics');if(metrics)metrics.hidden=true;
 const mobile=$('mobileStudyControls');if(mobile)mobile.hidden=true;
}
function hideScreen(){screen.hidden=true;show('quiz25Mobile',false);active=false;complete=false;}
function activate(){
 resetOtherScreens();
 screen.hidden=false;
 for(const id of ['viewStudy','viewDashboard','viewTerms','viewStepUp'])$(id)?.classList.remove('primary');
 nav.classList.add('primary');
}
function statusText(){
 const answered=Object.keys(answers).length;
 set('quiz25Status','第'+stage+'ラウンド ／ '+round.length+'問中 '+answered+'問回答済み ／ '+(round.length-answered)+'問未回答');
 $('quiz25MeterFill').style.width=(round.length?Math.round(answered/round.length*100):0)+'%';
}
function renderJump(){
 const list=$('quiz25Jump');list.replaceChildren();
 round.forEach((item,i)=>{
  const btn=document.createElement('button');btn.type='button';btn.className='qbtn unseen';btn.textContent=String(i+1);
  btn.title=item.year+'年度・問'+item.n;
  if(i===position)btn.classList.add('quiz25Here');
  if(Object.hasOwn(answers,item.id))btn.classList.add(answers[item.id]===item.answer?'quiz25Right':'quiz25Wrong');
  else if(drafts[item.id])btn.classList.add('quiz25Draft');
  btn.addEventListener('click',()=>{if(position===i)return;position=i;renderQuestion();scrollQuestion();});
  list.append(btn);
 });
}
// Official text already contains these SQL statements. Keep unique SQL figures,
 // including statements that are not present in the question or choice text.
const inlineSqlStemIds=new Set(['2016:am2:9','2017:am2:8','2018:am2:6','2018:am2:8','2018:am2:10','2020:am2:10']);
const inlineSqlChoiceIds=new Set(['2016:am2:9','2016:am2:10','2017:am2:2','2018:am2:10','2019:am2:11','2020:am2:10']);
function shouldRenderSqlFigure(id,figure,letter,text){
 if(figure.type!=='sql')return true;
 if(typeof text!=='string'||!text.trim())return true;
 return !(letter?inlineSqlChoiceIds:inlineSqlStemIds).has(id);
}
function renderQuestion(){
 if(!active||complete||!round[position])return;
 activate();
 show('quiz25Work',true);show('quiz25Result',false);
 const item=round[position],q=getQuestion(item);
 originalPage=Number.isInteger(progress[item.id]?.startPage)&&progress[item.id].startPage>=1&&progress[item.id].startPage<=PAGE_COUNTS.am2_qs?progress[item.id].startPage:QUESTION_START_PAGES.am2[item.n-1]||1;
 renderOriginalPage(item);
 set('quiz25Source',item.year+'年度 午前Ⅱ ／ '+(position+1)+'問目（元の問'+item.n+'）');
 set('quiz25Title','問'+item.n);
 const glossaryUsed=new Set();
 const glossaryOptions={used:glossaryUsed,questionId:item.id};
 const renderText=(target,value)=>{
  if(typeof window.DBStudyRenderGlossaryText==='function')window.DBStudyRenderGlossaryText(target,value,glossaryOptions);
  else target.textContent=value;
 };
 const stem=item.id==='2020:am2:10'?q?.stem?.replace('社員（社員番号，社員名，性別，生年月日）','社員（社員番号［主キー］，社員名，性別，生年月日）'):q?.stem;
 renderText($('quiz25Stem'),stem||'問題文を読み込めませんでした');
 const figures=$('quiz25Figures');figures.replaceChildren();
 for(const figure of q?.figures||[])if(shouldRenderSqlFigure(item.id,figure,null,stem))figures.append(renderChallengeFigure(figure));
 const url=years[item.year].courses.find(c=>c.id==='am2').questionUrl;
 $('quiz25Original').href=url+(Number.isInteger(q?.sourcePage)?'#page='+q.sourcePage:'');
 const optionText=$('quiz25OptionText');optionText.replaceChildren();
 if(!orders.has(item.id)){
  const order=['ア','イ','ウ','エ'];
  if(Number(item.year)===2025)for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  orders.set(item.id,order);
 }
 const order=orders.get(item.id);
 for(const letter of order){
  const row=document.createElement('div');row.className='optionText';row.dataset.originalChoice=letter;
  const choice=q?.options?.[letter];
  if(item.id==='2025:am2:4'&&choice){
   const match=choice.match(/^プログラム言語（(.+)）$/);
   if(!match)throw Error('INVALID_Q4_SCHEMA');
   row.append(document.createTextNode(letter+'　プログラム言語（'));
   match[1].split('，').forEach((part,i)=>{if(i)row.append(document.createTextNode('，'));const span=document.createElement('span');span.textContent=part.replace(/［主キー(?:の一部)?］/g,'');if(part.includes('［主キー')){span.style.textDecoration='underline';span.style.textUnderlineOffset='3px';span.setAttribute('aria-label',span.textContent+'（主キー）');}row.append(span);});
   row.append(document.createTextNode('）'));
  }else renderText(row,letter+'　'+(choice||'（図を参照）'));
  for(const f of q?.optionFigures?.[letter]||[])if(shouldRenderSqlFigure(item.id,f,letter,q?.options?.[letter]))row.append(renderChallengeFigure(f));
  optionText.append(row);
 }
 renderRelatedTermLinks($('quiz25RelatedTerms'),item.id,$('quiz25Stem').textContent+'\n'+$('quiz25Figures').textContent+'\n'+optionText.textContent);
 renderAnswerPanel(item);
 $('quiz25Back').disabled=position===0;
 $('quiz25Next').textContent=position===round.length-1?'結果を見る（未回答も含む）':'次の問題へ（未回答でも可）';
 statusText();renderJump();renderMobile();
}
function renderOriginalPage(item){
 const available=Number(item.year)===2025;
 show('quiz25OriginalViewer',available);
 if(!available){$('quiz25PageImage').removeAttribute('src');return;}
 originalPage=Math.max(1,Math.min(PAGE_COUNTS.am2_qs,originalPage));
 $('quiz25PageImage').src=imagePath('am2_qs',originalPage);
 set('quiz25PageStatus','原本 '+originalPage+' / '+PAGE_COUNTS.am2_qs+' ページ');
 $('quiz25PagePrev').disabled=originalPage===1;
 $('quiz25PageNext').disabled=originalPage===PAGE_COUNTS.am2_qs;
}
for(const [id,delta] of [['quiz25PagePrev',-1],['quiz25PageNext',1]])$(id).onclick=()=>{const item=round[position];if(!active||complete||Number(item?.year)!==2025)return;originalPage+=delta;renderOriginalPage(item);};
$('quiz25PageMark').onclick=()=>{const item=round[position];if(!active||complete||Number(item?.year)!==2025)return;progress[item.id]={...progress[item.id],startPage:originalPage,updatedAt:new Date().toISOString()};save();renderHistory(item);};
function renderAnswerPanel(item){
 const q=getQuestion(item),order=orders.get(item.id)||['ア','イ','ウ','エ'];
 const options=$('quiz25Choices');options.replaceChildren();
 const locked=Object.hasOwn(answers,item.id);
 for(const letter of order){
  const label=document.createElement('label');label.className='quiz25Option';
  const input=document.createElement('input');input.type='radio';input.name='quiz25Answer';input.value=letter;input.disabled=locked;
  input.checked=(locked?answers[item.id]:drafts[item.id])===letter;
  input.addEventListener('change',()=>{drafts[item.id]=letter;renderJump();renderMobile()});
  const tag=document.createElement('b');tag.textContent=letter;
  label.append(input,tag);
  options.append(label);
 }
 $('quiz25Submit').disabled=locked||!q;
 const feedback=$('quiz25Feedback');
 const visible=revealed.has(item.id);
 feedback.hidden=!visible;
 const showImage=visible&&Number(item.year)===2025;
 show('quiz25AnswerViewer',showImage);
 if(showImage)$('quiz25AnswerImage').src=imagePath('am2_ans',1);
 else $('quiz25AnswerImage').removeAttribute('src');
 feedback.textContent='正解：'+item.answer+'\n\n'+(q?.explanation||'公式解答と照合してください。');
 set('quiz25GradeResult',locked?(answers[item.id]===item.answer?'正解':'不正解')+'。正解は '+item.answer+' です。':'');
 set('quiz25Reveal',visible?'解答を閉じる':'答えを見る');
 $('quiz25OfficialAnswer').href=years[item.year].courses.find(c=>c.id==='am2').answerUrl;
 renderHistory(item);
}
function scrollQuestion(){
 if(window.matchMedia('(max-width:650px)').matches)$('quiz25Source').scrollIntoView({behavior:'instant',block:'start'});
}
function renderMobile(){
 const item=round[position];
 if(!active||complete||screen.hidden||!item){show('quiz25Mobile',false);return;}
 show('quiz25Mobile',true);
 set('quiz25MobileQuestion',item.year+'年度 午前Ⅱ 問'+item.n);
 const locked=Object.hasOwn(answers,item.id);
 set('quiz25MobileStatus',locked?$('quiz25GradeResult').textContent:(drafts[item.id]?'「判定」で正誤を確認できます。':'ア・イ・ウ・エから選択してください。'));
 const container=$('quiz25MobileChoices');container.replaceChildren();
 for(const letter of orders.get(item.id)||['ア','イ','ウ','エ']){
  const b=document.createElement('button');b.type='button';b.textContent=letter;
  const selected=(locked?answers[item.id]:drafts[item.id])===letter;
  b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.disabled=locked;
  b.onclick=()=>Array.from($('quiz25Choices').querySelectorAll('input')).find(input=>input.value===letter)?.click();
  container.append(b);
 }
 const grade=document.createElement('button');grade.type='button';grade.className='primary';grade.textContent='判定';grade.disabled=$('quiz25Submit').disabled;grade.onclick=()=>$('quiz25Submit').click();container.append(grade);
 $('quiz25MobileBack').disabled=$('quiz25Back').disabled;
 set('quiz25MobileNext',position===round.length-1?'結果を見る':'次の問題');
 set('quiz25MobileReveal',revealed.has(item.id)?'解答を閉じる':'解答を見る');
}
$('quiz25MobileBack').onclick=()=>{$('quiz25Back').click();scrollQuestion();};
$('quiz25MobileNext').onclick=()=>{$('quiz25Next').click();if(!complete)scrollQuestion();else $('quiz25Result').scrollIntoView({block:'start'});};
$('quiz25MobileReveal').onclick=()=>{$('quiz25Reveal').click();if(revealed.has(round[position]?.id))$('quiz25Feedback').scrollIntoView({block:'start'});};
function drawBatch(){
 const pool=eligibleQuestions(years,transcribed);
 if(!pool.length){set('quiz25Status','出題可能な問題がありません');return}
 const picked=weightedSample(pool,progress,BATCH_SIZE,[...new Set([...used,...previous])]);
 if(!picked.length)return;
 if(used.size+picked.length>=pool.length)used.clear();
 picked.forEach(q=>used.add(q.id));
 previous=picked.map(q=>q.id);
 round=picked;position=0;answers={};drafts={};revealed.clear();answerSeen.clear();orders.clear();stage=1;initialResult=null;retry=[];complete=false;active=true;
 renderQuestion();
}
function finish(){
 const result=roundSummary(round,answers);
 if(stage===1)initialResult=result;
 complete=true;retry=result.wrong;show('quiz25Mobile',false);
 show('quiz25Work',false);show('quiz25Result',true);
 const skipped=result.wrong.filter(q=>!Object.hasOwn(answers,q.id)).length;
 set('quiz25Status','第'+stage+'ラウンド 完了');
 set('quiz25Score','正答率 '+result.rate+'%（'+result.correct+' / '+result.count+'問）');
 set('quiz25ResultDetail',(initialResult&&stage>1?'初回25問の正答率：'+initialResult.rate+'% ／ ':'')+
   '今回の不正解 '+(result.wrong.length-skipped)+'問・未回答 '+skipped+'問。'+(result.wrong.length?'再挑戦で確認できます。':'全問正解です。次の25問に進めます。'));
 const list=$('quiz25ResultItems');list.replaceChildren();
 for(const q of result.wrong){const p=document.createElement('p');p.textContent=q.year+'年度・問'+q.n+(Object.hasOwn(answers,q.id)?'（不正解）':'（未回答）');list.append(p)}
 show('quiz25Retry',retry.length>0);show('quiz25New',retry.length===0);
}
$('quiz25Submit').addEventListener('click',()=>{
 if(!active||complete)return;
 const item=round[position];
 if(Object.hasOwn(answers,item.id))return;
 const selected=drafts[item.id];
 if(!['ア','イ','ウ','エ'].includes(selected)){set('quiz25Status','選択肢を選んでから解答を確定してください。未回答で次へ進むこともできます。');return}
 commitCurrent();
 renderAnswerPanel(item);
 statusText();renderJump();renderMobile();
});
$('quiz25Back').addEventListener('click',()=>{if(!active||complete||position===0)return;commitCurrent();position--;renderQuestion()});
$('quiz25Next').addEventListener('click',()=>{if(!active||complete)return;commitCurrent();if(position+1<round.length){position++;renderQuestion()}else finish()});
$('quiz25Retry').addEventListener('click',()=>{
 if(!active||!complete||!retry.length)return;
 round=retry;position=0;answers={};drafts={};revealed.clear();answerSeen.clear();orders.clear();retry=[];stage++;complete=false;renderQuestion();
});
$('quiz25New').addEventListener('click',()=>{if(active&&complete&&!retry.length)drawBatch()});
$('quiz25Exit').addEventListener('click',()=>{hideScreen();nav.classList.remove('primary');$('viewDashboard').click();const metrics=document.querySelector('.metrics');if(metrics)metrics.hidden=false;});
nav.addEventListener('click',()=>{if(!active)drawBatch();else if(complete){activate();show('quiz25Work',false);show('quiz25Result',true)}else renderQuestion();});
for(const id of ['viewDashboard','viewStudy','viewTerms','viewStepUp']){
 $(id)?.addEventListener('click',()=>{if(screen.hidden)return;screen.hidden=true;show('quiz25Mobile',false);nav.classList.remove('primary');const metrics=document.querySelector('.metrics');if(metrics&&(id==='viewDashboard'||id==='viewStudy'))metrics.hidden=false;});
}
nav.disabled=false;
