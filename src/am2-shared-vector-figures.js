/* Shared synchronous vector renderer for schema groups and disk arrays. */
(function(){'use strict';
const ns='http://www.w3.org/2000/svg';
function vector(parent,tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function schemaGroup(f){
 const widths=f.schemas.map(s=>s.columns.map(c=>Math.max(82,Array.from(c.name).length*16+28)));
 const w=Math.max(...widths.map(a=>a.reduce((x,y)=>x+y,0)))+20,h=f.schemas.length*70+8;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('role','img');svg.setAttribute('aria-label',f.schemas.map(s=>s.name+'：'+s.columns.map(c=>c.name+(c.primary?' 主キー':'')+(c.foreign?' 外部キー':'')).join('、')).join('。'));svg.style.cssText='display:block;width:'+w+'px;max-width:100%;height:auto';
 f.schemas.forEach((s,i)=>{let x=10;const y=8+i*70;vector(svg,'text',{x,y:y+14,'font-size':15,fill:'#172437'},s.name);
 s.columns.forEach((c,j)=>{const cw=widths[i][j],cx=x+cw/2;vector(svg,'rect',{x,y:y+20,width:cw,height:36,fill:'white',stroke:'#263747'});vector(svg,'text',{x:cx,y:y+41,'font-size':15,'text-anchor':'middle',fill:'#172437'},c.name);const half=Array.from(c.name).length*7.5+1;const under=(dy,dash)=>vector(svg,'line',{x1:cx-half,x2:cx+half,y1:y+dy,y2:y+dy,stroke:'#263747','stroke-width':1.3,...(dash?{'stroke-dasharray':'4 3'}:{})});if(c.primary)under(45,false);if(c.foreign)under(c.primary?50:45,true);x+=cw;});});return svg;
}
function diskArray(f){
 const stride=160,boxWidth=150,cellHeight=34;
 const rows=Math.max(...f.disks.map(d=>d.blocks.length));
 const w=f.disks.length*stride+24,h=96+rows*cellHeight+24;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('role','img');svg.setAttribute('aria-label',f.title+'。'+f.disks.map(d=>d.name+'：'+d.blocks.join('、')).join('。'));
 // Keep at least 13 CSS pixels per 16-unit glyph. Scroll only the figure
 // on narrower viewports rather than shrinking the entire question.
 const minWidth=Math.ceil(w*13/16);
 svg.style.cssText='display:block;width:'+w+'px;min-width:'+minWidth+'px;max-width:100%;height:auto';
 vector(svg,'rect',{x:2,y:2,width:w-4,height:h-4,fill:'white',stroke:'#263747'});
 const label=(x,y,t,anchor='middle')=>vector(svg,'text',{x,y,'font-size':16,'text-anchor':anchor,fill:'#172437'},t);
 label(14,25,f.title,'start');
 f.disks.forEach((d,i)=>{const x=12+i*stride,cx=x+boxWidth/2;label(cx,50,'〔'+d.name+'〕');vector(svg,'rect',{x,y:58,width:boxWidth,height:h-72,fill:'white',stroke:'#263747'});label(cx,80,'（データブロック）');d.blocks.forEach((b,j)=>{const y=94+j*cellHeight;vector(svg,'rect',{x:x+14,y,width:boxWidth-28,height:cellHeight,fill:'white',stroke:'#263747','stroke-dasharray':'5 4'});label(cx,y+22,b);});});return svg;
}
function render(f){const wrap=document.createElement('figure');wrap.style.cssText='margin:10px 0;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:auto;padding:8px;border:1px solid #d5e2ed;border-radius:8px';wrap.append(f.type==='schema-group'?schemaGroup(f):diskArray(f));return wrap;}
// Keep relationship names on the opposite side of the edge from multiplicities.
// Both renderers use the same deterministic coordinates; no question-specific offsets.
function associationLabels(x1,y1,x2,y2,e){
 const sign=(Number(e.offset)||0)>0?1:-1;
 const yy=sign*5;
 return [[x1+(x2-x1)*.14,y1+(y2-y1)*.14+yy,e.fromLabel],
 [x2-(x2-x1)*.14,y2-(y2-y1)*.14+yy,e.toLabel],
 [(x1+x2)/2,(y1+y2)/2-sign*16,e.label]];
}
window.am2SharedVectorFigures=Object.freeze({associationLabels,supports:f=>f.type==='schema-group'||f.type==='disk-array',render});
})();
