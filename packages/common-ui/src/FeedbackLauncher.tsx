import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Icon } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import FeedbackForm from './FeedbackForm';

export interface FeedbackLauncherProps {
  locale: Locale;
  bugsEnabled?: boolean;
  signedIn?: boolean;
}

/**
 * A floating bottom-right button that opens the feedback form in a modal — a non-intrusive, always-
 * available entry point on every page.
 */
export default function FeedbackLauncher({
  locale,
  bugsEnabled = false,
  signedIn = false,
}: FeedbackLauncherProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(locale, 'feedback.launcherLabel')}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Icon name="message-square" className="size-4" />
        <span className="hidden sm:inline">{t(locale, 'feedback.launcherLabel')}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t(locale, 'feedback.close')}>
          <DialogHeader>
            <DialogTitle>{t(locale, 'feedback.title')}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FeedbackForm
              locale={locale}
              bugsEnabled={bugsEnabled}
              signedIn={signedIn}
              onSuccess={() => {
                // Give the success banner a moment before closing.
                window.setTimeout(() => setOpen(false), 1500);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
