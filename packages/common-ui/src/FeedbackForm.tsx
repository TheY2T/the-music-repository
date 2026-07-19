import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  Field,
  Icon,
  Input,
  SegmentedToggle,
  type SegmentedToggleOption,
  Textarea,
} from '@TheY2T/tmr-ui';
import type { FeedbackType } from '@TheY2T/tmr-web-acl/dto';
import { submitFeedback } from '@TheY2T/tmr-web-acl/feedback-api';
import { type FormEvent, useState } from 'react';

export interface FeedbackFormProps {
  locale: Locale;
  /** Whether the bug-report type is offered (mirrors the `feedback.bugs` flag). */
  bugsEnabled?: boolean;
  /** Whether the current viewer is signed in — submission requires authentication. */
  signedIn?: boolean;
  /** Called after a successful submit (e.g. to close the launcher dialog). */
  onSuccess?: () => void;
}

/**
 * The shared feedback form: pick a category, optionally add a title, write a message, send. Bug
 * reports additionally carry the current page + browser so triage has the context. Used on the
 * `/feedback` page and inside the floating launcher.
 */
export default function FeedbackForm({
  locale,
  bugsEnabled = false,
  signedIn = false,
  onSuccess,
}: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>('idea');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const typeOptions: SegmentedToggleOption<FeedbackType>[] = [
    { value: 'idea', label: t(locale, 'feedback.type.idea') },
    ...(bugsEnabled ? [{ value: 'bug' as const, label: t(locale, 'feedback.type.bug') }] : []),
    { value: 'praise', label: t(locale, 'feedback.type.praise') },
    { value: 'other', label: t(locale, 'feedback.type.other') },
  ];

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setError(t(locale, 'feedback.messageRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isBug = type === 'bug';
      await submitFeedback({
        type,
        title: title.trim() || undefined,
        message: message.trim(),
        pageUrl: isBug && typeof window !== 'undefined' ? window.location.pathname : undefined,
        userAgent: isBug && typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      });
      setDone(true);
      setTitle('');
      setMessage('');
      onSuccess?.();
    } catch {
      setError(t(locale, 'feedback.error'));
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t(locale, 'feedback.signInRequired')}</p>
        <a
          href={localizedPath(locale, '/signin?redirect=/feedback')}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Icon name="log-in" className="size-4" />
          {t(locale, 'nav.signIn')}
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-accent/15 p-4 text-sm" role="status">
        <Icon name="check" className="mt-0.5 size-4 text-accent" />
        <span>{t(locale, 'feedback.success')}</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label={t(locale, 'feedback.typeLabel')}>
        <SegmentedToggle
          options={typeOptions}
          value={type}
          onValueChange={setType}
          aria-label={t(locale, 'feedback.typeLabel')}
        />
      </Field>
      <Field label={t(locale, 'feedback.titleLabel')} htmlFor="feedback-title">
        <Input
          id="feedback-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(locale, 'feedback.titlePlaceholder')}
          maxLength={140}
        />
      </Field>
      <Field label={t(locale, 'feedback.messageLabel')} htmlFor="feedback-message" required>
        <Textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t(locale, 'feedback.messagePlaceholder')}
          rows={5}
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? t(locale, 'feedback.submitting') : t(locale, 'feedback.submit')}
      </Button>
    </form>
  );
}
