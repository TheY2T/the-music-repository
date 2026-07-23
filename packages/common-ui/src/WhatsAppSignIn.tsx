import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Field, Input, SocialButton } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-acl/auth-client';
import { type FormEvent, useState } from 'react';

/**
 * WhatsApp phone-OTP sign-in. Passwordless and two-step: the learner enters a phone number, receives a
 * one-time code over WhatsApp, and verifying it signs them in (creating an account on first use). The
 * collapsed state is a single "Continue with WhatsApp" button so the flow sits alongside the OAuth
 * social buttons; selecting it reveals the phone-number step, then the code step. On a verified code the
 * browser is sent to `callbackURL`. Which state the button appears in is decided by the caller's flag prop.
 */
type Step = 'idle' | 'phone' | 'code';

export default function WhatsAppSignIn({
  locale,
  callbackURL = '/',
}: {
  locale: Locale;
  callbackURL?: string;
}) {
  const [step, setStep] = useState<Step>('idle');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    setError(null);
    const { error: sendError } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    setBusy(false);
    if (sendError) {
      setError(sendError.message ?? t(locale, 'whatsapp.sendFailed'));
      return false;
    }
    setStep('code');
    return true;
  }

  async function onSendCode(event: FormEvent) {
    event.preventDefault();
    await sendCode();
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: verifyError } = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
    if (verifyError) {
      setBusy(false);
      setError(verifyError.message ?? t(locale, 'whatsapp.verifyFailed'));
      return;
    }
    // Verifying creates the session; send the learner on to their destination. Build an absolute URL on
    // the web origin so a relative `callbackURL` doesn't resolve against the API base.
    const origin = window.location.origin;
    window.location.href = /^https?:\/\//.test(callbackURL)
      ? callbackURL
      : new URL(callbackURL, origin).toString();
  }

  if (step === 'idle') {
    return (
      <SocialButton
        provider="whatsapp"
        label={t(locale, 'social.continueWhatsapp')}
        onClick={() => {
          setError(null);
          setStep('phone');
        }}
      />
    );
  }

  return (
    <form onSubmit={step === 'phone' ? onSendCode : onVerify} className="space-y-2">
      {step === 'phone' ? (
        <Field label={t(locale, 'whatsapp.phoneLabel')} htmlFor="whatsapp-phone">
          <Input
            id="whatsapp-phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder={t(locale, 'whatsapp.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
      ) : (
        <Field label={t(locale, 'whatsapp.codeLabel')} htmlFor="whatsapp-code">
          <Input
            id="whatsapp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">{t(locale, 'whatsapp.codeHint')}</p>
        </Field>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full">
        {step === 'phone'
          ? busy
            ? t(locale, 'whatsapp.sendingCode')
            : t(locale, 'whatsapp.sendCode')
          : busy
            ? t(locale, 'whatsapp.verifying')
            : t(locale, 'whatsapp.verify')}
      </Button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setError(null);
            setCode('');
            setStep('phone');
          }}
        >
          {t(locale, 'whatsapp.back')}
        </button>
        {step === 'code' ? (
          <button
            type="button"
            disabled={busy}
            className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
            onClick={() => void sendCode()}
          >
            {t(locale, 'whatsapp.resend')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
