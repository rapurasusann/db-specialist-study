import {validCs03RecordId,CS03_MAX_CATALOG_RECORDS} from './cs03-learning-record-id.mjs';
// Private-to-this-origin, per-account checkpoint of unsent study drafts.
// Local browser storage is not encrypted and is NOT a substitute for JSON backups.
// No tokens, email addresses, passwords, or server credentials are stored here.
const USER=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FORMAT='cs03-unsaved-account-progress-v1';
const PREFIX='db-study-cs03-unsaved-v1-';
const MAX_BYTES=1100000;
function assertUser(id){if(!USER.test(id??''))throw Error('DRAFT_ACCOUNT_INVALID');}
function cleanRows(records){
 if(!records||typeof records!=='object'||Array.isArray(records))throw Error('DRAFT_RECORDS_INVALID');
 const entries=Object.entries(records);
 if(entries.length>CS03_MAX_CATALOG_RECORDS)throw Error('DRAFT_RECORDS_INVALID');
 const result=Object.create(null);
 let total=0;
 for(const [id,row] of entries){
  if(!validCs03RecordId(id)||!row||typeof row!=='object'||Array.isArray(row))
   throw Error('DRAFT_RECORD_INVALID');
  const copy=structuredClone(row);
  const json=JSON.stringify(copy);
  if(typeof json!=='string')throw Error('DRAFT_RECORD_INVALID');
  const size=new TextEncoder().encode(json).length;
  if(size>16000)throw Error('DRAFT_RECORD_TOO_LARGE');
  total+=size;
  if(total>1024*1024)throw Error('DRAFT_RECORDS_TOO_LARGE');
  result[id]=copy;
 }
 return result;
}
export function createCs03DraftStore({storage}={}){
 if(!storage||!['getItem','setItem','removeItem'].every(x=>typeof storage[x]==='function'))
  throw Error('DRAFT_STORAGE_REQUIRED');
 const key=id=>PREFIX+id.toLowerCase();
 function load(userId){
  assertUser(userId);
  let value;
  try{value=storage.getItem(key(userId));}catch{throw Error('DRAFT_STORAGE_UNAVAILABLE');}
  if(value===null)return null;
  if(typeof value!=='string'||new TextEncoder().encode(value).length>MAX_BYTES)
   throw Error('DRAFT_STORAGE_CORRUPT');
  let obj;
  try{obj=JSON.parse(value);}catch{throw Error('DRAFT_STORAGE_CORRUPT');}
  if(obj?.format!==FORMAT||obj?.userId!==userId)
   throw Error('DRAFT_STORAGE_CORRUPT');
  try{
   const rows=cleanRows(obj.records);
   if(Object.keys(rows).length===0)throw Error('EMPTY');
   return {format:FORMAT,userId,records:rows};
  }catch{throw Error('DRAFT_STORAGE_CORRUPT');}
 }
 function replace(userId,records){
  assertUser(userId);
  const rows=cleanRows(records);
  try{
   if(Object.keys(rows).length===0){storage.removeItem(key(userId));return;}
   const value=JSON.stringify({format:FORMAT,userId,records:rows});
   if(new TextEncoder().encode(value).length>MAX_BYTES)throw Error('DRAFT_TOO_LARGE');
   storage.setItem(key(userId),value);
  }catch{throw Error('DRAFT_STORAGE_UNAVAILABLE');}
 }
 return Object.freeze({load,replace});
}
