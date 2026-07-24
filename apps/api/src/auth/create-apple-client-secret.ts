import { createPrivateKey, createSign } from 'node:crypto';

/**
 * Apple's OAuth "client secret" is a short-lived ES256 JWT signed with the account's Sign in with Apple
 * private key (a `.p8`), rather than a fixed string like the other providers. This builds and rotates that
 * token. It's a plain factory (no Nest DI) so the module-scoped Better Auth instance can call it directly
 * from `process.env`, the same way the mail and WhatsApp transports are built.
 */

/** Token endpoint audience Apple requires in the client-secret JWT. */
const APPLE_AUDIENCE = 'https://appleid.apple.com';
/** Apple rejects a client secret whose lifetime exceeds six months. */
const MAX_TTL_SECONDS = 15_777_000;
/** Lifetime of each generated token when the caller doesn't specify one. */
const DEFAULT_TTL_SECONDS = 3600;
/** Regenerate this many seconds before expiry so a token is never used at the edge of its window. */
const REFRESH_MARGIN_SECONDS = 300;

export interface AppleClientSecretConfig {
  /** Apple Developer Team ID (the JWT issuer). */
  teamId: string;
  /** Key ID of the Sign in with Apple signing key (the JWT header `kid`). */
  keyId: string;
  /** The signing key's PKCS#8 PEM (`.p8` contents). `\n`-escaped values are normalized. */
  privateKey: string;
  /** Services ID — the OAuth `client_id`, carried as the JWT subject. */
  clientId: string;
  /** Token lifetime in seconds; capped at Apple's six-month maximum. */
  ttlSeconds?: number;
}

/** URL-safe base64 without padding, as JWS requires. */
function base64Url(input: string | Buffer): string {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Accepts a PEM with real newlines or with literal `\n` sequences (single-line env storage). */
function normalizePrivateKey(pem: string): string {
  return pem.includes('\\n') ? pem.replace(/\\n/g, '\n') : pem;
}

/**
 * Signs one Apple client-secret JWT (ES256). The signature is emitted in the IEEE P1363 (raw r‖s) form
 * JWS mandates via `dsaEncoding`, so no external JWT library is needed.
 */
export function signAppleClientSecret(config: AppleClientSecretConfig): string {
  const ttl = Math.min(config.ttlSeconds ?? DEFAULT_TTL_SECONDS, MAX_TTL_SECONDS);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: config.keyId };
  const payload = {
    iss: config.teamId,
    iat: now,
    exp: now + ttl,
    aud: APPLE_AUDIENCE,
    sub: config.clientId,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const key = createPrivateKey(normalizePrivateKey(config.privateKey));
  const signature = createSign('SHA256')
    .update(signingInput)
    .sign({ key, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${base64Url(signature)}`;
}

export interface AppleClientSecret {
  /** A currently-valid client-secret JWT, regenerated automatically before the previous one expires. */
  readonly value: string;
}

/**
 * A self-refreshing Apple client secret. Reading `value` returns a cached JWT and mints a fresh one once
 * the cached token nears expiry, so the secret never needs manual rotation over the process lifetime.
 */
export function createAppleClientSecret(config: AppleClientSecretConfig): AppleClientSecret {
  const ttl = Math.min(config.ttlSeconds ?? DEFAULT_TTL_SECONDS, MAX_TTL_SECONDS);
  let cached: { token: string; expiresAt: number } | null = null;
  return {
    get value(): string {
      const now = Math.floor(Date.now() / 1000);
      if (!cached || now >= cached.expiresAt - REFRESH_MARGIN_SECONDS) {
        cached = {
          token: signAppleClientSecret({ ...config, ttlSeconds: ttl }),
          expiresAt: now + ttl,
        };
      }
      return cached.token;
    },
  };
}
