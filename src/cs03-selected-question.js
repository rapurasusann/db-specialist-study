// CS-03 read-only bridge to the existing study page.
// This classic script runs after the original inline study script.
// It cannot write the old db-study-progress-v1 store.
(function(){
 'use strict';
 const pattern=/^20\d{2}:(am1|am2|pm1|pm2):(?:[1-9]|[1-9]\d|100)$/;
 const read=()=>{
  const id=String(year)+':'+String(courseId)+':'+String(number);
  if(!pattern.test(id))throw Error('INVALID_SELECTED_QUESTION');
  return id;
 };
 const readLegacy=id=>{
  if(id!==read())throw Error('SELECTED_QUESTION_CHANGED');
  const record=progress[id];
  return record&&typeof record==='object'&&!Array.isArray(record)?structuredClone(record):null;
 };
 Object.defineProperty(window,'CS03_SELECTED_QUESTION',{value:Object.freeze({read,readLegacy}),writable:false,configurable:false});
})();
