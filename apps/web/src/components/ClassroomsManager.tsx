import { useEffect, useState } from 'react';
import {
  type Classroom,
  type ClassroomDetail,
  createClassroom,
  getClassroom,
  grantClassroomPremium,
  joinClassroom,
  listClassrooms,
} from '@/lib/classrooms-api';

function ClassroomCard({ classroom, onChanged }: { classroom: Classroom; onChanged: () => void }) {
  const [detail, setDetail] = useState<ClassroomDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!open && !detail) {
      setDetail(await getClassroom(classroom.id));
    }
    setOpen((o) => !o);
  }

  async function grant() {
    setBusy(true);
    const updated = await grantClassroomPremium(classroom.id);
    if (updated) {
      setDetail(updated);
    }
    setBusy(false);
    onChanged();
  }

  return (
    <li className="space-y-2 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold">{classroom.name}</span>
          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{classroom.role}</span>
          {classroom.premiumGranted ? (
            <span className="ml-2 rounded bg-green-600/20 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400">
              premium granted
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{classroom.memberCount} member(s)</span>
          {classroom.role === 'owner' ? (
            <span>
              Code:{' '}
              <span className="font-mono font-semibold text-foreground">{classroom.joinCode}</span>
            </span>
          ) : null}
          <button type="button" onClick={toggle} className="underline">
            {open ? 'Hide' : 'Roster'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border pt-3">
          {detail?.members.length ? (
            <ul className="space-y-1 text-sm">
              {detail.members.map((m) => (
                <li key={m.email} className="text-muted-foreground">
                  {m.name || m.email} <span className="text-xs">({m.email})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet — share the join code.</p>
          )}
          {classroom.role === 'owner' && !classroom.premiumGranted ? (
            <button
              type="button"
              onClick={grant}
              disabled={busy || classroom.memberCount === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? 'Granting…' : 'Grant premium to class'}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export default function ClassroomsManager() {
  const [rooms, setRooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  async function refresh() {
    setRooms(await listClassrooms());
    setLoading(false);
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createClassroom(name.trim());
    setName('');
    await refresh();
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    const result = await joinClassroom(code.trim());
    if (result.error) {
      setJoinError(result.error);
      return;
    }
    setCode('');
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <form onSubmit={onCreate} className="space-y-2 rounded-lg border border-border p-4">
          <h2 className="font-semibold">Create a classroom</h2>
          <p className="text-sm text-muted-foreground">
            You become the teacher and get a join code.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Classroom name"
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create
          </button>
        </form>

        <form onSubmit={onJoin} className="space-y-2 rounded-lg border border-border p-4">
          <h2 className="font-semibold">Join a classroom</h2>
          <p className="text-sm text-muted-foreground">Enter the code your teacher gave you.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Join code"
            className="w-full rounded-md border border-input bg-background px-2 py-1 font-mono text-sm uppercase"
          />
          {joinError ? <p className="text-sm text-red-600">{joinError}</p> : null}
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium"
          >
            Join
          </button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">My classrooms</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You're not in any classrooms yet — create one or join with a code.
          </p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <ClassroomCard key={room.id} classroom={room} onChanged={refresh} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
