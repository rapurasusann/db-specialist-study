/** Regression guard for early term/afternoon initialization.
 * Run: node --test tests/early-study-navigation-load.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const term=readFileSync(new URL('../src/term-understanding-ui.js',import.meta.url),'utf8');
const step=readFileSync(new URL('../src/afternoon-step-up-ui.js',import.meta.url),'utf8');
test('term and afternoon assets are preloaded and initialized ahead of the deferred extras',()=>{
 const firstTerm=html.indexOf('<script type="module" src="src/term-understanding-ui.js');
 const firstStep=html.indexOf('<script type="module" src="src/afternoon-step-up-ui.js');
 const extras=html.indexOf('<script defer src="src/am2-2025-questions.js');
 assert.ok(firstTerm>=0&&firstStep>firstTerm&&extras>firstStep);
 for(const file of [
  'src/term-understanding-questions.js?v=20261125reading1',
  'src/afternoon-step-up-questions.js?v=20261124ex1',
  'src/term-understanding-ui.js?v=20261125stable2',
  'src/afternoon-step-up-ui.js?v=20261125stable2'
 ])assert.ok(html.includes('<link rel="modulepreload" href="'+file+'">'),file);
 const deferred=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 assert.equal(new Set(deferred).size,deferred.length,'no duplicate deferred script');
 for(const name of ['src/am2-2025-questions.js','src/am2-shared-vector-figures.js','src/am2-archive-2024.js'])assert.ok(deferred.includes(name),name);
 assert.ok(deferred.indexOf('src/am2-shared-vector-figures.js')<deferred.indexOf('src/am2-archive-2024.js'));
 assert.equal((html.match(/src="src\/term-understanding-ui.js\?v=20261125stable2"/g)||[]).length,1);
 assert.equal((html.match(/src="src\/afternoon-step-up-ui.js\?v=20261125stable2"/g)||[]).length,1);
});
test('early modules keep buttons disabled only until initialized and are independent of each other',()=>{
 assert.match(html,/id="viewTerms" type="button" disabled/);
 assert.match(html,/id="viewStepUp" type="button" disabled/);
 assert.match(term,/button\.disabled=false/);
 assert.match(step,/button\.disabled=false/);
 assert.match(term,/if\(stepPanel\)stepPanel\.hidden=true/);
 assert.match(step,/if\(termPanel\)termPanel\.hidden=true/);
});
test('core CSP still lists the original two secure inline script digests',()=>{
 assert.match(html,/sha256-7Mb7RIJKKGQ8vhWbDK5YUndSSQq76qgMi2nFm6HnQlY=/);
 assert.match(html,/sha256-AHcQKUdBqB3qcunPpX\/jqxBHfCC2gnOzgZiHLrWXv\/E=/);
 const config=html.indexOf('<script src="cloud-config.js"></script>');
 const sync=html.indexOf('const CLOUD = window.DB_STUDY_CLOUD');
 assert.ok(config>=0&&sync>config);
});
