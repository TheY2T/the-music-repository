import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { buttonVariants, Card, cn, Icon } from '@TheY2T/tmr-ui';
import { acceptInvitation } from '@TheY2T/tmr-web-acl/classrooms-api';
import { useEffect, useState } from 'react';

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
          <p className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <Icon name="circle-check" className="size-5 text-success" />
            {t(locale, 'invite.joined')}
          </p>
          <a href={localizedPath(locale, '/classrooms')} className={cn(buttonVariants())}>
            <Icon name="graduation-cap" className="size-4" />
            {t(locale, 'invite.goToClassrooms')}
          </a>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <Icon name="alert-triangle" className="size-5 text-destructive" />
            {t(locale, 'invite.invalid')}
          </p>
          <a
            href={localizedPath(locale, '/classrooms')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {t(locale, 'invite.backToClassrooms')}
          </a>
        </>
      )}
    </Card>
  );
}
