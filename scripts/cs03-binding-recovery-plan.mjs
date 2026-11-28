// Pure decision helper: no credentials, network calls or automatic rollback.
export function recoveryPlan(result) {
 const base={activationAllowed:false,automaticRetry:false,automaticRollback:false};
 if(result?.ok===true && result.phase==='staged') return {...base,action:'verify-before-approval'};
 if(result?.ok===false && result.phase==='preflight') return {...base,action:'inspect-preflight'};
 if(result?.ok===false && ['neon','cloudflare','verify'].includes(result.phase)) return {...base,action:'reconcile-both-providers',retainProtectedCredentials:true};
 return {...base,action:'stop-and-inspect',retainProtectedCredentials:true};
}
