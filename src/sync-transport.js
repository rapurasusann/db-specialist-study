/* Dedicated DB Study sync API transport. Does NOT provision or connect until configured.
   Backend MUST verify JWT, derive user id server-side and enforce row ownership.
   Expected API endpoints: GET /v1/progress and PUT /v1/progress/:encoded-id
*/
(function(root){
'use strict';
const VALID_ID=/^20\d{2}:(am1|am2|pm1|pm2):([1-9]|[1-9]\d|100)$/;
function createTransport({baseUrl,getToken,fetchImpl}){
 const base=new URL(baseUrl);
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/'||!base.hostname)throw Error('同期APIのURLはHTTPSのオリジンのみ指定してください');
 if(typeof getToken!=='function')throw Error('認証トークン取得処理が必要です');
 const request=fetchImpl||root.fetch?.bind(root);
 if(typeof request!=='function')throw Error('fetchが利用できません');
 async function call(path,method='GET',data){
  const token=await getToken();
  if(typeof token!=='string'||!token.trim())throw Error('認証が必要です');
  const controller=new AbortController();
  const options={method,signal:controller.signal,headers:{Authorization:'Bearer '+token,Accept:'application/json'}};
  if(data!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data)}
  // No cookie or cross-origin credentials are ever sent.
  options.credentials='omit';
  const response=await request(new URL(path,base),options);
  if(!response.ok)throw Error('同期APIエラー: '+response.status);
  const result=await response.json();
  if(result===null||typeof result!=='object')throw Error('同期APIの応答形式が不正です');
  return result;
 }
 return Object.freeze({
   list:async()=>{
     const result=await call('/v1/progress');
     if(!Array.isArray(result.rows))throw Error('同期APIの履歴形式が不正です');
     return result.rows;
   },
   put:async(id,row,expectedRevision)=>{
     if(!VALID_ID.test(id)||!row||typeof row!=='object'||Array.isArray(row))throw Error('不正な学習履歴です');
     if(expectedRevision!==null&&(!Number.isSafeInteger(expectedRevision)||expectedRevision<0))throw Error('不正なrevisionです');
     // Server must apply an atomic compare-and-swap using expectedRevision.
     // On stale revision, server MUST return HTTP 409, never overwrite.
     return call('/v1/progress/'+encodeURIComponent(id),'PUT',{data:row,expectedRevision});
   }
 });
}
const api=Object.freeze({createTransport});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.DBStudyTransport=api;
})(typeof globalThis==='object'?globalThis:this);
