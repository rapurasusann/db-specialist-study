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
function transactionSequence(f){
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 650 540');svg.setAttribute('role','img');svg.setAttribute('aria-label',f.steps.map(s=>s.number+' '+s.lane+' '+s.lines.join('')).join('。'));svg.style.cssText='display:block;width:650px;min-width:520px;max-width:100%;height:auto';
 const label=(x,y,t)=>vector(svg,'text',{x,y,'font-size':14,'text-anchor':'middle',fill:'#172437'},t);
 const arrow=(x,y1,y2)=>{vector(svg,'line',{x1:x,y1,x2:x,y2,stroke:'#263747'});vector(svg,'path',{d:'M'+(x-5)+' '+(y2-7)+' L'+x+' '+y2+' L'+(x+5)+' '+(y2-7),fill:'none',stroke:'#263747'});};
 label(190,22,'トランザクションT₁');label(490,22,'トランザクションT₂');arrow(32,35,510);label(22,530,'時刻');
 const last={};for(const s of f.steps){const x=s.lane===1?190:490,y=45+(s.number-1)*79,h=52;if(last[s.lane]!==undefined)arrow(x,last[s.lane],y);vector(svg,'rect',{x:x-135,y,width:270,height:h,fill:'white',stroke:'#263747'});label(x-124,y-6,String(s.number));s.lines.forEach((t,i)=>label(x,y+(s.lines.length===1?30:20+i*17),t));last[s.lane]=y+h;}return svg;
}
function markTableHeader(th,f,index){if(f.primaryColumns?.includes(index)){th.style.textDecoration='underline';th.style.textUnderlineOffset='3px';th.setAttribute('aria-label',f.headers[index]+'（主キー）');}}
function boxedMultiplicity(f){
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 360 100');svg.setAttribute('role','img');svg.setAttribute('aria-label',f.left+' と '+f.right+' の関連。左 '+f.a+'、右 '+f.b+'、'+f.role);svg.style.cssText='display:block;width:360px;max-width:100%;height:auto';
 const rect=(x,y,w,h)=>vector(svg,'rect',{x,y,width:w,height:h,fill:'white',stroke:'#263747'});
 const label=(x,y,t)=>vector(svg,'text',{x,y,'font-size':14,'text-anchor':'middle',fill:'#172437'},t);
 rect(10,44,70,35);rect(280,44,70,35);label(45,66,f.left);label(315,66,f.right);
 vector(svg,'line',{x1:80,y1:61,x2:280,y2:61,stroke:'#263747'});
 rect(88,18,60,25);rect(212,18,60,25);label(118,35,f.a);label(242,35,f.b);label(246,78,f.role);return svg;
}
function serverTopology(f){
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 520 285');svg.setAttribute('role','img');svg.setAttribute('aria-label','クライアントとサーバ、データベースの冗長構成。各クライアントから対応サーバへ更新・参照要求、各サーバから対応データベースへ更新・参照、サーバ間は双方向に更新を通知。');svg.style.cssText='display:block;width:520px;max-width:100%;height:auto';
 const rect=(x,y,w,h)=>vector(svg,'rect',{x,y,width:w,height:h,fill:'white',stroke:'#263747'});
 const label=(x,y,t,anchor='middle')=>vector(svg,'text',{x,y,'font-size':13,'text-anchor':anchor,fill:'#172437'},t);
 const arrow=(x1,y1,x2,y2,both=false)=>{vector(svg,'line',{x1,y1,x2,y2,stroke:'#263747'});const head=(a,b,c,d)=>{const len=Math.hypot(c-a,d-b),ux=(c-a)/len,uy=(d-b)/len;vector(svg,'path',{d:'M '+(c-8*ux+4*uy)+' '+(d-8*uy-4*ux)+' L '+c+' '+d+' L '+(c-8*ux-4*uy)+' '+(d-8*uy+4*ux),fill:'none',stroke:'#263747'});};head(x1,y1,x2,y2);if(both)head(x2,y2,x1,y1);};
 for(const [i,x] of [[1,100],[2,360]]){rect(x-64,12,128,30);label(x,32,'クライアント'+i);rect(x-64,100,128,30);label(x,120,'サーバ'+i);arrow(x,42,x,100);label(x+9,73,'更新・参照要求','start');arrow(x,130,x,194);label(x+9,169,'更新・参照','start');vector(svg,'path',{d:'M '+(x-43)+' 204 V 257 A 43 10 0 0 0 '+(x+43)+' 257 V 204',fill:'white',stroke:'#263747'});vector(svg,'ellipse',{cx:x,cy:204,rx:43,ry:10,fill:'white',stroke:'#263747'});label(x,231,'データ');label(x,248,'ベース'+i);}
 arrow(164,115,296,115,true);label(230,136,'更新を通知');return svg;
}
function accountingConstraint(svg,nodes,f){
 if(!f.accountingConstraint)return [];
 const n=nodes.find(n=>n.id===f.accountingConstraint.target);if(!n)return [];
 const x=n.x+18,y=n.y+n.height+28,w=158,h=68;
 vector(svg,'line',{x1:n.x+12,y1:n.y+n.height,x2:x+20,y2:y,stroke:'#263747','stroke-dasharray':'4 3'});
 vector(svg,'path',{d:'M '+x+' '+y+' H '+(x+w-12)+' L '+(x+w)+' '+(y+12)+' V '+(y+h)+' H '+x+' Z M '+(x+w-12)+' '+y+' V '+(y+12)+' H '+(x+w),fill:'white',stroke:'#263747'});
 f.accountingConstraint.lines.forEach((t,i)=>vector(svg,'text',{x:x+6,y:y+15+i*14,'font-size':10,fill:'#172437'},t));
 return [{left:x,right:x+w,top:y,bottom:y+h}];
}
function render(f){const wrap=document.createElement('figure');wrap.style.cssText='margin:10px 0;max-width:100%;min-width:0;box-sizing:border-box;overflow-x:auto;padding:8px;border:1px solid #d5e2ed;border-radius:8px';wrap.append(f.type==='schema-group'?schemaGroup(f):f.type==='transaction-sequence'?transactionSequence(f):f.type==='boxed-multiplicity'?boxedMultiplicity(f):f.type==='server-topology'?serverTopology(f):diskArray(f));return wrap;}
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
function placeAssociationLabels(labels,nodes,reserved=[]){
 const occupied=[...reserved,...nodes.map(n=>({left:n.x-n.half,right:n.x+n.half,top:n.y-n.height,bottom:n.y+n.height}))];
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
function layoutAssociationNodes(nodes,links,figure={}){
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
  labels.push(...diamondAssociationLabels(figure,candidate));
  const constraint=ownershipConstraintGeometry(candidate,figure);
  if(placeAssociationLabels(labels,candidate,constraint?[constraint.box]:[]).every(p=>p.resolved))return candidate;
 }
 return candidate;
}


