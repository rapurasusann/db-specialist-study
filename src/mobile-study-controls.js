/* Smartphone-only study controls. The existing desktop workflow remains unchanged. */
(function () {
  'use strict';
  const bar=document.getElementById('mobileStudyControls');
  if (!bar || typeof renderStudy!=='function' || typeof renderAnswer!=='function') return;
  const $=id=>document.getElementById(id);
  const letters=['ア','イ','ウ','エ'];
  const choices=Array.from(bar.querySelectorAll('[data-mobile-choice]'));
  const status=$('mobileStudyStatus');
  const caption=$('mobileStudyQuestion');
  const smallScreen=()=>window.matchMedia('(max-width:650px)').matches;
  function refresh(){
    const isStudying=!$('study').classList.contains('hide');
    bar.hidden=!isStudying;
    if (!isStudying) return;
    const written=course().type==='written';
    caption.textContent=year+'年度 '+course().name+' 問'+number;
    for(const button of choices){
      button.hidden=written;
      const selected=sessionSelected===button.dataset.mobileChoice;
      button.setAttribute('aria-pressed',String(selected));
      button.classList.toggle('selected',selected);
    }
    $('mobileStudyGrade').hidden=written;
    $('mobileStudySolution').textContent=showAnswer?'解答を閉じる':'解答を見る';
    $('mobileStudyPrev').disabled=number===1;
    $('mobileStudyNext').disabled=number===course().count;
    const previous=$('gradeResult').textContent.trim();
    status.textContent=written?'記述解答・理解度は従来の解答欄から入力できます。':
      (sessionGradedSelection===sessionSelected && sessionSelected
        ? previous||'解答済み'
        : sessionSelected?'「判定」で正誤を確認できます。':'ア・イ・ウ・エから選択してください。');
  }
  function questionTop(){
    if(!smallScreen())return;
    const title=$('currentTitle');
    if(title)title.scrollIntoView({behavior:'instant',block:'start'});
  }
  // Keep the mobile view synchronized with existing answer state and navigation.
  const originalAnswer=renderAnswer;
  renderAnswer=function(){originalAnswer();refresh()};
  const originalStudy=renderStudy;
  renderStudy=function(){originalStudy();refresh()};
  const originalMode=renderMode;
  renderMode=function(){originalMode();refresh()};
  for(const button of choices){
    button.addEventListener('click',()=>{
      const input=Array.from($('choices').querySelectorAll('input[type="radio"]'))
        .find(input=>input.value===button.dataset.mobileChoice);
      if(input)input.click();
      refresh();
    });
  }
  $('mobileStudyGrade').addEventListener('click',()=>{$('grade').click();refresh()});
  $('mobileStudyPrev').addEventListener('click',()=>{
    const before=number;$('previous').click();refresh();if(number!==before)questionTop();
  });
  $('mobileStudyNext').addEventListener('click',()=>{
    const before=number;$('next').click();refresh();if(number!==before)questionTop();
  });
  $('mobileStudySolution').addEventListener('click',()=>{
    $('reveal').click();refresh();
    if(showAnswer && smallScreen())$('solution').scrollIntoView({behavior:'instant',block:'start'});
  });
  window.addEventListener('resize',refresh);
  refresh();
})();