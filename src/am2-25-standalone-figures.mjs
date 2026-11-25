/* Independent SVG/table renderer for the dedicated 25-question UI.
 * Does not depend on the ordinary past-question screen or its DOM.
 */
const ns='http://www.w3.org/2000/svg';let seq=0;
function el(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=String(text);return e;}
function vector(parent,tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
function diagram(f){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 350 205');svg.setAttribute('role','img');svg.setAttribute('aria-label',f.title||'UML クラス図');svg.style.cssText='width:100%;height:auto;max-width:620px;display:block';const defs=vector(svg,'defs',{});const id='archive-arrow-'+(++seq);const marker=vector(defs,'marker',{id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});vector(marker,'path',{d:'M0 0 L10 5 L0 10 Z',fill:'#263747'});const triangle=vector(defs,'marker',{id:id+'-triangle',viewBox:'0 0 10 10',refX:10,refY:5,markerWidth:10,markerHeight:10,orient:'auto'});vector(triangle,'path',{d:'M0 0 L10 5 L0 10 Z',fill:'white',stroke:'#263747'});
const uml=f.type==='uml';
const nodes=(uml?f.classes.map(([id,x,y])=>({id,x,y})):f.nodes).map(n=>{
 const attrs=uml?(f.attributes?.[n.id]||[]):[];
 const half=uml?Math.max(37,...[n.id,...attrs].map(v=>Array.from(String(v)).length*5+5)):15;
 const diamond=uml&&(f.diamondNodes||[]).includes(n.id);
 return {...n,attrs,diamond,half:diamond?12:half,height:diamond?9:uml?15+attrs.length*7:14};
});
const map=new Map(nodes.map(n=>[n.id,n]));
const labels=[];
function label(x,y,t,anchor='middle'){if(t)vector(svg,'text',{x,y,'font-size':10,'text-anchor':anchor,fill:'#172437'},t);}
function boundary(n,dx,dy){const scale=Math.max(Math.abs(dx)/n.half,Math.abs(dy)/n.height,0.00001);return [n.x+dx/scale,n.y+dy/scale];}
function endpoints(a,b,offset){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;const ox=-dy/len*offset,oy=dx/len*offset;const p=boundary(a,dx,dy),q=boundary(b,-dx,-dy);return [p[0]+ox,p[1]+oy,q[0]+ox,q[1]+oy];}
for(const e of uml?f.links:f.edges){
 const a=map.get(e.from),b=map.get(e.to);if(!a)continue;
 if(e.kind==='self'){const left=a.x-a.half,top=a.y-a.height;const bend=Math.min(top-20,a.y-34);vector(svg,'path',{d:'M '+left+' '+a.y+' H '+(left-22)+' V '+bend+' H '+a.x+' V '+top,fill:'none',stroke:'#263747'});labels.push([left-10,a.y+12,e.fromLabel],[a.x+22,bend-5,e.toLabel]);continue;}
 if(!b)continue;const [x1,y1,x2,y2]=endpoints(a,b,Number(e.offset)||0);
 const attrs={x1,y1,x2,y2,stroke:'#263747','stroke-width':1.3};
 if(!uml||e.kind==='inherit')attrs['marker-end']='url(#'+id+(uml?'-triangle':'')+')';
 if(e.bidirectional)attrs['marker-start']='url(#'+id+')';
 if(e.kind==='dependency')attrs['stroke-dasharray']='4 3';
 vector(svg,'line',attrs);
 if(uml){const sign=(Number(e.offset)||0)>0?1:-1;const yy=sign*5;labels.push([x1+(x2-x1)*.14,y1+(y2-y1)*.14+yy,e.fromLabel],[x2-(x2-x1)*.14,y2-(y2-y1)*.14+yy,e.toLabel],[(x1+x2)/2,(y1+y2)/2+sign*12,e.label]);}
}
for(const target of f.incomingPointers||[]){const n=map.get(target);if(!n)throw Error('Unknown incoming pointer target');const top=n.y-n.height;vector(svg,'line',{x1:n.x,y1:top-24,x2:n.x,y2:top,stroke:'#263747','stroke-width':1.3,'marker-end':'url(#'+id+')'});}
for(const e of f.associationClasses||[]){const a=map.get(e.from),b=map.get(e.to),c=map.get(e.classId);if(!a||!b||!c)continue;const [x1,y1,x2,y2]=endpoints(a,b,Number(e.offset)||0);const x=a.id===b.id?a.x-a.half/2-11:(x1+x2)/2,y=a.id===b.id?Math.min(a.y-a.height-20,a.y-34):(y1+y2)/2;const [cx,cy]=boundary(c,x-c.x,y-c.y);vector(svg,'line',{x1:x,y1:y,x2:cx,y2:cy,stroke:'#263747','stroke-width':1.3,'stroke-dasharray':'4 3'});}
for(const n of nodes){
 if(n.diamond){vector(svg,'polygon',{points:[[n.x-n.half,n.y],[n.x,n.y-n.height],[n.x+n.half,n.y],[n.x,n.y+n.height]].map(p=>p.join(',')).join(' '),fill:'white',stroke:'#263747'});continue;}
 if(uml||f.shape==='rect'){vector(svg,'rect',{x:n.x-n.half,y:n.y-n.height,width:n.half*2,height:n.height*2,fill:'white',stroke:'#263747'});if(n.attrs.length){const y=n.y-n.height+22;vector(svg,'line',{x1:n.x-n.half,y1:y,x2:n.x+n.half,y2:y,stroke:'#263747'});label(n.x,y-8,n.id);n.attrs.forEach((v,i)=>label(n.x-n.half+4,y+11+i*14,v,'start'));}else label(n.x,n.y+3,n.id);}
 else {vector(svg,'circle',{cx:n.x,cy:n.y,r:14,fill:'white',stroke:'#263747'});label(n.x,n.y+3,n.id);}
}
for(const args of labels)label(...args);
const left=Math.min(0,...nodes.map(n=>n.x-n.half-32)),top=Math.min(0,...nodes.map(n=>n.y-n.height-38)),right=Math.max(350,...nodes.map(n=>n.x+n.half+16)),bottom=Math.max(205,...nodes.map(n=>n.y+n.height+18));svg.setAttribute('viewBox',[left,top,right-left,bottom-top].join(' '));return svg;}
export function renderChallengeFigure(f){const wrap=el('figure');wrap.style.cssText='margin:10px 0;max-width:100%;overflow-x:auto;padding:8px;border:1px solid #d5e2ed;border-radius:8px';if(f.title)wrap.append(el('figcaption',f.title));if(f.type==='sql'){const pre=el('pre',f.text);pre.style.whiteSpace='pre-wrap';wrap.append(pre);}else if(f.type==='table'){const t=el('table');t.style.cssText='width:max-content;min-width:100%;white-space:nowrap;font-size:.85rem';const head=el('thead'),hr=el('tr');for(const h of f.headers){const th=el('th',h);th.scope='col';hr.append(th);}head.append(hr);t.append(head);const body=el('tbody');for(const row of f.rows){const tr=el('tr');for(const value of row)tr.append(el('td',value));body.append(tr);}t.append(body);wrap.append(t);}else if(f.type==='schema'){
 const t=el('table');t.style.cssText='width:max-content;min-width:100%;white-space:nowrap;font-size:.88rem';
 const tr=el('tr');
 for(const column of f.columns){
  const td=el('td');const span=el('span',column.name);
  span.style.display='inline-block';
  if(column.primary&&column.foreign){
   span.style.cssText='display:inline-block;text-decoration:underline solid;text-underline-offset:3px;border-bottom:1px dashed currentColor;padding-bottom:3px';
  }else if(column.primary){
   span.style.cssText='display:inline-block;text-decoration:underline solid;text-underline-offset:3px';
  }else if(column.foreign){
   span.style.cssText='display:inline-block;text-decoration:underline dashed;text-underline-offset:3px';
  }
  const designation=[column.primary?'主キー':null,column.foreign?'外部キー':null].filter(Boolean).join('・');
  if(designation)span.setAttribute('aria-label',column.name+'（'+designation+'）');
  td.append(span);tr.append(td);
 }
 t.append(tr);wrap.append(t);
 const legend=el('p','実線の下線：主キー／破線の下線：外部キー');
 legend.style.cssText='font-size:.75rem;margin:4px 0 0';wrap.append(legend);
 }else if(f.type==='graph'||f.type==='uml')wrap.append(diagram(f));return wrap;}

