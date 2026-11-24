import {validCs03RecordId} from './cs03-learning-record-id.mjs';
// CS-03 isolated, read-only account progress view.
// Renders as text nodes only. Never updates the legacy study DOM or storage.

const LEVELS={unseen:'未学習',review:'要復習',learning:'学習中',mastered:'習得済み'};
export function clearCs03HistoryView(root){
 if(!root)throw Error('HISTORY_VIEW_ROOT_REQUIRED');
 root.replaceChildren();
 root.hidden=true;
}
export function renderCs03HistoryView(root,listing,{maxRows=100}={}){
 if(!root||!listing||!listing.records||typeof listing.records!=='object'||Array.isArray(listing.records)||
    !Number.isInteger(maxRows)||maxRows<1||maxRows>100)throw Error('HISTORY_VIEW_INVALID');
 // Validate every record before exposing any of it to the screen.
 const entries=Object.entries(listing.records).sort(([a],[b])=>a.localeCompare(b,'en'));
 for(const [id,record] of entries){
  if(!validCs03RecordId(id)||!record||!record.data||typeof record.data!=='object'||Array.isArray(record.data))
   throw Error('HISTORY_VIEW_INVALID');
 }
 const doc=root.ownerDocument;
 const heading=doc.createElement('p');
 heading.textContent='アカウント側の学習履歴（閲覧専用）';
 const table=doc.createElement('table');
 table.setAttribute('aria-label','アカウント側の問題別学習履歴');
 const head=doc.createElement('thead'),tr=doc.createElement('tr');
 for(const label of ['問題','理解度','更新番号']){
  const th=doc.createElement('th');th.textContent=label;tr.append(th);
 }
 head.append(tr);table.append(head);
 const tbody=doc.createElement('tbody');
 for(const [id,record] of entries.slice(0,maxRows)){
  const row=doc.createElement('tr');
  const values=[id,LEVELS[record.data.level]??'記録あり',String(record.revision??'—')];
  for(const value of values){const td=doc.createElement('td');td.textContent=value;row.append(td);}
  tbody.append(row);
 }
 table.append(tbody);
 const foot=doc.createElement('p');
 foot.textContent=entries.length>maxRows?
  '全'+entries.length+'件中'+maxRows+'件を表示しています。端末内の学習履歴には反映していません。':
  '全'+entries.length+'件を表示しています。端末内の学習履歴には反映していません。';
 root.replaceChildren(heading,table,foot);
 root.hidden=false;
 return {total:entries.length,shown:Math.min(entries.length,maxRows)};
}
