import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { SocialButton, type SocialProvider } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { useState } from 'react';

/** Which flag gates a provider button. */
type ProviderFlag = 'social' | 'facebook' | 'microsoft' | 'microsoft-work' | 'apple';

/** How a provider's sign-in flow is started through the Better Auth client. */
type ProviderStart =
  | { kind: 'social'; provider: SocialProvider }
  | { kind: 'oauth2'; providerId: string };

interface ProviderConfig {
  /** Brand mark shown on the button. */
  brand: SocialProvider;
  labelKey: MessageKey;
  flag: ProviderFlag;
  start: ProviderStart;
}

const PROVIDERS = [
  {
    brand: 'google',
    labelKey: 'social.continueGoogle',
    flag: 'social',
    start: { kind: 'social', provider: 'google' },
  },
  {
    brand: 'facebook',
    labelKey: 'social.continueFacebook',
    flag: 'facebook',
    start: { kind: 'social', provider: 'facebook' },
  },
  {
    brand: 'microsoft',
    labelKey: 'social.continueMicrosoft',
    flag: 'microsoft',
    start: { kind: 'social', provider: 'microsoft' },
  },
  {
    brand: 'microsoft',
    labelKey: 'social.continueMicrosoftWork',
    flag: 'microsoft-work',
    start: { kind: 'oauth2', providerId: 'microsoft-entra-id' },
  },
  {
    brand: 'apple',
    labelKey: 'social.continueApple',
    flag: 'apple',
    start: { kind: 'social', provider: 'apple' },
  },
] as const satisfies ReadonlyArray<ProviderConfig>;

/**
 * Social sign-in row. Each button starts a provider's OAuth flow; on success Better Auth redirects the
 * browser to `callbackURL`, so a returning render only happens on failure — which surfaces a message
 * rather than silently resetting. Google, Facebook, personal Microsoft accounts, and Apple use the
 * built-in social providers; work/school (organizational) Microsoft accounts use the Entra ID
 * generic-OAuth provider. Which buttons show is decided per provider by the flag props.
 */
export default function SocialSignInButtons({
  locale,
  callbackURL = '/',
  showSocial = false,
  showFacebook = false,
  showMicrosoft = false,
  showMicrosoftWork = false,
  showApple = false,
}: {
  locale: Locale;
  callbackURL?: string;
  showSocial?: boolean;
  showFacebook?: boolean;
  showMicrosoft?: boolean;
  showMicrosoftWork?: boolean;
  showApple?: boolean;
}) {
  const [busy, setBusy] = useState<MessageKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabled: Record<ProviderFlag, boolean> = {
    social: showSocial,
    facebook: showFacebook,
    microsoft: showMicrosoft,
    'microsoft-work': showMicrosoftWork,
    apple: showApple,
  };
  const visible = PROVIDERS.filter((provider) => enabled[provider.flag]);
  if (visible.length === 0) {
    return null;
  }

  async function onSelect(entry: ProviderConfig) {
    setBusy(entry.labelKey);
    setError(null);
    // The OAuth round-trip completes on the API origin, so a relative callbackURL would resolve against
    // the API's base URL. Build absolute URLs on the web origin so the provider returns the user to the
    // site (success → callbackURL, failure → the sign-in page rather than a raw API response).
    const origin = window.location.origin;
    const successUrl = /^https?:\/\//.test(callbackURL)
      ? callbackURL
      : new URL(callbackURL, origin).toString();
    const errorCallbackURL = new URL('/signin', origin).toString();
    try {
      const { error: signInError } =
        entry.start.kind === 'oauth2'
          ? await authClient.signIn.oauth2({
              providerId: entry.start.providerId,
              callbackURL: successUrl,
              errorCallbackURL,
            })
          : await authClient.signIn.social({
              provider: entry.start.provider,
              callbackURL: successUrl,
              errorCallbackURL,
            });
      // On success the browser is redirected to the provider; only a failed request returns here.
      if (signInError) {
        console.error(`Social sign-in (${entry.labelKey}) failed`, signInError);
        setError(signInError.message ?? t(locale, 'social.failed'));
        setBusy(null);
      }
    } catch (cause) {
      console.error(`Social sign-in (${entry.labelKey}) failed`, cause);
      setError(t(locale, 'social.failed'));
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      {visible.map((entry) => (
        <SocialButton
          key={entry.labelKey}
          provider={entry.brand}
          label={t(locale, entry.labelKey)}
          disabled={busy !== null}
          onClick={() => onSelect(entry)}
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
