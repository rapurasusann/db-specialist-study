/* PM1 Q1 Figure 3 provisional vector; original IPA image remains default. */
(function(){'use strict';
  const previous=showQuestion;
  showQuestion=function(){
    previous();
    if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==1)return;
    const fig=document.querySelectorAll('#questionText .pm1-study-figures figure.pm-original-diagram')[2];
    if(!fig)return;
    const svg=fig.querySelector('svg'),viewport=fig.querySelector('.pm-diagram-viewport');
    if(!svg||!viewport)return;
    const original={content:svg.innerHTML,viewBox:svg.getAttribute('viewBox'),preserve:svg.getAttribute('preserveAspectRatio'),style:svg.getAttribute('style')};
    const caption=fig.querySelector('figcaption'),originalCaption=caption?.textContent||'';
    const button=document.createElement('button');button.type='button';button.className='pm-fig3-toggle';
    button.textContent='図3のSVG試作を表示';button.setAttribute('aria-pressed','false');
    button.style.cssText='margin:8px 6px 8px 0;padding:9px 12px;min-height:42px;';
    const zoom=fig.querySelector('.pm-diagram-zoom');
    if(zoom)fig.insertBefore(button,zoom);else fig.append(button);
    let busy=false;
    button.addEventListener('click',async()=>{
      if(busy)return;busy=true;button.disabled=true;
      try{
        if(button.getAttribute('aria-pressed')==='true'){
          svg.innerHTML=original.content;
          svg.setAttribute('viewBox',original.viewBox);svg.setAttribute('preserveAspectRatio',original.preserve);
          if(original.style===null)svg.removeAttribute('style');else svg.setAttribute('style',original.style);
          delete svg.dataset.fig3Review;
          if(caption)caption.textContent=originalCaption;
          button.textContent='図3のSVG試作を表示';button.setAttribute('aria-pressed','false');
        }else{
          const res=await fetch('src/pm1-q1-figure3-review.svg',{cache:'no-cache'});
          if(!res.ok)throw Error('HTTP_'+res.status);
          const parsed=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
          const source=parsed.documentElement;
          if(source.localName!=='svg'||parsed.querySelector('parsererror')||source.querySelectorAll('rect.blank').length!==5)throw Error('FIG3_INVALID');
          svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
          svg.setAttribute('viewBox','0 0 1660 510');svg.setAttribute('preserveAspectRatio','xMinYMin meet');
          svg.style.setProperty('width','1360px','important');
          svg.style.setProperty('max-width','none','important');svg.style.setProperty('max-height','none','important');
          svg.style.height='auto';svg.dataset.fig3Review='true';viewport.scrollLeft=0;
          if(caption)caption.textContent='図3　追加及び変更する関係スキーマ（SVG試作・下線照合待ち）';
          button.textContent='IPA原本の図3に戻す';button.setAttribute('aria-pressed','true');
        }
      }catch(e){console.warn('PM1_FIG3_REVIEW_ERROR',e.message);}
      finally{busy=false;button.disabled=false;}
    });
  };
})();
