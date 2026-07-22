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
 * browser to `callbackURL`, so a returning render only happens on failure — which surfaces a message
 * rather than silently resetting.
 */
export default function SocialSignInButtons({
  locale,
  callbackURL = '/',
}: {
  locale: Locale;
  callbackURL?: string;
}) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(provider: SocialProvider) {
    setBusy(provider);
    setError(null);
    // The OAuth round-trip completes on the API origin, so a relative callbackURL would resolve against
    // the API's base URL. Build absolute URLs on the web origin so the provider returns the user to the
    // site (success → callbackURL, failure → the sign-in page rather than a raw API response).
    const origin = window.location.origin;
    const successUrl = /^https?:\/\//.test(callbackURL)
      ? callbackURL
      : new URL(callbackURL, origin).toString();
    try {
      const { error: signInError } = await authClient.signIn.social({
        provider,
        callbackURL: successUrl,
        errorCallbackURL: new URL('/signin', origin).toString(),
      });
      // On success the browser is redirected to the provider; only a failed request returns here.
      if (signInError) {
        console.error(`Social sign-in (${provider}) failed`, signInError);
        setError(signInError.message ?? t(locale, 'social.failed'));
        setBusy(null);
      }
    } catch (cause) {
      console.error(`Social sign-in (${provider}) failed`, cause);
      setError(t(locale, 'social.failed'));
      setBusy(null);
    }
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
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
