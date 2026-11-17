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
   // Only allow the exact isolated Managed Auth instance.
   if(cfg.authUrl!=='https://ep-dawn-dew-a11prveg.neonauth.ap-southeast-1.aws.neon.tech/cs03_auth_sandbox/auth')
    throw Error('AUTH_TARGET_MISMATCH');
   const client=createCs03AccountClient({
    authClient:createAuthClient(cfg.authUrl),apiUrl:cfg.apiUrl,
    storage:window.localStorage
   });
   root.hidden=false;
   const ui=mountCs03AccountPanel(root,client);
   await ui.refresh();
  }catch{
   // Fail closed. Existing local learning remains accessible.
   root.hidden=true;
  }
 }
}
