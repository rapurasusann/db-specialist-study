import {pmVerifiedStructure,validatePmStructure} from './pm-2025-verified-structure.mjs';
import {createPmSubquestionView} from './pm-subquestion-view.mjs';
import {getSubquestionAnswers,updateSubquestionAnswer} from './pm-subquestion-progress.mjs';

const KEY='db-study-progress-v1';
const recordId='2025:pm1:1';
const root=document.getElementById('pmRoot');
const status=document.getElementById('storageStatus');
const doc=pmVerifiedStructure[recordId];
function currentProgress(){
 const raw=localStorage.getItem(KEY);
 if(raw===null)return {};
 const value=JSON.parse(raw);
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_PROGRESS_STORE');
 return value;
}
function currentRecord(){
 const value=currentProgress()[recordId];
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_PROGRESS_RECORD');
 return value;
}
function saveAnswer(subquestionId,value){
 try{
  // Always re-read before saving to preserve updates written by the existing
  // learning app (e.g. status, legacy written, unrelated questions).
  const progress=currentProgress();
  // A missing record can be initialized, but a malformed existing record
  // must fail closed instead of silently overwriting legacy progress.
  const record=Object.hasOwn(progress,recordId)?progress[recordId]:{};
  const next=updateSubquestionAnswer(record,subquestionId,value);
  localStorage.setItem(KEY,JSON.stringify({...progress,[recordId]:next}));
  status.textContent='設問 '+subquestionId+' の回答を端末内に保存しました。';
  delete status.dataset.error;
  return true;
 }catch(e){
  status.textContent='回答を保存できませんでした。ブラウザの保存設定またはデータを確認してください。';
  status.dataset.error=e?.message||'SAVE_FAILED';
  return false;
 }
}
if(!validatePmStructure(doc)){
 status.textContent='問題の構造データが不正です。表示を中止しました。';
}else{
 let answers={};
 try{answers=getSubquestionAnswers(currentRecord())}catch{
  status.textContent='保存済み学習データを読めません。入力内容は保存できない可能性があります。';
 }
 root.appendChild(createPmSubquestionView(doc,{loadAnswers:()=>answers,saveAnswer}));
}
