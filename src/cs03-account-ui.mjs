// CS-03 account panel: intentionally independent from the legacy local progress.
// No automatic migration or account mixing. Fails closed until Auth + API are wired.
export function mountCs03AccountPanel(root,account) {
 if(!root||!account||typeof account.signUp!=='function'||typeof account.signIn!=='function'||
    typeof account.signOut!=='function'||typeof account.session!=='function')throw Error('ACCOUNT_UI_CONFIG_REQUIRED');
 const get=id=>{
  const element=root.querySelector('[data-cs03="'+id+'"]');
  if(!element)throw Error('ACCOUNT_UI_ELEMENT_MISSING');
  return element;
 };
 const signup=get('signup'),login=get('login'),logout=get('logout');
 const email=get('email'),password=get('password'),name=get('name'),status=get('status'),identity=get('identity');
 let busy=false,signedIn=false;
 function updateButtons(){
  signup.disabled=busy||signedIn;
  login.disabled=busy||signedIn;
  logout.disabled=busy||!signedIn;
  email.disabled=busy||signedIn;
  name.disabled=busy||signedIn;
  password.disabled=busy||signedIn;
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
  showUser(user);message('ログインしました。既存の端末内履歴は自動で統合しません。');
 }));
 logout.addEventListener('click',()=>run(async()=>{
  await account.signOut();showUser(null);message('ログアウトしました。');
 }));
 showUser(null);message('アカウント機能の試験用画面です。自動同期は準備中です。');
 return {
  refresh:()=>run(async()=>{
   try{const user=await account.session();showUser(user);message('ログイン状態を確認しました。');}
   catch{showUser(null);message('ログインしていません。');}
  })
 };
}
