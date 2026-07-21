/** CaptchaVerifier — confirm a request came from a human via an anti-bot challenge token. */
export abstract class CaptchaVerifier {
  /**
   * Verify a challenge token. Returns true when the token is valid — or when verification is not
   * configured (so local/dev and unconfigured environments are not blocked). `remoteIp` is optional
   * context for the provider.
   */
  abstract verify(token: string | undefined, remoteIp?: string): Promise<boolean>;
}
