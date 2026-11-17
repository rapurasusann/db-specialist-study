/* CS-03: validation only. No network requests, credentials storage or auth claims. */
(function (root) {
  'use strict';
  function validateEmail(email) {
    return typeof email === 'string' && email.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
  function validatePassword(password) {
    return typeof password === 'string' && password.length >= 12 &&
      password.length <= 128;
  }
  function validateRegistration(input) {
    const x = input || {};
    const errors = [];
    if (!validateEmail(x.email)) errors.push('メールアドレスの形式を確認してください。');
    if (!validatePassword(x.password)) errors.push('パスワードは12〜128文字で入力してください。');
    if (x.password !== x.confirmPassword) errors.push('確認用パスワードが一致しません。');
    return { valid: errors.length === 0, errors };
  }
  function validateLogin(input) {
    const x = input || {};
    const errors = [];
    if (!validateEmail(x.email)) errors.push('メールアドレスの形式を確認してください。');
    if (typeof x.password !== 'string' || !x.password.length) errors.push('パスワードを入力してください。');
    return { valid: errors.length === 0, errors };
  }
  const api = Object.freeze({validateEmail,validatePassword,validateRegistration,validateLogin});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DBStudyAccountValidation = api;
})(typeof window === 'undefined' ? globalThis : window);
