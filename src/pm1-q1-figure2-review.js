/* PM1 Q1 Figure 2 provisional SVG preview; original IPA figure stays default. */
(function(){'use strict';
  const previous=showQuestion;
  showQuestion=function(){
    previous();
    if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==1)return;
    const figures=document.querySelectorAll('#questionText .pm1-study-figures figure.pm-original-diagram');
    const figure=figures[1];if(!figure)return;
    const svg=figure.querySelector('svg');if(!svg)return;
    const original=svg.cloneNode(true);
    const caption=figure.querySelector('figcaption');
    const originalCaption=caption?.textContent||'';
    const btn=document.createElement('button');btn.type='button';
    btn.textContent='図2のSVG校正版を試す（下線は照合中）';
    btn.style.cssText='margin:8px 0;padding:8px 12px;min-height:42px;';
    btn.setAttribute('aria-pressed','false');
    const zoom=figure.querySelector('.pm-diagram-zoom');
    if(zoom)figure.insertBefore(btn,zoom);else figure.append(btn);
    let busy=false;
    btn.onclick=async()=>{
      if(busy)return;busy=true;btn.disabled=true;
      try{
        if(btn.getAttribute('aria-pressed')==='true'){
          svg.replaceChildren(...Array.from(original.childNodes).map(n=>n.cloneNode(true)));
          for(const a of Array.from(svg.attributes))if(a.name.startsWith('data-fig2'))svg.removeAttribute(a.name);
          svg.setAttribute('viewBox',original.getAttribute('viewBox'));svg.style.cssText=original.style.cssText;
          svg.setAttribute('preserveAspectRatio',original.getAttribute('preserveAspectRatio'));
          if(caption)caption.textContent=originalCaption;
          btn.textContent='図2のSVG校正版を試す（下線は照合中）';btn.setAttribute('aria-pressed','false');
        } else {
          const res=await fetch('src/pm1-q1-figure2-schema-review.svg',{cache:'no-cache'});
          if(!res.ok)throw Error('SVG_HTTP_'+res.status);
          const parsed=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
          const source=parsed.documentElement;
          if(source.localName!=='svg'||parsed.querySelector('parsererror'))throw Error('SVG_PARSE_FAILED');
          if(source.querySelectorAll('rect').length<15)throw Error('SVG_STRUCTURE_INVALID');
          svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
          svg.setAttribute('viewBox',source.getAttribute('viewBox'));
          svg.setAttribute('preserveAspectRatio','xMinYMin meet');
          svg.dataset.fig2Review='true';svg.style.setProperty('width',zoom?.getAttribute('aria-expanded')==='true'?'1660px':'1280px','important');svg.style.setProperty('max-width','none','important');svg.style.setProperty('max-height','none','important');
          if(caption)caption.textContent='図2　関係スキーマ（SVG校正版・下線最終照合待ち）';
          btn.textContent='IPA原本の図2に戻す';btn.setAttribute('aria-pressed','true');
        }
      }catch(e){console.warn('PM1_FIG2_REVIEW_ERROR',e.message);alert('図2プレビューの切替に失敗しました。');}
      finally{busy=false;btn.disabled=false;}
    };
  };
})();
