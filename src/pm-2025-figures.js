/* 2025 DB PM1: exact source-image figures for questions 1 and 2.
 * Fractional crops are measured against the original IPA booklet pages.
 * The underlying source is the same bundled page WebP as the full viewer.
 * No relationships, keys or blanks are reconstructed or filled in.
 */
(function () {
  'use strict';
  const figures = Object.freeze({
    '2025:pm1:1': [
      {page:8,rect:[.10,.41,.84,.53],title:'図1　現状の概念データモデル（未完成）'},
      {page:9,rect:[.12,.08,.80,.56],title:'図2　現状の関係スキーマ（未完成）'},
      {page:10,rect:[.11,.22,.83,.18],title:'図3　追加・変更する関係スキーマ（未完成）'}
    ],
    '2025:pm1:2': [
      {page:14,rect:[.18,.36,.67,.24],title:'図1　現状の概念データモデル（未完成）'},
      {page:14,rect:[.10,.61,.81,.30],title:'図2　現状の関係スキーマ（未完成）'},
      {page:15,rect:[.17,.62,.71,.23],title:'図3　納期調整シートの帳票サンプル'},
      {page:16,rect:[.19,.23,.64,.17],title:'図4　修正後の概念データモデル（未完成）'}
    ]
  });
  const original = showQuestion;
  function renderFigure(item) {
    const fig=document.createElement('figure');
    fig.style.cssText='margin:12px 0 18px;padding:10px;border:1px solid #cbd5e1;border-radius:8px;max-width:100%;overflow:hidden;background:white';
    const label=document.createElement('figcaption');
    label.textContent=item.title+'（IPA公式原本画像）';
    label.style.cssText='font-weight:600;font-size:.95rem;margin-bottom:8px;color:#243747';
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const [x,y,w,h]=item.rect;
    // Original WebP pages have portrait A4 ratio. Fractions keep the crop
    // independent of their encoded pixel dimensions.
    const width=852,height=1203;
    svg.setAttribute('viewBox',[x*width,y*height,w*width,h*height].join(' '));
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',item.title);
    svg.style.cssText='display:block;width:100%;height:auto;max-height:680px';
    const img=document.createElementNS('http://www.w3.org/2000/svg','image');
    img.setAttribute('href','pages/pm1_qs_'+String(item.page).padStart(2,'0')+'.webp');
    img.setAttribute('x','0');img.setAttribute('y','0');
    img.setAttribute('width',String(width));img.setAttribute('height',String(height));
    svg.append(img);
    const note=document.createElement('div');
    note.textContent='文字が小さい場合は、下の原本ページ画像で拡大して確認してください。';
    note.style.cssText='font-size:.8rem;color:#475569;margin-top:6px';
    fig.append(label,svg,note);
    return fig;
  }
  showQuestion=function () {
    original();
    const key=String(year)+':'+String(courseId)+':'+String(number);
    const list=figures[key];
    if(!list)return;
    const root=document.getElementById('questionText');
    if(!root || root.classList.contains('hide'))return;
    const source=root.querySelector('.source');
    if(!source)return;
    const section=document.createElement('section');
    section.setAttribute('aria-label','問題の公式図表');
    const heading=document.createElement('h4');
    heading.textContent='問題に使用する図表（原本と同じ画像）';
    section.append(heading);
    for(const item of list)section.append(renderFigure(item));
    source.before(section);
  };
})();
