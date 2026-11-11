'use strict';
const assert=require('node:assert/strict');
const {merge}=require('../src/sync-merge.js');
const id='2025:am2:1';
const newer={selected:'ア',updatedAt:'2026-11-11T10:00:00.000Z'};
const older={selected:'イ',updatedAt:'2026-11-10T10:00:00.000Z'};
const remote=data=>[{question_id:id,data,updated_at:'2099-01-01T00:00:00Z'}];
{const r=merge({[id]:newer},remote(older));assert.deepEqual(r.progress[id],newer);assert.equal(r.uploads.length,1);assert.equal(r.conflicts.length,0)}
{const r=merge({[id]:older},remote(newer));assert.deepEqual(r.progress[id],newer);assert.equal(r.uploads.length,0)}
{const r=merge({},remote(newer));assert.deepEqual(r.progress[id],newer)}
{const r=merge({[id]:newer},[]);assert.equal(r.uploads.length,1)}
{const r=merge({[id]:newer},remote(newer));assert.equal(r.uploads.length,0)}
{const a={selected:'ア',updatedAt:'2026-11-11T10:00:00Z'},b={selected:'イ',updatedAt:'2026-11-11T10:00:00Z'};const r=merge({[id]:a},remote(b));assert.deepEqual(r.progress[id],a);assert.equal(r.uploads.length,0);assert.equal(r.conflicts.length,1);assert.deepEqual(r.conflicts[0].remote,b)}
{const r=merge({'2025:am2:0':newer},[{question_id:'2025:am2:0',data:older},{question_id:'__proto__',data:older}]);assert.equal(Object.keys(r.progress).length,0)}
{assert.throws(()=>merge(null,[]));assert.throws(()=>merge({},null))}
console.log('sync-merge 8/8 PASS');
