import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Card } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { acceptInvitation } from '@/lib/classrooms-api';

/** Reads an invitation `token` from the URL and accepts it for the signed-in user (joining the class). */
export default function AcceptInvitation({ locale }: { locale: Locale }) {
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('error');
      return;
    }
    acceptInvitation(token).then((ok) => setState(ok ? 'done' : 'error'));
  }, []);

  return (
    <Card className="space-y-4 p-6">
      {state === 'working' ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'invite.accepting')}</p>
      ) : state === 'done' ? (
        <>
          <p className="text-lg font-semibold">{t(locale, 'invite.joined')}</p>
          <a
            href={localizedPath(locale, '/classrooms')}
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {t(locale, 'invite.goToClassrooms')}
          </a>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold">{t(locale, 'invite.invalid')}</p>
          <a href={localizedPath(locale, '/classrooms')} className="text-sm underline">
            {t(locale, 'invite.backToClassrooms')}
          </a>
        </>
      )}
    </Card>
  );
}
