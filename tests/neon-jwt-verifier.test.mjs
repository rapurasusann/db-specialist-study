import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createNeonJwtVerifier } from '../src/neon-jwt-verifier.mjs';

const USER='11111111-1111-4111-8111-111111111111';
const ISS='https://auth.example.test/issuer';
const AUD='study-progress-api';
const { privateKey, publicKey }=await generateKeyPair('RS256');
const { privateKey: otherPrivateKey }=await generateKeyPair('RS256');
const pub=await exportJWK(publicKey);
const jwks=createLocalJWKSet({keys:[{...pub,alg:'RS256',kid:'test-key'}]});
const verify=createNeonJwtVerifier({issuer:ISS,audience:AUD,jwks});
async function sign({subject=USER,issuer=ISS,audience=AUD,expiry='5m',key=privateKey}={}) {
  return new SignJWT({}).setProtectedHeader({alg:'RS256',kid:'test-key'})
    .setSubject(subject).setIssuer(issuer).setAudience(audience)
    .setIssuedAt().setExpirationTime(expiry).sign(key);
}
test('valid signed token returns canonical authenticated user ID',async()=>assert.equal((await verify(await sign())).userId,USER));
test('forged signature rejected',async()=>assert.rejects(verify(await sign({key:otherPrivateKey})),/UNAUTHORIZED/));
test('wrong issuer rejected',async()=>assert.rejects(verify(await sign({issuer:'https://wrong.example.test'})),/UNAUTHORIZED/));
test('wrong audience rejected',async()=>assert.rejects(verify(await sign({audience:'other'})),/UNAUTHORIZED/));
test('expired token rejected',async()=>assert.rejects(verify(await sign({expiry:'-1h'})),/UNAUTHORIZED/));
test('invalid subject rejected',async()=>assert.rejects(verify(await sign({subject:'attacker'})),/UNAUTHORIZED/));
test('missing token rejected',async()=>assert.rejects(verify(''),/UNAUTHORIZED/));
test('configuration must declare trusted issuer, audience and keys',()=>{
  assert.throws(()=>createNeonJwtVerifier({issuer:ISS,jwks}),/AUTH_JWT_CONFIG_REQUIRED/);
  assert.throws(()=>createNeonJwtVerifier({issuer:'http://insecure',audience:AUD,jwks}),/AUTH_JWT_CONFIG_REQUIRED/);
});
