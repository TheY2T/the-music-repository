import { generateKeyPairSync } from 'node:crypto';
import { decodeProtectedHeader, importSPKI, jwtVerify } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateAppleClientSecret } from './apple-client-secret';

describe('generateAppleClientSecret', () => {
  let privateKeyPem: string;
  let publicKeyPem: string;

  beforeAll(() => {
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    privateKeyPem = privateKey.toString();
    publicKeyPem = publicKey.toString();
  });

  const params = () => ({
    clientId: 'com.themusicrepository.web',
    teamId: 'TEAM123456',
    keyId: 'KEY7890AB',
    privateKey: privateKeyPem,
  });

  it('signs an ES256 JWT carrying the key id in the header', async () => {
    const secret = await generateAppleClientSecret(params());
    const header = decodeProtectedHeader(secret);
    expect(header.alg).toBe('ES256');
    expect(header.kid).toBe('KEY7890AB');
  });

  it('issues Apple-shaped claims that verify against the public key', async () => {
    const secret = await generateAppleClientSecret(params());
    const { payload } = await jwtVerify(secret, await importSPKI(publicKeyPem, 'ES256'));
    expect(payload.iss).toBe('TEAM123456');
    expect(payload.sub).toBe('com.themusicrepository.web');
    expect(payload.aud).toBe('https://appleid.apple.com');
    // Expiry is ~6 months out, capped at Apple's limit.
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(180 * 24 * 60 * 60);
  });

  it('restores literal \\n escapes in the private key before parsing', async () => {
    const escaped = privateKeyPem.replace(/\n/g, '\\n');
    const secret = await generateAppleClientSecret({ ...params(), privateKey: escaped });
    const { payload } = await jwtVerify(secret, await importSPKI(publicKeyPem, 'ES256'));
    expect(payload.sub).toBe('com.themusicrepository.web');
  });
});
