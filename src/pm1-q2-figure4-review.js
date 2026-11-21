/* PM1 Q2 Figure 4 source-based, opt-in SVG preview. Original IPA image is default. */
(function(){'use strict';
const previous=showQuestion;
showQuestion=function(){
 previous();
 if(String(year)!=='2025'||courseId!=='pm1'||Number(number)!==2)return;
 const fig=document.querySelectorAll('#questionText .pm2-study-figures figure.pm-original-diagram')[3];
 if(!fig)return;
 const svg=fig.querySelector('svg');if(!svg)return;
 const original=svg.cloneNode(true),caption=fig.querySelector('figcaption'),oldCaption=caption?.textContent||'';
 const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-pressed','false');
 btn.textContent='図4のSVG試作を表示（未校正）';btn.style.cssText='margin:8px 4px 8px 0;padding:8px 12px;min-height:42px';
 const viewport=fig.querySelector('.pm-diagram-viewport');
 if(viewport)fig.insertBefore(btn,viewport);else fig.append(btn);
 let busy=false;
 btn.onclick=async()=>{
  if(busy)return;busy=true;btn.disabled=true;
  try{
   if(btn.getAttribute('aria-pressed')==='true'){
    const saved=original.cloneNode(true);svg.replaceChildren(...Array.from(saved.childNodes).map(n=>n.cloneNode(true)));
    for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
    for(const a of Array.from(saved.attributes))svg.setAttribute(a.name,a.value);
    svg.style.cssText=saved.style.cssText;
    if(caption)caption.textContent=oldCaption;
    btn.textContent='図4のSVG試作を表示（未校正）';btn.setAttribute('aria-pressed','false');
   }else{
    const res=await fetch('src/pm1-q2-figure4-review.svg',{cache:'no-cache'});if(!res.ok)throw Error('SVG_HTTP_'+res.status);
    const parsed=new DOMParser().parseFromString(await res.text(),'image/svg+xml');
    const source=parsed.documentElement;
    if(source.localName!=='svg'||parsed.querySelector('parsererror')||source.querySelectorAll('rect').length!==5||source.querySelectorAll('line,path,polyline,polygon').length!==0)throw Error('SVG_STRUCTURE_INVALID');
    svg.replaceChildren(...Array.from(source.childNodes).map(n=>document.importNode(n,true)));
    for(const a of Array.from(svg.attributes))svg.removeAttribute(a.name);
    for(const a of Array.from(source.attributes))svg.setAttribute(a.name,a.value);
    svg.style.cssText='display:block;width:1000px;max-width:none;height:auto';
    if(caption)caption.textContent='図4　修正後の概念データモデル（SVG試作・原本照合待ち）';
    btn.textContent='IPA原本の図4に戻す';btn.setAttribute('aria-pressed','true');
   }
  }catch(e){console.warn('PM1_Q2_FIG4_REVIEW_ERROR',e.message);alert('図4の切替に失敗しました。');}
  finally{busy=false;btn.disabled=false;}
 };
};
})();
