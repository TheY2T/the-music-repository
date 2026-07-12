import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

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
