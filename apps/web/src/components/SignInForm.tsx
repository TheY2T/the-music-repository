import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

/** Local dev accounts (seeded by `pnpm --filter @TheY2T/tmr-api db:seed:auth`). */
const DEV_ACCOUNTS = [
  { labelKey: 'signin.roleAdmin', email: 'admin@local.dev' },
  { labelKey: 'signin.roleEditor', email: 'editor@local.dev' },
  { labelKey: 'signin.roleLearner', email: 'learner@local.dev' },
] as const satisfies ReadonlyArray<{ labelKey: MessageKey; email: string }>;

export default function SignInForm({
  redirectTo = '/admin',
  locale,
}: {
  redirectTo?: string;
  locale: Locale;
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
    <div className="mx-auto w-full max-w-sm space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            {t(locale, 'signin.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            {t(locale, 'signin.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t(locale, 'signin.submitBusy') : t(locale, 'signin.submit')}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs text-muted-foreground">{t(locale, 'signin.devAccounts')}</p>
        <div className="flex gap-2">
          {DEV_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword('password123');
              }}
              className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
            >
              {t(locale, account.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