function diagramNodeLabel(svg,f,n,y){
 const attrs={x:n.x,y,'font-size':10,'text-anchor':'middle',fill:'#172437'};
 if(f.objectDiagram)attrs['text-decoration']='underline';
 return vector(svg,'text',attrs,n.id);
}
function diamondAssociationLabels(f,nodes){
 return nodes.filter(n=>n.diamond&&f.diamondLabels?.[n.id]).map(n=>[n.x,n.y-n.height-9,f.diamondLabels[n.id],{tx:1,ty:0,nx:0,ny:-1}]);
}
function parallelPointerSegments(a,b,offset=0){
 return [associationEndpoints(a,b,offset-3),associationEndpoints(b,a,-offset-3)];
}


function mergedInheritance(svg,nodes,links,markerId){
 const groups=new Map(),used=new Set(),map=new Map(nodes.map(n=>[n.id,n]));
 for(const e of links)if(e.kind==='inherit'){if(!groups.has(e.to))groups.set(e.to,[]);groups.get(e.to).push(e);}
 for(const [target,edges] of groups){
  const p=map.get(target),children=edges.map(e=>map.get(e.from));
  if(edges.length<2||!p||children.some(c=>!c||c.y-c.height<=p.y+p.height+12))continue;
  const bottom=p.y+p.height,join=(bottom+Math.min(...children.map(c=>c.y-c.height)))/2;
  const line=(x1,y1,x2,y2,extra={})=>vector(svg,'line',{x1,y1,x2,y2,stroke:'#263747','stroke-width':1.3,...extra});
  line(Math.min(p.x,...children.map(c=>c.x)),join,Math.max(p.x,...children.map(c=>c.x)),join);
  line(p.x,join,p.x,bottom,{'marker-end':'url(#'+markerId+')'});
  children.forEach(c=>line(c.x,c.y-c.height,c.x,join));edges.forEach(e=>used.add(e));
 }
 return used;
}
function ownershipConstraintGeometry(nodes,f){
 if(!f.ownershipConstraint)return;
 const map=new Map(nodes.map(n=>[n.id,n])),a=map.get(f.ownershipConstraint[0]),b=map.get(f.ownershipConstraint[1]),c=map.get(f.ownershipConstraint[2]);
 if(!a||!b||!c)return;
 const y=(Math.max(a.y+a.height,b.y+b.height)+c.y-c.height)/2;
 const x=(a.x+b.x)/2,w=162,h=24;
 return {a,b,c,x,y,w,h,box:{left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2}};
}
function ownershipConstraint(svg,nodes,f){
 const g=ownershipConstraintGeometry(nodes,f);if(!g)return [];
 const {a,b,c,x,y,w,h}=g;
 vector(svg,'line',{x1:a.x+(c.x-a.x)*(y-a.y)/(c.y-a.y),y1:y,x2:b.x+(c.x-b.x)*(y-b.y)/(c.y-b.y),y2:y,stroke:'#263747','stroke-dasharray':'4 3'});
 vector(svg,'rect',{x:x-w/2,y:y-h/2,width:w,height:h,fill:'white',stroke:'#263747'});
 vector(svg,'text',{x,y:y+3,'font-size':10,'text-anchor':'middle',fill:'#172437'},'制約：同時には成立しない');
 return [g.box];
}

window.am2SharedVectorFigures=Object.freeze({accountingConstraint,markTableHeader,mergedInheritance,ownershipConstraint,diagramNodeLabel,diamondAssociationLabels,parallelPointerSegments,associationLabels,placeAssociationLabels,associationEndpoints,selfAssociationLabels,layoutAssociationNodes,supports:f=>f.type==='schema-group'||f.type==='disk-array'||f.type==='transaction-sequence'||f.type==='boxed-multiplicity'||f.type==='server-topology',render});
})();
