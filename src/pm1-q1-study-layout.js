/* PM1 Q1 structured study layout; no changes to other questions or saved answers. */
(function () {
  'use strict';
  const previousShowQuestion = showQuestion;
  const style = document.createElement('style');
  style.textContent = `
    .pm1-study-layout{display:grid;gap:14px;padding:10px}
    .pm1-study-block{border:1px solid #cbd8e5;border-radius:10px;padding:12px;background:#fff;min-width:0}
    .pm1-study-block h3{font-size:1rem;margin:0 0 10px}
    .pm1-study-copy{white-space:pre-wrap;line-height:1.75;overflow-wrap:anywhere}
    .pm1-study-nav{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:12px}
    .pm1-study-nav button:disabled{opacity:.5;cursor:not-allowed}
    .pm1-study-figures figure[hidden]{display:none!important}
    .pm1-study-block select{max-width:100%;padding:8px;border:1px solid #9cb4c9;border-radius:6px}
    .pm1-study-choices{display:flex;gap:8px;flex-wrap:wrap}
    .pm1-study-choices button[aria-pressed="true"]{background:#dceefa;border-color:#448ac1;font-weight:bold}
    .pm1-study-figures .pm-original-diagram{max-width:100%} @media(max-width:650px){body:has(.pm1-study-layout) #mobileStudyControls{display:none!important}.pm1-study-layout{padding:0;gap:10px}.pm1-study-block{padding:10px}.pm1-study-copy{line-height:1.65}}
  `;
  document.head.append(style);
  function el(tag,cls,txt){
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(txt!==undefined)x.textContent=txt;
    return x;
  }
  showQuestion=function(){
    previousShowQuestion();
    if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==1)return;
    const data=transcribed['2025:pm1:1'];
    if(!data||!Array.isArray(data.sections)||data.sections.length!==6)return;
    const panel=document.getElementById('questionText');
    const figures=Array.from(panel.querySelectorAll('figure.pm-original-diagram'));
    if(figures.length!==3)return;
    const source=panel.querySelector('.source');
    const layout=el('div','pm1-study-layout');
    const main=el('section','pm1-study-block');
    const heading=el('h3','', '大問の問題文');
    const copy=el('div','pm1-study-copy');
    const nav=el('div','pm1-study-nav');
    const back=el('button','','前の本文ページ'), next=el('button','','次の本文ページ');
    back.type=next.type='button';
    const status=el('span','pm1-study-page-status');
    status.setAttribute('aria-live','polite');
    nav.append(back,status,next);main.append(heading,copy,nav);
    let page=0;
    function renderPage(){
      const section=data.sections[page];
      // Page 6 is the question sheet; the selected question is displayed separately.
      copy.textContent=page===5?'設問は下の「設問選択部」で選択して確認してください。':section.body;
      status.textContent=`${page+1} / ${data.sections.length}：${section.title}`;
      back.disabled=page===0;next.disabled=page===data.sections.length-1;
    }
    back.onclick=()=>{if(page>0){page--;renderPage();}};
    next.onclick=()=>{if(page<5){page++;renderPage();}};
    renderPage();
    const diagramBlock=el('section','pm1-study-block');
    diagramBlock.append(el('h3','','図表示部'));
    const picker=el('select','pm1-study-figure-select');
    picker.setAttribute('aria-label','表示する図を切り替える');
    figures.forEach((fig,i)=>{
      const o=document.createElement('option');o.value=String(i);
      o.textContent=fig.querySelector('figcaption')?.textContent||`図${i+1}`;
      picker.append(o);
    });
    const figureHost=el('div','pm1-study-figures');
    figures.forEach(f=>figureHost.append(f));
    diagramBlock.append(picker,figureHost);
    function selectDiagram(i){
      picker.value=String(i);
      figures.forEach((f,k)=>{
        if(k!==i){
          const zoom=f.querySelector('.pm-diagram-zoom');
          if(zoom?.getAttribute('aria-expanded')==='true')zoom.click();
        }
        f.hidden=k!==i;
      });
      document.body.classList.remove('pm-figure-zoom-active');
    }
    picker.onchange=()=>selectDiagram(Number(picker.value));
    const chooseBlock=el('section','pm1-study-block');
    chooseBlock.append(el('h3','','設問選択部'));
    const buttons=el('div','pm1-study-choices');
    const answerBlock=el('section','pm1-study-block');
    answerBlock.append(el('h3','','選択された設問の問題文'));
    const questionCopy=el('div','pm1-study-copy');
    answerBlock.append(questionCopy);
    const finalBody=data.sections[5].body;
    const splits=finalBody.split(/(?=設問[12]　)/u).filter(Boolean);
    const q1=splits.find(s=>s.startsWith('設問1'))||'設問1の本文を確認してください。';
    const q2=splits.find(s=>s.startsWith('設問2'))||'設問2の本文を確認してください。';
    let selected=1;
    const subAnswerBlock=el('section','pm1-study-block pm1-subanswer-block');
    subAnswerBlock.append(el('h3','','選択された設問の回答欄'));
    const subAnswerLabel=el('label','pm1-subanswer-label');
    const subAnswer=el('textarea','pm1-subanswer-input');
    subAnswer.id='pm1-subanswer-input';
    subAnswerLabel.htmlFor=subAnswer.id;
    subAnswer.style.cssText='display:block;width:100%;min-height:130px;margin-top:8px;';
    const subAnswerNote=el('p','muted','設問別に自動保存します。従来の大問共通回答は既存欄に残します。');
    subAnswerBlock.append(subAnswerLabel,subAnswer,subAnswerNote);
    subAnswer.oninput=()=>{
      const prior=rec().subAnswers;
      const answers=prior&&typeof prior==='object'&&!Array.isArray(prior)?prior:{};
      put({subAnswers:{...answers,[String(selected)]:subAnswer.value}});
    };
    function renderQuestion(){
      questionCopy.textContent=selected===1?q1:q2;
      const stored=rec().subAnswers;
      subAnswerLabel.textContent=`設問${selected}の回答`;
      subAnswer.setAttribute('aria-label',`設問${selected}の回答`);
      subAnswer.value=stored&&typeof stored==='object'&&typeof stored[String(selected)]==='string'?stored[String(selected)]:'';
      Array.from(buttons.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i+1===selected)));
      selectDiagram(selected===1?0:2);
    }
    for(let i=1;i<=2;i++){
      const b=el('button','',`設問${i}`);b.type='button';
      b.onclick=()=>{selected=i;renderQuestion();};
      buttons.append(b);
    }
    chooseBlock.append(buttons);
    layout.append(main,diagramBlock,chooseBlock,answerBlock,subAnswerBlock);
    panel.replaceChildren(layout);
    if(source)layout.append(source);
    renderQuestion();
  };
})();
