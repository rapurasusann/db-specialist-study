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
 const currentSourcePage=doc.source?pager.appendChild(make('a','')):null;
 if(currentSourcePage){currentSourcePage.target='_blank';currentSourcePage.rel='noopener noreferrer'}
 const mats=root.appendChild(make('section',undefined,'pmMaterials'));mats.append(make('h3','図・表表示部'));
 const materialSelector=mats.appendChild(make('select'));materialSelector.setAttribute('aria-label','表示する図・表');
 const materialBody=mats.appendChild(make('div',undefined,'pmMaterialBody'));
 const questionNav=root.appendChild(make('section',undefined,'pmQuestionNav'));questionNav.append(make('h3','設問選択部'));
 const buttons=questionNav.appendChild(make('div',undefined,'toolbar'));
 const questionArea=root.appendChild(make('section',undefined,'pmQuestionText'));questionArea.append(make('h3','選択された設問の問題文'));
 const questionGroup=questionArea.appendChild(make('h4',''));
 const prompt=questionArea.appendChild(make('p',''));
 const promptNotice=questionArea.appendChild(make('p','','muted'));
 const relatedPages=questionArea.appendChild(make('div',undefined,'pmRelatedPages toolbar'));
 relatedPages.setAttribute('aria-label','この設問に関連する大問ページ');
 const questionSourceLink=doc.source?questionArea.appendChild(make('a','設問の原本11ページを開く')):null;
 if(questionSourceLink){questionSourceLink.target='_blank';questionSourceLink.rel='noopener noreferrer'}
 const answerArea=root.appendChild(make('section',undefined,'pmQuestionAnswer'));answerArea.append(make('h3','回答欄'));
 const answer=answerArea.appendChild(make('textarea'));answer.rows=5;answer.setAttribute('aria-label','選択中の設問の回答');
 const warning=answerArea.appendChild(make('p',''));warning.className='muted';
 warning.setAttribute('role','status');warning.setAttribute('aria-live','polite');
 const retry=answerArea.appendChild(make('button','再保存'));retry.type='button';retry.hidden=true;
 let page=0,selected=doc.subquestions[0]?.id||'',selectedMaterial='auto';
 let answers={...(loadAnswers()||{})};
 const unsaved=new Set();
 const sub=()=>doc.subquestions.find(q=>q.id===selected);
 function renderIntro(){
  const pages=doc.introductionPages;
  introText.replaceChildren();
  const item=pages[page];
  if(item){
   introText.append(make('p','原本 '+item.sourcePage+' ページ'));
   for(const text of item.paragraphs||[]){
    const sectionHeader=/^【[^】]+】/.test(text);
    introText.append(make(sectionHeader?'h4':'p',text,sectionHeader?'pmIntroHeading':undefined));
   }
   if(!item.complete)introText.append(make('p','このページは要約・作業メモであり、原文の全文ではありません。解答時は公式原本を確認してください。','muted'));
  }else introText.append(make('p','大問本文は未整備です。公式原本を確認してください。','muted'));
  indicator.textContent=(pages.length?String(page+1):'0')+' / '+pages.length;
  prev.disabled=page<=0;next.disabled=page>=pages.length-1;
  if(currentSourcePage){
   const sourcePage=item?.sourcePage;
   currentSourcePage.textContent=Number.isInteger(sourcePage)&&sourcePage>0?'原本の'+sourcePage+'ページを開く':'IPA原本を開く';
   currentSourcePage.href=doc.source.split('#')[0]+(Number.isInteger(sourcePage)&&sourcePage>0?'#page='+sourcePage:'');
  }
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
   if(doc.source && Number.isInteger(mat.sourcePage) && mat.sourcePage>0){
    const originalLink=box.appendChild(make('a','IPA公式問題冊子：'+mat.sourcePage+'ページを開く'));
    // Official booklet page and PDF page align for this source; explicit
    // sourcePage metadata is maintained per material.
    originalLink.href=doc.source.split('#')[0]+'#page='+mat.sourcePage;
    originalLink.target='_blank';
    originalLink.rel='noopener noreferrer';
   }
   // A single toggled display flag must not expose unverified Figure 2.
   // The preview entry also validates the complete document, but this
   // reusable view must fail closed when called directly with draft data.
   const unresolvedFig2=mat.id==='fig2'&&(
    mat.sourceTranscriptionVerified!==true||mat.keyNotationVerified!==true||
    !Array.isArray(mat.entries)||mat.entries.some(e=>
     e.primaryKeyCandidates?.length||e.keyAudit?.includes('UNVERIFIED'))
   );
   // Source-checked review tables (Figures 2 and 3) render only individually
   // audited marks, never infer or fill incomplete source/blank answers.
   if((mat.id==='fig2'||mat.id==='fig3')&&mat.verifiedStructure===false&&
      mat.transcriptionStage==='TEXT_DRAFT_PARTIAL_KEY_AUDIT'&&
      mat.sourceTranscriptionVerified===false&&mat.keyNotationVerified===false){
    const auditMarks=(mat.entries||[]).flatMap(row=>row.keyAudit||[]);
    const pkCount=auditMarks.filter(k=>k==='PK_SOLID').length;
    const fkCount=auditMarks.filter(k=>k==='FK_DASHED').length;
    const pendingCount=auditMarks.filter(k=>k==='UNVERIFIED').length;
    box.append(make('p',`作業中の関係スキーマです。原本${mat.sourcePage}ページで確認済みの主キー${pkCount}属性は実線、外部キー${fkCount}属性は破線で表示します。未確認${pendingCount}属性のキー下線は省略します。空欄は未回答です。`,'muted'));
    const table=box.appendChild(make('table'));
    table.className=mat.id==='fig2'?'pmFig2ReviewTable':'pmFig3ReviewTable';
    const head=table.appendChild(make('tr'));
    head.append(make('th','関係名'));
    head.append(make('th','属性（確認済みのキーだけ下線表示）'));
    for(const row of mat.entries||[]){
     const tr=table.appendChild(make('tr'));
     const relation=tr.appendChild(make('th',row.name));
     const pending=(row.keyAudit||[]).filter(k=>k==='UNVERIFIED').length;
     relation.append(make('span',`（未確認${pending}）`,'muted'));
     const cell=tr.appendChild(make('td'));
     row.attributes.forEach((attribute,i)=>{
      if(i)cell.appendChild(document.createTextNode('、'));
      const mark=cell.appendChild(make('span',attribute));
      // Only source-page-matched marks are visible. Candidate keys and
      // source-incomplete rows never receive inferred underline styles.
      if(row.auditSourcePages?.[i]===mat.sourcePage){
       if(row.keyAudit?.[i]==='PK_SOLID'&&row.primaryKeyColumns?.includes(i))
        mark.classList.add('pmPrimaryKey');
       if(row.keyAudit?.[i]==='FK_DASHED'&&row.foreignKeyColumns?.includes(i))
        mark.classList.add('pmForeignKey');
      }
     });
    }
    continue;
   }
   // Review-only Fig.1: display only traced shapes; never mark the whole
   // figure as verified and never invent any missing exam relationships.
   if(mat.id==='fig1'&&mat.verifiedStructure===false&&mat.partialSvgSource?.status==='REVIEW_ONLY'){
    const data=mat.partialSvgSource,ns='http://www.w3.org/2000/svg';
    const notice=box.appendChild(make('p','作業中の再構成図（原本との最終照合は未完了）','muted'));
    notice.setAttribute('role','status');
    const viewport=box.appendChild(make('div',undefined,'pmSvgViewport'));
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',data.viewBox);
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label','図1の作業中の再構成図。空欄aと欠落関係は解答されていません。');
    svg.setAttribute('class','pmModelSvg');
    const element=(name,attrs={})=>{
     const el=document.createElementNS(ns,name);
     for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
     svg.appendChild(el);return el;
    };
    const path=(points)=>element('polyline',{
     points:points.map(p=>p.join(',')).join(' '),
     fill:'none',stroke:'currentColor','stroke-width':1.7
    });
    for(const poly of data.arrows||[]){
     path(poly);
     const last=poly.at(-1),prev=poly.at(-2);
     if(last&&prev){
      const angle=Math.atan2(last[1]-prev[1],last[0]-prev[0]),size=7;
      const wing=a=>[last[0]-size*Math.cos(angle+a),last[1]-size*Math.sin(angle+a)];
      path([wing(Math.PI/6),last,wing(-Math.PI/6)]);
     }
    }
    const knownNodeIds=new Set(mat.nodes.map(n=>n.id));
    for(const group of data.subtypeGroups||[]){
     // Never draw a review-only inheritance edge if it is not backed by
     // the printed page, or if its referenced entities are missing.
     if(group.sourcePage!==mat.sourcePage||!knownNodeIds.has(group.parentId)||
        !Array.isArray(group.childIds)||group.childIds.length!==2||
        !group.childIds.every(id=>knownNodeIds.has(id))||
        !Array.isArray(group.children)||group.children.length!==group.childIds.length)continue;
     const [x,y]=group.apex,bar=group.bar;
     if(group.parent)path(group.parent);
     // A small open specialization triangle above a common subtype bar.
     path([[x,y],[x-8,y+14],[x+8,y+14],[x,y]]);
     path([[x,y+14],[x,bar[0][1]]]);
     path(bar);
     for(const p of group.children||[])path([[p[0],bar[0][1]],p]);
    }
    const indexed=new Map(mat.nodes.map(node=>[node.id,node]));
    for(const entry of data.boxes||[]){
     const [id,x,y,w,h]=entry;
     const n=indexed.get(id);if(!n)continue;
     element('rect',{x,y,width:w,height:h,fill:'none',stroke:'currentColor','stroke-width':1.5});
     if(id==='a'){
      element('rect',{x:x+18,y:y+9,width:w-36,height:h-18,fill:'none',stroke:'currentColor','stroke-width':1.5});
     }
     const lines=String(n.label).split('\\n');
     lines.forEach((line,i)=>{
      const t=element('text',{x:x+w/2,y:y+h/2+(i-(lines.length-1)/2)*14+4,
       'font-size':13,'text-anchor':'middle',fill:'currentColor'});
      t.textContent=line;
     });
    }
    viewport.appendChild(svg);
    if(mat.note)box.append(make('p',mat.note,'muted'));
    continue;
   }
   if(!mat.verifiedStructure||unresolvedFig2){box.append(make('p','図・表のテキスト再構成は未整備です。上記のIPA公式原本を確認してください。','muted'));continue}
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
      // Distinguish the IPA booklet's solid PK underline from dashed FK
      // underline. Both can apply to the same attribute.
      if(entry.primaryKeyColumns?.includes(i))name.classList.add('pmPrimaryKey');
      if(entry.foreignKeyColumns?.includes(i))name.classList.add('pmForeignKey');
      if(entry.primaryKeyColumns?.includes(i)&&entry.foreignKeyColumns?.includes(i))
       name.classList.add('pmBothKeys');
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
    svg.classList.add('pmModelSvg');
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
    viewport.appendChild(svg);
    if(mat.note)box.append(make('p',mat.note,'muted'));
   }else box.append(make('p','対応する図の表示形式を確認中です。','muted'));
  }
 }
 function renderQuestion(){
  // Keep button nodes stable so keyboard focus is not lost during selection.
  if(!buttons.children.length){
   for(const q of doc.subquestions){
    const b=buttons.appendChild(make('button',q.label));b.type='button';
    b.addEventListener('click',()=>{selected=q.id;selectedMaterial='auto';materialSelector.value='auto';renderQuestion();renderMaterials()});
   }
  }
  Array.from(buttons.children).forEach((b,i)=>
   b.setAttribute('aria-pressed',String(doc.subquestions[i]?.id===selected)));
  questionGroup.textContent=selected==='s2'?'設問2：拡充後の関係スキーマ':'設問1：現状の概念データモデルと関係スキーマ';
  prompt.textContent=sub()?.text||'設問の問題文は未整備です。';
  relatedPages.replaceChildren();
  const related=Array.isArray(sub()?.relatedIntroPages)?sub().relatedIntroPages:[];
  for(const sourcePage of [...new Set(related)]){
   const index=doc.introductionPages.findIndex(p=>p.sourcePage===sourcePage);
   if(index<0)continue; // No fabricated local page for absent source sections.
   const shortcut=relatedPages.appendChild(make('button',sourcePage+'ページの大問を見る'));
   shortcut.type='button';
   shortcut.setAttribute('aria-label','大問の'+sourcePage+'ページを表示');
   shortcut.addEventListener('click',()=>{page=index;renderIntro()});
  }
  if(questionSourceLink){
   const sourcePage=sub()?.sourcePage;
   questionSourceLink.textContent=Number.isInteger(sourcePage)?'原本の設問（'+sourcePage+'ページ）を開く':'IPA公式設問を開く';
   questionSourceLink.href=doc.source.split('#')[0]+(Number.isInteger(sourcePage)?'#page='+sourcePage:'');
  }
  const questionIsVerified=doc.status==='FULL_SOURCE_VERIFICATION'&&sub()?.textStatus==='VERIFIED_TRANSCRIPTION'&&Boolean(sub()?.text);
  promptNotice.textContent=questionIsVerified?'':'この設問文は原文の全文転記ではなく、内容をまとめた説明です。正式な設問はIPA公式問題冊子を確認してください。';
  answer.value=answers[selected]||'';
  warning.textContent=unsaved.has(selected)?'この設問の最新の回答は保存できていません。画面を閉じる前に保存設定を確認してください。':'設問ごとに回答を分離します。原本未整備の内容は公式原本で確認してください。';
  retry.hidden=!unsaved.has(selected);
 }
 materialSelector.appendChild(new Option('自動：選択中の設問に関連する図・表','auto'));
 for(const mat of doc.materials)materialSelector.appendChild(new Option(mat.title,mat.id));
 materialSelector.addEventListener('change',()=>{selectedMaterial=materialSelector.value;renderMaterials()});
 prev.addEventListener('click',()=>{page=Math.max(0,page-1);renderIntro()});
 next.addEventListener('click',()=>{page=Math.min(doc.introductionPages.length-1,page+1);renderIntro()});
 function persistSelected(){
  if(!selected)return;
  try{if(saveAnswer(selected,answers[selected]||'')===true)unsaved.delete(selected);else unsaved.add(selected)}
  catch{unsaved.add(selected)}
  warning.textContent=unsaved.has(selected)?'この設問の最新の回答は保存できていません。再保存を押すかブラウザの保存設定を確認してください。':'この設問の回答を保存しました。';
  retry.hidden=!unsaved.has(selected);
 }
 answer.addEventListener('input',()=>{if(!selected)return;answers[selected]=answer.value;persistSelected()});
 retry.addEventListener('click',persistSelected);
 renderIntro();renderQuestion();renderMaterials();
 return root;
}
