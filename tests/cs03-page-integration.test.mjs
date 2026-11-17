import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const config=readFileSync(new URL('../cs03-config.js',import.meta.url),'utf8');
const loader=readFileSync(new URL('../src/cs03-account-preview-loader.mjs',import.meta.url),'utf8');
test('existing study page contains isolated account panel and required inputs',()=>{
 assert.match(page,/<section id="cs03AccountPanel" hidden/);
 for(const id of ['email','name','password','signup','login','logout','identity','status'])
  assert.ok(page.includes('data-cs03="'+id+'"'));
});
test('legacy study questions and PDF controls remain intact',()=>{
 for(const id of ['viewStudy','year','backup','pageImage','ansImage','questions','syncStatus'])
  assert.ok(page.includes('id="'+id+'"'));
});
test('account preview disabled by default and script skips loading bundle',()=>{
 assert.match(config,/previewEnabled:false/);
 assert.match(loader,/if\(cfg\?\.previewEnabled===true\)/);
 assert.match(page,/src="src\/cs03-account-preview-loader\.mjs"/);
});
test('no new inline JavaScript or password defaults in account panel',()=>{
 const panel=page.slice(page.indexOf('id="cs03AccountPanel"'),page.indexOf('<div class="foot">'));
 assert.doesNotMatch(panel,/on(?:click|change|submit)=/);
 assert.doesNotMatch(panel,/type="password"[^>]*value=/);
});
