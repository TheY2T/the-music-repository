import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, Button, Input } from '@TheY2T/tmr-ui';
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

function ClassroomCard({
  classroom,
  onChanged,
  locale,
}: {
  classroom: Classroom;
  onChanged: () => void;
  locale: Locale;
}) {
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
    setInviteMsg(result.error ?? t(locale, 'classmgr.invitationSent'));
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
          <Badge variant="secondary" className="ml-2">
            {classroom.role}
          </Badge>
          {classroom.premiumGranted ? (
            <Badge variant="success" className="ml-2">
              {t(locale, 'classmgr.premiumGranted')}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{t(locale, 'classmgr.memberCount', { count: classroom.memberCount })}</span>
          {isOwner ? (
            <span>
              {t(locale, 'classmgr.codeLabel')}{' '}
              <span className="font-mono font-semibold text-foreground">{classroom.joinCode}</span>
            </span>
          ) : null}
          <button type="button" onClick={toggle} className="underline">
            {open ? t(locale, 'classmgr.hide') : t(locale, 'classmgr.manage')}
          </button>
        </div>
      </div>

      {open ? (
        <div className="space-y-4 border-t border-border pt-3">
          {/* Roster */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{t(locale, 'classmgr.members')}</h3>
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
                          {t(locale, 'classmgr.remove')}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await transferOwnership(classroom.id, m.id);
                            onChanged();
                          }}
                          className="text-xs underline"
                        >
                          {t(locale, 'classmgr.makeOwner')}
                        </button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.noMembers')}</p>
            )}
          </div>

          {/* Assignments */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">{t(locale, 'classmgr.assignedContent')}</h3>
            {assignments.length ? (
              <ul className="space-y-1 text-sm">
                {assignments.map((a) => (
                  <li key={a.slug} className="flex items-center gap-2">
                    <a href={localizedPath(locale, `/catalogue/${a.slug}`)} className="underline">
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
                        {t(locale, 'classmgr.remove')}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t(locale, 'classmgr.nothingAssigned')}
              </p>
            )}
            {isOwner ? (
              <form onSubmit={onAssign} className="flex flex-wrap items-center gap-2 pt-1">
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t(locale, 'classmgr.contentSlugPlaceholder')}
                  className="w-auto"
                />
                <Button type="submit" variant="outline" size="sm">
                  {t(locale, 'classmgr.assign')}
                </Button>
                {assignError ? <span className="text-xs text-red-600">{assignError}</span> : null}
              </form>
            ) : null}
          </div>

          {/* Invitations (owner) */}
          {isOwner ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t(locale, 'classmgr.invitations')}</h3>
              {invitations.length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {invitations.map((inv) => (
                    <li key={inv.email}>
                      {inv.email} —{' '}
                      {inv.accepted
                        ? t(locale, 'classmgr.invitationJoined')
                        : t(locale, 'classmgr.invitationPending')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t(locale, 'classmgr.noInvitations')}
                </p>
              )}
              <form onSubmit={onInvite} className="flex flex-wrap items-center gap-2 pt-1">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t(locale, 'classmgr.inviteEmailPlaceholder')}
                  className="w-auto"
                />
                <Button type="submit" variant="outline" size="sm">
                  {t(locale, 'classmgr.inviteByEmail')}
                </Button>
                {inviteMsg ? (
                  <span className="text-xs text-muted-foreground">{inviteMsg}</span>
                ) : null}
              </form>
            </div>
          ) : null}

          {/* Progress overview (owner) */}
          {isOwner && progress && progress.assignments.length > 0 ? (
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t(locale, 'classmgr.classProgress')}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {progress.members.map((m) => (
                  <li key={m.id}>
                    {t(locale, 'classmgr.memberProgress', {
                      name: m.name || m.email,
                      done: m.completedCount,
                      total: m.total,
                    })}
                  </li>
                ))}
                {progress.members.length === 0 ? (
                  <li>{t(locale, 'classmgr.noMembersToTrack')}</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isOwner && !classroom.premiumGranted ? (
              <Button type="button" onClick={grant} disabled={busy || classroom.memberCount === 0}>
                {busy ? t(locale, 'classmgr.granting') : t(locale, 'classmgr.grantPremium')}
              </Button>
            ) : null}
            {isOwner ? (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await archiveClassroom(classroom.id);
                  onChanged();
                }}
              >
                {t(locale, 'classmgr.archiveClass')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await leaveClassroom(classroom.id);
                  onChanged();
                }}
              >
                {t(locale, 'classmgr.leaveClass')}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export default function ClassroomsManager({
  canCreate = false,
  locale,
}: {
  canCreate?: boolean;
  locale: Locale;
}) {
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
            <h2 className="font-semibold">{t(locale, 'classmgr.createClassroom')}</h2>
            <p className="text-sm text-muted-foreground">
              {t(locale, 'classmgr.createDescription')}
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t(locale, 'classmgr.classroomNamePlaceholder')}
            />
            <Button type="submit">{t(locale, 'classmgr.create')}</Button>
          </form>
        ) : null}

        <form onSubmit={onJoin} className="space-y-2 rounded-lg border border-border p-4">
          <h2 className="font-semibold">{t(locale, 'classmgr.joinClassroom')}</h2>
          <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.joinDescription')}</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t(locale, 'classmgr.joinCodePlaceholder')}
            className="font-mono uppercase"
          />
          {joinError ? <p className="text-sm text-red-600">{joinError}</p> : null}
          <Button type="submit" variant="outline">
            {t(locale, 'classmgr.join')}
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">{t(locale, 'classmgr.myClassrooms')}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.loading')}</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.noClassrooms')}</p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <ClassroomCard key={room.id} classroom={room} onChanged={refresh} locale={locale} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
