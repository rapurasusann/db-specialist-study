import {readFileSync} from 'node:fs';
import test from 'node:test';

function run(source,terms){
 class N{constructor(tag,value=''){this.tag=tag;this.nodeType=tag==='#text'?3:1;this.nodeValue=value;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.className='';this.parentNode=null;}get parentElement(){return this.parentNode}get isConnected(){return !!this.parentNode}get textContent(){return this.nodeType===3?this.nodeValue:this.children.map(c=>c.textContent).join('')}set textContent(v){this.children=[];if(v)this.append(new N('#text',v))}append(...ns){for(const n of ns){n.parentNode=this;this.children.push(n)}}matches(s){return s.split(',').some(x=>x[0]==='.'?this.className.split(' ').includes(x.slice(1)):this.tag===x)}closest(s){return this.matches(s)?this:this.parentNode?.closest(s)||null}replaceChild(f,n){let i=this.children.indexOf(n);if(i<0)throw Error('missing child');for(const c of f.children)c.parentNode=this;this.children.splice(i,1,...f.children);n.parentNode=null}setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}addEventListener(k,f){this.events[k]=f}getBoundingClientRect(){return {left:20,bottom:40,top:20,width:100,height:50}}contains(n){return n===this||this.children.some(c=>c.contains(n))}}
 const root=new N('div'),body=new N('body'),head=new N('head');body.append(root);const txt=v=>new N('#text',v);const el=(tag,v)=>{const n=new N(tag);n.append(txt(v));return n};let callback;
 const NodeFilter={SHOW_ELEMENT:1,SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2,FILTER_SKIP:3};
 const document={head,body,getElementById:()=>root,createElement:t=>new N(t),createTextNode:txt,createDocumentFragment:()=>new N('fragment'),addEventListener(){},createTreeWalker(root,mask,filter){let list=[];function walk(n){const a=filter.acceptNode(n);if(a===1)list.push(n);if(a!==2)for(const c of n.children)walk(c)}for(const c of root.children)walk(c);let i=0;return {nextNode(){this.currentNode=list[i++];return this.currentNode}}}};
 const window={DBStudyGlossaryTerms:terms,innerWidth:800,innerHeight:600,addEventListener(){}};
 class MutationObserver{constructor(f){callback=f}observe(){}}
 const allButtons=()=>{let a=[];function walk(n){if(n.matches('.glossary-term'))a.push(n);n.children.forEach(walk)}walk(root);return a};const assert=(v,m)=>{if(!v)throw Error(m)};
 root.append(el('p','主キー 主キー 1NF 第一正規形 JOIN IN'),el('p','主キー 第1正規形 外部キー 外部キー'),el('svg','主キー SQL'),el('pre','SQL'));
 const original=root.textContent;new Function('document','window','NodeFilter','MutationObserver','year','courseId','number',source)(document,window,NodeFilter,MutationObserver,2024,'am2',1);
 const ids=()=>allButtons().map(b=>b.dataset.glossaryId);
 assert(ids().join(',')==='pk,nf1,sql-in,fk','first occurrence/boundary '+ids());
 assert(root.textContent===original,'text preservation');callback();assert(ids().join(',')==='pk,nf1,sql-in,fk','observer repeat');
 const b=allButtons()[0];root.events.pointerover({target:b,pointerType:'mouse'});assert(body.children[1].hidden===false && body.children[1].textContent===b.dataset.glossaryDefinition,'hover');root.events.pointerout({target:b,pointerType:'mouse',relatedTarget:null});assert(body.children[1].hidden===true,'mouseout');
 root.children.forEach(n=>n.parentNode=null);root.children=[];root.append(el('p','主キー 主キー'));callback();assert(ids().join(',')==='pk','new question');return 6;
}

test('first occurrence, aliases, boundaries, text preservation, repeated observer, hover and question change',()=>{const source=readFileSync(new URL('../src/glossary.js',import.meta.url),'utf8');const dict=readFileSync(new URL('../src/glossary-terms.js',import.meta.url),'utf8');const terms=new Function('window',dict+';return window.DBStudyGlossaryTerms')({});run(source,terms);});
