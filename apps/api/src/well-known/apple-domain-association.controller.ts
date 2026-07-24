import { Controller, Get, Header, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Serves Apple's Sign in with Apple domain-verification file. The OAuth callback lives on this API's
 * domain (`${BETTER_AUTH_URL}/api/auth/callback/apple`), so Apple verifies THIS domain — it fetches the
 * association document from here. The document is domain-specific (Apple issues it per Services ID +
 * domain), so it's supplied at runtime via `APPLE_DOMAIN_ASSOCIATION_TXT` rather than committed: paste the
 * file Apple generates into that env var and it serves immediately. Absent the var, the path 404s. The
 * value is stored `\n`-escaped on a single line (env files hold no real newlines) and un-escaped here so
 * the served document is byte-for-byte what Apple issued.
 */
@Controller('.well-known')
export class AppleDomainAssociationController {
  constructor(private readonly config: ConfigService) {}

  @Get('apple-developer-domain-association.txt')
  @Header('Content-Type', 'text/plain')
  @Header('Cache-Control', 'public, max-age=3600')
  get(): string {
    const association = this.config.get<string>('APPLE_DOMAIN_ASSOCIATION_TXT');
    if (!association) {
      throw new NotFoundException();
    }
    return association.replace(/\\n/g, '\n');
  }
}
