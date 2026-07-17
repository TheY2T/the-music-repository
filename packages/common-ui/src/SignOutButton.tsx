import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button } from '@TheY2T/tmr-ui';
import { authClient } from '@TheY2T/tmr-web-data/auth-client';
import { useState } from 'react';

export default function SignOutButton({
  redirectTo = '/signin',
  locale,
}: {
  redirectTo?: string;
  locale: Locale;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        window.location.href = redirectTo;
      }}
    >
      {busy ? t(locale, 'common.loading') : t(locale, 'common.signOut')}
    </Button>
  );
}
