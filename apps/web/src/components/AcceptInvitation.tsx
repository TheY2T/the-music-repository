import { useEffect, useState } from 'react';
import { acceptInvitation } from '@/lib/classrooms-api';

/** Reads an invitation `token` from the URL and accepts it for the signed-in user (joining the class). */
export default function AcceptInvitation() {
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
    <div className="space-y-4 rounded-lg border border-border p-6">
      {state === 'working' ? (
        <p className="text-sm text-muted-foreground">Accepting your invitation…</p>
      ) : state === 'done' ? (
        <>
          <p className="text-lg font-semibold">✓ You've joined the classroom.</p>
          <a
            href="/classrooms"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to my classrooms
          </a>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold">This invitation is invalid or already used.</p>
          <a href="/classrooms" className="text-sm underline">
            Back to classrooms
          </a>
        </>
      )}
    </div>
  );
}
