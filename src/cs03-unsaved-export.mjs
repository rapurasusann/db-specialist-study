// Explicit, local-only download of unsaved account records. No remote requests.
export function exportCs03UnsavedBackup({auto,confirmDownload=window.confirm.bind(window),documentRef=document,createUrl=URL.createObjectURL.bind(URL),revokeUrl=URL.revokeObjectURL.bind(URL),schedule=setTimeout}){
 if(!auto||typeof auto.exportPending!=='function')throw Error('UNSAVED_EXPORT_CONFIG_REQUIRED');
 const backup=auto.exportPending();
 const count=Object.keys(backup.records).length;
 if(!confirmDownload('未保存のアカウント履歴 '+count+'件を書き出しますか？ 学習内容が含まれるため、ファイルは安全な場所に保管してください。'))
  return '書き出しをキャンセルしました。';
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=createUrl(blob);
 try{
  const link=documentRef.createElement('a');
  link.href=url;link.download='cs03-unsaved-account-'+new Date().toISOString().slice(0,10)+'.json';
  documentRef.body.append(link);link.click();link.remove();
 }finally{schedule(()=>revokeUrl(url),1000);}
 return '未保存のアカウント記録をファイルに書き出しました。サーバーへ再送信・自動復元はしていません。';
}
