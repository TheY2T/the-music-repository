import { generateKeyPairSync, verify } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppleClientSecret, signAppleClientSecret } from './create-apple-client-secret';

// A throwaway P-256 key stands in for an Apple Sign in with Apple `.p8`.
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

const CONFIG = {
  teamId: 'TEAM123456',
  keyId: 'KEY1234567',
  clientId: 'com.themusicrepository.web',
  privateKey: privateKeyPem,
};

const APPLE_MAX_TTL = 15_777_000;

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

function segmentsOf(token: string): { header: string; payload: string; signature: string } {
  const [header = '', payload = '', signature = ''] = token.split('.');
  return { header, payload, signature };
}

/** Verifies the compact JWS with the matching public key (ES256, raw r‖s signature). */
function verifySignature(token: string): boolean {
  const { header, payload, signature } = segmentsOf(token);
  return verify(
    'SHA256',
    Buffer.from(`${header}.${payload}`),
    { key: publicKey, dsaEncoding: 'ieee-p1363' },
    Buffer.from(signature, 'base64url'),
  );
}

describe('signAppleClientSecret', () => {
  it('signs a verifiable ES256 JWT with the header and claims Apple requires', () => {
    const token = signAppleClientSecret(CONFIG);
    const segments = segmentsOf(token);
    const header = decodeSegment(segments.header);
    const payload = decodeSegment(segments.payload);

    expect(header).toMatchObject({ alg: 'ES256', kid: CONFIG.keyId });
    expect(payload).toMatchObject({
      iss: CONFIG.teamId,
      sub: CONFIG.clientId,
      aud: 'https://appleid.apple.com',
    });
    expect(typeof payload.iat).toBe('number');
    expect(payload.exp).toBeGreaterThan(payload.iat as number);
    expect(verifySignature(token)).toBe(true);
  });

  it('caps the lifetime at the six-month maximum Apple allows', () => {
    const token = signAppleClientSecret({ ...CONFIG, ttlSeconds: 999_999_999 });
    const payload = decodeSegment(segmentsOf(token).payload);
    expect((payload.exp as number) - (payload.iat as number)).toBeLessThanOrEqual(APPLE_MAX_TTL);
  });

  it('accepts a private key with escaped newlines (single-line env storage)', () => {
    const escaped = privateKeyPem.replace(/\n/g, '\\n');
    const token = signAppleClientSecret({ ...CONFIG, privateKey: escaped });
    expect(verifySignature(token)).toBe(true);
  });
});

describe('createAppleClientSecret', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('memoizes the token and regenerates it as expiry approaches', () => {
    const base = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(base);
    const secret = createAppleClientSecret({ ...CONFIG, ttlSeconds: 3600 });

    const first = secret.value;
    expect(secret.value).toBe(first); // reused while fresh

    // Advance past the refresh margin (5 min before the 1h expiry): a new token is minted.
    nowSpy.mockReturnValue(base + (3600 - 299) * 1000);
    const refreshed = secret.value;
    expect(refreshed).not.toBe(first);
    expect(verifySignature(refreshed)).toBe(true);
  });
});
