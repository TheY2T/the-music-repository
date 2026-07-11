import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export default function SignOutButton({ redirectTo = '/signin' }: { redirectTo?: string }) {
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
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
