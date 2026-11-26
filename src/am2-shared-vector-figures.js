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
// Estimate conservative SVG text bounds in user units (10px diagram font).
function labelBox(x,y,t){
 const half=Array.from(String(t)).length*5+2;
 return {left:x-half,right:x+half,top:y-11,bottom:y+3};
}
function intersects(a,b){return a.left<b.right+2&&a.right>b.left-2&&a.top<b.bottom+2&&a.bottom>b.top-2;}
function associationLabels(x1,y1,x2,y2,e){
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
 const tx=dx/len,ty=dy/len,nx=-ty,ny=tx;
 const side=(Number(e.offset)||0)>0?1:-1;
 const make=(p,t,s,d)=>[x1+dx*p+nx*s*d,y1+dy*p+ny*s*d+3,t,{tx,ty,nx:nx*s,ny:ny*s}];
 return [make(.14,e.fromLabel,side,9),make(.86,e.toLabel,side,9),make(.5,e.label,-side,16)];
}
// Reserve class boxes and previously placed labels. Search near each semantic
// anchor, preserving the side and limiting movement along the relationship.
function placeAssociationLabels(labels,nodes){
 const occupied=nodes.map(n=>({left:n.x-n.half,right:n.x+n.half,top:n.y-n.height,bottom:n.y+n.height}));
 const placed=[];
 for(const [x,y,t,axis] of labels){
  if(t===undefined||t===null||t==='')continue;
  const a=axis||{tx:1,ty:0,nx:0,ny:-1};
  let best=null;
  for(const normal of [0,6,12,18,24,30]){
   for(const tangent of [0,-5,5,-10,10]){
    const px=x+a.nx*normal+a.tx*tangent,py=y+a.ny*normal+a.ty*tangent;
    const box=labelBox(px,py,t);
    if(occupied.some(b=>intersects(b,box)))continue;
    const score=normal*normal+tangent*tangent;
    if(!best||score<best.score)best={x:px,y:py,box,score};
   }
  }
  // Do not move a multiplicity to an unrelated edge just to conceal a collision.
  // Unresolved cases remain visible and must fail the browser acceptance audit.
  const chosen=best||{x,y,box:labelBox(x,y,t)};
  occupied.push(chosen.box);placed.push({x:chosen.x,y:chosen.y,text:t,box:chosen.box,resolved:!!best});
 }
 return placed;
}

function associationEndpoints(a,b,offset){
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
 const boundary=(n,x,y)=>{const scale=Math.max(Math.abs(x)/n.half,Math.abs(y)/n.height,0.00001);return [n.x+x/scale,n.y+y/scale]};
 const p=boundary(a,dx,dy),q=boundary(b,-dx,-dy);
 return [p[0]-dy/len*offset,p[1]+dx/len*offset,q[0]-dy/len*offset,q[1]+dx/len*offset];
}
function selfAssociationLabels(a,e){
 const left=a.x-a.half,top=a.y-a.height,bend=Math.min(top-20,a.y-34);
 return [[left-22,a.y+12,e.fromLabel,{tx:0,ty:1,nx:-1,ny:0}],[a.x+22,bend-5,e.toLabel,{tx:1,ty:0,nx:0,ny:-1}]];
}
// Expand the original coordinate grid, not class sizes or relationship semantics.
function layoutAssociationNodes(nodes,links){
 const originX=Math.min(...nodes.map(n=>n.x)),originY=Math.min(...nodes.map(n=>n.y));
 let candidate=nodes;
 for(const scale of [1,1.25,1.5,1.75,2,2.5,3]){
  candidate=nodes.map(n=>({...n,x:originX+(n.x-originX)*scale,y:originY+(n.y-originY)*scale}));
  const map=new Map(candidate.map(n=>[n.id,n])),labels=[];
  for(const e of links){
   const a=map.get(e.from),b=map.get(e.to);if(!a)continue;
   if(e.kind==='self'){labels.push(...selfAssociationLabels(a,e));continue}
   if(b)labels.push(...associationLabels(...associationEndpoints(a,b,Number(e.offset)||0),e));
  }
  const boxes=candidate.map(n=>({left:n.x-n.half,right:n.x+n.half,top:n.y-n.height,bottom:n.y+n.height}));
  if(boxes.some((a,i)=>boxes.slice(i+1).some(b=>intersects(a,b))))continue;
  if(placeAssociationLabels(labels,candidate).every(p=>p.resolved))return candidate;
 }
 return candidate;
}

window.am2SharedVectorFigures=Object.freeze({associationLabels,placeAssociationLabels,associationEndpoints,selfAssociationLabels,layoutAssociationNodes,supports:f=>f.type==='schema-group'||f.type==='disk-array',render});
})();
