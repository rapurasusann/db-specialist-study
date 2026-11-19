import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const widget=readFileSync(new URL('src/am2-q8-q9-text-view.js',root),'utf8');
const clips=readFileSync(new URL('src/am2-figure-clips.js',root),'utf8');

test('question 8 and 9 structured HTML loads after figures and before choices extension',()=>{
 const figures=html.indexOf('src/am2-figure-clips.js');
 const structured=html.indexOf('src/am2-q8-q9-text-view.js');
 assert.ok(figures>=0&&structured>figures);
 assert.ok(html.includes('id="pageImage"'), 'original question viewer remains');
 assert.ok(!clips.includes("'2025:am2:8':"));
 assert.ok(!clips.includes("'2025:am2:9':"));
 assert.ok(widget.includes("data-study-text"));
 assert.ok(widget.includes('number===8?question8():question9()'));
});
test('question 8 keeps exact SQL constraints and both original rows',()=>{
 for(const item of ['PK_システム番号','UK_担当者番号','DEFERRABLE INITIALLY IMMEDIATE','1234','6789','111','222','SET CONSTRAINTS [ a ]','COMMIT;'])assert.ok(widget.includes(item),item);
});
test('question 9 preserves both rosters, placeholders and tabular markup',()=>{
 for(const item of ['試験 太郎','情報 花子','処理 一郎','東京','大阪','京都','名簿1','名簿2','[ a ]','[ b ]','[ c ]','COUNT(*) = 0','createElement(\'table\')'])assert.ok(widget.includes(item),item);
});
