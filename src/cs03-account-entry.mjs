// CS-03 UI is opt-in and stays disabled until isolated preview config is ready.
// This script does not contain credentials and does not change legacy progress.
const cfg=window.DB_STUDY_CS03;
if(cfg?.previewEnabled===true && cfg?.authUrl && cfg?.apiUrl){
 const root=document.getElementById('cs03AccountPanel');
 if(root){
  try{
   const {createAuthClient}=await import('@neon/auth');
   const {createCs03AccountClient}=await import('./cs03-account-client.mjs');
   const {mountCs03AccountPanel}=await import('./cs03-account-ui.mjs');
   const {createCs03ScopedProgress}=await import('./cs03-scoped-progress.mjs');
   const {createCs03ManualTransfer}=await import('./cs03-manual-transfer.mjs');
   // Only allow the exact isolated Managed Auth instance.
   if(cfg.authUrl!=='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth')
    throw Error('AUTH_TARGET_MISMATCH');
   const client=createCs03AccountClient({
    authClient:createAuthClient(cfg.authUrl),apiUrl:cfg.apiUrl,
    storage:window.localStorage
   });
   root.hidden=false;
   const scoped=createCs03ScopedProgress({account:client});
   const manual=createCs03ManualTransfer({scoped,
    readLegacy:id=>window.CS03_SELECTED_QUESTION.readLegacy(id),
    confirmTransfer:id=>window.confirm(id+' の端末内履歴1件をログイン中のアカウントにコピーしますか？\n既存の端末内履歴は残ります。')
   });
   const ui=mountCs03AccountPanel(root,client,{
    onSignedIn:async()=>{await scoped.bind();},
    onSignedOut:()=>{scoped.unbind();},
    onListProgress:async()=>{
     const listing=await scoped.list();
     const records=Object.values(listing.records);
     const learned=records.filter(r=>r.data?.level&&r.data.level!=='unseen').length;
     return 'アカウント履歴 '+records.length+'件（学習済み '+learned+'件）。閲覧のみ。端末内履歴は変更しません。';
    },
    onTransferProgress:async()=>{
     const id=window.CS03_SELECTED_QUESTION?.read();
     if(!id)throw Error('SELECTED_QUESTION_UNAVAILABLE');
     const result=await manual.transfer(id);
     return result.copied?id+'：アカウントへの保存が完了しました。':'保存をキャンセルしました。';
    },
    onLoadProgress:async()=>{
     const id=window.CS03_SELECTED_QUESTION?.read();
     if(!id)throw Error('SELECTED_QUESTION_UNAVAILABLE');
     const value=await scoped.pull(id);
     if(!value)return id+'：アカウントの履歴はまだありません。';
     const labels={unseen:'未学習',review:'要復習',learning:'学習中',mastered:'習得済み'};
     return id+'：'+(labels[value.level]||'記録あり')+'（閲覧のみ。端末内履歴には反映しません）';
    }
   });
   await ui.refresh();
  }catch{
   // Fail closed. Existing local learning remains accessible.
   root.hidden=true;
  }
 }
}
