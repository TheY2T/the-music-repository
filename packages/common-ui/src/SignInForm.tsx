import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input, PasswordInput } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';
import SocialSignInButtons from './SocialSignInButtons';
import WhatsAppSignIn from './WhatsAppSignIn';

export default function SignInForm({
  redirectTo = '/',
  locale,
  showSignup = false,
  showSocial = false,
  showFacebook = false,
  showMicrosoft = false,
  showMicrosoftWork = false,
  showWhatsapp = false,
}: {
  redirectTo?: string;
  locale: Locale;
  showSignup?: boolean;
  showSocial?: boolean;
  showFacebook?: boolean;
  showMicrosoft?: boolean;
  showMicrosoftWork?: boolean;
  showWhatsapp?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (signInError) {
      setError(signInError.message ?? t(locale, 'signin.failed'));
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-6 p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t(locale, 'signin.email')} htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t(locale, 'signin.password')} htmlFor="password">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showLabel={t(locale, 'common.showPassword')}
            hideLabel={t(locale, 'common.hidePassword')}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t(locale, 'signin.submitBusy') : t(locale, 'signin.submit')}
        </Button>
        <div className="flex flex-col items-center gap-1 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t(locale, 'signin.forgotLink')}
          </a>
          {showSignup ? (
            <a
              href="/signup"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t(locale, 'signin.createAccount')}
            </a>
          ) : null}
        </div>
      </form>

      {showSocial || showFacebook || showMicrosoft || showMicrosoftWork || showWhatsapp ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t(locale, 'social.orDivider')}
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            <SocialSignInButtons
              locale={locale}
              callbackURL={redirectTo}
              showSocial={showSocial}
              showFacebook={showFacebook}
              showMicrosoft={showMicrosoft}
              showMicrosoftWork={showMicrosoftWork}
            />
            {showWhatsapp ? <WhatsAppSignIn locale={locale} callbackURL={redirectTo} /> : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
