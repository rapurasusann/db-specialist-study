// CS-03 account panel: intentionally independent from the legacy local progress.
// No automatic migration or account mixing. Fails closed until Auth + API are wired.
export function mountCs03AccountPanel(root,account,options={}) {
 if(!root||!account||typeof account.signUp!=='function'||typeof account.signIn!=='function'||
    typeof account.signOut!=='function'||typeof account.session!=='function')throw Error('ACCOUNT_UI_CONFIG_REQUIRED');
 const get=id=>{
  const element=root.querySelector('[data-cs03="'+id+'"]');
  if(!element)throw Error('ACCOUNT_UI_ELEMENT_MISSING');
  return element;
 };
 const signup=get('signup'),login=get('login'),logout=get('logout');
 const email=get('email'),password=get('password'),name=get('name'),status=get('status'),identity=get('identity');
 const load=root.querySelector('[data-cs03="load-progress"]');
 const listAll=root.querySelector('[data-cs03="list-progress"]');
 const compare=root.querySelector('[data-cs03="compare-progress"]');
 const transfer=root.querySelector('[data-cs03="transfer-progress"]');
 const exportUnsaved=root.querySelector('[data-cs03="export-unsaved"]');
 const restoreFile=root.querySelector('[data-cs03="restore-unsaved-file"]');
 const restoreUnsaved=root.querySelector('[data-cs03="restore-unsaved"]');
 const discardUnsaved=root.querySelector('[data-cs03="discard-unsaved"]');
 const recordStatus=root.querySelector('[data-cs03="record-status"]');
 const retry=root.querySelector('[data-cs03="retry-sync"]');
 let busy=false,signedIn=false,ready=false;
 async function activate(user){ready=false;showUser(user);if(options.onSignedIn)await options.onSignedIn(user);ready=true;updateButtons();}
 function updateButtons(){
  signup.disabled=busy||signedIn;
  login.disabled=busy||signedIn;
  logout.disabled=busy||!signedIn;
  email.disabled=busy||signedIn;
  name.disabled=busy||signedIn;
  password.disabled=busy||signedIn;
  if(retry)retry.disabled=busy||!signedIn||ready;
  if(load)load.disabled=busy||!ready;
  if(listAll)listAll.disabled=busy||!ready;
  if(compare)compare.disabled=busy||!ready;
  if(transfer)transfer.disabled=busy||!ready;
  if(exportUnsaved)exportUnsaved.disabled=busy||!ready;
  if(restoreFile)restoreFile.disabled=busy||!ready;
  if(restoreUnsaved)restoreUnsaved.disabled=busy||!ready;
  if(discardUnsaved)discardUnsaved.disabled=busy||!ready;
 }
 function message(text){status.textContent=text;}
 function showUser(user){
  signedIn=Boolean(user?.id);if(!signedIn)ready=false;
  identity.textContent=signedIn?'ログイン中：'+(user.email||'アカウント確認済み'):'未ログイン';
  updateButtons();
 }
 async function run(fn){
  if(busy)return;
  busy=true;updateButtons();
  try{await fn();}
  catch(error){
   const kind=String(error?.message||'');
   message(kind==='SIGN_IN_REQUIRED'?'ログインしてください。':
     kind==='CREDENTIALS_REQUIRED'?'入力内容を確認してください。':
     kind==='PROGRESS_LIST_CANCELLED'?'履歴取得を中断しました。途中のデータは反映していません。必要に応じて再試行してください。':
     kind==='PROGRESS_LIST_TIMEOUT'?'履歴取得が10分を超えたため中止しました。途中のデータは反映していません。再試行してください。':
     '操作に失敗しました。認証情報と通信状態を確認してください。');
  }finally{busy=false;password.value='';updateButtons();}
 }
 signup.addEventListener('click',()=>run(async()=>{
  await account.signUp({email:email.value.trim(),password:password.value,name:name.value.trim()});
  message('登録要求を送信しました。必要に応じてメール認証を済ませてログインしてください。');
 }));
 login.addEventListener('click',()=>run(async()=>{
  const user=await account.signIn({email:email.value.trim(),password:password.value});
  await activate(user);
  message('ログインしました。既存の端末内履歴は自動で統合しません。');
 }));
 if(retry)retry.addEventListener('click',()=>run(async()=>{await activate(await account.session());message('アカウント履歴を取得しました。');}));
 logout.addEventListener('click',()=>run(async()=>{
  if(options.onBeforeSignOut)await options.onBeforeSignOut();
  await account.signOut();
  if(options.onSignedOut)await options.onSignedOut();
  showUser(null);if(recordStatus)recordStatus.textContent='ログアウトしました。';
  message('ログアウトしました。');
 }));
 if(transfer && typeof options.onTransferProgress==='function')transfer.addEventListener('click',()=>run(async()=>{
  if(recordStatus)recordStatus.textContent='選択中の問題の保存条件を確認中…';
  try{
   const result=await options.onTransferProgress();
   if(recordStatus)recordStatus.textContent=result;
  }catch(error){
   const code=String(error?.message||'');
   if(recordStatus)recordStatus.textContent=
    code==='REMOTE_RECORD_EXISTS'?'アカウント側に既存の履歴があります。上書きせず中止しました。':
    code==='NO_DEVICE_RECORD'?'選択中の問題には端末内の記録がありません。':
    code==='DEVICE_RECORD_CHANGED'?'端末内の記録が変わったため中止しました。':
    code==='ACCOUNT_CHANGED'?'ログインユーザーが変わったため中止しました。':
    code==='REVISION_CONFLICT_REFRESHED'?'別の端末で更新されています。上書きせず中止しました。':
    '保存できませんでした。端末内履歴は変更していません。';
   throw error;
  }
 }));
 if(listAll && typeof options.onListProgress==='function')listAll.addEventListener('click',()=>run(async()=>{
  if(recordStatus)recordStatus.textContent='アカウントの全履歴を取得中…';
  const summary=await options.onListProgress();
  if(recordStatus)recordStatus.textContent=summary;
 }));
 if(compare && typeof options.onCompareProgress==='function')compare.addEventListener('click',()=>run(async()=>{
  if(recordStatus)recordStatus.textContent='端末内とアカウントの履歴を比較中…';
  const summary=await options.onCompareProgress();
  if(recordStatus)recordStatus.textContent=summary;
 }));
 if(exportUnsaved && typeof options.onExportUnsaved==='function')exportUnsaved.addEventListener('click',()=>run(async()=>{
  const summary=await options.onExportUnsaved();
  if(recordStatus)recordStatus.textContent=summary;
 }));
 if(restoreFile && restoreUnsaved && typeof options.onRestoreUnsaved==='function')
  restoreUnsaved.addEventListener('click',()=>run(async()=>{
   const file=restoreFile.files?.[0];
   try{
    if(!file)throw Error('BACKUP_FILE_REQUIRED');
    if(file.size>1200000)throw Error('BACKUP_FILE_INVALID');
    // File selection is explicit; do not persist raw JSON or auto-upload.
    const result=await options.onRestoreUnsaved(await file.text());
    if(recordStatus)recordStatus.textContent=result;
   }catch(error){
    if(recordStatus)recordStatus.textContent='復元できませんでした。アカウントとファイルを確認してください。';
    throw error;
   }finally{restoreFile.value='';}
  }));
 if(discardUnsaved && typeof options.onDiscardUnsaved==='function')
  discardUnsaved.addEventListener('click',()=>run(async()=>{
   const summary=await options.onDiscardUnsaved();
   if(recordStatus)recordStatus.textContent=summary;
  }));
 if(load && typeof options.onLoadProgress==='function')load.addEventListener('click',()=>run(async()=>{
  if(recordStatus)recordStatus.textContent='アカウントの履歴を取得中…';
  const result=await options.onLoadProgress();
  if(recordStatus)recordStatus.textContent=result;
 }));
 showUser(null);message('アカウント機能の試験用画面です。自動同期は準備中です。');
 return {
  refresh:()=>run(async()=>{
   let user;
   try{user=await account.session();}
   catch{if(options.onSignedOut)await options.onSignedOut();showUser(null);message('ログインしていません。');return;}
   await activate(user);message('ログイン状態を確認しました。');
  })
 };
}
