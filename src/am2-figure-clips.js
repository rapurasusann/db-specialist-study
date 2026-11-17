/* Exact crops of bundled IPA 2025 DB AM2 booklet page images.
 * No diagrams are redrawn. Coordinates refer to the 852x1203 WebP pages
 * already bundled under pages/am2_qs_NN.webp. The whole official page
 * remains available in the existing viewer.
 */
(function () {
  'use strict';
  const clips = Object.freeze({
    '2025:am2:3': [{page:4, box:[0.17,0.16,0.67,0.20], caption:'UML：商品・倉庫・在庫商品の関係図'}],
    '2025:am2:6': [{page:5, fullPage:true, caption:'正規化の対象となる受注データの表'}],
    '2025:am2:8': [{page:7, fullPage:true, caption:'SQLの表定義とシステム担当者の初期データ'}],
    '2025:am2:9': [{page:8, fullPage:true, caption:'名簿1・名簿2の表とSQL文'}],
    '2025:am2:11': [{page:9, box:[0.25,0.23,0.54,0.18], caption:'注文表・注文明細表の主キーと外部キーの関係図'}],
    '2025:am2:12': [{page:10, fullPage:true, caption:'トランザクションの処理内容とチェックポイント図'}],
    '2025:am2:23': [{page:15, box:[0.16,0.21,0.73,0.34], caption:'RAID6の磁気ディスク配置図とパリティ計算式'}]
  });
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
    const selected = clips[key];
    if (!selected) return;
    const panel = document.getElementById('questionText');
    const title = panel.querySelector('h3');
    if (!title) return;
    // Insert the original figures immediately after the question stem,
    // before the text answer choices. No CSS-based recreation.
    for (const clip of selected) title.insertAdjacentElement('afterend', buildClip(clip));
  };
})();
