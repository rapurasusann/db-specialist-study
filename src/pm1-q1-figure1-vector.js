/* PM1 Q1 Figure 1 optional SVG preview. IPA original image is always the initial display. */
(function(){'use strict';
const previous=showQuestion;
showQuestion=function(){
  previous();
  if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==1)return;
  const figure=document.querySelector('#questionText .pm1-study-figures figure.pm-original-diagram');
  if(!figure)return;
  const svg=figure.querySelector('svg');if(!svg)return;
  const original=svg.cloneNode(true);
  const caption=figure.querySelector('figcaption');
  const originalCaption=caption?.textContent||'';
  const button=document.createElement('button');button.type='button';button.className='pm-fig1-toggle';
  button.textContent='図1のSVG試作を表示（原本は初期表示）';button.setAttribute('aria-pressed','false');
  button.style.cssText='margin:8px 6px 8px 0;padding:9px 12px;min-height:42px;';
  const zoom=figure.querySelector('.pm-diagram-zoom');
  if(zoom)figure.insertBefore(button,zoom);else figure.append(button);
  let busy=false;
  button.onclick=async()=>{
    if(busy)return;busy=true;button.disabled=true;
    try{
      if(button.getAttribute('aria-pressed')==='true'){
        svg.replaceChildren(...Array.from(original.childNodes).map(n=>n.cloneNode(true)));
        svg.setAttribute('viewBox',original.getAttribute('viewBox'));
        svg.setAttribute('preserveAspectRatio',original.getAttribute('preserveAspectRatio'));
        if(original.getAttribute('style')===null)svg.removeAttribute('style');else svg.setAttribute('style',original.getAttribute('style'));
        svg.removeAttribute('data-vector-figure');
        svg.setAttribute('aria-label',original.getAttribute('aria-label'));
        if(caption)caption.textContent=originalCaption;
        button.textContent='図1のSVG試作を表示（原本は初期表示）';
        button.setAttribute('aria-pressed','false');
      }else{
        const res=await fetch('src/pm1-q1-figure1-vector.svg',{cache:'no-cache'});
        if(!res.ok)throw Error('SVG_HTTP_'+res.status);
        const parsed=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
        const source=parsed.documentElement;
        if(source.localName!=='svg'||parsed.querySelector('parsererror'))throw Error('SVG_PARSE_FAILED');
        if(source.querySelectorAll('rect.entity').length!==25||source.querySelectorAll('path.link').length<15)throw Error('SVG_STRUCTURE_INVALID');
        svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
        svg.setAttribute('viewBox','0 0 860 730');
        svg.setAttribute('aria-label','図1 現状の学習管理システムの概念データモデル（SVG試作・照合待ち）');
        svg.dataset.vectorFigure='pm1-figure1-vector';
        if(caption)caption.textContent='図1　現状の学習管理システムの概念データモデル（SVG試作・原本照合待ち）';
        button.textContent='IPA原本画像に戻す';button.setAttribute('aria-pressed','true');
      }
    }catch(e){console.warn('PM1_FIG1_VECTOR_NOT_APPLIED',e.message);}
    finally{busy=false;button.disabled=false;}
  };
};
})();
