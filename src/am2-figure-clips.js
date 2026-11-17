/* Original-page figures for IPA DB AM2; Q6 alone is a readable HTML
 * reconstruction of the 10-row order table, not a distorted image crop.
 */
(function () {
  'use strict';
  const clips = Object.freeze({
    '2025:am2:3': [{page:4, box:[0.17,0.16,0.67,0.20], caption:'UML：商品・倉庫・在庫商品の関係図'}],
    '2025:am2:8': [{page:7, fullPage:true, caption:'SQLの表定義とシステム担当者の初期データ'}],
    '2025:am2:9': [{page:8, fullPage:true, caption:'名簿1・名簿2の表とSQL文'}],
    '2025:am2:11': [{page:9, box:[0.25,0.23,0.54,0.18], caption:'注文表・注文明細表の主キーと外部キーの関係図'}],
    '2025:am2:12': [{page:10, fullPage:true, caption:'トランザクションの処理内容とチェックポイント図'}],
    '2025:am2:23': [{page:15, box:[0.16,0.21,0.73,0.34], caption:'RAID6の磁気ディスク配置図とパリティ計算式'}]
  });
  // Transcribed from the Q6 table supplied for verification. Cells remain text only.
  const orderColumns = Object.freeze(['受注番号','顧客コード','顧客名','受注日','商品コード','商品名','単価','受注数','受注金額']);
  const orderRows = Object.freeze([
    ['1055','A7053','鈴木電気','2025-07-01','T035','テレビA','85,000','10','850,000'],
    ['1055','A7053','鈴木電気','2025-07-01','K083','無線スピーカーA','23,000','5','115,000'],
    ['1055','A7053','鈴木電気','2025-07-01','S172','Blu-rayプレイヤーB','78,000','3','234,000'],
    ['2030','B7060','中村商会','2025-07-03','T050','テレビB','90,000','3','270,000'],
    ['2030','B7060','中村商会','2025-07-03','S172','Blu-rayプレイヤーB','78,000','10','780,000'],
    ['3025','C9025','佐藤電気','2025-07-03','T035','テレビA','85,000','3','255,000'],
    ['3025','C9025','佐藤電気','2025-07-03','K085','無線スピーカーB','25,000','2','50,000'],
    ['3025','C9025','佐藤電気','2025-07-03','S171','Blu-rayプレイヤーA','50,000','8','400,000'],
    ['3090','B7060','中村商会','2025-07-04','T050','テレビB','90,000','1','90,000'],
    ['3090','B7060','中村商会','2025-07-04','T035','テレビA','85,000','2','170,000']
  ]);
  function buildOrderTable() {
    const figure = document.createElement('figure');
    figure.setAttribute('data-study-table','am2-q6');
    figure.style.cssText = 'margin:14px 0;width:100%;max-width:100%;min-width:0;overflow:hidden;border:1px solid #d5e2ed;border-radius:10px;background:#fff;padding:4px;';
    const table = document.createElement('table');
    table.setAttribute('aria-label','問6 受注データの表');
    table.style.cssText = 'border-collapse:collapse;table-layout:auto;width:max-content;max-width:none;font-size:12px;line-height:1.3;white-space:nowrap;transform-origin:top left;';
    // Numeric order numbers, prices, quantities, and amounts align right; codes and dates align left.
    const numericColumns = new Set([0,6,7,8]);
    const thead = document.createElement('thead');
    const headings = document.createElement('tr');
    for (const [columnIndex,label] of orderColumns.entries()) {
      const th = document.createElement('th');
      th.scope = 'col'; th.textContent = label;
      th.style.cssText = 'padding:4px 2px;border:1px solid #c6d4e0;background:#eaf2fa;text-align:'+(numericColumns.has(columnIndex)?'right':'left')+';white-space:nowrap;';
      headings.append(th);
    }
    thead.append(headings);
    const tbody = document.createElement('tbody');
    for (const row of orderRows) {
      const tr = document.createElement('tr');
      for (const [columnIndex,value] of row.entries()) {
        const td = document.createElement('td');
        td.textContent = value;
        td.style.cssText = 'padding:4px 2px;border:1px solid #d2dee8;text-align:'+(numericColumns.has(columnIndex)?'right':'left')+';white-space:nowrap;';
        tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(thead,tbody);
    const viewport = document.createElement('div');
    viewport.style.cssText = 'width:100%;max-width:100%;overflow:hidden;position:relative;';
    viewport.append(table);
    figure.append(viewport);
    // Fit the entire unwrapped table in the question panel without scrolling.
    // On narrow screens the entire table shrinks, including its text.
    function fitTable() {
      const available = viewport.clientWidth;
      const natural = table.offsetWidth;
      if (!(available > 0 && natural > 0)) return;
      const scale = Math.min(1, available / natural);
      table.style.transform = 'scale('+scale+')';
      viewport.style.height = (table.offsetHeight * scale)+'px';
    }
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(fitTable);
      observer.observe(viewport);
    }
    requestAnimationFrame(fitTable);
    return figure;
  }
  const baseQuestion = showQuestion;
  const ns = 'http://www.w3.org/2000/svg';
  function buildClip(item) {
    const fig = document.createElement('figure');
    fig.style.cssText = 'margin:14px 0;padding:12px;border:1px solid #d5e2ed;border-radius:10px;background:#fff;max-width:100%;';
    // Four affected diagrams are shown as complete originals, with the image's
    // own intrinsic aspect ratio. No fixed-size SVG viewBox or guessed crop.
    if (item.fullPage) {
      const img = document.createElement('img');
      img.src = 'pages/am2_qs_'+String(item.page).padStart(2,'0')+'.webp';
      img.alt = item.caption+'（IPA公式問題冊子・ページ全体）';
      img.loading = 'eager';
      img.style.cssText = 'display:block;width:100%;height:auto;max-width:100%;object-fit:contain;';
      const caption = document.createElement('figcaption');
      caption.textContent = item.caption+'（原本ページ全体を縦横比を保って表示）';
      caption.style.cssText = 'font-size:.85rem;color:#586b7b;margin-top:8px;';
      fig.append(img,caption);
      return fig;
    }
    const [x,y,w,h] = item.box;
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox', [x*852,y*1203,w*852,h*1203].join(' '));
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',item.caption+'。IPA公式問題冊子の図表画像');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.cssText = 'display:block;width:100%;height:auto;max-height:600px;';
    const image = document.createElementNS(ns,'image');
    image.setAttribute('href','pages/am2_qs_'+String(item.page).padStart(2,'0')+'.webp');
    image.setAttribute('x','0');image.setAttribute('y','0');
    image.setAttribute('width','852');image.setAttribute('height','1203');
    svg.append(image);
    const caption = document.createElement('figcaption');
    caption.textContent = item.caption+'（IPA公式問題画像からの切り出し。細部は下の原本画像を参照）';
    caption.style.cssText = 'font-size:.85rem;color:#586b7b;margin-top:8px;';
    fig.append(svg,caption);
    return fig;
  }
  showQuestion = function () {
    baseQuestion();
    const key = String(year)+':'+String(courseId)+':'+String(number);
    const isOrderTable = key === '2025:am2:6';
    // Only replace the small inset figure; never alter the original page viewer.
    const selected = clips[key];
    if (!isOrderTable && !selected) return;
    const panel = document.getElementById('questionText');
    const title = panel.querySelector('h3');
    if (!title) return;
    if (isOrderTable) {
      title.insertAdjacentElement('afterend',buildOrderTable());
      return;
    }
    // Insert the original figures immediately after the question stem,
    // before the text answer choices. No CSS-based recreation.
    for (const clip of selected) title.insertAdjacentElement('afterend', buildClip(clip));
  };
})();
