import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Card,
  Field,
  Icon,
  type IconName,
  Input,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@TheY2T/tmr-ui';
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
} from '@TheY2T/tmr-web-data/classrooms-api';
import { useEffect, useState } from 'react';

function SectionHeading({ iconName, children }: { iconName: IconName; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-tight">
      <Icon name={iconName} className="size-4 text-muted-foreground" />
      {children}
    </h3>
  );
}

function ClassroomCard({
  classroom,
  onChanged,
  showPremium,
  locale,
}: {
  classroom: Classroom;
  onChanged: () => void;
  showPremium: boolean;
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
    <li>
      <Card className="space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-semibold tracking-tight">{classroom.name}</span>
            <Badge variant="secondary">{classroom.role}</Badge>
            {showPremium && classroom.premiumGranted ? (
              <Badge variant="success">
                <Icon name="crown" className="size-3" />
                {t(locale, 'classmgr.premiumGranted')}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Icon name="users" className="size-4" />
              {t(locale, 'classmgr.memberCount', { count: classroom.memberCount })}
            </span>
            {isOwner ? (
              <span>
                {t(locale, 'classmgr.codeLabel')}{' '}
                <span className="font-mono font-semibold text-foreground">
                  {classroom.joinCode}
                </span>
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={toggle}>
              <Icon name={open ? 'chevron-down' : 'chevron-right'} className="size-4" />
              {open ? t(locale, 'classmgr.hide') : t(locale, 'classmgr.manage')}
            </Button>
          </div>
        </div>

        {open ? (
          <div className="space-y-5 border-t border-border pt-4">
            {/* Roster */}
            <div className="space-y-2">
              <SectionHeading iconName="users">{t(locale, 'classmgr.members')}</SectionHeading>
              {detail?.members.length ? (
                <Table>
                  <TableBody>
                    {detail.members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">
                          <span className="font-medium text-foreground">{m.name || m.email}</span>{' '}
                          <span className="text-xs text-muted-foreground">({m.email})</span>
                        </TableCell>
                        {isOwner ? (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await transferOwnership(classroom.id, m.id);
                                  onChanged();
                                }}
                              >
                                {t(locale, 'classmgr.makeOwner')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={async () => {
                                  await removeMember(classroom.id, m.id);
                                  await load();
                                  onChanged();
                                }}
                              >
                                <Icon name="trash" className="size-4" />
                                {t(locale, 'classmgr.remove')}
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.noMembers')}</p>
              )}
            </div>

            {/* Assignments */}
            <div className="space-y-2">
              <SectionHeading iconName="book-open">
                {t(locale, 'classmgr.assignedContent')}
              </SectionHeading>
              {assignments.length ? (
                <ul className="space-y-1 text-sm">
                  {assignments.map((a) => (
                    <li key={a.slug} className="flex items-center gap-2">
                      <a
                        href={localizedPath(locale, `/catalogue/${a.slug}`)}
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        {a.title}
                      </a>
                      {isOwner ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={async () => {
                            await unassignContent(classroom.id, a.slug);
                            await load();
                          }}
                        >
                          <Icon name="trash" className="size-4" />
                          {t(locale, 'classmgr.remove')}
                        </Button>
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
                    <Icon name="plus" className="size-4" />
                    {t(locale, 'classmgr.assign')}
                  </Button>
                  {assignError ? (
                    <span className="text-xs text-destructive">{assignError}</span>
                  ) : null}
                </form>
              ) : null}
            </div>

            {/* Invitations (owner) */}
            {isOwner ? (
              <div className="space-y-2">
                <SectionHeading iconName="user">{t(locale, 'classmgr.invitations')}</SectionHeading>
                {invitations.length ? (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {invitations.map((inv) => (
                      <li key={inv.email} className="flex items-center gap-2">
                        <span className="text-foreground">{inv.email}</span>
                        <Badge variant={inv.accepted ? 'success' : 'secondary'}>
                          {inv.accepted
                            ? t(locale, 'classmgr.invitationJoined')
                            : t(locale, 'classmgr.invitationPending')}
                        </Badge>
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
                    <Icon name="plus" className="size-4" />
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
              <div className="space-y-2">
                <SectionHeading iconName="gauge">
                  {t(locale, 'classmgr.classProgress')}
                </SectionHeading>
                {progress.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t(locale, 'classmgr.noMembersToTrack')}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {progress.members.map((m) => {
                      const percent =
                        m.total === 0 ? 0 : Math.round((m.completedCount / m.total) * 100);
                      return (
                        <li key={m.id} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium text-foreground">{m.name || m.email}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {m.completedCount}/{m.total}
                            </span>
                          </div>
                          <Progress value={percent} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              {showPremium && isOwner && !classroom.premiumGranted ? (
                <Button
                  type="button"
                  onClick={grant}
                  disabled={busy || classroom.memberCount === 0}
                >
                  <Icon name="crown" className="size-4" />
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
                  variant="destructive"
                  onClick={async () => {
                    await leaveClassroom(classroom.id);
                    onChanged();
                  }}
                >
                  <Icon name="log-out" className="size-4" />
                  {t(locale, 'classmgr.leaveClass')}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Card>
    </li>
  );
}

export default function ClassroomsManager({
  canCreate = false,
  showPremium = false,
  locale,
}: {
  canCreate?: boolean;
  showPremium?: boolean;
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
          <Card className="p-5">
            <form onSubmit={onCreate} className="space-y-3">
              <div className="space-y-1">
                <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
                  <Icon name="graduation-cap" className="size-5 text-accent" />
                  {t(locale, 'classmgr.createClassroom')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(locale, 'classmgr.createDescription')}
                </p>
              </div>
              <Field label={t(locale, 'classmgr.createClassroom')} htmlFor="classroom-name">
                <Input
                  id="classroom-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t(locale, 'classmgr.classroomNamePlaceholder')}
                />
              </Field>
              <Button type="submit">
                <Icon name="plus" className="size-4" />
                {t(locale, 'classmgr.create')}
              </Button>
            </form>
          </Card>
        ) : null}

        <Card className="p-5">
          <form onSubmit={onJoin} className="space-y-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight">
                <Icon name="users" className="size-5 text-accent" />
                {t(locale, 'classmgr.joinClassroom')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(locale, 'classmgr.joinDescription')}
              </p>
            </div>
            <Field
              label={t(locale, 'classmgr.joinClassroom')}
              htmlFor="join-code"
              error={joinError ?? undefined}
            >
              <Input
                id="join-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t(locale, 'classmgr.joinCodePlaceholder')}
                className="font-mono uppercase"
              />
            </Field>
            <Button type="submit" variant="outline">
              {t(locale, 'classmgr.join')}
            </Button>
          </form>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {t(locale, 'classmgr.myClassrooms')}
        </h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.loading')}</p>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(locale, 'classmgr.noClassrooms')}</p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <ClassroomCard
                key={room.id}
                classroom={room}
                onChanged={refresh}
                showPremium={showPremium}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
