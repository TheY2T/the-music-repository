import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, Field, Icon, Input, Textarea } from '@TheY2T/tmr-ui';
import { submitContact } from '@TheY2T/tmr-web-acl/contact-api';
import { type FormEvent, useState } from 'react';

export interface ContactFormProps {
  locale: Locale;
  /** Called after a successful submit. */
  onSuccess?: () => void;
}

/** Public contact form: name, email, subject, message → emails the site operators. */
export default function ContactForm({ locale, onSuccess }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — hidden from real users; bots that fill it are dropped server-side.
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError(t(locale, 'contact.required'));
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
      });
      setDone(true);
      onSuccess?.();
    } catch {
      setError(t(locale, 'contact.error'));
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
