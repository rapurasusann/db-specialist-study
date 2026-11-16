/* 2025 DB AM2 Q4: make primary-key underlining visible as in the IPA source.
 * The existing stem, choice texts, original answer letters and grading are unchanged.
 * Uses question-specific presentation data; no generic option content is replaced.
 */
(function () {
  'use strict';
  const specs = Object.freeze({
    'ア': {columns:['氏名','プログラム言語'],primary:['氏名']},
    'イ': {columns:['従業員番号','プログラム言語'],primary:['プログラム言語']},
    'ウ': {columns:['従業員番号','プログラム言語'],primary:['従業員番号']},
    'エ': {columns:['従業員番号','プログラム言語'],primary:['従業員番号','プログラム言語']}
  });
  const css = document.createElement('style');
  css.textContent = [
    '#questionText .q4-employees{margin:12px 0 16px;padding:12px;background:#eff6fd;border:1px solid #b7d1e6;border-radius:10px}',
    '#questionText .q4-employees strong{display:block;margin-bottom:8px}',
    '#questionText .q4-schema{display:flex;align-items:center;flex-wrap:wrap;gap:5px;line-height:1.7}',
    '#questionText .q4-table-name{font-weight:700;margin-right:5px}',
    '#questionText .q4-field{display:inline-block;padding:3px 8px;background:white;border:1px solid #a3b9cc;border-radius:5px}',
    '#questionText .q4-primary{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;font-weight:700;border-color:#3a81b4;background:#e8f3ff}',
    '#questionText .q4-legend{font-size:.85rem;color:#475c70;margin-top:7px}',
    '#questionText .q4-option-label{font-weight:700;display:block;margin:0 0 7px}',
    '#questionText .q4-option-schema{padding:3px 0}',
    '#questionText .q4-option-schema .q4-field{font-size:.96rem}',
    '#questionText .q4-primary-key{font-size:.85rem;margin-top:7px;color:#394e60}',
    '#questionText .optionText.choice-eliminated .q4-primary-key{text-decoration:line-through}',
    '@media(max-width:520px){#questionText .q4-field{padding:3px 5px;font-size:.87rem}#questionText .q4-employees{padding:9px}}'
  ].join('\n');
  document.head.append(css);

  function schema(columns, primary) {
    const row = document.createElement('div');
    row.className='q4-schema';
    for (const name of columns) {
      const cell = document.createElement('span');
      cell.className = 'q4-field' + (primary.includes(name)?' q4-primary':'');
      cell.textContent=name;
      if(primary.includes(name))cell.title='主キーの属性';
      row.append(cell);
    }
    return row;
  }
  const previousShow = showQuestion;
  showQuestion = function () {
    previousShow();
    if (Number(year)!==2025 || courseId!=='am2' || number!==4) return;
    const root=document.getElementById('questionText');
    const title=root.querySelector('h3');
    const choices=Array.from(root.querySelectorAll('.optionText'));
    if(!title || choices.length!==4)return;

    const info=document.createElement('div');
    info.className='q4-employees';
    const heading=document.createElement('strong');
    heading.textContent='共通の「従業員」表';
    info.append(heading,schema(['従業員番号','氏名'],['従業員番号']));
    const legend=document.createElement('div');
    legend.className='q4-legend';
    legend.textContent='下線付きの列＝主キー（複数列に下線がある場合は複合主キー）。これは原本の下線を見やすく表現したものです。';
    info.append(legend);
    title.after(info);

    for (let i=0;i<choices.length;i++) {
      const letter=['ア','イ','ウ','エ'][i];
      const item=specs[letter];
      const option=choices[i];
      // No answers, correct/incorrect labels or hints are shown here.
      option.replaceChildren();
      const name=document.createElement('span');
      name.className='q4-option-label';
      name.textContent=letter+'　プログラム言語表';
      const row=schema(item.columns,item.primary);
      row.classList.add('q4-option-schema');
      const key=document.createElement('div');
      key.className='q4-primary-key';
      key.textContent='主キー：'+item.primary.join(' ＋ ');
      option.append(name,row,key);
    }
  };
})();
