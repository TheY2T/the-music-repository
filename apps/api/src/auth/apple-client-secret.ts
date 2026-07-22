import { importPKCS8, SignJWT } from 'jose';

/**
 * Mints Apple's OAuth client secret — an ES256 JWT signed with the developer `.p8` private key, valid for
 * ~6 months (Apple's cap), issued by the team, subject the Services ID, audience `appleid.apple.com`.
 * `privateKey` may contain literal `\n` escapes (host env quirk); they're restored to real newlines
 * before parsing.
 */
export async function generateAppleClientSecret(params: {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
}): Promise<string> {
  const key = await importPKCS8(params.privateKey.replace(/\\n/g, '\n'), 'ES256');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: params.keyId })
    .setIssuer(params.teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .setAudience('https://appleid.apple.com')
    .setSubject(params.clientId)
    .sign(key);
}
