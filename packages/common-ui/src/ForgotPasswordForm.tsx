import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input } from '@TheY2T/tmr-ui';
import { requestPasswordReset } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';

/**
 * Requests a password-reset email. The response is always reported the same way (a neutral confirmation)
 * so the form never reveals whether an account exists for the given address.
 */
export default function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: resetError } = await requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      setError(t(locale, 'forgot.failed'));
      return;
    }
    setSent(true);
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-6 p-6">
      {sent ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t(locale, 'forgot.success')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t(locale, 'forgot.email')} htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? t(locale, 'forgot.submitBusy') : t(locale, 'forgot.submit')}
          </Button>
        </form>
      )}
      <div className="border-t border-border pt-4 text-center">
        <a
          href="/signin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t(locale, 'forgot.backToSignin')}
        </a>
      </div>
    </Card>
  );
}
