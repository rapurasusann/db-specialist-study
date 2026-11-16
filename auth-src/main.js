import { createAuthClient } from '@neon/auth';
const authUrl=import.meta.env.VITE_NEON_AUTH_URL;
const appUrl='https://rapurasusann.github.io/db-specialist-study/auth/';
const status=document.getElementById('result');
const $=id=>document.getElementById(id);
const auth=authUrl?createAuthClient(authUrl):null;
function message(m){status.textContent=m}
async function act(fn){
 if(!auth){message('認証サーバーの設定がありません。');return}
 try{await fn()}catch{message('通信に失敗しました。時間をおいて再試行してください。')}
}
const search=new URLSearchParams(location.search);
const resetToken=search.get('token');
if(resetToken){$('reset').hidden=false;$('request').hidden=true;history.replaceState(null,'',location.pathname)}
else if(search.has('error'))message('リンクが無効または期限切れです。設定メールを再送してください。');
$('sendReset').onclick=()=>act(async()=>{
 const email=$('email').value.trim();
 if(!email){message('メールアドレスを入力してください。');return}
 const {error}=await auth.requestPasswordReset({email,redirectTo:appUrl});
 message(error?'設定メールの送信に失敗しました。':'登録済みの場合、設定用メールが届きます。');
});
$('applyReset').onclick=()=>act(async()=>{
 const p=$('password').value;
 if(p.length<12||p!==$('passwordAgain').value){message('12文字以上の同じパスワードを2回入力してください。');return}
 if(!resetToken){message('有効な再設定リンクがありません。');return}
 const {error}=await auth.resetPassword({newPassword:p,token:resetToken});
 $('password').value='';$('passwordAgain').value='';
 if(error){message('パスワード設定に失敗しました。リンクの期限を確認してください。');return}
 $('reset').hidden=true;message('パスワードを設定しました。ログインしてください。');
});
$('signIn').onclick=()=>act(async()=>{
 const {data,error}=await auth.signIn.email({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
 $('loginPassword').value='';
 message(error||!data?.user?'ログインできませんでした。入力内容を確認してください。':'ログインしました。現在は同期機能の接続準備中です。');
});
$('signOut').onclick=()=>act(async()=>{
 const {error}=await auth.signOut();
 message(error?'ログアウトできませんでした。':'ログアウトしました。');
});
