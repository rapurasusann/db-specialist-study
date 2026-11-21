/* 2025 PM1 Q2 PC study layout: draft text and original-image figures remain explicitly provisional. */
(function(){
'use strict';
const oldShowQuestion=showQuestion;
const style=document.createElement('style');
style.textContent='.pm2-study-layout{display:grid;gap:14px;padding:10px}.pm2-study-block{border:1px solid #cbd8e5;border-radius:10px;padding:12px;background:#fff;min-width:0}.pm2-study-block h3{font-size:1rem;margin:0 0 10px}.pm2-study-copy{white-space:pre-wrap;line-height:1.75;overflow-wrap:anywhere}.pm2-study-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}.pm2-study-figures figure[hidden]{display:none!important}.pm2-study-figures figure{max-width:100%}.pm2-study-block select{max-width:100%;padding:8px}.pm2-study-choices{display:flex;gap:8px;flex-wrap:wrap}.pm2-study-choices button[aria-pressed="true"]{background:#dceefa;font-weight:bold}@media(max-width:650px){.pm2-study-layout{padding:0}.pm2-study-block{padding:10px}}';
document.head.append(style);
const mk=(tag,cl,txt)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=txt;return x;};
showQuestion=function(){
  oldShowQuestion();
  if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==2)return;
  const d=transcribed['2025:pm1:2'];if(!d||!Array.isArray(d.sections)||d.sections.length!==17)return;
  const p=document.getElementById('questionText'),figs=Array.from(p.querySelectorAll('figure.pm-original-diagram'));
  if(figs.length!==4)return;
  const source=p.querySelector('.source');
  const root=mk('div','pm2-study-layout');
  const main=mk('section','pm2-study-block');main.append(mk('h3','','大問の問題文（要約・原文校正待ち）'));
  const copy=mk('div','pm2-study-copy');
  const nav=mk('div','pm2-study-nav');
  const prev=mk('button','','前の本文項目'),next=mk('button','','次の本文項目');
  prev.type=next.type='button';
  const status=mk('span','pm2-study-page-status');status.setAttribute('aria-live','polite');
  nav.append(prev,status,next);main.append(copy,nav);
  const chapters=d.sections.slice(0,-3);
  let position=0;
  function renderChapter(){
    const s=chapters[position];copy.textContent=s.body;
    status.textContent=`${position+1} / ${chapters.length}：${s.title}`;
    prev.disabled=position===0;next.disabled=position===chapters.length-1;
  }
  prev.onclick=()=>{if(position>0){position--;renderChapter();}};
  next.onclick=()=>{if(position<chapters.length-1){position++;renderChapter();}};
  renderChapter();
  const figBlock=mk('section','pm2-study-block');
  figBlock.append(mk('h3','','図表示部'));
  figBlock.append(mk('p','muted','現在は原本画像の暫定表示です。図1・2・4のSVG化、図3の表データ化は別工程で行います。'));
  const pick=mk('select','pm2-study-figure-select');pick.setAttribute('aria-label','図の切替');
  figs.forEach((f,i)=>{let o=document.createElement('option');o.value=String(i);o.textContent=f.querySelector('figcaption')?.textContent||`図${i+1}`;pick.append(o)});
  const host=mk('div','pm2-study-figures');figs.forEach(f=>host.append(f));
  figBlock.append(pick,host);
  function showFigure(n){
    pick.value=String(n);
    figs.forEach((f,i)=>{if(i!==n){const zoom=f.querySelector('.pm-diagram-zoom');if(zoom?.getAttribute('aria-expanded')==='true')zoom.click();}f.hidden=i!==n;});
    document.body.classList.remove('pm-figure-zoom-active');
  }
  pick.onchange=()=>showFigure(Number(pick.value));
  const choiceBlock=mk('section','pm2-study-block');
  choiceBlock.append(mk('h3','','設問選択部'));
  const choices=mk('div','pm2-study-choices');
  const questionBlock=mk('section','pm2-study-block');questionBlock.append(mk('h3','','選択された設問の問題文（要約）'));
  const qcopy=mk('div','pm2-study-copy');questionBlock.append(qcopy);
  const answerBlock=mk('section','pm2-study-block');answerBlock.append(mk('h3','','選択された設問の回答欄'));
  const label=mk('label','',''),ans=mk('textarea','pm2-subanswer-input');
  ans.id='pm2-q2-subanswer-input';label.htmlFor=ans.id;
  ans.style.cssText='display:block;width:100%;min-height:130px;margin-top:8px;';
  answerBlock.append(label,ans,mk('p','muted','設問別に保存します。原本と照合済みの最終問題文ではありません。'));
  let selected=1;
  const questionSections=d.sections.slice(-3);
  const figureMap={1:1,2:0,3:3};
  function renderQuestion(){
    qcopy.textContent=questionSections[selected-1].body;
    const saved=rec().subAnswers;
    ans.value=saved&&typeof saved==='object'&&typeof saved[String(selected)]==='string'?saved[String(selected)]:'';
    label.textContent=`設問${selected}の回答`;ans.setAttribute('aria-label',`設問${selected}の回答`);
    [...choices.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===selected)));
    showFigure(figureMap[selected]);
  }
  ans.oninput=()=>{const existing=rec().subAnswers;const map=existing&&typeof existing==='object'&&!Array.isArray(existing)?existing:{};put({subAnswers:{...map,[String(selected)]:ans.value}})};
  for(let i=1;i<=3;i++){let b=mk('button','',`設問${i}`);b.type='button';b.onclick=()=>{selected=i;renderQuestion()};choices.append(b)}
  choiceBlock.append(choices);
  root.append(main,figBlock,choiceBlock,questionBlock,answerBlock);
  if(source)root.append(source);
  p.replaceChildren(root);
  renderQuestion();
};
})();