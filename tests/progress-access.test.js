'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createProgressAccess}=require('../src/progress-access');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const input={examCode:'db',questionId:'2025:am2:6'};
function setup() {
  const calls=[];
  const store={read:async x=>{calls.push(['read',x]);return x},write:async x=>{calls.push(['write',x]);return x}};
  const verifyToken=async token=>{if(token==='valid-a')return {userId:A};if(token==='valid-b')return {userId:B};throw Error('INVALID_TOKEN')};
  return {service:createProgressAccess({verifyToken,store}),calls};
}
const auth=t=>({authorization:'Bearer '+t});
test('A reads only using A verified subject, ignoring spoofed userId',async()=>{const {service,calls}=setup();const res=await service.read(auth('valid-a'),{...input,userId:B});assert.equal(res.userId,A);assert.equal(calls[0][1].userId,A)});
test('A cannot override B with a request body on write',async()=>{const {service,calls}=setup();const res=await service.write(auth('valid-a'),{...input,userId:B,data:{level:'review'},revision:1});assert.equal(res.userId,A);assert.equal(calls[0][1].userId,A)});
test('B writes to own verified subject',async()=>{const {service}=setup();assert.equal((await service.write(auth('valid-b'),{...input,data:{level:'learning'},revision:2})).userId,B)});
test('missing auth is denied before any DB call',async()=>{const {service,calls}=setup();await assert.rejects(service.read({},input),/UNAUTHORIZED/);assert.equal(calls.length,0)});
test('invalid or expired token rejected by verification dependency',async()=>{const {service,calls}=setup();await assert.rejects(service.write(auth('invalid'),{...input,data:{},revision:1}),/INVALID_TOKEN/);assert.equal(calls.length,0)});
test('invalid subject is denied',async()=>{const svc=createProgressAccess({verifyToken:async()=>({userId:'arbitrary'}),store:{read:async()=>{},write:async()=>{}}});await assert.rejects(svc.read(auth('valid-a'),input),/UNAUTHORIZED/)});
test('bad question or exam rejected',async()=>{const {service,calls}=setup();await assert.rejects(service.read(auth('valid-a'),{examCode:'db',questionId:'../secret'}),/BAD_REQUEST/);assert.equal(calls.length,0)});
test('malformed revision and data rejected',async()=>{const {service,calls}=setup();await assert.rejects(service.write(auth('valid-a'),{...input,data:[],revision:1}),/BAD_REQUEST/);await assert.rejects(service.write(auth('valid-a'),{...input,data:{},revision:0}),/BAD_REQUEST/);assert.equal(calls.length,0)});
test('fail closed if verifier or store missing',()=>{assert.throws(()=>createProgressAccess({verifyToken:null,store:{read(){},write(){}}}),/SECURE_DEPENDENCIES_REQUIRED/)});
