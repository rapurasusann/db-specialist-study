// Stable record identity; same allowlist mirrored in isolated SQL migration.
const RECORD_ID=/^(20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)|term:(nf-1|nf-2|nf-3|ra-select|ra-project|ra-union|ra-intersect|ra-difference|ra-product|ra-join|ra-division|ra-rename|iso-ru|iso-rc|iso-rr|iso-ser|iso-dirty|iso-nonrepeat|iso-phantom|xp-pair|xp-tdd|xp-ci|xp-refactor|xp-collective|xp-simple|xp-small|xp-customer|xp-pace|xp-standard|crypto-symmetric|crypto-public|crypto-aes|crypto-rsa|crypto-hash|crypto-sign|crypto-hmac|crypto-hybrid|crypto-ecdh|crypto-forward|crypto-nonce|crypto-salt|crypto-aead|con-immediate|con-deferred|con-deferrable|con-set-constraints|con-initially-immediate|con-initially-deferred|con-unique|con-transaction)|step:[2-5]:[1-5]:([1-9]|10))$/;
const CONTEXTS=Object.freeze(['受注管理','履修管理','在庫管理','従業員技能管理','店舗販売集計']);
export const CS03_MAX_CATALOG_RECORDS=4250;
export function validCs03RecordId(id){return typeof id==='string'&&RECORD_ID.test(id);}
export function termRecordId(id){const key='term:'+id;if(!validCs03RecordId(key))throw Error('INVALID_RECORD');return key;}
export function stepRecordId(id){if(typeof id!=='string')throw Error('INVALID_RECORD');const m=/^s([2-5])-(.+)-([1-9]|10)$/.exec(id);if(!m)throw Error('INVALID_RECORD');const c=CONTEXTS.indexOf(m[2])+1;if(!c)throw Error('INVALID_RECORD');return 'step:'+m[1]+':'+c+':'+m[3];}
export function localStepId(key){if(!validCs03RecordId(key)||!key.startsWith('step:'))throw Error('INVALID_RECORD');const [,lv,c,n]=key.split(':');return 's'+lv+'-'+CONTEXTS[Number(c)-1]+'-'+n;}
