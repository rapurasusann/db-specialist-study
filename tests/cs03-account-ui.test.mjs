import test from 'node:test';
import assert from 'node:assert/strict';
import {mountCs03AccountPanel} from '../src/cs03-account-ui.mjs';
function element(){
 const handlers={};
 return {value:'',textContent:'',disabled:false,addEventListener:(event,handler)=>handlers[event]=handler,click:()=>handlers.click?.()};
}
function fixture(){
 const ids=['signup','login','logout','email','password','name','status','identity'];
 const elements=Object.fromEntries(ids.map(k=>[k,element()]));
 const events=[];
 const account={
  signUp:async fields=>{events.push({type:'signup',fields});return {user:{id:'some'}};},
  signIn:async fields=>{events.push({type:'login',fields});return {id:'a',email:fields.email};},
  signOut:async()=>{events.push({type:'logout'});},
  session:async()=>({id:'a',email:'a@example.com'})
 };
 const root={querySelector:selector=>elements[selector.slice(12,-2)]??null};
 // Selector is [data-cs03="signup"] (length prefix 12)
 const mount=()=>mountCs03AccountPanel(root,account);
 return {elements,events,account,mount};
}
async function ticks(){await new Promise(resolve=>setImmediate(resolve));}
test('configuration missing fails closed',()=>{
 assert.throws(()=>mountCs03AccountPanel(null,{}),/ACCOUNT_UI_CONFIG_REQUIRED/);
});
test('panel initializes logged out and prevents logout',()=>{
 const f=fixture();f.mount();
 assert.equal(f.elements.logout.disabled,true);
 assert.equal(f.elements.login.disabled,false);
});
test('signup sends only values to auth client and clears password',async()=>{
 const f=fixture();f.mount();
 f.elements.email.value='  a@example.com ';f.elements.password.value='secret';f.elements.name.value='Student';
 f.elements.signup.click();await ticks();
 assert.equal(f.events[0].type,'signup');
 assert.deepEqual(f.events[0].fields,{email:'a@example.com',password:'secret',name:'Student'});
 assert.equal(f.elements.password.value,'');
});
test('login updates identity without touching legacy progress',async()=>{
 const f=fixture();f.mount();
 f.elements.email.value='a@example.com';f.elements.password.value='secret';
 f.elements.login.click();await ticks();
 assert.equal(f.events[0].type,'login');
 assert.equal(f.elements.login.disabled,true);
 assert.equal(f.elements.logout.disabled,false);
 assert.match(f.elements.identity.textContent,/a@example.com/);
});
test('logout clears identity and restores input',async()=>{
 const f=fixture();f.mount();
 f.elements.login.click();await ticks();f.elements.logout.click();await ticks();
 assert.equal(f.events.at(-1).type,'logout');
 assert.equal(f.elements.login.disabled,false);
 assert.equal(f.elements.logout.disabled,true);
 assert.equal(f.elements.identity.textContent,'未ログイン');
});
test('session restores identity',async()=>{
 const f=fixture();const panel=f.mount();
 await panel.refresh();
 assert.equal(f.elements.logout.disabled,false);
});

test('pending account edits refuse sign-out before contacting auth provider',async()=>{
 const f=fixture();
 mountCs03AccountPanel({querySelector:selector=>f.elements[selector.slice(12,-2)]??null},f.account,{
  onBeforeSignOut:()=>{throw Error('UNSAVED_ACCOUNT_PROGRESS');}
 });
 f.elements.login.click();await ticks();
 f.elements.logout.click();await ticks();
 assert.equal(f.events.filter(e=>e.type==='logout').length,0);
 assert.equal(f.elements.logout.disabled,false);
 assert.equal(f.elements.login.disabled,true);
});
test('sign-out checks account write guard before invoking auth provider',async()=>{
 const f=fixture(),calls=[];
 mountCs03AccountPanel({querySelector:selector=>f.elements[selector.slice(12,-2)]??null},{
  ...f.account,signOut:async()=>{calls.push('auth');}
 },{onBeforeSignOut:async()=>calls.push('guard')});
 f.elements.login.click();await ticks();
 f.elements.logout.click();await ticks();
 assert.deepEqual(calls,['guard','auth']);
});

test('restore button imports selected JSON only after explicit interaction and clears file selection',async()=>{
 const f=fixture(),seen=[];
 const pick=element(),button=element(),recordStatus=element();
 pick.files=[{size:90,text:async()=>'{"format":"cs03-unsaved-account-progress-v1"}'}];
 f.elements['restore-unsaved-file']=pick;
 f.elements['restore-unsaved']=button;
 f.elements['record-status']=recordStatus;
 mountCs03AccountPanel({querySelector:selector=>f.elements[selector.slice(12,-2)]??null},f.account,{
  onRestoreUnsaved:async text=>{seen.push(text);return '確認待ちとして読み込みました。';}
 });
 assert.equal(button.disabled,true);
 f.elements.login.click();await ticks();
 assert.equal(button.disabled,false);
 button.click();await ticks();
 assert.deepEqual(seen,['{"format":"cs03-unsaved-account-progress-v1"}']);
 assert.equal(recordStatus.textContent,'確認待ちとして読み込みました。');
 assert.equal(pick.value,'');
});
test('oversize backup file is rejected without reading or submitting',async()=>{
 const f=fixture(),seen=[],pick=element(),button=element(),recordStatus=element();
 pick.files=[{size:1200001,text:async()=>{throw Error('SHOULD_NOT_READ')}}];
 f.elements['restore-unsaved-file']=pick;f.elements['restore-unsaved']=button;f.elements['record-status']=recordStatus;
 mountCs03AccountPanel({querySelector:selector=>f.elements[selector.slice(12,-2)]??null},f.account,{
  onRestoreUnsaved:async text=>{seen.push(text);return 'unexpected';}
 });
 f.elements.login.click();await ticks();button.click();await ticks();
 assert.deepEqual(seen,[]);
 assert.match(recordStatus.textContent,/復元できませんでした/);
 assert.equal(pick.value,'');
});
