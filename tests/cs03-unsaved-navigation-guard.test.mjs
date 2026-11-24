import test from 'node:test';
import assert from 'node:assert/strict';
import {attachCs03UnsavedNavigationGuard} from '../src/cs03-unsaved-navigation-guard.mjs';

function fixture(initial){
 let state=initial,handler=null,removed=false;
 const auto={state:()=>state};
 const windowRef={
  addEventListener:(name,callback)=>{assert.equal(name,'beforeunload');handler=callback;},
  removeEventListener:(name,callback)=>{assert.equal(name,'beforeunload');assert.equal(callback,handler);removed=true;handler=null;}
 };
 const detach=attachCs03UnsavedNavigationGuard({auto,windowRef});
 const trigger=()=>{
  let blocked=false;
  const event={returnValue:undefined,preventDefault:()=>{blocked=true;}};
  handler?.(event);
  return {blocked,returnValue:event.returnValue};
 };
 return {detach,trigger,setState:s=>state=s,isRemoved:()=>removed};
}
test('clean account and signed-out state allow normal navigation',()=>{
 const f=fixture({active:false,pending:['q1'],blocked:['q1'],inFlight:[]});
 assert.equal(f.trigger().blocked,false);
 f.setState({active:true,pending:[],blocked:[],inFlight:[]});
 assert.equal(f.trigger().blocked,false);
 f.detach();
});
test('failed, restored and in-flight drafts trigger browser close/reload confirmation',()=>{
 const f=fixture({active:true,pending:['q1'],blocked:[],inFlight:[]});
 assert.deepEqual(f.trigger(),{blocked:true,returnValue:''});
 f.setState({active:true,pending:[],blocked:['q1'],inFlight:[]});
 assert.equal(f.trigger().blocked,true);
 f.setState({active:true,pending:[],blocked:[],inFlight:['q1']});
 assert.equal(f.trigger().blocked,true);
 f.detach();assert.equal(f.isRemoved(),true);
 assert.deepEqual(f.trigger(),{blocked:false,returnValue:undefined});
});
test('navigation guard rejects missing dependencies rather than silently disabling protection',()=>{
 assert.throws(()=>attachCs03UnsavedNavigationGuard({auto:{state:()=>({})}}),/NAVIGATION_GUARD_CONFIG_REQUIRED/);
});
