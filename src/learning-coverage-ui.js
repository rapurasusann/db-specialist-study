import {termQuestions} from './term-understanding-questions.js?v=20261125reading1';
import {stepQuestions} from './afternoon-step-up-questions.js?v=20261124ex1';
import './term-understanding-ui.js?v=20261125layout1';
import './afternoon-step-up-ui.js?v=20261124ex1';
const byId=id=>document.getElementById(id);
const labels={am2:'午前Ⅱ',term:'用語理解',2:'Lv.2 基礎記述',3:'Lv.3 SQL演習',4:'Lv.4 ER図演習',5:'Lv.5 業務仕様の読解'};
const groups=['am2','term','2','3','4','5'];
const readRecords=key=>{try{const r=JSON.parse(localStorage.getItem(key)||'{}');return r&&typeof r==='object'&&!Array.isArray(r)?r:{}}catch{return {}}};
const day=86400000;
function items(){
 const result=[];
 for(let y=2016;y<=2025;y++){const c=years[y]?.courses?.find(x=>x.id==='am2');if(!c)continue;for(let n=1;n<=c.count;n++){const id=y+':am2:'+n;const q=years[y].questions?.['am2:'+n]||transcribed[id];if(q?.options)result.push({group:'am2',id,y,n,label:y+'年度 午前Ⅱ 問'+n});}}
 for(const q of termQuestions)result.push({group:'term',id:q.id,label:'用語：'+q.term});
 for(const q of stepQuestions)result.push({group:String(q.lv),id:q.id,label:'Lv.'+q.lv+' '+q.title});
 // A question is counted and queued only once per learning group.
 return [...new Map(result.map(item=>[JSON.stringify([item.group,item.id]),item])).values()];
}
function state(item,records){
 const r=records[item.group==='am2'?'am2':item.group==='term'?'term':'step'][item.id]||{};
 const am=item.group==='am2',term=item.group==='term';
 const seen=am?(Number(r.attempts)>0||['review','learning','mastered'].includes(r.level)):term?Number(r.attempts)>0:['review','learning','mastered'].includes(r.status);
 const mastered=seen&&(am?(r.level==='mastered'||(r.correct===true&&Number(r.streak)>=2&&r.level!=='review')):term?(r.correct===true&&Number(r.streak)>=2):r.status==='mastered');
 // Explicit AM2 self-assessment takes precedence over an older graded answer.
 const wrong=seen&&(am?(r.level==='review'||(r.level!=='mastered'&&r.correct===false)):term?r.correct===false:r.status==='review');
 const stamp=Date.parse(r.updatedAt||'');
 return {...item,seen,mastered,wrong,due:seen&&(!Number.isFinite(stamp)||Date.now()-stamp>=7*day)};
}
function states(){const records={am2:progress,term:readRecords('db-study-terms-v1'),step:readRecords('db-study-step-up-v1')};return items().map(x=>state(x,records));}
// Keep streaks in the original AM2 record. A changed answer in the same display
// is not a second independent correct attempt. Existing manual mastery remains valid.
let counted=false,answerSeen=false;
const oldRenderStudy=renderStudy;
renderStudy=function(){counted=false;answerSeen=false;return oldRenderStudy.apply(this,arguments)};
const oldPut=put;
put=function(update){if(update.seenAnswer===true)answerSeen=true;if(courseId==='am2'&&typeof update.correct==='boolean'&&Object.hasOwn(update,'attempts')){
 const prev=rec();update={...update,streak:update.correct?(answerSeen?(Number(prev.streak)||0):counted?(prev.correct===true?Number(prev.streak)||0:0):(Number(prev.streak)||0)+1):0};counted=true;
 }return oldPut.call(this,update)};
