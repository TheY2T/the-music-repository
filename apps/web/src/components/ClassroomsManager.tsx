import { useEffect, useState } from 'react';
import {
  type Assignment,
  archiveClassroom,
  assignContent,
  type ClassProgress,
  type Classroom,
  type ClassroomDetail,
  createClassroom,
  getClassProgress,
  getClassroom,
  grantClassroomPremium,
  type InvitationItem,
  inviteToClassroom,
  joinClassroom,
  leaveClassroom,
  listAssignments,
  listClassrooms,
  listInvitations,
  removeMember,
  transferOwnership,
  unassignContent,
} from '@/lib/classrooms-api';

function ClassroomCard({ classroom, onChanged }: { classroom: Classroom; onChanged: () => void }) {
  const [detail, setDetail] = useState<ClassroomDetail | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<ClassProgress | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const isOwner = classroom.role === 'owner';

  async function load() {
    const [d, a] = await Promise.all([getClassroom(classroom.id), listAssignments(classroom.id)]);
    setDetail(d);
    setAssignments(a);
    setProgress(isOwner ? await getClassProgress(classroom.id) : null);
    setInvitations(isOwner ? await listInvitations(classroom.id) : []);
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    if (!inviteEmail.trim()) {
      return;
    }
    const result = await inviteToClassroom(classroom.id, inviteEmail.trim());
    setInviteMsg(result.error ?? 'Invitation sent.');
    setInviteEmail('');
    await load();
  }

  async function toggle() {
    if (!open && !detail) {
      await load();
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

  async function onAssign(e: React.FormEvent) {
    e.preventDefault();
    setAssignError(null);
    if (!slug.trim()) {
      return;
    }
    const result = await assignContent(classroom.id, slug.trim());
    if (result.error) {
      setAssignError(result.error);
      return;
    }
    setSlug('');
    await load();
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
          {isOwner ? (
            <span>
              Code:{' '}
              <span className="font-mono font-semibold text-foreground">{classroom.joinCode}</span>
            </span>
          ) : null}
          <button type="button" onClick={toggle} className="underline">
            {open ? 'Hide' : 'Manage'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-border pt-3">
          {/* Roster */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Members</h3>
            {detail?.members.length ? (
              <ul className="space-y-1 text-sm">
                {detail.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-muted-foreground">
                    <span>
                      {m.name || m.email} <span className="text-xs">({m.email})</span>
                    </span>
                    {isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeMember(classroom.id, m.id);
                            await load();
                            onChanged();
                          }}
                          className="text-xs underline"
                        >
                          remove
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await transferOwnership(classroom.id, m.id);
                            onChanged();
                          }}
                          className="text-xs underline"
                        >
                          make owner
                        </button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No members yet — share the join code.</p>
            )}
          </div>

          {/* Assignments */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Assigned content</h3>
            {assignments.length ? (
              <ul className="space-y-1 text-sm">
                {assignments.map((a) => (
                  <li key={a.slug} className="flex items-center gap-2">
                    <a href={`/catalogue/${a.slug}`} className="underline">
                      {a.title}
                    </a>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await unassignContent(classroom.id, a.slug);
                          await load();
                        }}
                        className="text-xs text-muted-foreground underline"
                      >
                        remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing assigned yet.</p>
            )}
            {isOwner ? (
              <form onSubmit={onAssign} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="content slug"
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
                <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm">
                  Assign
                </button>
                {assignError ? <span className="text-xs text-red-600">{assignError}</span> : null}
              </form>
            ) : null}
          </div>

          {/* Invitations (owner) */}
          {isOwner ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Invitations</h3>
              {invitations.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {invitations.map((inv) => (
                    <li key={inv.email}>
                      {inv.email} — {inv.accepted ? 'joined' : 'pending'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No invitations yet.</p>
              )}
              <form onSubmit={onInvite} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="student@email.com"
                  className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
                <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm">
                  Invite by email
                </button>
                {inviteMsg ? (
                  <span className="text-xs text-muted-foreground">{inviteMsg}</span>
                ) : null}
              </form>
            </div>
          ) : null}

          {/* Progress overview (owner) */}
          {isOwner && progress && progress.assignments.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Class progress</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {progress.members.map((m) => (
                  <li key={m.id}>
                    {m.name || m.email}: {m.completedCount}/{m.total} assignments complete
                  </li>
                ))}
                {progress.members.length === 0 ? <li>No members to track yet.</li> : null}
              </ul>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isOwner && !classroom.premiumGranted ? (
              <button
                type="button"
                onClick={grant}
                disabled={busy || classroom.memberCount === 0}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? 'Granting…' : 'Grant premium to class'}
              </button>
            ) : null}
            {isOwner ? (
              <button
                type="button"
                onClick={async () => {
                  await archiveClassroom(classroom.id);
                  onChanged();
                }}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Archive class
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await leaveClassroom(classroom.id);
                  onChanged();
                }}
                className="rounded-md border border-border px-4 py-2 text-sm"
              >
                Leave class
              </button>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function ClassroomsManager({ canCreate = false }: { canCreate?: boolean }) {
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
        {canCreate ? (
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
        ) : null}

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
