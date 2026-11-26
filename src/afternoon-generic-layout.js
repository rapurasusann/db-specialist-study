/* 2025 PM I Q3 / PM II Q1 Q2: original-image-first structured study layout.
 * Source-based section notes are NOT certified verbatim transcription.
 * Keep other question layouts, image crop/zoom, and shared answer UI unchanged.
 */
(function () {
  'use strict';
  const targets = {'2025:pm1:3':3, '2025:pm2:1':3, '2025:pm2:2':2};
  const previousShowQuestion = showQuestion;
  const style = document.createElement('style');
  style.textContent = '.afg-layout{display:grid;gap:14px;padding:10px}.afg-block{min-width:0;border:1px solid #cbd8e5;border-radius:10px;padding:12px;background:white}.afg-block h3{font-size:1rem;margin:0 0 10px}.afg-copy{white-space:pre-wrap;line-height:1.75;overflow-wrap:anywhere}.afg-nav,.afg-choices{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.afg-nav{margin-top:12px}.afg-choices button[aria-pressed="true"]{background:#dceefa;font-weight:bold}.afg-figures figure[hidden]{display:none!important}.afg-figures figure{max-width:100%}.afg-block select{max-width:100%;padding:8px}.afg-answer{display:block;width:100%;min-height:130px;margin-top:8px}@media(max-width:650px){.afg-layout{padding:0}.afg-block{padding:10px}body:has(.afg-layout) #mobileStudyControls{display:none!important}}';
  document.head.append(style);
  const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
  showQuestion=function () {
    previousShowQuestion();
    const key=String(year)+':'+courseId+':'+String(number);
    if(!Object.prototype.hasOwnProperty.call(targets,key))return;
    const data=transcribed[key], expected=targets[key];
    if(!data || !Array.isArray(data.sections) || data.sections.length<=expected)return;
    const panel=document.getElementById('questionText');
    const figures=Array.from(panel.querySelectorAll('figure.pm-original-diagram'));
    if(!figures.length)return;
    const source=panel.querySelector('.source');
    const root=el('div','afg-layout');
    const main=el('section','afg-block');main.append(el('h3','','大問の問題文（原本に基づく要点・逐語転記未完了）'));
    const copy=el('div','afg-copy');const nav=el('div','afg-nav');
    const back=el('button','','前の本文区分'), next=el('button','','次の本文区分');
    back.type=next.type='button';
    const status=el('span','afg-status');status.setAttribute('aria-live','polite');
    const sourceButton=el('button','','原本ページを表示');sourceButton.type='button';
    const sourcePicker=el('select','');sourcePicker.setAttribute('aria-label','本文の原本ページ');
    function sourcePages(section){
      const m=section.title.match(/(\d+)(?:[〜～–-](\d+))?ページ/);
      if(!m)return [];
      const first=Number(m[1]),last=Number(m[2]||m[1]);
      if(first<data.sourcePage||last>data.sourceEndPage||last<first)return [];
      return Array.from({length:last-first+1},(_,i)=>first+i);
    }
    function setSourcePages(select,section){
      select.replaceChildren();
      for(const pg of sourcePages(section)){const option=el('option','',pg+'ページ');option.value=String(pg);select.append(option);}
    }
    function openSource(select){const pg=Number(select.value);if(!Number.isInteger(pg)||pg<data.sourcePage||pg>data.sourceEndPage)return;activePage=pg;loadPage();document.getElementById('localViewer')?.scrollIntoView({block:'start'});}
    sourceButton.onclick=()=>openSource(sourcePicker);
    nav.append(back,status,next,sourcePicker,sourceButton);main.append(copy,nav);
    const chapters=data.sections.slice(0,-expected);
    let chapter=0;
    function renderChapter(){const s=chapters[chapter];copy.textContent=s.title+'\n'+s.body;setSourcePages(sourcePicker,s);sourceButton.disabled=!sourcePicker.options.length;status.textContent=`${chapter+1} / ${chapters.length}（原本のページ区切りではなく内容区分）`;back.disabled=chapter===0;next.disabled=chapter===chapters.length-1;}
    back.onclick=()=>{if(chapter){chapter--;renderChapter();}};
    next.onclick=()=>{if(chapter<chapters.length-1){chapter++;renderChapter();}};
    renderChapter();
    const figBlock=el('section','afg-block');figBlock.append(el('h3','','図・表表示部（IPA原本画像）'));
    figBlock.append(el('p','muted','図・表は公式問題冊子の切り抜き画像です。省略や回答対象の空欄は原本のまま表示します。'));
    const picker=el('select','afg-figure-select');picker.setAttribute('aria-label','図・表を選択');
    const host=el('div','afg-figures');
    figures.forEach((f,i)=>{const o=el('option','',f.querySelector('figcaption')?.textContent||`図表${i+1}`);o.value=String(i);picker.append(o);host.append(f);});
    figBlock.append(picker,host);
    function selectFigure(i){if(!Number.isInteger(i)||i<0||i>=figures.length)return;picker.value=String(i);figures.forEach((f,j)=>{if(i!==j){const zoom=f.querySelector('.pm-diagram-zoom');if(zoom?.getAttribute('aria-expanded')==='true')zoom.click();}f.hidden=j!==i;});document.body.classList.remove('pm-figure-zoom-active');}
    picker.onchange=()=>selectFigure(Number(picker.value));
    const chooseBlock=el('section','afg-block');chooseBlock.append(el('h3','','設問選択部'));
    const choices=el('div','afg-choices');chooseBlock.append(choices);
    const qBlock=el('section','afg-block');qBlock.append(el('h3','','選択された設問の問題文（要点・原文校正待ち）'));
    const qcopy=el('div','afg-copy');
    const qsource=el('select','');qsource.setAttribute('aria-label','設問の原本ページ');
    const qopen=el('button','','設問の原本ページを表示');qopen.type='button';qopen.onclick=()=>openSource(qsource);
    const qnav=el('div','afg-nav');qnav.append(qsource,qopen);qBlock.append(qcopy,qnav);
    const aBlock=el('section','afg-block');aBlock.append(el('h3','','選択された設問の回答欄'));
    const answerLabel=el('label');const answer=el('textarea','afg-answer');
    answer.id='afg-subanswer';answerLabel.htmlFor=answer.id;aBlock.append(answerLabel,answer,el('p','muted','設問ごとに端末内へ自動保存します。従来の大問共通回答欄も残します。'));
    const questionSections=data.sections.slice(-expected);
    let selected=1;
    function renderQuestion(){
      const section=questionSections[selected-1];qcopy.textContent=section.title+'\n'+section.body;setSourcePages(qsource,section);qopen.disabled=!qsource.options.length;
      const saved=rec().subAnswers;
      answer.value=saved&&typeof saved==='object'&&typeof saved[String(selected)]==='string'?saved[String(selected)]:'';
      answerLabel.textContent=`設問${selected}の回答`;answer.setAttribute('aria-label',`設問${selected}の回答`);
      Array.from(choices.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===selected)));
      // Each selected question opens its most relevant original figure. Users can still change the selection.
      const recommendedFigures = {
        '2025:pm1:3':[2,3,4], // Q1 SQL table, Q2 allocation flow, Q3 stock-reflection flow
        '2025:pm2:1':[5,6,10], // Q1 P2/P3 SQL, Q2 settlement sequence, Q3 revised sequence
        '2025:pm2:2':[2,7] // Q1 existing model, Q2 revised model
      };
      const recommendedIndex=recommendedFigures[key]?.[selected-1];
      if(Number.isInteger(recommendedIndex)&&recommendedIndex<figures.length)selectFigure(recommendedIndex);
    }
    answer.oninput=()=>{const old=rec().subAnswers;const current=old&&typeof old==='object'&&!Array.isArray(old)?old:{};put({subAnswers:{...current,[String(selected)]:answer.value}});};
    for(let i=1;i<=expected;i++){const b=el('button','',`設問${i}`);b.type='button';b.onclick=()=>{selected=i;renderQuestion();};choices.append(b);}
    root.append(main,figBlock,chooseBlock,qBlock,aBlock);
    if(source)root.append(source);
    panel.replaceChildren(root);
    selectFigure(0);renderQuestion();
  };
})();
