import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Field,
  PaginationBar,
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
import type { FeedbackStatus, FeedbackSubmission, FeedbackType } from '@TheY2T/tmr-web-acl/dto';
import { feedbackAdminApi } from '@TheY2T/tmr-web-acl/feedback-api';
import { useCallback, useEffect, useState } from 'react';

const TYPES: FeedbackType[] = ['idea', 'bug', 'praise', 'other'];
const STATUSES: FeedbackStatus[] = [
  'new',
  'triaging',
  'planned',
  'in_progress',
  'shipped',
  'declined',
  'closed',
];

export default function AdminFeedbackManager({ locale }: { locale: Locale }) {
  const [filterType, setFilterType] = useState<'' | FeedbackType>('');
  const [filterStatus, setFilterStatus] = useState<'' | FeedbackStatus>('');
  const [items, setItems] = useState<FeedbackSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedbackSubmission | null>(null);

  const load = useCallback(() => {
    setError(null);
    feedbackAdminApi
      .list({ type: filterType || undefined, status: filterStatus || undefined, pageSize: 200 })
      .then((page) => setItems(page.items))
      .catch((e: Error) => setError(t(locale, 'afeedback.loadError', { error: e.message })));
  }, [filterType, filterStatus, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pageItems,
    total,
    rangeFrom,
    rangeTo,
    pageSizes,
  } = usePagination(items, { initialPageSize: 25, resetKey: `${filterType}|${filterStatus}` });

  function onUpdated(updated: FeedbackSubmission) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setSelected(null);
  }

  function onDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t(locale, 'afeedback.filterType')}>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as '' | FeedbackType)}
          >
            <option value="">{t(locale, 'afeedback.all')}</option>
            {TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {t(locale, `feedback.type.${tp}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t(locale, 'afeedback.filterStatus')}>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as '' | FeedbackStatus)}
          >
            <option value="">{t(locale, 'afeedback.all')}</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(locale, `feedback.status.${st}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {total === 0 ? (
        <EmptyState title={t(locale, 'afeedback.empty')} />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t(locale, 'afeedback.colDate')}</TableHead>
                <TableHead>{t(locale, 'afeedback.colType')}</TableHead>
                <TableHead>{t(locale, 'afeedback.colStatus')}</TableHead>
                <TableHead>{t(locale, 'afeedback.colMessage')}</TableHead>
                <TableHead>{t(locale, 'afeedback.colFrom')}</TableHead>
                <TableHead className="text-right">{t(locale, 'afeedback.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell>{t(locale, `feedback.type.${item.type}`)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(locale, `feedback.status.${item.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.title ?? item.message}</TableCell>
                  <TableCell className="text-muted-foreground">{item.userEmail ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected(item)}
                    >
                      {t(locale, 'afeedback.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizes={pageSizes}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            perPageLabel={t(locale, 'common.perPage')}
            showingLabel={t(locale, 'common.showing', { from: rangeFrom, to: rangeTo, total })}
            prevLabel={t(locale, 'common.prev')}
            nextLabel={t(locale, 'common.next')}
          />
        </>
      )}

      {selected ? (
        <FeedbackDetailDialog
          locale={locale}
          submission={selected}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ) : null}
    </div>
  );
}

function FeedbackDetailDialog({
  locale,
  submission,
  onClose,
  onUpdated,
  onDeleted,
}: {
  locale: Locale;
  submission: FeedbackSubmission;
  onClose: () => void;
  onUpdated: (updated: FeedbackSubmission) => void;
  onDeleted: (id: string) => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>(submission.status);
  const [notes, setNotes] = useState(submission.adminNotes ?? '');
  const [isPublic, setIsPublic] = useState(submission.isPublic);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const updated = await feedbackAdminApi.update(submission.id, {
        status,
        adminNotes: notes,
        isPublic,
      });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(t(locale, 'afeedback.deleteConfirm'))) return;
    setBusy(true);
    try {
      await feedbackAdminApi.remove(submission.id);
      onDeleted(submission.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent closeLabel={t(locale, 'common.close')}>
        <DialogHeader>
          <DialogTitle>{t(locale, 'afeedback.detailTitle')}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{t(locale, `feedback.type.${submission.type}`)}</Badge>
            <span>{submission.userEmail ?? submission.userId}</span>
            <span>{new Date(submission.createdAt).toLocaleString(locale)}</span>
          </div>
          {submission.title ? <p className="font-medium">{submission.title}</p> : null}
          <p className="whitespace-pre-wrap text-sm">{submission.message}</p>
          {submission.pageUrl ? (
            <p className="text-xs text-muted-foreground">
              {t(locale, 'afeedback.context')}: {submission.pageUrl}
            </p>
          ) : null}

          <Field label={t(locale, 'afeedback.colStatus')}>
            <Select value={status} onChange={(e) => setStatus(e.target.value as FeedbackStatus)}>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(locale, `feedback.status.${st}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t(locale, 'afeedback.notesLabel')}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(locale, 'afeedback.notesPlaceholder')}
              rows={3}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            {t(locale, 'afeedback.publicLabel')}
          </label>

          <div className="flex justify-between gap-2 pt-2">
            <Button type="button" variant="destructive" onClick={remove} disabled={busy}>
              {t(locale, 'afeedback.delete')}
            </Button>
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? t(locale, 'afeedback.saving') : t(locale, 'afeedback.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
