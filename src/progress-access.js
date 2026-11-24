'use strict';
// CS-03 server-side authorization boundary. Never bundle into the browser.
// verifyToken MUST validate JWT signature, issuer, audience, and expiry.
function createProgressAccess({ verifyToken, store }) {
  if (typeof verifyToken !== 'function' || !store || typeof store.read !== 'function' || typeof store.write !== 'function') throw new TypeError('SECURE_DEPENDENCIES_REQUIRED');
  function bearer(headers) {
    const raw = headers && (typeof headers.get === 'function' ? headers.get('authorization') : headers.authorization);
    if (typeof raw !== 'string' || !/^Bearer [A-Za-z0-9_~+./=-]+$/.test(raw)) throw new Error('UNAUTHORIZED');
    return raw.slice(7);
  }
  async function authenticatedUser(headers) {
    const identity = await verifyToken(bearer(headers));
    if (!identity || typeof identity.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.userId)) throw new Error('UNAUTHORIZED');
    return identity.userId.toLowerCase();
  }
  function exam(input){if(!input||typeof input.examCode!=='string'||!/^[a-z][a-z0-9_]{1,31}$/.test(input.examCode))throw Error('BAD_REQUEST');return input.examCode;}
  const QUESTION=/^(20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)|term:(nf-1|nf-2|nf-3|ra-select|ra-project|ra-union|ra-intersect|ra-difference|ra-product|ra-join|ra-division|ra-rename|iso-ru|iso-rc|iso-rr|iso-ser|iso-dirty|iso-nonrepeat|iso-phantom|xp-pair|xp-tdd|xp-ci|xp-refactor|xp-collective|xp-simple|xp-small|xp-customer|xp-pace|xp-standard|crypto-symmetric|crypto-public|crypto-aes|crypto-rsa|crypto-hash|crypto-sign|crypto-hmac|crypto-hybrid|crypto-ecdh|crypto-forward|crypto-nonce|crypto-salt|crypto-aead|con-immediate|con-deferred|con-deferrable|con-set-constraints|con-initially-immediate|con-initially-deferred|con-unique|con-transaction)|step:[2-5]:[1-5]:([1-9]|10))$/;
  function key(input) {
    if (!input || typeof input.examCode !== 'string' || !/^[a-z][a-z0-9_]{1,31}$/.test(input.examCode) || typeof input.questionId !== 'string' || !QUESTION.test(input.questionId)) throw new Error('BAD_REQUEST');
    return {examCode:input.examCode, questionId:input.questionId};
  }
  async function read(headers, input) {
    const userId = await authenticatedUser(headers);
    return store.read({userId, ...key(input)});
  }
  async function list(headers,input){
    const userId=await authenticatedUser(headers);
    const examCode=exam(input);
    const limit=input?.limit===undefined?100:Number(input.limit);
    const cursor=input?.cursor??null;
    if(!Number.isInteger(limit)||limit<1||limit>100||
       (cursor!==null&&(typeof cursor!=='string'||!QUESTION.test(cursor))))throw Error('BAD_REQUEST');
    if(typeof store.list!=='function')throw Error('SERVICE_UNAVAILABLE');
    return store.list({userId,examCode,limit,cursor});
  }
  async function write(headers, input) {
    const userId = await authenticatedUser(headers);
    const ids = key(input);
    if (!Object.prototype.hasOwnProperty.call(input, 'data') || !input.data || Array.isArray(input.data) || typeof input.data !== 'object' || Buffer.byteLength(JSON.stringify(input.data),'utf8') > 16384 || !Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error('BAD_REQUEST');
    return store.write({userId, ...ids, data:input.data, revision:input.revision});
  }
  return Object.freeze({read,write,list});
}
module.exports={createProgressAccess};
