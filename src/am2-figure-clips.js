/* Dedicated text/vector renderers for IPA 2025 AM2 Q3 and Q6.
 * Other question figures are supplied by the semantic data renderer.
 */
(function () {
  'use strict';
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
  // Rebuilt from IPA 2025 AM2 Q3, page 4. Keep the original page viewer unchanged.
  // All entities, attributes and multiplicities are rendered as text/vector shapes.
  function buildQ3Diagram() {
    const fig = document.createElement('figure');
    fig.setAttribute('data-study-diagram','am2-q3');
    fig.style.cssText = 'margin:14px 0;width:100%;max-width:100%;min-width:0;overflow:hidden;border:1px solid #d5e2ed;border-radius:10px;background:#fff;padding:8px;';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    const nsSvg = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox','0 0 960 400');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label','問3 UMLデータモデル。商品1対在庫商品1以上、倉庫1対在庫商品0以上、在庫商品1対入庫1以上、在庫商品1対出庫0以上。格納先は倉庫と在庫商品の関連。');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.cssText = 'display:block;width:100%;height:auto;max-width:100%;font-family:system-ui,sans-serif;';
    function element(tag,attrs={},label) {
      const el=document.createElementNS(nsSvg,tag);
      for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,String(value));
      if (label!==undefined) el.textContent=label;
      svg.append(el);return el;
    }
    function line(x1,y1,x2,y2) {element('line',{x1,y1,x2,y2,stroke:'#263747','stroke-width':2.3});}
    function label(x,y,value,anchor='middle') {
      element('text',{x,y,'font-size':22,'text-anchor':anchor,fill:'#172437'},value);
    }
    function entity(x,y,width,title,attributes) {
      const rowHeight=34,height=rowHeight+attributes.length*33+8;
      element('rect',{x,y,width,height,fill:'#fff',stroke:'#263747','stroke-width':2.3});
      line(x,y+rowHeight,x+width,y+rowHeight);
      label(x+width/2,y+25,title);
      attributes.forEach((value,i)=>label(x+10,y+rowHeight+29+i*33,value,'start'));
    }
    // Draw associations before entity boxes so all endpoints remain beneath boxes.
    line(190,291,386,291);                       // 商品 -- 在庫商品
    line(574,291,759,291);                       // 在庫商品 -- 倉庫
    line(374,117,439,248);                       // 入庫 -- 在庫商品
    line(691,117,524,248);                       // 出庫 -- 在庫商品
    entity(35,251,155,'商品',['商品コード']);
    entity(386,248,188,'在庫商品',['/在庫数量']);
    entity(759,251,165,'倉庫',['倉庫番号']);
    entity(290,24,168,'入庫',['入庫年月日','数量']);
    entity(606,24,168,'出庫',['出庫年月日','数量']);
    // Multiplicity always appears at the endpoint it qualifies.
    label(210,281,'1','start');
    label(376,281,'1..*','end');
    label(586,281,'0..*','start');
    label(748,281,'1','end');
    label(347,149,'1..*');
    label(426,236,'1');
    label(725,149,'0..*');
    label(540,236,'1');
    label(661,281,'格納先');
    fig.append(svg);
    const caption=document.createElement('figcaption');
    caption.textContent='問3 商品・倉庫のUMLデータモデル（原本の関連と多重度を再構成）';
    caption.style.cssText='font-size:.85rem;color:#586b7b;margin-top:6px;';
    fig.append(caption);
    return fig;
  }
  const baseQuestion = showQuestion;
  showQuestion = function () {
    baseQuestion();
    const key = String(year)+':'+String(courseId)+':'+String(number);
    const isOrderTable = key === '2025:am2:6';
    if (!isOrderTable && key !== '2025:am2:3') return;
    const panel = document.getElementById('questionText');
    const title = panel.querySelector('h3');
    if (!title) return;
    if (isOrderTable) {
      title.insertAdjacentElement('afterend',buildOrderTable());
      return;
    }
    if (key === '2025:am2:3') {
      title.insertAdjacentElement('afterend',buildQ3Diagram());
      return;
    }

  };
})();
