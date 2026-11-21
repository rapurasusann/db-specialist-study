/* PM1 Q1 Figure 1 vector preview (independent SVG entities and lines); preserve original on load failure. */
(function(){'use strict';
const previous=showQuestion;
showQuestion=function(){
  previous();
  if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==1)return;
  const figure=document.querySelector('#questionText .pm1-study-figures figure.pm-original-diagram');
  if(!figure)return;
  const svg=figure.querySelector('svg');if(!svg)return;
  const key='pm1-figure1-vector';
  fetch('src/pm1-q1-figure1-vector.svg', {cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('SVG_HTTP_'+r.status);return r.text()}).then(xml=>{
    if(!svg.isConnected)return;
    const parsed=new DOMParser().parseFromString(xml,'image/svg+xml');
    const source=parsed.documentElement;
    if(source.localName!=='svg'||parsed.querySelector('parsererror'))throw Error('SVG_PARSE_FAILED');
    if(source.querySelectorAll('rect.entity').length!==25||source.querySelectorAll('path.link').length<15)throw Error('SVG_STRUCTURE_INVALID');
    svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
    svg.setAttribute('viewBox','0 0 860 730');
    svg.setAttribute('aria-label','図1 現状の学習管理システムの概念データモデル（SVG試作・照合待ち）');
    svg.dataset.vectorFigure=key;
    const caption=figure.querySelector('figcaption');if(caption)caption.textContent='図1　現状の学習管理システムの概念データモデル（SVG試作・原本照合待ち）';
  }).catch(e=>console.warn('PM1_FIG1_VECTOR_NOT_APPLIED',e.message));
};
})();