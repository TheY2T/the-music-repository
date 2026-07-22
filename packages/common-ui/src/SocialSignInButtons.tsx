import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { SocialButton, type SocialProvider } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { useState } from 'react';

const PROVIDERS = [
  { provider: 'google', labelKey: 'social.continueGoogle' },
  { provider: 'facebook', labelKey: 'social.continueFacebook' },
] as const satisfies ReadonlyArray<{ provider: SocialProvider; labelKey: MessageKey }>;

/**
 * Social sign-in row. Each button starts the provider's OAuth flow; on success Better Auth redirects the
 * browser to `callbackURL`, so a returning render only happens on error (the busy state is cleared then).
 */
export default function SocialSignInButtons({
  locale,
  callbackURL = '/',
}: {
  locale: Locale;
  callbackURL?: string;
}) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  async function onSelect(provider: SocialProvider) {
    setBusy(provider);
    await authClient.signIn.social({ provider, callbackURL });
    setBusy(null);
  }

  return (
    <div className="space-y-2">
      {PROVIDERS.map(({ provider, labelKey }) => (
        <SocialButton
          key={provider}
          provider={provider}
          label={t(locale, labelKey)}
          disabled={busy !== null}
          onClick={() => onSelect(provider)}
        />
      ))}
    </div>
  );
}
