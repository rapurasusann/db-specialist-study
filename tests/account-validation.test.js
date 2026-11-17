const test = require('node:test');
const assert = require('node:assert/strict');
const v = require('../src/account-validation.js');

test('valid registration with email and matching password', () => {
  assert.equal(v.validateRegistration({email:'user@example.com',password:'a-long-password-123',confirmPassword:'a-long-password-123'}).valid,true);
});
test('rejects malformed email', () => {
  assert.equal(v.validateRegistration({email:'invalid',password:'a-long-password-123',confirmPassword:'a-long-password-123'}).valid,false);
});
test('rejects short password', () => {
  assert.equal(v.validateRegistration({email:'user@example.com',password:'short',confirmPassword:'short'}).valid,false);
});
test('rejects mismatch', () => {
  assert.equal(v.validateRegistration({email:'user@example.com',password:'a-long-password-123',confirmPassword:'different-password'}).valid,false);
});
test('login does not impose registration minimum on existing password', () => {
  assert.equal(v.validateLogin({email:'user@example.com',password:'old'}).valid,true);
});
test('login rejects missing password', () => {
  assert.equal(v.validateLogin({email:'user@example.com',password:''}).valid,false);
});
