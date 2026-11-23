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
 const recordStatus=root.querySelector('[data-cs03="record-status"]');
 let busy=false,signedIn=false;
 function updateButtons(){
  signup.disabled=busy||signedIn;
  login.disabled=busy||signedIn;
  logout.disabled=busy||!signedIn;
  email.disabled=busy||signedIn;
  name.disabled=busy||signedIn;
  password.disabled=busy||signedIn;
  if(load)load.disabled=busy||!signedIn;
  if(listAll)listAll.disabled=busy||!signedIn;
  if(compare)compare.disabled=busy||!signedIn;
  if(transfer)transfer.disabled=busy||!signedIn;
 }
 function message(text){status.textContent=text;}
 function showUser(user){
  signedIn=Boolean(user?.id);
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
     '操作に失敗しました。認証情報と通信状態を確認してください。');
  }finally{busy=false;password.value='';updateButtons();}
 }
 signup.addEventListener('click',()=>run(async()=>{
  await account.signUp({email:email.value.trim(),password:password.value,name:name.value.trim()});
  message('登録要求を送信しました。必要に応じてメール認証を済ませてログインしてください。');
 }));
 login.addEventListener('click',()=>run(async()=>{
  const user=await account.signIn({email:email.value.trim(),password:password.value});
  showUser(user);
  if(options.onSignedIn)await options.onSignedIn(user);
  message('ログインしました。既存の端末内履歴は自動で統合しません。');
 }));
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
 if(load && typeof options.onLoadProgress==='function')load.addEventListener('click',()=>run(async()=>{
  if(recordStatus)recordStatus.textContent='アカウントの履歴を取得中…';
  const result=await options.onLoadProgress();
  if(recordStatus)recordStatus.textContent=result;
 }));
 showUser(null);message('アカウント機能の試験用画面です。自動同期は準備中です。');
 return {
  refresh:()=>run(async()=>{
   try{const user=await account.session();showUser(user);
    if(options.onSignedIn)await options.onSignedIn(user);
    message('ログイン状態を確認しました。');}
   catch{if(options.onSignedOut)await options.onSignedOut();
    showUser(null);message('ログインしていません。');}
  })
 };
}
