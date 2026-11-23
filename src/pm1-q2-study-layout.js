/* 2025 PM1 Q2 PC study layout: page-grouped provisional summaries; Figure 3 editable HTML table. */
(function(){
'use strict';
const oldShowQuestion=showQuestion;
const style=document.createElement('style');
style.textContent='.pm2-study-layout{display:grid;gap:14px;padding:10px}.pm2-study-block{border:1px solid #cbd8e5;border-radius:10px;padding:12px;background:#fff;min-width:0}.pm2-study-block h3{font-size:1rem;margin:0 0 10px}.pm2-study-copy{white-space:pre-wrap;line-height:1.75;overflow-wrap:anywhere}.pm2-study-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}.pm2-study-figures figure[hidden]{display:none!important}.pm2-study-figures figure{max-width:100%}.pm2-study-block select{max-width:100%;padding:8px}.pm2-sheet-wrap{overflow-x:auto;max-width:100%;margin-top:10px}.pm2-sheet{border-collapse:collapse;min-width:900px;font-size:14px;white-space:nowrap}.pm2-sheet caption{text-align:left;font-weight:bold;margin-bottom:5px}.pm2-sheet th,.pm2-sheet td{border:1px solid #334155;padding:5px 8px;text-align:center}.pm2-sheet th{background:#f1f5f9}.pm2-fig3-original-toggle{margin:8px 0;padding:7px}.pm2-sheet-note{font-size:.85rem;color:#475569}.pm2-study-choices{display:flex;gap:8px;flex-wrap:wrap}.pm2-study-choices button[aria-pressed="true"]{background:#dceefa;font-weight:bold}@media(max-width:650px){.pm2-study-layout{padding:0}.pm2-study-block{padding:10px}}';
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
  const prev=mk('button','','前の本文ページ'),next=mk('button','','次の本文ページ');
  prev.type=next.type='button';
  const status=mk('span','pm2-study-page-status');status.setAttribute('aria-live','polite');
  const openOriginal=mk('button','pm2-source-page-button','原本12ページを表示');openOriginal.type='button';
  nav.append(prev,status,next,openOriginal);main.append(copy,nav);
  // The 17 source-data sections are topic summaries, not an exact transcript.
  // Group them by related booklet pages; spanning sections may continue onto the next page.
  const pageGroups=[
    {page:12,indices:[0,1,2,3]},
    {page:13,indices:[3,4,5,6]},
    {page:14,indices:[7,8,9]},
    {page:15,indices:[10,11,12]},
    {page:16,indices:[13,14]},
    {page:17,indices:[15,16]}
  ];
  let position=0;
  function renderChapter(){
    const group=pageGroups[position];
    const exact=window.PM1Q2SourcePages?.[String(group.page)];
    copy.textContent=exact||group.indices.map(i=>d.sections[i].title+'\n'+d.sections[i].body).join('\n\n');
    status.textContent=`${position+1} / ${pageGroups.length}：原本${group.page}ページ${exact?"の転記候補（未校正）":"に関係する要約"}`;
    openOriginal.textContent=`原本${group.page}ページを下の問題冊子で表示`;
    prev.disabled=position===0;next.disabled=position===pageGroups.length-1;
  }
  openOriginal.onclick=()=>{
    const pg=pageGroups[position].page;
    if(typeof activePage!=='number'||typeof loadPage!=='function')return;
    activePage=pg;loadPage();
    const viewer=document.getElementById('localViewer');
    if(viewer){viewer.scrollIntoView({block:'start'});}
  };
  prev.onclick=()=>{if(position>0){position--;renderChapter();}};
  next.onclick=()=>{if(position<pageGroups.length-1){position++;renderChapter();}};
  renderChapter();
  const figBlock=mk('section','pm2-study-block');
  figBlock.append(mk('h3','','図表示部'));
  figBlock.append(mk('p','muted','図1・2・4は原本画像による暫定表示です。図3は文字と表で再構成しました。本文は要約であり、原文の完全転記ではありません。'));
  const pick=mk('select','pm2-study-figure-select');pick.setAttribute('aria-label','図の切替');
  figs.forEach((f,i)=>{let o=document.createElement('option');o.value=String(i);o.textContent=f.querySelector('figcaption')?.textContent||`図${i+1}`;pick.append(o)});
  const host=mk('div','pm2-study-figures');figs.forEach(f=>host.append(f));
  figBlock.append(pick,host);
  // Figure 3: reconstruct the delivery-adjustment sheet as selectable HTML cells.
  const fig3=figs[2];
  const sheetWrap=mk('div','pm2-sheet-wrap');
  const sheet=mk('table','pm2-sheet');
  const cap=mk('caption','','図3　納期調整シートの帳票サンプル（表で再構成）');sheet.append(cap);
  const head=document.createElement('thead');
  const first=document.createElement('tr');
  for(const [name,n] of [['得意先納品要求',3],['納期回答',4],['出荷',1]]){
    const c=mk('th','',name);c.colSpan=n;first.append(c);
  }
  const second=document.createElement('tr');
  const heads=['要求番号','要求納期年月日時分','要求数量','納期調整番号','納品可能年月日時分','納品可能数量','確定フラグ','出荷番号'];
  heads.forEach(x=>{const t=mk('th','',x);t.scope='col';second.append(t)});
  head.append(first,second);sheet.append(head);
  const body=document.createElement('tbody');
  const entries=[
    ['001','2025-01-09 12:00','200','01','2025-01-09 12:00','200','確定','2617'],
    ['002','2025-01-12 14:00','300','01','2025-01-12 14:00','300','確定','2879'],
    ['003','2025-01-14 11:00','50','01','2025-01-12 14:00','50','確定',''],
    ['004','2025-01-15 16:00','600','01','2025-01-15 16:00','100','確定',''],
    ['','','','02','2025-01-16 11:00','500','','']
  ];
  const contract=mk('div','pm2-sheet-note','契約番号：000273 ／ 空欄は原本に値の記載がない欄です。');
  entries.forEach((arr,i)=>{const tr=document.createElement('tr');arr.forEach((x,j)=>{const td=mk('td','',x);if(j===0&&i===4)td.setAttribute('aria-label','前行と同じ要求番号');tr.append(td)});body.append(tr)});
  sheet.append(body);sheetWrap.append(contract,sheet);
  const toggle=mk('button','pm2-fig3-original-toggle','IPA原本画像を表示して比較');toggle.type='button';toggle.setAttribute('aria-pressed','false');
  const originalViewport=fig3.querySelector('.pm-diagram-viewport');
  const originalZoom=fig3.querySelector('.pm-diagram-zoom');
  const originalHint=fig3.querySelector('.pm-diagram-hint');
  const changeSource=(useImage)=>{
    toggle.setAttribute('aria-pressed',String(useImage));
    toggle.textContent=useImage?'表の表示に戻す':'IPA原本画像を表示して比較';
    sheetWrap.hidden=useImage;
    if(originalViewport)originalViewport.hidden=!useImage;
    if(originalZoom)originalZoom.hidden=!useImage;
    if(originalHint)originalHint.hidden=!useImage;
  };
  fig3.insertBefore(toggle,fig3.querySelector('.pm-diagram-viewport'));
  fig3.insertBefore(sheetWrap,toggle.nextSibling);
  toggle.onclick=()=>changeSource(toggle.getAttribute('aria-pressed')!=='true');
  changeSource(false);

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