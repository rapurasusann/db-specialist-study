// Isolated read-only study-page marker for the signed-in account.
// Does not replace or modify legacy history, grading, or device persistence.
const ID=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
const LEVEL={unseen:'未学習',review:'要復習',learning:'学習中',mastered:'習得済み'};
export function createCs03StudyHint({root,selectedId}){
 if(!root||typeof selectedId!=='function')throw Error('STUDY_HINT_CONFIG_REQUIRED');
 let visibleId=null;
 function clear(){
  visibleId=null;root.textContent='';root.hidden=true;
 }
 function show(id,data){
  if(!ID.test(id)||!data||typeof data!=='object'||Array.isArray(data))throw Error('STUDY_HINT_INVALID');
  if(selectedId()!==id){clear();throw Error('SELECTED_QUESTION_CHANGED');}
  visibleId=id;
  const level=Object.hasOwn(LEVEL,data.level)?LEVEL[data.level]:'記録あり';
  root.textContent='アカウント履歴（閲覧専用）：'+level+'。端末内履歴には反映していません。';
  root.hidden=false;
 }
 function current(){
  if(!visibleId)return false;
  if(selectedId()!==visibleId){clear();return false;}
  return true;
 }
 clear();
 return Object.freeze({clear,show,current});
}
