// CS-03: server-only verifier for Neon Auth JWTs.
// Never expose verifier config or database credentials in a browser bundle.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pass issuer and audience from a verified Neon Auth JWT contract,
 * not from untrusted token claims. Inject jwks only in isolated tests.
 */
export function createNeonJwtVerifier({ jwksUrl, issuer, audience, jwks } = {}) {
  if (typeof issuer !== 'string' || !issuer.startsWith('https://') ||
      typeof audience !== 'string' || audience.length === 0 ||
      (!jwks && (typeof jwksUrl !== 'string' || !jwksUrl.startsWith('https://')))) {
    throw new TypeError('AUTH_JWT_CONFIG_REQUIRED');
  }
  const keySet = jwks ?? createRemoteJWKSet(new URL(jwksUrl), {
    timeoutDuration: 5000,
    cooldownDuration: 30000,
  });
  if (typeof keySet !== 'function') throw new TypeError('AUTH_JWKS_INVALID');
  return async function verifyToken(token) {
    if (typeof token !== 'string' || token.length < 10 || token.length > 8192) {
      throw new Error('UNAUTHORIZED');
    }
    try {
      const { payload } = await jwtVerify(token, keySet, {
        issuer,
        audience,
        algorithms: ['EdDSA', 'RS256', 'ES256'],
        clockTolerance: '5 seconds',
        requiredClaims: ['sub', 'iat', 'exp', 'iss', 'aud'],
      });
      if (typeof payload.sub !== 'string' || !UUID.test(payload.sub)) {
        throw new Error('INVALID_SUBJECT');
      }
      return { userId: payload.sub.toLowerCase() };
    } catch {
      // Avoid exposing key, token, or verification diagnostics to clients.
      throw new Error('UNAUTHORIZED');
    }
  };
}
