/* Q2 Figure 1: opt-in SVG comparison, original IPA image remains default. */
(function(){'use strict';
const previous=showQuestion;
showQuestion=function(){
 previous();
 if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==2)return;
 const fig=document.querySelector('#questionText .pm2-study-figures figure.pm-original-diagram');
 if(!fig)return;
 const svg=fig.querySelector('svg');if(!svg)return;
 const original=svg.cloneNode(true),caption=fig.querySelector('figcaption');
 const oldCaption=caption?.textContent||'';
 const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-pressed','false');
 btn.textContent='図1のSVG試作を表示（未校正）';btn.style.cssText='margin:8px 4px 8px 0;padding:8px 12px;min-height:42px';
 const viewport=fig.querySelector('.pm-diagram-viewport');
 if(viewport)fig.insertBefore(btn,viewport);else fig.append(btn);
 let busy=false;
 btn.onclick=async()=>{
   if(busy)return;busy=true;btn.disabled=true;
   try{
    if(btn.getAttribute('aria-pressed')==='true'){
      const saved=original.cloneNode(true);svg.replaceChildren(...Array.from(saved.childNodes));
      for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
      for(const a of Array.from(saved.attributes))svg.setAttribute(a.name,a.value);
      svg.style.cssText=saved.style.cssText;
      if(caption)caption.textContent=oldCaption;
      btn.textContent='図1のSVG試作を表示（未校正）';btn.setAttribute('aria-pressed','false');
    }else{
      const r=await fetch('src/pm1-q2-figure1-review.svg',{cache:'no-cache'});if(!r.ok)throw Error('SVG_HTTP_'+r.status);
      const parsed=new DOMParser().parseFromString(await r.text(),'image/svg+xml');
      const source=parsed.documentElement;
      if(source.localName!=='svg'||parsed.querySelector('parsererror')||source.querySelectorAll('rect').length<9)throw Error('SVG_INVALID');
      svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
      for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
      for(const a of Array.from(source.attributes))svg.setAttribute(a.name,a.value);
      svg.style.cssText='display:block;width:1050px;max-width:none;height:auto';
      if(caption)caption.textContent='図1　現状業務の概念データモデル（SVG試作・原本照合待ち）';
      btn.textContent='IPA原本の図1に戻す';btn.setAttribute('aria-pressed','true');
    }
   }catch(e){console.warn('PM1_Q2_FIG1_REVIEW_ERROR',e.message);alert('図1の切替に失敗しました。');}
   finally{busy=false;btn.disabled=false;}
 };
};
})();
