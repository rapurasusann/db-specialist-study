// Explicit, local-only download of unsaved account records. No remote requests.
export function exportCs03UnsavedBackup({auto,confirmDownload,documentRef,createUrl,revokeUrl,schedule}={}){
 if(!auto||typeof auto.exportPending!=='function')throw Error('UNSAVED_EXPORT_CONFIG_REQUIRED');
 const backup=auto.exportPending();
 const count=Object.keys(backup.records).length;
 // Browser globals must not be evaluated before a confirmed download.
 // Node tests can cancel or surface account errors without a DOM.
 const confirm=confirmDownload??(typeof window!=='undefined'?window.confirm.bind(window):undefined);
 if(typeof confirm!=='function')throw Error('UNSAVED_EXPORT_CONFIRM_REQUIRED');
 if(!confirm('未保存のアカウント履歴 '+count+'件を書き出しますか？ 学習内容が含まれるため、ファイルは安全な場所に保管してください。'))
  return '書き出しをキャンセルしました。';
 const doc=documentRef??(typeof document!=='undefined'?document:undefined);
 const makeUrl=createUrl??(typeof URL!=='undefined'?URL.createObjectURL?.bind(URL):undefined);
 const releaseUrl=revokeUrl??(typeof URL!=='undefined'?URL.revokeObjectURL?.bind(URL):undefined);
 const defer=schedule??setTimeout;
 if(!doc?.body||typeof doc.createElement!=='function'||typeof makeUrl!=='function'||typeof releaseUrl!=='function'||typeof defer!=='function')
  throw Error('UNSAVED_EXPORT_BROWSER_REQUIRED');
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=makeUrl(blob);
 try{
  const link=doc.createElement('a');
  link.href=url;link.download='cs03-unsaved-account-'+new Date().toISOString().slice(0,10)+'.json';
  doc.body.append(link);link.click();link.remove();
 }finally{defer(()=>releaseUrl(url),1000);}
 return '未保存のアカウント記録をファイルに書き出しました。サーバーへ再送信・自動復元はしていません。';
}
