import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const file=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=file('src/pm-archive-data.js');
const window={};
runInNewContext(source,{window});
const years=window.DB_PM_ARCHIVE;

test('ten official DB afternoon exam sessions from 2016 to 2025, including October 2020',()=>{
 assert.equal(years.length,10);
 assert.deepEqual(years.map(x=>x.year),[2025,2024,2023,2022,2021,2020,2019,2018,2017,2016]);
 assert.equal(new Set(years.map(x=>x.year)).size,10);
 assert.equal(years.find(x=>x.year===2020).term,'10月');
 assert.equal(years.find(x=>x.year===2019).term,'春期');
 assert.equal(years.find(x=>x.year===2021).term,'秋期');
});

test('every afternoon question/answer booklet links only to year-verified IPA origin',()=>{
 for(const entry of years){
  assert.match(entry.index,/^https:\/\/www\.ipa\.go\.jp\/shiken\/mondai-kaiotu\/[a-z0-9]+\.html$/);
  assert.match(entry.base,/^https:\/\/www\.ipa\.go\.jp\/shiken\/mondai-kaiotu\/[a-z0-9]+-att\/$/);
  for(const session of ['pm1','pm2']){
   for(const suffix of ['qs','ans']){
    const u=entry.base+entry.code+'_db_'+session+'_'+suffix+'.pdf';
    assert.match(u,/^https:\/\/www\.ipa\.go\.jp\/shiken\/mondai-kaiotu\/.+_db_pm[12]_(?:qs|ans)\.pdf$/);
   }
  }
 }
});

test('new archive is added via same-origin scripts without relaxing CSP or overwriting legacy screens',()=>{
 const html=file('index.html');
 const scripts=html.match(/<script src="src\/pm-archive-(?:data|view)\.js\?v=20261124a"><\/script>/g);
 assert.equal(scripts?.length,2);
 assert.ok(html.indexOf('pm-archive-data.js')<html.indexOf('pm-archive-view.js'));
 assert.match(html,/script-src 'self'/);
 assert.match(html,/connect-src 'self'/);
 assert.match(html,/src\/term-understanding-ui.js/);
 assert.match(html,/src\/pm1-q1-study-layout.js/);
 assert.match(html,/src\/afternoon-generic-layout.js/);
});

test('archive view compiles; records are kept under original progress key and never use external provider keys',()=>{
 const code=file('src/pm-archive-view.js');
 assert.doesNotThrow(()=>new Script(code));
 assert.match(code,/progress\[id\]/);
 assert.match(code,/save\(\)/);
 assert.match(code,/target="_blank" rel="noopener noreferrer"/);
 assert.match(code,/www\\\.ipa\\\.go\\\.jp/);
 assert.doesNotMatch(code,/service_role|sb_secret|x-secret|\.supabase\.co/);
});
