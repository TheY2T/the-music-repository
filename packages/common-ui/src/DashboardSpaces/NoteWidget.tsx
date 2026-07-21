import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';

/**
 * A free-text note pinned to a practice space — the learner's own reminders, goals, or setlist. Reads
 * its text from the widget `config.text`; renders read-only here (in-place editing arrives with the
 * space editor). i18n-by-prop.
 */
export default function NoteWidget({ text, locale }: { text?: string; locale: Locale }) {
  const body = (text ?? '').trim();
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto">
      {body ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{body}</p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="pencil" className="size-4" />
          {t(locale, 'spaces.note.empty')}
        </p>
      )}
    </div>
  );
}
