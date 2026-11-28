const API='https://api.cloudflare.com/client/v4';
const EXPECTED={account:'9829f590b4afea346993621ca3a0c13f',script:'cs03-browser-isolated-candidate-not-approved'};
function check(t){if(!t||t.account!==EXPECTED.account||t.script!==EXPECTED.script)throw Error('CLOUDFLARE_TARGET_REJECTED');}
export function createCloudflareAdapter({token,fetchImpl=fetch,target=EXPECTED}){
 check(target);if(typeof token!=='string'||token.length<20)throw Error('CLOUDFLARE_CREDENTIAL_MISSING');
 const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
 return {async putSecret(name,value){if(name!=='CS03_GATEWAY_SECRET'||typeof value!=='string'||value.length<32)throw Error('CLOUDFLARE_SECRET_REJECTED');const r=await fetchImpl(`${API}/accounts/${target.account}/workers/scripts/${target.script}/secrets`,{method:'PUT',headers,body:JSON.stringify({name,text:value,type:'secret_text'})});let b;try{b=await r.json()}catch{throw Error('CLOUDFLARE_RESPONSE_INVALID')}if(!r.ok||b?.success!==true)throw Error('CLOUDFLARE_API_FAILED');return true;}};
}