const box=document.createElement('div');box.id='learningOverview';box.innerHTML='<h2>学習網羅率・定着率</h2><p class="muted">2016～2025年度の午前Ⅱ・用語理解・ステップアップを集計。網羅率は解答・自己評価済みの割合。定着率は習得済み（午前Ⅱは自己評価または連続2回正解、用語は連続2回正解、記述は自己評価）の割合です。旧履歴の連続正解数は不明として扱います。実際の記憶定着を保証する指標ではありません。</p><div id="coverageRows" style="display:grid;gap:12px"></div><h2 style="margin-top:22px">ランダム学習</h2><p class="muted">選んだ範囲から重複なしで出題し、既存の学習画面に移動します。</p><div class="toolbar" id="randomGroups"></div><div class="toolbar separate"><label>出題方法 <select id="randomMode"><option value="weak">学習が必要な問題を優先</option><option value="unseen">未学習のみ</option><option value="wrong">不正解・要復習のみ</option><option value="review">定着確認（7日以上・日付不明）</option><option value="all">完全ランダム</option></select></label><label>問題数 <select id="randomCount"><option>10</option><option selected>20</option><option>50</option></select></label><button type="button" id="randomStart" class="primary">学習開始</button></div><p id="randomMessage" role="status" class="muted"></p>';
byId('dashboard').prepend(box);
for(const g of groups){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=g;input.checked=true;label.append(input,document.createTextNode(' '+labels[g]));byId('randomGroups').append(label)}
function refresh(){const rows=states();const dest=byId('coverageRows');dest.replaceChildren();for(const g of groups){const xs=rows.filter(x=>x.group===g);const total=xs.length,seen=xs.filter(x=>x.seen).length,master=xs.filter(x=>x.mastered).length;const row=document.createElement('div');row.style.cssText='border:1px solid #dae4ee;border-radius:10px;padding:12px';const title=document.createElement('strong');title.textContent=labels[g]+'　全'+total+'問';row.append(title);
 for(const [name,num,color] of [['網羅率',seen,'#4285cf'],['学習定着率',master,'#15837a']]){const p=total?Math.round(num/total*1000)/10:0;const line=document.createElement('div');line.style.cssText='display:grid;grid-template-columns:95px minmax(0,1fr) 58px;align-items:center;gap:8px;margin-top:7px';const text=document.createElement('span');text.textContent=name;const bar=document.createElement('div');bar.className='progress';const fill=document.createElement('div');fill.style.width=p+'%';fill.style.background=color;bar.append(fill);const val=document.createElement('strong');val.textContent=p+'%';line.append(text,bar,val);row.append(line);}
 const sub=document.createElement('div');sub.className='muted';sub.textContent='学習済み '+seen+'問／習得済み '+master+'問／未学習 '+(total-seen)+'問';row.append(sub);dest.append(row);}}
const queueBar=document.createElement('section');queueBar.id='randomSession';queueBar.hidden=true;queueBar.innerHTML='<div class="toolbar"><strong id="randomPosition"></strong><button id="randomBack">前の出題</button><button id="randomNext" class="primary">次のランダム問題</button><button id="randomStop">終了</button></div><p class="muted" id="randomTarget"></p>';
document.querySelector('.metrics').insertAdjacentElement('beforebegin',queueBar);
let queue=[],position=0;
function open(item){if(item.group==='am2'){year=item.y;courseId='am2';number=item.n;showAnswer=false;byId('year').value=String(year);byId('filter').value='all';byId('viewStudy').click();return true}if(item.group==='term')return window.DBStudyOpenTerm(item.id);return window.DBStudyOpenStep(item.id);}
function show(){const item=queue[position];if(!item)return;queueBar.hidden=false;byId('randomPosition').textContent='ランダム学習 '+(position+1)+' / '+queue.length;byId('randomTarget').textContent=item.label+'（既存の学習画面で解答してください）';byId('randomBack').disabled=position===0;byId('randomNext').textContent=position===queue.length-1?'学習終了':'次のランダム問題';if(!open(item)){byId('randomTarget').textContent='問題を開けませんでした。次へ進んでください。'}queueBar.scrollIntoView({block:'nearest'});}
function stop(){queue=[];position=0;queueBar.hidden=true;byId('viewDashboard').click();refresh();}
byId('randomStart').addEventListener('click',()=>{const selected=new Set([...byId('randomGroups').querySelectorAll('input:checked')].map(x=>x.value));const mode=byId('randomMode').value;let xs=states().filter(x=>selected.has(x.group));
 if(mode==='unseen')xs=xs.filter(x=>!x.seen);if(mode==='wrong')xs=xs.filter(x=>x.wrong);if(mode==='review')xs=xs.filter(x=>x.due);if(mode==='weak')xs=xs.filter(x=>!x.mastered||x.due||x.wrong);
 if(!xs.length){byId('randomMessage').textContent='対象の問題がありません。出題範囲や方法を変更してください。';return}
 // Random order within priority groups, with no repeated item in a session.
 for(let i=xs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[xs[i],xs[j]]=[xs[j],xs[i]]}
 if(mode==='weak'){const priority=x=>x.wrong?0:!x.seen?1:!x.mastered?2:3;xs.sort((a,b)=>priority(a)-priority(b));}
 queue=xs.slice(0,Number(byId('randomCount').value));position=0;byId('randomMessage').textContent=queue.length+'問を選びました。';show();
});
function gradeIfCurrent(){const item=queue[position];if(item?.group==='am2'&&year===item.y&&courseId==='am2'&&number===item.n&&!byId('study').classList.contains('hide'))gradeCurrentAnswer();}
byId('randomBack').addEventListener('click',()=>{if(position>0){gradeIfCurrent();position--;show()}});
byId('randomNext').addEventListener('click',()=>{gradeIfCurrent();if(position+1<queue.length){position++;show()}else stop()});
byId('randomStop').addEventListener('click',()=>{gradeIfCurrent();stop()});
byId('viewDashboard').addEventListener('click',refresh);window.addEventListener('storage',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
refresh();
