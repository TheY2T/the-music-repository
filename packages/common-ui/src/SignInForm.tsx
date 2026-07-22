import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';
import SocialSignInButtons from './SocialSignInButtons';

/** Local dev accounts (seeded by `pnpm --filter @TheY2T/tmr-api db:seed:auth`). */
const DEV_ACCOUNTS = [
  { labelKey: 'signin.roleAdmin', email: 'admin@local.dev' },
  { labelKey: 'signin.roleEditor', email: 'editor@local.dev' },
  { labelKey: 'signin.roleLearner', email: 'learner@local.dev' },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; email: string }>;

export default function SignInForm({
  redirectTo = '/admin',
  locale,
  showSignup = false,
  showSocial = false,
}: {
  redirectTo?: string;
  locale: Locale;
  showSignup?: boolean;
  showSocial?: boolean;
}) {
  const [email, setEmail] = useState('admin@local.dev');
  const [password, setPassword] = useState('password123');
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
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

      {showSocial ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t(locale, 'social.orDivider')}
            <span className="h-px flex-1 bg-border" />
          </div>
          <SocialSignInButtons locale={locale} callbackURL={redirectTo} />
        </div>
      ) : null}

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">{t(locale, 'signin.devAccounts')}</p>
        <div className="flex flex-wrap gap-2">
          {DEV_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail(account.email);
                setPassword('password123');
              }}
            >
              {t(locale, account.labelKey)}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
