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
  function key(input) {
    if (!input || typeof input.examCode !== 'string' || !/^[a-z][a-z0-9_]{1,31}$/.test(input.examCode) || typeof input.questionId !== 'string' || !/^20[0-9]{2}:(am1|am2|pm1|pm2):([1-9]|[1-9][0-9]|100)$/.test(input.questionId)) throw new Error('BAD_REQUEST');
    return {examCode:input.examCode, questionId:input.questionId};
  }
  async function read(headers, input) {
    const userId = await authenticatedUser(headers);
    return store.read({userId, ...key(input)});
  }
  async function write(headers, input) {
    const userId = await authenticatedUser(headers);
    const ids = key(input);
    if (!Object.prototype.hasOwnProperty.call(input, 'data') || !input.data || Array.isArray(input.data) || typeof input.data !== 'object' || Buffer.byteLength(JSON.stringify(input.data),'utf8') > 16384 || !Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error('BAD_REQUEST');
    return store.write({userId, ...ids, data:input.data, revision:input.revision});
  }
  return Object.freeze({read,write});
}
module.exports={createProgressAccess};
