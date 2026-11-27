/* IPA 2025 DB AM2 Q8/Q9: faithful textual reconstruction of the inset originals.
 * The separate original-page PDF image viewer remains unchanged.
 */
(function () {
  'use strict';
  const css = document.createElement('style');
  css.textContent = [
    '#questionText .am2-code-figure{margin:12px 0 16px;padding:12px;border:1px solid #d5e2ed;border-radius:10px;background:#fff;min-width:0;max-width:100%}',
    '#questionText .am2-code-heading{font-weight:700;margin:8px 0 5px}',
    '#questionText .am2-code-figure pre{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:clamp(10px,1.25vw,13px);line-height:1.55;margin:3px 0 10px;white-space:pre-wrap;overflow-wrap:anywhere}',
    '#questionText .am2-code-figure table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:clamp(10px,1.3vw,14px);line-height:1.35}',
    '#questionText .am2-code-figure th,#questionText .am2-code-figure td{border:1px solid #b6c7d5;padding:5px 3px;white-space:nowrap;min-width:0}',
    '#questionText .am2-code-figure th{background:#edf4fa;font-weight:650}',
    '#questionText .am2-code-figure .am2-key{text-decoration:underline;text-underline-offset:3px}',
    '#questionText .am2-code-figure .am2-numeric{text-align:right;font-variant-numeric:tabular-nums}',
    '#questionText .am2-code-figure .am2-left{text-align:left}',
    '#questionText .am2-code-figure .am2-two-tables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}',
    '#questionText .am2-code-figure .am2-note{font-size:.81rem;color:#586b7b;margin:7px 0 0}',
    '@media(max-width:650px){#questionText .am2-code-figure{padding:8px}#questionText .am2-code-figure .am2-two-tables{gap:4px}#questionText .am2-code-figure th,#questionText .am2-code-figure td{padding:4px 1px;font-size:clamp(8px,2.15vw,11px)}}'
  ].join('\n');
  document.head.append(css);

  function section(figure,label){
    const heading=document.createElement('div');
    heading.className='am2-code-heading';
    heading.textContent=label;
    figure.append(heading);
  }
  function code(figure,source){
    const pre=document.createElement('pre');
    pre.textContent=source;
    figure.append(pre);
  }
  function table(label,headings,rows,numberColumns,keyColumn){
    const result=document.createElement('table');
    result.setAttribute('aria-label',label);
    const thead=document.createElement('thead'),headingRow=document.createElement('tr');
    headings.forEach((text,i)=>{
      const th=document.createElement('th');
      th.textContent=text;th.scope='col';
      th.className=numberColumns.includes(i)?'am2-numeric':'am2-left';
      if(i===keyColumn)th.className+=' am2-key';
      headingRow.append(th);
    });
    thead.append(headingRow);
    const tbody=document.createElement('tbody');
    rows.forEach(row=>{
      const tr=document.createElement('tr');
      row.forEach((value,i)=>{
        const td=document.createElement('td');
        td.textContent=String(value);
        td.className=numberColumns.includes(i)?'am2-numeric':'am2-left';
        tr.append(td);
      });
      tbody.append(tr);
    });
    result.append(thead,tbody);
    return result;
  }
  function figure(key){
    const result=document.createElement('figure');
    result.className='am2-code-figure';
    result.setAttribute('data-study-text',key);
    return result;
  }
  function question8(){
    const f=figure('am2-q8');
    section(f,'【表定義】');
    code(f,[
      'CREATE TABLE システム担当者 (',
      '  システム番号 INTEGER,',
      '  担当者番号 INTEGER NOT NULL,',
      '  CONSTRAINT PK_システム番号 PRIMARY KEY(システム番号),',
      '  CONSTRAINT UK_担当者番号 UNIQUE(担当者番号)',
      '    DEFERRABLE INITIALLY IMMEDIATE',
      ')'
    ].join('\n'));
    section(f,'【システム担当者】');
    f.append(table('問8 システム担当者の初期データ',['システム番号','担当者番号'],[['1234','111'],['6789','222']],[0,1],0));
    section(f,'【トランザクションAの複合文内のSQL文】');
    code(f,[
      'SET CONSTRAINTS [ a ];',
      'UPDATE システム担当者 SET 担当者番号 = 222',
      '  WHERE システム番号 = 1234;',
      'UPDATE システム担当者 SET 担当者番号 = 111',
      '  WHERE システム番号 = 6789;',
      'COMMIT;'
    ].join('\n'));
    const note=document.createElement('p');note.className='am2-note';
    note.textContent='※ [ a ] に入る字句を下の選択肢から選んでください。';
    f.append(note);
    return f;
  }
  function question9(){
    const f=figure('am2-q9');
    const rows=[
      ['試験 太郎','東京','男','22'],
      ['情報 花子','大阪','女','24'],
      ['処理 一郎','京都','男','35']
    ];
    const pair=document.createElement('div');
    pair.className='am2-two-tables';
    for(const name of ['名簿1','名簿2']){
      const container=document.createElement('div');
      const caption=document.createElement('div');
      caption.className='am2-code-heading';
      caption.textContent=name;
      container.append(caption,table('問9 '+name,['名前','住所','性別','年齢'],rows,[3],-1));
      pair.append(container);
    }
    f.append(pair);
    section(f,'【SQL文】');
    code(f,[
      "SELECT CASE WHEN COUNT(*) = 0 THEN '等しい' ELSE '異なる' END AS 結果",
      '  FROM ((SELECT * FROM 名簿1 [ a ] SELECT * FROM 名簿2)',
      '    [ b ]',
      '    (SELECT * FROM 名簿1 [ c ] SELECT * FROM 名簿2)',
      '  ) COMPARE'
    ].join('\n'));
    const note=document.createElement('p');note.className='am2-note';
    note.textContent='※ [ a ]・[ b ]・[ c ] に入る字句を下の選択肢から選んでください。';
    f.append(note);
    return f;
  }
  const prior=showQuestion;
  showQuestion=function(){
    prior();
    if(Number(year)!==2025||courseId!=='am2'||(number!==8&&number!==9))return;
    const panel=document.getElementById('questionText');
    const heading=panel?.querySelector('h3');
    if(!heading)return;
    heading.insertAdjacentElement('afterend',number===8?question8():question9());
  };
})();
