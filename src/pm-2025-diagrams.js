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
      {page:9, box:[0.09,0.09,0.82,0.53], title:'図2　現状の学習管理システムの関係スキーマ（未完成）'},
      {page:10,box:[0.11,0.23,0.80,0.15],title:'図3　追加及び変更する関係スキーマ（未完成）'}
    ],
    '2025:pm1:2': [
      {page:14,box:[0.10,0.33,0.82,0.25],title:'図1　現状業務の概念データモデル（未完成）'},
      {page:14,box:[0.09,0.59,0.83,0.28],title:'図2　現状業務の関係スキーマ（未完成）'},
      {page:15,box:[0.12,0.59,0.79,0.25],title:'図3　納期調整シートの帳票サンプル'},
      {page:16,box:[0.13,0.16,0.77,0.25],title:'図4　修正後の概念データモデル（未完成）'}
    ],
    '2025:pm1:3': [
      {page:19,box:[0.11,0.30,0.79,0.18],title:'図1　主なテーブルのテーブル構造'},
      {page:20,box:[0.10,0.53,0.80,0.10],title:'図2　在庫履歴テーブルの構造'},
      {page:21,box:[0.10,0.30,0.81,0.55],title:'表1　在庫履歴用のSQL文（未完成）'},
      {page:22,box:[0.12,0.26,0.77,0.23],title:'図3　在庫引当APの処理の流れとSQL文'},
      {page:23,box:[0.10,0.50,0.80,0.26],title:'図4　変更後の在庫反映APの処理の流れ'}
    ],
    '2025:pm2:1': [
      {page:8,box:[0.21,0.395,0.59,0.135],title:'図1　現行システムのシステム構成'},
      {page:8,box:[0.09,0.66,0.83,0.18],title:'図2　決済サービスのテーブル構造'},
      {page:9,box:[0.09,0.08,0.83,0.24],title:'図3　ポイントサービスのテーブル構造'},
      {page:9,box:[0.08,0.28,0.84,0.44],title:'表1　主な属性の意味・制約'},
      {page:10,box:[0.08,0.09,0.84,0.82],title:'表2〜4　処理一覧・入金処理・決済残高消費処理'},
      {page:11,box:[0.08,0.08,0.84,0.77],title:'表5〜6　ポイント反映処理・ポイント消費処理のSQL'},
      {page:12,box:[0.10,0.49,0.80,0.41],title:'図4　決済処理の正常実行時のシーケンス図'},
      {page:13,box:[0.09,0.22,0.82,0.29],title:'表7　決済処理中の障害・回復の事例（未完成）'},
      {page:14,box:[0.22,0.07,0.62,0.19],title:'図5　検討中のシステム構成'},
      {page:15,box:[0.12,0.79,0.76,0.15],title:'図6　追加する決済指示テーブルの構造'},
      {page:16,box:[0.12,0.30,0.78,0.53],title:'図7　検討中の決済処理のシーケンス図'},
      {page:17,box:[0.10,0.45,0.80,0.27],title:'表8　決済処理の補償トランザクション（未完成）'},
      {page:18,box:[0.11,0.11,0.79,0.20],title:'表9　決済処理中の障害・回復の事例'},
      {page:19,box:[0.18,0.47,0.72,0.13],title:'図8　ポイント消込履歴テーブルの構造（未完成）'}
    ],
    '2025:pm2:2': [
      {page:26,box:[0.11,0.40,0.79,0.15],title:'図1　結合して求める冗長な属性を明示する例'},
      {page:26,box:[0.11,0.60,0.79,0.15],title:'図2　継承して冗長な属性を明示する例'},
      {page:28,box:[0.09,0.09,0.83,0.36],title:'図3　現状のマスター及び在庫領域の概念データモデル（未完成）'},
      {page:28,box:[0.09,0.40,0.83,0.36],title:'図4　現状のトランザクション領域の概念データモデル（未完成）'},
      {page:29,box:[0.09,0.09,0.83,0.37],title:'図5　現状のマスター及び在庫領域の関係スキーマ（未完成）'},
      {page:29,box:[0.09,0.49,0.83,0.38],title:'図6　現状のトランザクション領域の関係スキーマ（未完成）'},
      {page:30,box:[0.10,0.10,0.81,0.33],title:'図7　変更を検討する範囲を示した概念データモデル（図4の再掲、未完成）'},
      {page:30,box:[0.10,0.38,0.81,0.24],title:'図8　変更した概念データモデル（未完成）'},
      {page:30,box:[0.10,0.65,0.81,0.25],title:'図9　変更後のトランザクション領域の関係スキーマ（未完成）'}
    ]
  });
  const namespace='http://www.w3.org/2000/svg';
  const originalShowQuestion=showQuestion; const zoomStyle=document.createElement('style');zoomStyle.textContent='body.pm-figure-zoom-active #mobileStudyControls{display:none!important}';document.head.append(zoomStyle);
  function createFigure(item,key) {
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
    image.setAttribute('href','pages/'+(key.startsWith('2025:pm2:')?'pm2':'pm1')+'_qs_'+String(item.page).padStart(2,'0')+'.webp');
    image.setAttribute('x','0');image.setAttribute('y','0');
    image.setAttribute('width','851');image.setAttribute('height','1204');
    svg.append(image);
    const viewport=document.createElement('div');
    viewport.className='pm-diagram-viewport';
    viewport.style.cssText='width:100%;max-width:100%;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;';
    viewport.append(svg);
    const control=document.createElement('button');
    control.type='button';
    control.className='pm-diagram-zoom';
    control.textContent='図表を拡大して見る';
    control.setAttribute('aria-expanded','false');
    control.style.cssText='display:inline-block;margin:8px 0 0;padding:8px 12px;min-height:40px;border:1px solid #9bb5cc;border-radius:6px;background:#eef6fd;color:#173c59;cursor:pointer;';
    control.onclick=()=>{
      const expanded=control.getAttribute('aria-expanded')==='true';
      control.setAttribute('aria-expanded',expanded?'false':'true');
      control.textContent=expanded?'図表を拡大して見る':'通常サイズに戻す';
      svg.style.width=expanded?'100%':'min(950px, 240vw)';
      svg.style.maxHeight=expanded?'850px':'none';
      viewport.scrollLeft=0; if(!expanded){document.body.classList.add('pm-figure-zoom-active');figure.scrollIntoView({block:'start'});}else{document.body.classList.remove('pm-figure-zoom-active');}
    };
    const hint=document.createElement('p');hint.className='pm-diagram-hint';hint.textContent='';hint.style.cssText='font-size:.85rem;color:#475569;margin:6px 0;';const originalClick=control.onclick;control.onclick=()=>{originalClick();hint.textContent=control.getAttribute('aria-expanded')==='true'?'左右にスクロールして図全体を確認できます。':'';};figure.append(label,viewport,hint,control);
    return figure;
  }
  showQuestion=function () { document.body.classList.remove('pm-figure-zoom-active');
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
    for(const item of items) source.before(createFigure(item,key));
  };
})();
