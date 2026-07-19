import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Card, Field, Input } from '@TheY2T/tmr-ui';
import { sendVerificationEmail } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';

/**
 * Requests a fresh email-verification link. Reports the outcome neutrally so it never reveals whether an
 * account exists or is already verified.
 */
export default function VerifyEmailNotice({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: sendError } = await sendVerificationEmail({ email, callbackURL: '/' });
    setBusy(false);
    if (sendError) {
      setError(t(locale, 'verify.failed'));
      return;
    }
    setSent(true);
  }

  return (
    <Card className="mx-auto w-full max-w-sm space-y-6 p-6">
      {sent ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t(locale, 'verify.success')}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label={t(locale, 'verify.email')} htmlFor="email">
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
            {busy ? t(locale, 'verify.submitBusy') : t(locale, 'verify.submit')}
          </Button>
        </form>
      )}
    </Card>
  );
}
