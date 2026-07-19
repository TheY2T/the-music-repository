import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input } from '@TheY2T/tmr-ui';
import { resetPassword } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';

/**
 * Sets a new password from a reset link. The `token` comes from the link's query string; without it the
 * form shows an invalid-link message and a way to request a fresh one. On success the user is sent to
 * sign in with the new password.
 */
export default function ResetPasswordForm({ locale, token }: { locale: Locale; token?: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <Card className="mx-auto w-full max-w-sm space-y-4 p-6">
        <p role="alert" className="text-sm text-destructive">
          {t(locale, 'reset.tokenMissing')}
        </p>
        <a
          href="/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t(locale, 'reset.requestNew')}
        </a>
      </Card>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError(t(locale, 'reset.mismatch'));
      return;
    }
    setBusy(true);
    setError(null);
    const { error: resetError } = await resetPassword({ newPassword: password, token });
    setBusy(false);
    if (resetError) {
      setError(resetError.message ?? t(locale, 'reset.failed'));
      return;
    }
    window.location.href = '/signin';
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-6 p-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t(locale, 'reset.newPassword')} htmlFor="new-password">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label={t(locale, 'reset.confirmPassword')} htmlFor="confirm-password">
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? t(locale, 'reset.submitBusy') : t(locale, 'reset.submit')}
        </Button>
      </form>
    </Card>
  );
}
