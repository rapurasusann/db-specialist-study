// Browser classic-script bridge between the study page and opt-in account mode.
// The legacy device store remains untouched. This script is never active unless
// the authenticated CS-03 preview explicitly calls activate().
(function(){
 'use strict';
 const ID=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
 let mode=null,device=null,sequence=0;
 const notify=(text)=>{const el=document.getElementById('cs03StudyHint');if(el){el.textContent=text;el.hidden=false;}};
 function inAccountMode(){return mode!==null;}
 function activate(listing,auto){
  if(mode||!listing||typeof listing.userId!=='string'||!listing.records||
     !auto||!['open','edit','state'].every(k=>typeof auto[k]==='function'))throw Error('ACCOUNT_MODE_INVALID');
  const fresh=Object.create(null);
  for(const [id,row] of Object.entries(listing.records)){
   if(!ID.test(id)||!row||typeof row!=='object'||!row.data||
      typeof row.data!=='object'||Array.isArray(row.data))throw Error('ACCOUNT_SNAPSHOT_INVALID');
   fresh[id]=structuredClone(row.data);
  }
  device=progress;mode={auto,ready:new Set(),loading:new Map(),seq:++sequence};
  progress=fresh;renderMode(); // Account data only; never calls save().
  notify('アカウントの学習記録を表示中。問題の読み込みが終わると編集できます。');
 }
 function deactivate(){
  if(!mode)return;
  // The caller must ensure all queued writes have completed before sign-out.
  const st=mode.auto.state();
  if(st.pending.length||st.blocked.length||st.inFlight?.length)throw Error('UNSAVED_ACCOUNT_PROGRESS');
  ++sequence;mode=null;progress=device;device=null;
  renderMode();
  const el=document.getElementById('cs03StudyHint');
  if(el){el.textContent='';el.hidden=true;}
 }
 function onStudyRender(){
  if(!mode)return;
  const ctx=mode,id=String(year)+':'+courseId+':'+number;
  if(!ID.test(id))return;
  ctx.ready.delete(id);
  if(ctx.loading.has(id))return;
  const seq=ctx.seq;
  const request=(async()=>{
   try{
    const row=await ctx.auto.open(id);
    if(!mode||mode!==ctx||seq!==sequence)return;
    if(row===null)delete progress[id];
    else progress[id]=structuredClone(row);
    ctx.ready.add(id);
    if(String(year)+':'+courseId+':'+number===id){
     renderMetrics();renderQuestions();renderAnswer();
     notify('アカウント履歴を取得しました。この問題の変更はアカウントに保存されます。');
    }
   }catch(error){
    if(mode===ctx){ctx.ready.delete(id);notify('アカウント履歴を取得できません。変更は保存しません。');}
   }finally{ctx.loading.delete(id);}
  })();
  ctx.loading.set(id,request);
 }
 function write(id,update){
  if(!mode)throw Error('ACCOUNT_MODE_INACTIVE');
  if(!ID.test(id)||!update||typeof update!=='object'||Array.isArray(update))throw Error('INVALID_RECORD');
  const ctx=mode;
  if(!ctx.ready.has(id)||ctx.auto.state().blocked.includes(id)){
   notify('同期の確認が必要です。この問題の変更は受け付けませんでした。');
   return false;
  }
  const row={...(progress[id]??{}),...structuredClone(update),updatedAt:new Date().toISOString()};
  let pending;
  try{pending=ctx.auto.edit(id,structuredClone(row));}
  catch{
   notify('同期の確認が必要です。この問題の変更は受け付けませんでした。');
   return false;
  }
  progress[id]=row;
  Promise.resolve(pending).then(()=>{
   if(mode===ctx)notify('アカウントの学習記録を保存しました。');
  },()=>{
   if(mode===ctx){ctx.ready.delete(id);notify('アカウントへの保存に失敗しました。再読み込み・ログアウトせず記録を確認してください。');}
  });
  return true;
 }
 Object.defineProperty(window,'CS03_STUDY_PAGE',{
  value:Object.freeze({inAccountMode,activate,deactivate,onStudyRender,write}),
  writable:false,configurable:false
 });
})();
