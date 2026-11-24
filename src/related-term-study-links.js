import {termQuestions} from './term-understanding-questions.js';
// Context-aware vocabulary links in the EXISTING past-question study screen.
// Links use same-origin ?term=<known ID> and open without replacing the exam.
const questionTerms=Object.freeze({
 '2025:am2:6':['nf-1','nf-2','nf-3'],
 '2025:am2:8':['con-immediate','con-deferred','con-deferrable','con-set-constraints','con-unique','con-initially-immediate','con-initially-deferred'],
 '2025:am2:9':['ra-union','ra-intersect','ra-difference'],
 '2025:am2:10':['ra-division','ra-product','ra-project','ra-difference'],
 '2025:am2:12':['con-transaction'],
 '2025:am2:15':['iso-rr','iso-rc','iso-ru','iso-ser','iso-nonrepeat'],
 '2025:am2:16':['iso-ser'],
 '2025:am2:20':['crypto-rsa','crypto-sign','crypto-public','crypto-hash'],
 '2025:am2:21':['crypto-forward','crypto-ecdh'],
 '2025:am2:25':['xp-ci','xp-pair','xp-collective']
});
const byId=new Map(termQuestions.map(q=>[q.id,q]));
const title=document.getElementById('currentTitle');
const question=document.getElementById('questionText');
if(title&&question){
 const region=document.createElement('div');
 region.id='relatedTermStudyLinks';
 region.setAttribute('aria-label','この問題に関連する単語学習');
 region.style.cssText='display:none;gap:7px;flex-wrap:wrap;align-items:center;padding:10px 12px;margin:8px 0 12px;border:1px solid #d8e4ee;border-radius:10px;background:#f4f9fd';
 // Keep the newly linked terms outside questionText so glossary annotations are untouched.
 const exam=document.querySelector('#study .exam');
 exam?.insertAdjacentElement('beforebegin',region);
 let lastTitle='',lastText='';
 const render=()=>{
  const label=title.textContent.trim();
  // Match only study labels of the form "2025年度 午前Ⅱ・問8".
  const m=label.match(/^(\d{4})年度\s+(午前Ⅰ|午前Ⅱ|午後Ⅰ|午後Ⅱ)・問(\d+)$/);
  if(!m){region.style.display='none';return;}
  const course={'午前Ⅰ':'am1','午前Ⅱ':'am2','午後Ⅰ':'pm1','午後Ⅱ':'pm2'}[m[2]];
  const id=m[1]+':'+course+':'+m[3];
  const text=question.textContent;
  if(id===lastTitle&&text===lastText)return;
  lastTitle=id;lastText=text;
  const explicit=questionTerms[id]||[];
  // Exact mentions only; never suggest loosely related terms based on generic words.
  const found=termQuestions.filter(q=>q.term.length>=4&&text.includes(q.term)).map(q=>q.id);
  const ids=[...new Set([...explicit,...found])].filter(x=>byId.has(x));
  region.replaceChildren();
  if(!ids.length){region.style.display='none';return;}
  const heading=document.createElement('strong');heading.textContent='関連する単語を学ぶ：';
  region.append(heading);
  for(const tid of ids){
   const q=byId.get(tid);
   const link=document.createElement('a');
   const url=new URL(window.location.href);
   url.searchParams.set('term',tid);
   url.hash='';
   link.href=url.href;
   link.target='_blank';
   link.rel='noopener noreferrer';
   link.textContent=q.term+' の単語学習へ';
   link.style.cssText='display:inline-block;padding:7px 10px;border:1px solid #90b5d5;border-radius:8px;background:#fff;color:#075d9a;text-decoration:none;font-size:.88rem';
   region.append(link);
  }
  region.style.display='flex';
 };
 new MutationObserver(render).observe(title,{subtree:true,childList:true,characterData:true});
 // Question content is populated by other scripts after the title changes.
 // Observer only reads question text and updates an element OUTSIDE its subtree.
 new MutationObserver(render).observe(question,{subtree:true,childList:true,characterData:true});
 render();
}
