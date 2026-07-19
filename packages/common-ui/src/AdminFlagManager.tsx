import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Icon,
  Input,
  Label,
  PaginationBar,
  SearchField,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  usePagination,
} from '@TheY2T/tmr-ui';
import {
  type FlagAdminRow,
  type FlagEnvironmentRow,
  type FlagRevisionRow,
  featureFlagAdminApi,
  type TargetingRule,
} from '@TheY2T/tmr-web-data/feature-flags-api';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

/** flagd/JSONLogic templates offered in the targeting editor. */
function roleTemplate(role: string): TargetingRule {
  return { if: [{ in: [role, { var: 'roles' }] }, 'on', 'off'] };
}
function percentTemplate(pct: number): TargetingRule {
  return {
    fractional: [
      ['on', pct],
      ['off', 100 - pct],
    ],
  };
}

export default function AdminFlagManager({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, params?: Record<string, string | number>) => t(locale, key, params);

  const [environments, setEnvironments] = useState<FlagEnvironmentRow[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('');
  const [flags, setFlags] = useState<FlagAdminRow[]>([]);
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [targetingFlag, setTargetingFlag] = useState<FlagAdminRow | null>(null);
  const [revisionsFlag, setRevisionsFlag] = useState<FlagAdminRow | null>(null);

  const currentEnv = environments.find((e) => e.id === selectedEnvId);

  const run = useCallback(async (op: () => Promise<void>, okMessage?: string) => {
    setError(null);
    try {
      await op();
      if (okMessage) {
        setNotice(okMessage);
        setTimeout(() => setNotice(null), 2500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const reloadFlags = useCallback(async () => {
    const items = await featureFlagAdminApi.listFlags({ includeDeleted: showDeleted });
    setFlags(items);
  }, [showDeleted]);

  const reloadEnvironments = useCallback(async () => {
    const items = await featureFlagAdminApi.listEnvironments();
    setEnvironments(items);
    setSelectedEnvId((prev) => prev || items.find((e) => e.isDefault)?.id || items[0]?.id || '');
  }, []);

  useEffect(() => {
    run(async () => {
      await reloadEnvironments();
      await reloadFlags();
    });
  }, [run, reloadEnvironments, reloadFlags]);

  const filtered = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return flags;
    return flags.filter(
      (f) => f.key.toLowerCase().includes(needle) || f.description.toLowerCase().includes(needle),
    );
  }, [flags, deferredSearch]);

  const pagination = usePagination(filtered, {
    resetKey: `${deferredSearch}|${showDeleted}|${selectedEnvId}`,
  });

  const settingFor = (flag: FlagAdminRow) =>
    flag.settings.find((s) => s.environmentId === selectedEnvId);

  const toggleEnabled = (flag: FlagAdminRow, enabled: boolean) =>
    run(async () => {
      await featureFlagAdminApi.upsertSetting(flag.id, selectedEnvId, {
        enabled,
        defaultVariant: enabled ? 'on' : 'off',
      });
      await reloadFlags();
    });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="ff-env" className="text-sm text-muted-foreground">
            {tr('flagadmin.environment')}
          </Label>
          <Select
            id="ff-env"
            value={selectedEnvId}
            onChange={(e) => setSelectedEnvId(e.target.value)}
            className="w-44"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.label}
                {env.isDefault ? ` (${tr('flagadmin.currentEnv')})` : ''}
              </option>
            ))}
          </Select>
        </div>
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tr('flagadmin.search')}
          className="w-full max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
          {tr('flagadmin.showDeleted')}
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEnvOpen(true)}>
            <Icon name="settings" className="size-4" /> {tr('flagadmin.manageEnvironments')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Icon name="upload" className="size-4" /> {tr('flagadmin.import')}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" className="size-4" /> {tr('flagadmin.new')}
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {notice}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tr('flagadmin.colKey')}</TableHead>
            <TableHead className="w-24 text-center">{tr('flagadmin.colEnabled')}</TableHead>
            <TableHead className="w-32">{tr('flagadmin.colTargeting')}</TableHead>
            <TableHead className="w-24">{tr('flagadmin.colSource')}</TableHead>
            <TableHead className="w-48 text-right">{tr('flagadmin.colActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.pageItems.map((flag) => {
            const setting = settingFor(flag);
            return (
              <TableRow key={flag.id} className={flag.deleted ? 'opacity-60' : undefined}>
                <TableCell>
                  <div className="font-mono text-sm">{flag.key}</div>
                  {flag.description && (
                    <div className="text-xs text-muted-foreground">{flag.description}</div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={setting?.enabled ?? false}
                    disabled={flag.deleted || !setting}
                    onChange={(e) => toggleEnabled(flag, e.target.checked)}
                    aria-label={tr('flagadmin.colEnabled')}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={setting?.targeting ? 'default' : 'outline'}>
                    {setting?.targeting
                      ? tr('flagadmin.targetingSet')
                      : tr('flagadmin.targetingNone')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={flag.source === 'code' ? 'secondary' : 'outline'}>
                    {flag.source === 'code'
                      ? tr('flagadmin.sourceCode')
                      : tr('flagadmin.sourceRuntime')}
                  </Badge>
                  {flag.deleted && (
                    <Badge variant="outline" className="ml-1">
                      {tr('flagadmin.deletedBadge')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={flag.deleted || !setting}
                      onClick={() => setTargetingFlag(flag)}
                    >
                      {tr('flagadmin.editTargeting')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRevisionsFlag(flag)}>
                      {tr('flagadmin.revisions')}
                    </Button>
                    {flag.deleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(async () => {
                            await featureFlagAdminApi.restoreFlag(flag.id);
                            await reloadFlags();
                          }, tr('flagadmin.saved'))
                        }
                      >
                        {tr('flagadmin.restore')}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(async () => {
                            await featureFlagAdminApi.deleteFlag(flag.id);
                            await reloadFlags();
                          }, tr('flagadmin.saved'))
                        }
                      >
                        {tr('flagadmin.delete')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {pagination.pageItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                {tr('flagadmin.empty')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationBar
        page={pagination.page}
        pageCount={pagination.pageCount}
        pageSize={pagination.pageSize}
        pageSizes={pagination.pageSizes}
        total={pagination.total}
        rangeFrom={pagination.rangeFrom}
        rangeTo={pagination.rangeTo}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        perPageLabel={tr('common.perPage')}
        showingLabel={tr('common.showing', {
          from: pagination.rangeFrom,
          to: pagination.rangeTo,
          total: pagination.total,
        })}
        prevLabel={tr('common.prev')}
        nextLabel={tr('common.next')}
      />

      {createOpen && (
        <CreateFlagDialog
          tr={tr}
          onClose={() => setCreateOpen(false)}
          onCreate={(body) =>
            run(async () => {
              await featureFlagAdminApi.createFlag(body);
              await reloadFlags();
              setCreateOpen(false);
            }, tr('flagadmin.saved'))
          }
        />
      )}

      {targetingFlag && currentEnv && (
        <TargetingDialog
          tr={tr}
          flag={targetingFlag}
          envId={selectedEnvId}
          onClose={() => setTargetingFlag(null)}
          onSave={(body) =>
            run(async () => {
              await featureFlagAdminApi.upsertSetting(targetingFlag.id, selectedEnvId, body);
              await reloadFlags();
              setTargetingFlag(null);
            }, tr('flagadmin.saved'))
          }
        />
      )}

      {revisionsFlag && (
        <RevisionsDialog tr={tr} flag={revisionsFlag} onClose={() => setRevisionsFlag(null)} />
      )}

      {importOpen && (
        <ImportDialog
          tr={tr}
          onClose={() => setImportOpen(false)}
          onImport={(entries) =>
            run(async () => {
              await featureFlagAdminApi.importFlags(entries);
              await reloadFlags();
              setImportOpen(false);
            }, tr('flagadmin.saved'))
          }
        />
      )}

      {envOpen && (
        <EnvironmentsDialog
          tr={tr}
          environments={environments}
          onClose={() => setEnvOpen(false)}
          onChanged={() => run(reloadEnvironments)}
          run={run}
        />
      )}
    </div>
  );
}

type Tr = (key: MessageKey, params?: Record<string, string | number>) => string;

function CreateFlagDialog({
  tr,
  onClose,
  onCreate,
}: {
  tr: Tr;
  onClose: () => void;
  onCreate: (body: { key: string; description?: string; defaultValue?: boolean }) => void;
}) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [defaultValue, setDefaultValue] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tr('flagadmin.createTitle')}</DialogTitle>
          <DialogDescription>{tr('flagadmin.createBody')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ff-key">{tr('flagadmin.fieldKey')}</Label>
            <Input
              id="ff-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="tools.new-thing"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ff-desc">{tr('flagadmin.fieldDescription')}</Label>
            <Input
              id="ff-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={defaultValue} onChange={(e) => setDefaultValue(e.target.checked)} />
            {tr('flagadmin.fieldDefault')}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr('flagadmin.cancel')}
          </Button>
          <Button
            disabled={!key.trim()}
            onClick={() => onCreate({ key: key.trim(), description, defaultValue })}
          >
            {tr('flagadmin.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TargetingDialog({
  tr,
  flag,
  envId,
  onClose,
  onSave,
}: {
  tr: Tr;
  flag: FlagAdminRow;
  envId: string;
  onClose: () => void;
  onSave: (body: { defaultVariant: string; targeting: TargetingRule }) => void;
}) {
  const setting = flag.settings.find((s) => s.environmentId === envId);
  const [defaultVariant, setDefaultVariant] = useState(setting?.defaultVariant ?? 'off');
  const [json, setJson] = useState(
    setting?.targeting ? JSON.stringify(setting.targeting, null, 2) : '',
  );
  const [invalid, setInvalid] = useState(false);

  const save = () => {
    const trimmed = json.trim();
    let targeting: TargetingRule = null;
    if (trimmed) {
      try {
        targeting = JSON.parse(trimmed);
      } catch {
        setInvalid(true);
        return;
      }
    }
    onSave({ defaultVariant, targeting });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">{flag.key}</DialogTitle>
          <DialogDescription>{tr('flagadmin.targetingHelp')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ff-dv">{tr('flagadmin.defaultVariant')}</Label>
            <Select
              id="ff-dv"
              value={defaultVariant}
              onChange={(e) => setDefaultVariant(e.target.value)}
              className="w-32"
            >
              <option value="on">on</option>
              <option value="off">off</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ff-targeting">{tr('flagadmin.targetingLabel')}</Label>
            <Textarea
              id="ff-targeting"
              value={json}
              onChange={(e) => {
                setJson(e.target.value);
                setInvalid(false);
              }}
              rows={8}
              className="font-mono text-xs"
              placeholder='{"if":[{"in":["beta",{"var":"roles"}]},"on","off"]}'
            />
            {invalid && <p className="text-xs text-destructive">{tr('flagadmin.invalidJson')}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJson(JSON.stringify(roleTemplate('beta'), null, 2))}
            >
              {tr('flagadmin.templateRole')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setJson(JSON.stringify(percentTemplate(10), null, 2))}
            >
              {tr('flagadmin.templatePercent')}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr('flagadmin.cancel')}
          </Button>
          <Button onClick={save}>{tr('flagadmin.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevisionsDialog({
  tr,
  flag,
  onClose,
}: {
  tr: Tr;
  flag: FlagAdminRow;
  onClose: () => void;
}) {
  const [revisions, setRevisions] = useState<FlagRevisionRow[] | null>(null);
  useEffect(() => {
    featureFlagAdminApi
      .listRevisions(flag.id)
      .then(setRevisions)
      .catch(() => setRevisions([]));
  }, [flag.id]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr('flagadmin.revisionsTitle')}</DialogTitle>
          <DialogDescription className="font-mono">{flag.key}</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {revisions?.length === 0 && (
            <p className="text-sm text-muted-foreground">{tr('flagadmin.noRevisions')}</p>
          )}
          {revisions?.map((rev) => (
            <div key={rev.id} className="rounded-md border border-border px-3 py-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">{rev.action}</span>
                <span className="text-muted-foreground">
                  {rev.environmentKey ? `${rev.environmentKey} · ` : ''}
                  {new Date(rev.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  tr,
  onClose,
  onImport,
}: {
  tr: Tr;
  onClose: () => void;
  onImport: (entries: Record<string, unknown>) => void;
}) {
  const [json, setJson] = useState('');
  const [invalid, setInvalid] = useState(false);
  const doImport = () => {
    try {
      const parsed = JSON.parse(json);
      const entries = parsed.flags ?? parsed; // accept a `{ flags: {...} }` wrapper or a bare map
      onImport(entries);
    } catch {
      setInvalid(true);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr('flagadmin.importTitle')}</DialogTitle>
          <DialogDescription>{tr('flagadmin.importBody')}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setInvalid(false);
          }}
          rows={10}
          className="font-mono text-xs"
        />
        {invalid && <p className="text-xs text-destructive">{tr('flagadmin.invalidJson')}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr('flagadmin.cancel')}
          </Button>
          <Button disabled={!json.trim()} onClick={doImport}>
            {tr('flagadmin.importAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EnvironmentsDialog({
  tr,
  environments,
  onClose,
  onChanged,
  run,
}: {
  tr: Tr;
  environments: FlagEnvironmentRow[];
  onClose: () => void;
  onChanged: () => void;
  run: (op: () => Promise<void>, okMessage?: string) => Promise<void>;
}) {
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr('flagadmin.environmentsTitle')}</DialogTitle>
          <DialogDescription>{tr('flagadmin.environmentsBody')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {environments.map((env) => (
            <div
              key={env.id}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="font-mono">{env.key}</span>
              <span className="text-muted-foreground">{env.label}</span>
              {env.isDefault && <Badge variant="secondary">{tr('flagadmin.envDefault')}</Badge>}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                disabled={env.isDefault}
                onClick={() =>
                  run(async () => {
                    await featureFlagAdminApi.deleteEnvironment(env.id);
                    onChanged();
                  })
                }
              >
                {tr('flagadmin.delete')}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <div className="space-y-1">
            <Label htmlFor="ff-envkey">{tr('flagadmin.envKey')}</Label>
            <Input
              id="ff-envkey"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="staging"
              className="font-mono"
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label htmlFor="ff-envlabel">{tr('flagadmin.envLabel')}</Label>
            <Input id="ff-envlabel" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <Button
            disabled={!key.trim()}
            onClick={() =>
              run(async () => {
                await featureFlagAdminApi.createEnvironment({
                  key: key.trim(),
                  label: label.trim() || key.trim(),
                });
                setKey('');
                setLabel('');
                onChanged();
              })
            }
          >
            {tr('flagadmin.addEnvironment')}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
