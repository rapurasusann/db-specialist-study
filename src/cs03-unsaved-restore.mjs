// Explicit JSON-backup recovery into account-specific review drafts only.
// Never writes to Neon, legacy device progress, or browser storage.
export async function restoreCs03UnsavedBackup({auto,jsonText,confirmRestore}={}){
 if(!auto||typeof auto.restorePending!=='function'||typeof auto.state!=='function'||
    typeof confirmRestore!=='function')throw Error('UNSAVED_RESTORE_CONFIG_REQUIRED');
 if(typeof jsonText!=='string'||new TextEncoder().encode(jsonText).length>1200000)
  throw Error('BACKUP_FILE_INVALID');
 let backup;
 try{backup=JSON.parse(jsonText);}catch{throw Error('BACKUP_FILE_INVALID');}
 if(!backup||typeof backup!=='object'||Array.isArray(backup)||
    backup.format!=='cs03-unsaved-account-progress-v1'||!backup.records||
    typeof backup.records!=='object'||Array.isArray(backup.records))throw Error('BACKUP_FILE_INVALID');
 const before=auto.state();
 if(!before.active||before.userId!==backup.userId)throw Error('BACKUP_ACCOUNT_MISMATCH');
 const count=Object.keys(backup.records).length;
 if(count<1||count>1600)throw Error('BACKUP_RECORDS_INVALID');
 const approved=await confirmRestore(count);
 if(approved!==true)return {restored:0,cancelled:true};
 const after=auto.state();
 if(!after.active||after.userId!==before.userId)throw Error('BACKUP_ACCOUNT_MISMATCH');
 // restorePending validates every identifier and payload before mutating memory.
 // It installs blocked drafts, not saved records, and never auto-submits.
 return auto.restorePending(backup);
}
