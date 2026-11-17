const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const preview = fs.readFileSync(path.join(__dirname,'../src/account-form-preview.js'),'utf8');

test('preview is hidden until explicitly opened', () => {
  assert.match(html, /id="accountPreview" hidden/);
  assert.match(html, /id="accountPreviewToggle" aria-expanded="false"/);
});
test('registration and login fields and feedback exist', () => {
  for (const id of ['accountPreviewForm','accountPreviewMode','accountPreviewEmail','accountPreviewPassword','accountPreviewPasswordConfirm','accountPreviewStatus'])
    assert.ok(html.includes('id="'+id+'"'), id);
});
test('validation loads before form preview', () => {
  assert.ok(html.indexOf('src/account-validation.js') < html.indexOf('src/account-form-preview.js'));
});
test('preview never calls authentication endpoints or stores passwords', () => {
  assert.doesNotMatch(preview,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\/auth\/|\/rest\/|syncAll\s*\(/);
  assert.match(preview,/event\.preventDefault\(\)/);
});
test('no change to existing sync controls required', () => {
  assert.match(html,/id="syncControls" hidden/);
  assert.match(html,/id="syncStatus"/);
});
