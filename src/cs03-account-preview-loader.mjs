// No external network requests or missing bundle imports unless preview explicitly enabled.
const cfg=window.DB_STUDY_CS03;
if(cfg?.previewEnabled===true){
 try{await import('./cs03-account.bundle.js');}
 catch{const root=document.getElementById('cs03AccountPanel');if(root)root.hidden=true;}
}
