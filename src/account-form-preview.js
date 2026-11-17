/* CS-03: isolated account form preview; no authentication or network calls. */
(function (root) {
  'use strict';
  function init(doc) {
    const panel = doc.getElementById('accountPreview');
    const form = doc.getElementById('accountPreviewForm');
    const status = doc.getElementById('accountPreviewStatus');
    const toggle = doc.getElementById('accountPreviewToggle');
    if (!panel || !form || !status || !toggle || !root.DBStudyAccountValidation) return false;
    const validator = root.DBStudyAccountValidation;
    const mode = doc.getElementById('accountPreviewMode');
    const confirm = doc.getElementById('accountPreviewConfirm');
    const submit = doc.getElementById('accountPreviewSubmit');
    const email = doc.getElementById('accountPreviewEmail');
    const password = doc.getElementById('accountPreviewPassword');
    const passwordConfirm = doc.getElementById('accountPreviewPasswordConfirm');
    if (!mode || !confirm || !submit || !email || !password || !passwordConfirm) return false;
    function clearErrors() {
      for (const field of [email, password, passwordConfirm]) field.removeAttribute('aria-invalid');
    }
    function setMode(value) {
      const registering = value === 'register';
      mode.value = registering ? 'register' : 'login';
      confirm.hidden = !registering;
      passwordConfirm.disabled = !registering;
      password.autocomplete = registering ? 'new-password' : 'current-password';
      clearErrors();
      submit.textContent = registering ? '登録内容を確認' : 'ログイン内容を確認';
      status.textContent = '画面の入力確認のみ可能です。登録・ログインはまだ実行されません。';
      form.reset();
      mode.value = registering ? 'register' : 'login';
      confirm.hidden = !registering;
      passwordConfirm.disabled = !registering;
    }
    toggle.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) setMode(mode.value);
    });
    mode.addEventListener('change', function () { setMode(mode.value); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors();
      const input = { email: email.value, password: password.value, confirmPassword: passwordConfirm.value };
      const result = mode.value === 'register'
        ? validator.validateRegistration(input)
        : validator.validateLogin(input);
      if (!result.valid) {
        if (!validator.validateEmail(input.email)) email.setAttribute('aria-invalid', 'true');
        if (mode.value === 'register' && !validator.validatePassword(input.password)) password.setAttribute('aria-invalid', 'true');
        if (mode.value === 'register' && input.password !== input.confirmPassword) passwordConfirm.setAttribute('aria-invalid', 'true');
        if (!input.password) password.setAttribute('aria-invalid', 'true');
      }
      status.textContent = result.valid
        ? '入力形式を確認しました。登録・ログイン機能は開発中のため、送信していません。'
        : result.errors.join(' ');
      password.value = '';
      passwordConfirm.value = '';
    });
    setMode('register');
    return true;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {init};
  else if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(root.document); });
    else init(root.document);
  }
})(typeof window === 'undefined' ? globalThis : window);
