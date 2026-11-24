/* Shared PDF-first afternoon archive UI. Loaded after the legacy study scripts.
 * Reuses the existing progress object and backup key. Does not change the 2025
 * dedicated question view, the glossary, or any cloud / account configuration.
 * A selected question points into an IPA booklet; it is NOT a transcribed Q&A.
 */
(function(){
 'use strict';
 const archive=window.DB_PM_ARCHIVE;
 const studyButton=document.getElementById('viewStudy');
 const studyPanel=document.getElementById('study');
 if(!Array.isArray(archive)||archive.length!==10||!studyButton||!studyPanel)return;
 const button=document.createElement('button');
 button.type='button';button.id='viewPmArchive';button.textContent='午後の年度別過去問';
 studyButton.insertAdjacentElement('afterend',button);
 const panel=document.createElement('section');panel.id='pmArchive';panel.hidden=true;
 panel.setAttribute('aria-label','午後の年度別過去問');
 panel.innerHTML='<h2>午後の年度別過去問（IPA公式PDF）</h2><p class="muted">2016～2025年度の午後Ⅰ・午後Ⅱを年度と問番号で選べます。PDFは科目別の問題冊子全体です。2025年度以外は問番号のページ位置を未登録のため、PDF内で該当する問を選んでください。</p><div class="toolbar"><label for="pmArchiveYear">年度</label><select id="pmArchiveYear"></select><label for="pmArchiveSession">科目</label><select id="pmArchiveSession"><option value="pm1">午後Ⅰ</option><option value="pm2">午後Ⅱ</option></select></div><div class="toolbar separate" id="pmArchiveQuestions" aria-label="問番号"></div><div class="pm-archive-links"><a id="pmArchivePdf" target="_blank" rel="noopener noreferrer">問題冊子を開く（IPA公式PDF）</a><a id="pmArchiveAnswer" target="_blank" rel="noopener noreferrer">解答例を開く（IPA公式PDF）</a><a id="pmArchiveSource" target="_blank" rel="noopener noreferrer">IPAの年度別掲載ページ</a></div><p id="pmArchiveHint" class="muted"></p><label for="pmArchiveWritten"><strong>選択した問の解答・学習メモ</strong></label><textarea id="pmArchiveWritten" rows="7" placeholder="設問ごとの解答・考え方・復習メモを記入してください。保存先は通常の過去問履歴と同じです。"></textarea><div class="toolbar separate"><label for="pmArchiveLevel">習熟度</label><select id="pmArchiveLevel"><option value="">未学習</option><option value="review">要復習</option><option value="learning">学習中</option><option value="mastered">習得済み</option></select><button id="pmArchiveBack" type="button">通常の過去問学習に戻る</button></div><p id="pmArchiveSaved" class="muted" role="status"></p><p class="muted">解答欄・習熟度はブラウザーの端末内記録に保存され、既存の「記録をバックアップ／復元」に含まれます。端末間の自動同期はまだ利用できません。公式解答例で自己採点してください。</p>';
 studyPanel.insertAdjacentElement('afterend',panel);
 const style=document.createElement('style');
 style.textContent='#pmArchive[hidden]{display:none!important}#pmArchive .pm-archive-links{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}#pmArchive .pm-archive-links a{border:1px solid #a9c1d5;border-radius:8px;padding:10px 12px;background:#edf6ff}#pmArchiveQuestions button.selected{background:#d9edfb;font-weight:700;border-color:#2781b6}#pmArchive textarea{width:100%;min-height:160px}#pmArchiveHint{line-height:1.7;margin:12px 0}#pmArchiveYear,#pmArchiveSession,#pmArchiveLevel{max-width:100%}@media(max-width:650px){#pmArchive .pm-archive-links{flex-direction:column}#pmArchive .pm-archive-links a{display:block}}';
 document.head.append(style);
 const el=id=>document.getElementById(id);
 const yearInput=el('pmArchiveYear'),sessionInput=el('pmArchiveSession');
 const text=el('pmArchiveWritten'),level=el('pmArchiveLevel'),status=el('pmArchiveSaved');
 let chosenYear=2025,chosenSession='pm1',chosenQuestion=1;
 let timer=null,queuedId=null,queuedText='';
 for(const item of archive){
  const option=document.createElement('option');
  option.value=String(item.year);option.textContent=item.year+'年度（'+item.term+'）';
  yearInput.append(option);
 }
 yearInput.value=String(chosenYear);
 function current(){return archive.find(x=>x.year===chosenYear);}
 function key(){return String(chosenYear)+':'+chosenSession+':'+chosenQuestion;}
 function safeOfficial(url){
  if(!/^https:\/\/www\.ipa\.go\.jp\/shiken\/mondai-kaiotu\/[A-Za-z0-9/_\-.]+(?:#page=\d+)?$/.test(url))throw Error('INVALID_IPA_URL');
  return url;
 }
 function saveRow(id,update){
  if(!/^20(?:1[6-9]|2[0-5]):pm[12]:[1-3]$/.test(id))return;
  progress[id]={...(progress[id]||{}),...update,updatedAt:new Date().toISOString()};
  save();
  status.textContent='端末内に保存しました';
 }
 function flush(){
  if(timer!==null){clearTimeout(timer);timer=null;}
  if(queuedId!==null){saveRow(queuedId,{written:queuedText});queuedId=null;}
 }
 function updateLink(id,url){
  const link=el(id);link.href=safeOfficial(url);
 }
 function render(){
  const item=current();if(!item)return;
  const max=chosenSession==='pm1'?3:2;
  if(chosenQuestion>max)chosenQuestion=1;
  const area=el('pmArchiveQuestions');area.replaceChildren();
  for(let i=1;i<=max;i++){
   const b=document.createElement('button');b.type='button';
   b.textContent='問'+i;
   b.className=i===chosenQuestion?'selected':'';
   b.setAttribute('aria-pressed',String(i===chosenQuestion));
   b.addEventListener('click',()=>{flush();chosenQuestion=i;render();});
   area.append(b);
  }
  const base=item.base+item.code+'_db_'+chosenSession;
  const knownStart=item.pages?.[chosenSession]?.[chosenQuestion-1];
  updateLink('pmArchivePdf',base+'_qs.pdf'+(knownStart?'#page='+knownStart:''));
  updateLink('pmArchiveAnswer',base+'_ans.pdf');
  updateLink('pmArchiveSource',item.index);
  el('pmArchiveHint').textContent=String(item.year)+'年度 '+item.term+' 午後'+(chosenSession==='pm1'?'Ⅰ':'Ⅱ')+'・問'+chosenQuestion+'を選択中。'+(knownStart?'問題冊子の開始ページ '+knownStart+' を指定して開きます。':'問題冊子PDFは全問共通です。開いた後、冊子内で問'+chosenQuestion+'を探してください。');
  const row=progress[key()]||{};
  text.value=typeof row.written==='string'?row.written:'';
  level.value=['review','learning','mastered'].includes(row.level)?row.level:'';
  status.textContent=row.updatedAt?'保存記録あり（'+new Date(row.updatedAt).toLocaleString('ja-JP')+'）':'未学習（記録なし）';
 }
 function hide(){
  flush();panel.hidden=true;button.classList.remove('primary');
  const m=document.querySelector('.metrics');if(m)m.hidden=false;
 }
 function show(){
  const term=document.getElementById('termPractice');
  if(term)term.hidden=true;
  const termButton=document.getElementById('viewTerms');
  if(termButton)termButton.classList.remove('primary');
  studyPanel.classList.add('hide');el('dashboard').classList.add('hide');
  const m=document.querySelector('.metrics');if(m)m.hidden=true;
  studyButton.classList.remove('primary');el('viewDashboard').classList.remove('primary');
  panel.hidden=false;button.classList.add('primary');render();
 }
 button.addEventListener('click',show);
 yearInput.addEventListener('change',()=>{flush();chosenYear=Number(yearInput.value);chosenQuestion=1;render();});
 sessionInput.addEventListener('change',()=>{flush();chosenSession=sessionInput.value;chosenQuestion=1;render();});
 text.addEventListener('input',()=>{
  queuedId=key();queuedText=text.value;
  if(timer!==null)clearTimeout(timer);
  timer=setTimeout(flush,400);
 });
 text.addEventListener('change',flush);
 level.addEventListener('change',()=>{flush();saveRow(key(),{level:level.value||undefined});render();});
 el('pmArchiveAnswer').addEventListener('click',()=>{flush();saveRow(key(),{seenAnswer:true});});
 studyButton.addEventListener('click',hide);
 el('viewDashboard').addEventListener('click',hide);
 el('pmArchiveBack').addEventListener('click',()=>studyButton.click());
 // In capture phase: close before the vocabulary module sets its own panel state.
 document.addEventListener('click',event=>{
  if(event.target.closest?.('#viewTerms'))hide();
 },true);
 window.addEventListener('pagehide',flush);
 render();
})();
