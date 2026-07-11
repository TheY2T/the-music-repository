import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

/** Local dev accounts (seeded by `pnpm --filter @TheY2T/tmr-api db:seed:auth`). */
const DEV_ACCOUNTS = [
  { label: 'Admin', email: 'admin@local.dev' },
  { label: 'Editor', email: 'editor@local.dev' },
  { label: 'Learner', email: 'learner@local.dev' },
] as const;

export default function SignInForm({ redirectTo = '/admin' }: { redirectTo?: string }) {
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
      setError(signInError.message ?? 'Sign-in failed. Check your credentials.');
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
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
            Password
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
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <p className="text-xs text-muted-foreground">Quick fill (dev accounts, password shared):</p>
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
              {account.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
