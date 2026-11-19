// Reusable view for VERIFIED afternoon materials. Does not modify legacy progress.
// NOT connected to index.html until complete source transcriptions are verified.
export function createPmSubquestionView(doc,{loadAnswers=()=>({}),saveAnswer=()=>{}}={}){
 if(!doc||!Array.isArray(doc.introductionPages)||!Array.isArray(doc.materials)||!Array.isArray(doc.subquestions))throw Error('INVALID_PM_DOCUMENT');
 const root=document.createElement('section');root.className='pmStructured';root.setAttribute('aria-label','午後試験の設問別学習');
 const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
 const intro=root.appendChild(make('section',undefined,'pmIntro'));intro.append(make('h3','大問表示部'));
 const introText=intro.appendChild(make('div',undefined,'pmIntroText'));
 if(doc.status!=='FULL_SOURCE_VERIFICATION'){
  const notice=intro.appendChild(make('p','この問題は原本の転記・照合が未完了です。表示中の大問本文は要約を含み、試験問題の全文ではありません。','muted'));
  notice.setAttribute('role','status');
 }
 if(doc.source){
  const sourceLink=intro.appendChild(make('a','IPA公式問題冊子で原文を確認する'));
  sourceLink.href=doc.source;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
 }
 const pager=intro.appendChild(make('div',undefined,'toolbar'));
 const prev=pager.appendChild(make('button','前ページ'));prev.type='button';
 const indicator=pager.appendChild(make('span',''));
 const next=pager.appendChild(make('button','次ページ'));next.type='button';
 const mats=root.appendChild(make('section',undefined,'pmMaterials'));mats.append(make('h3','図・表表示部'));
 const materialSelector=mats.appendChild(make('select'));materialSelector.setAttribute('aria-label','表示する図・表');
 const materialBody=mats.appendChild(make('div',undefined,'pmMaterialBody'));
 const questionNav=root.appendChild(make('section',undefined,'pmQuestionNav'));questionNav.append(make('h3','設問選択部'));
 const buttons=questionNav.appendChild(make('div',undefined,'toolbar'));
 const questionArea=root.appendChild(make('section',undefined,'pmQuestionText'));questionArea.append(make('h3','選択された設問の問題文'));
 const prompt=questionArea.appendChild(make('p',''));
 const answerArea=root.appendChild(make('section',undefined,'pmQuestionAnswer'));answerArea.append(make('h3','回答欄'));
 const answer=answerArea.appendChild(make('textarea'));answer.rows=5;answer.setAttribute('aria-label','選択中の設問の回答');
 const warning=answerArea.appendChild(make('p',''));warning.className='muted';
 let page=0,selected=doc.subquestions[0]?.id||'',selectedMaterial='auto';
 let answers={...(loadAnswers()||{})};
 const sub=()=>doc.subquestions.find(q=>q.id===selected);
 function renderIntro(){
  const pages=doc.introductionPages;
  introText.replaceChildren();
  const item=pages[page];
  if(item){
   introText.append(make('p','原本 '+item.sourcePage+' ページ'));
   for(const text of item.paragraphs||[])introText.append(make('p',text));
   if(!item.complete)introText.append(make('p','このページは要約・作業メモであり、原文の全文ではありません。解答時は公式原本を確認してください。','muted'));
  }else introText.append(make('p','大問本文は未整備です。公式原本を確認してください。','muted'));
  indicator.textContent=(pages.length?String(page+1):'0')+' / '+pages.length;
  prev.disabled=page<=0;next.disabled=page>=pages.length-1;
 }
 function materialFor(question){
  const ids=question?.materialIds||[];
  if(selectedMaterial==='auto')return doc.materials.filter(m=>ids.includes(m.id));
  return doc.materials.filter(m=>m.id===selectedMaterial);
 }
 function renderMaterials(){
  const items=materialFor(sub());
  materialBody.replaceChildren();
  if(!items.length){materialBody.append(make('p','この設問に関連する図・表はありません。','muted'));return}
  for(const mat of items){
   const box=materialBody.appendChild(make('div',undefined,'pmMaterialItem'));
   box.append(make('h4',mat.title));
   if(!mat.verifiedStructure){box.append(make('p','図・表のテキスト再構成は未整備です。公式原本の '+mat.sourcePage+' ページを確認してください。','muted'));continue}
   if(mat.kind==='schema'){
    const table=box.appendChild(make('table'));
    const head=table.appendChild(make('tr'));
    head.append(make('th','関係名'));head.append(make('th','属性（［ ］は原本の空欄）'));
    for(const entry of mat.entries||[]){
     const row=table.appendChild(make('tr'));row.append(make('th',entry.name));
     const cell=row.appendChild(make('td'));
     entry.attributes.forEach((attribute,i)=>{
      if(i)cell.append(document.createTextNode('、'));
      const name=cell.appendChild(make('span',attribute));
      if(entry.keyColumns?.includes(i))name.style.textDecoration='underline';
     });
    }
   }else if(mat.kind==='table'){
    const table=box.appendChild(make('table'));
    if(mat.columns){const head=table.appendChild(make('tr'));for(const val of mat.columns)head.append(make('th',String(val)))}
    for(const row of mat.rows||[]){const tr=table.appendChild(make('tr'));for(const val of row)tr.append(make('td',String(val)))}
   }else if(mat.kind==='code'){
    box.append(make('pre',mat.text||''));
   }else if(mat.kind==='svg'&&Array.isArray(mat.nodes)){
    // Safe native SVG elements: no injected HTML, image files or event handlers.
    const ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 960 700');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',mat.title+'。'+(mat.note||''));
    svg.style.maxWidth='100%';svg.style.height='auto';
    svg.style.minWidth='640px';
    const byId=new Map(mat.nodes.map(n=>[n.id,n]));
    const parentPairs=new Set((mat.inheritance||[]).flatMap(g=>g.slice(1).map(c=>g[0]+'|'+c)));
    function line(x1,y1,x2,y2){
     const el=document.createElementNS(ns,'line');
     for(const [k,v] of Object.entries({x1,y1,x2,y2}))el.setAttribute(k,String(v));
     el.setAttribute('stroke','currentColor');el.setAttribute('stroke-width','1.5');
     svg.appendChild(el);
    }
    for(const [a,b] of mat.edges||[]){
     const p=byId.get(a),q=byId.get(b);
     if(!p||!q)continue;
     const startX=p.x+52,startY=p.y+36,endX=q.x+52,endY=q.y;
     line(startX,startY,endX,endY);
     if(!parentPairs.has(a+'|'+b)){
      // Relationships are directional in this simplified diagram.
      const arrow=document.createElementNS(ns,'circle');
      arrow.setAttribute('cx',String(endX));arrow.setAttribute('cy',String(endY));
      arrow.setAttribute('r','2.5');arrow.setAttribute('fill','currentColor');svg.appendChild(arrow);
     }
    }
    for(const node of mat.nodes){
     const rect=document.createElementNS(ns,'rect');
     rect.setAttribute('x',String(node.x));rect.setAttribute('y',String(node.y));
     rect.setAttribute('width','106');rect.setAttribute('height','42');
     rect.setAttribute('fill','none');rect.setAttribute('stroke','currentColor');
     svg.appendChild(rect);
     const lines=String(node.label).split('\\n');
     lines.forEach((lineText,i)=>{
      const txt=document.createElementNS(ns,'text');
      txt.setAttribute('x',String(node.x+53));
      txt.setAttribute('y',String(node.y+(lines.length===1?25:17)+i*15));
      txt.setAttribute('font-size','13');txt.setAttribute('text-anchor','middle');
      txt.setAttribute('fill','currentColor');txt.textContent=lineText;svg.appendChild(txt);
     });
    }
    const viewport=box.appendChild(make('div',undefined,'pmSvgViewport'));
    viewport.style.overflowX='auto';viewport.appendChild(svg);
    if(mat.note)box.append(make('p',mat.note,'muted'));
   }else box.append(make('p','対応する図の表示形式を確認中です。','muted'));
  }
 }
 function renderQuestion(){
  buttons.replaceChildren();
  for(const q of doc.subquestions){
   const b=buttons.appendChild(make('button',q.label));b.type='button';b.setAttribute('aria-pressed',String(q.id===selected));
   b.addEventListener('click',()=>{selected=q.id;selectedMaterial='auto';materialSelector.value='auto';renderQuestion();renderMaterials()});
  }
  prompt.textContent=sub()?.text||'設問の問題文は未整備です。';
  answer.value=answers[selected]||'';
  warning.textContent='設問ごとに回答を分離します。原本未整備の内容は公式原本で確認してください。';
 }
 materialSelector.appendChild(new Option('自動：選択中の設問に関連する図・表','auto'));
 for(const mat of doc.materials)materialSelector.appendChild(new Option(mat.title,mat.id));
 materialSelector.addEventListener('change',()=>{selectedMaterial=materialSelector.value;renderMaterials()});
 prev.addEventListener('click',()=>{page=Math.max(0,page-1);renderIntro()});
 next.addEventListener('click',()=>{page=Math.min(doc.introductionPages.length-1,page+1);renderIntro()});
 answer.addEventListener('input',()=>{if(!selected)return;answers[selected]=answer.value;saveAnswer(selected,answer.value)});
 renderIntro();renderQuestion();renderMaterials();
 return root;
}
