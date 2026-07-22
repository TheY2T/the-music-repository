import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input, PasswordInput } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';
import SocialSignInButtons from './SocialSignInButtons';

/**
 * Creates an account with name/email/password. A verification email is sent on sign-up and the address
 * must be confirmed before signing in, so a successful submit shows a "check your email" confirmation
 * rather than redirecting into the app.
 */
export default function SignUpForm({
  locale,
  showSocial = false,
}: {
  locale: Locale;
  showSocial?: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message ?? t(locale, 'signup.failed'));
      return;
    }
    setDone(true);
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-6 p-6">
      {done ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t(locale, 'signup.checkEmail')}
        </p>
      ) : (
        <>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label={t(locale, 'signup.name')} htmlFor="name">
              <Input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label={t(locale, 'signup.email')} htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label={t(locale, 'signup.password')} htmlFor="password">
              <PasswordInput
                id="password"
                autoComplete="new-password"
                required
                minLength={8}
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
              {busy ? t(locale, 'signup.submitBusy') : t(locale, 'signup.submit')}
            </Button>
          </form>

          {showSocial ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t(locale, 'social.orDivider')}
                <span className="h-px flex-1 bg-border" />
              </div>
              <SocialSignInButtons locale={locale} />
            </div>
          ) : null}
        </>
      )}

      <div className="border-t border-border pt-4 text-center">
        <a
          href="/signin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t(locale, 'signup.haveAccount')}
        </a>
      </div>
    </Card>
  );
}
