import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Field, Icon, Input, Textarea } from '@TheY2T/tmr-ui';
import { submitContact } from '@TheY2T/tmr-web-acl/contact-api';
import { type FormEvent, useEffect, useRef, useState } from 'react';

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

const getTurnstile = (): TurnstileApi | undefined =>
  (window as unknown as { turnstile?: TurnstileApi }).turnstile;

export interface ContactFormProps {
  locale: Locale;
  /** Cloudflare Turnstile site key. When set, the form renders the challenge and requires its token;
   * when absent (local/dev), the form works without it. */
  turnstileSiteKey?: string;
  /** Called after a successful submit. */
  onSuccess?: () => void;
}

/** Public contact form: name, email, subject, message → emails the site operators. */
export default function ContactForm({ locale, turnstileSiteKey, onSuccess }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — hidden from real users; bots that fill it are dropped server-side.
  const [company, setCompany] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load + render the Turnstile challenge when a site key is configured.
  useEffect(() => {
    if (!turnstileSiteKey || !widgetRef.current) {
      return;
    }
    let widgetId: string | undefined;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;

    const render = (): boolean => {
      const api = getTurnstile();
      if (cancelled || !api || !widgetRef.current) {
        return false;
      }
      widgetId = api.render(widgetRef.current, {
        sitekey: turnstileSiteKey,
        callback: (tok) => setToken(tok),
        'error-callback': () => setToken(''),
        'expired-callback': () => setToken(''),
      });
      return true;
    };

    if (!render()) {
      if (!document.querySelector('script[data-turnstile]')) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-turnstile', '');
        document.head.appendChild(script);
      }
      poll = setInterval(() => {
        if (render() && poll) {
          clearInterval(poll);
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (poll) {
        clearInterval(poll);
      }
      if (widgetId) {
        getTurnstile()?.remove(widgetId);
      }
    };
  }, [turnstileSiteKey]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t(locale, 'contact.required'));
      return;
    }
    if (turnstileSiteKey && !token) {
      setError(t(locale, 'contact.verifyPending'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        company: company.trim() || undefined,
        turnstileToken: token || undefined,
      });
      setDone(true);
      onSuccess?.();
    } catch {
      setError(t(locale, 'contact.error'));
      // Let the visitor retry with a fresh challenge token.
      setToken('');
      getTurnstile()?.reset();
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-accent/15 p-4 text-sm" role="status">
        <Icon name="check" className="mt-0.5 size-4 text-accent" />
        <span>{t(locale, 'contact.success')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t(locale, 'contact.nameLabel')} htmlFor="contact-name" required>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </Field>
      <Field label={t(locale, 'contact.emailLabel')} htmlFor="contact-email" required>
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
        />
      </Field>
      <Field label={t(locale, 'contact.subjectLabel')} htmlFor="contact-subject" required>
        <Input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
        />
      </Field>
      <Field label={t(locale, 'contact.messageLabel')} htmlFor="contact-message" required>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
        />
      </Field>
      {/* Honeypot: visually hidden + off the tab order; real users never fill it. */}
      <div aria-hidden="true" className="hidden">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>
      {turnstileSiteKey ? <div ref={widgetRef} /> : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? t(locale, 'contact.submitting') : t(locale, 'contact.submit')}
      </Button>
    </form>
  );
}
