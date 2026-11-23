/* Q2 Figure 2: provisional text vector with a source-image fallback; original is default. */
(function(){'use strict';
const prior=showQuestion;
showQuestion=function(){
 prior();
 if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==2)return;
 const fig=document.querySelectorAll('#questionText .pm2-study-figures figure.pm-original-diagram')[1];
 if(!fig)return;
 const svg=fig.querySelector('svg');if(!svg)return;
 const original=svg.cloneNode(true),caption=fig.querySelector('figcaption');
 const originalCaption=caption?.textContent||'';
 const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-pressed','false');
 btn.textContent='図2のSVG試作を表示（下線未校正）';
 btn.style.cssText='margin:8px 4px 8px 0;padding:8px 12px;min-height:42px';
 const viewport=fig.querySelector('.pm-diagram-viewport');
 if(viewport)fig.insertBefore(btn,viewport);else fig.append(btn);
 let busy=false;
 btn.onclick=async()=>{
  if(busy)return;busy=true;btn.disabled=true;
  try{
    if(btn.getAttribute('aria-pressed')==='true'){
      const src=original.cloneNode(true);
      svg.replaceChildren(...Array.from(src.childNodes).map(n=>n.cloneNode(true)));
      for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
      for(const a of Array.from(src.attributes))svg.setAttribute(a.name,a.value);
      svg.style.cssText=src.style.cssText;
      if(caption)caption.textContent=originalCaption;
      btn.textContent='図2のSVG試作を表示（下線未校正）';btn.setAttribute('aria-pressed','false');
    }else{
      const res=await fetch('src/pm1-q2-figure2-review.svg',{cache:'no-cache'});
      if(!res.ok)throw Error('SVG_HTTP_'+res.status);
      const doc=new DOMParser().parseFromString(await res.text(),'image/svg+xml'),src=doc.documentElement;
      if(src.localName!=='svg'||doc.querySelector('parsererror')||src.querySelectorAll('text').length<35||src.querySelectorAll('.answer-blank').length!==5)throw Error('SVG_INVALID');
      svg.replaceChildren(...Array.from(src.childNodes).map(n=>document.importNode(n,true)));
      for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
      for(const a of Array.from(src.attributes))svg.setAttribute(a.name,a.value);
      svg.style.cssText='display:block;width:1450px;max-width:none;max-height:none;height:auto';
      if(caption)caption.textContent='図2　現状業務の関係スキーマ（SVG試作・下線未校正）';
      btn.textContent='IPA原本の図2に戻す';btn.setAttribute('aria-pressed','true');
    }
  }catch(e){console.warn('PM1_Q2_FIG2_REVIEW_ERROR',e.message);alert('図2の切替に失敗しました。');}
  finally{busy=false;btn.disabled=false;}
 };
};
})();