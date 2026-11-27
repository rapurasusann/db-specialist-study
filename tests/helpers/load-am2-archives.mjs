import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
// Execute the actual browser data registration in an isolated context.
// No network, storage or application UI is accessed.
export function loadArchives(){
 const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
 const context={years:{},year:2025,courseId:'am2',showQuestion(){},renderYears(){},renderMode(){},document:{createElement(){return {}},head:{append(){}}}};
 for(let y=2016;y<2024;y++)runInNewContext(read('src/am2-archive-'+y+'-data.js'),context,{timeout:1000});
 runInNewContext(read('src/am2-archive-2024.js'),context,{timeout:1000});
 const result=JSON.parse(JSON.stringify(context.years));
 assert.deepEqual(Object.keys(result).map(Number).sort(),Array.from({length:9},(_,i)=>2016+i));
 return result;
}
