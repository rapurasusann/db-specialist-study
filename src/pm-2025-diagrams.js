/* IPA 2025 DB Specialist afternoon I figures: reuse bundled original booklet
 * page images, never redraw answer-bearing diagrams or keys.
 * Each crop is defined as a fraction of the original page dimensions.
 * The full original page remains in the existing image viewer below.
 */
(function () {
  'use strict';
  const diagrams = Object.freeze({
    '2025:pm1:1': [
      {page:8, box:[0.10,0.43,0.83,0.49], title:'図1　現状の学習管理システムの概念データモデル（未完成）'},
      {page:9, box:[0.11,0.06,0.80,0.46], title:'図2　現状の学習管理システムの関係スキーマ（未完成）'},
      {page:10,box:[0.18,0.15,0.65,0.18],title:'図3　追加及び変更する関係スキーマ（未完成）'}
    ],
    '2025:pm1:2': [
      {page:14,box:[0.10,0.34,0.82,0.38],title:'図1　現状業務の概念データモデル（未完成）'},
      {page:14,box:[0.09,0.72,0.83,0.25],title:'図2　現状業務の関係スキーマ（未完成）'},
      {page:15,box:[0.12,0.65,0.79,0.28],title:'図3　納期調整シートの帳票サンプル'},
      {page:16,box:[0.13,0.16,0.77,0.25],title:'図4　修正後の概念データモデル（未完成）'}
    ]
  });
  const namespace='http://www.w3.org/2000/svg';
  const originalShowQuestion=showQuestion;
  function createFigure(item) {
    const figure=document.createElement('figure');
    figure.className='pm-original-diagram';
    figure.style.cssText='margin:12px 0 20px;padding:10px;border:1px solid #d6dfe8;border-radius:8px;background:white;';
    const label=document.createElement('figcaption');
    label.textContent=item.title+'（IPA公式問題画像）';
    label.style.cssText='font-size:.92rem;font-weight:600;margin-bottom:8px;color:#24364a;';
    const svg=document.createElementNS(namespace,'svg');
    const [x,y,w,h]=item.box;
    svg.setAttribute('viewBox',[x*851,y*1204,w*851,h*1204].join(' '));
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',item.title);
    svg.style.cssText='display:block;width:100%;height:auto;max-height:850px;';
    const image=document.createElementNS(namespace,'image');
    image.setAttribute('href','pages/pm1_qs_'+String(item.page).padStart(2,'0')+'.webp');
    image.setAttribute('x','0');image.setAttribute('y','0');
    image.setAttribute('width','851');image.setAttribute('height','1204');
    svg.append(image);
    figure.append(label,svg);
    return figure;
  }
  showQuestion=function () {
    originalShowQuestion();
    const key=String(year)+':'+courseId+':'+String(number);
    const items=diagrams[key];
    if (!items) return;
    const panel=document.getElementById('questionText');
    const source=panel.querySelector('.source');
    if (!source) return;
    const heading=document.createElement('h4');
    heading.textContent='問題中の図表（原本から抜粋）';
    heading.style.cssText='margin:20px 0 8px;';
    source.before(heading);
    for(const item of items) source.before(createFigure(item));
  };
})();
