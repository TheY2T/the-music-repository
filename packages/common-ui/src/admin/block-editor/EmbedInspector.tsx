import { type EmbedConfig, type EmbedTool, parseYouTubeId } from '@TheY2T/tmr-content-serde';
import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  Field,
  Input,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '@TheY2T/tmr-ui';
import { adminApi } from '@TheY2T/tmr-web-acl/admin-api';
import { useEffect, useRef, useState } from 'react';
import type { EmbedInspectorTarget } from './editor-ui';
import { type EmbedFieldDef, fieldsForTool, TOOL_LABEL_KEY } from './embed-fields';

/** Read a config value as the string shown in a control (arrays join with `, `). */
function toInputValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value == null ? '' : String(value);
}

/** Parse a control's string back to the typed config value. */
function fromInputValue(field: EmbedFieldDef, raw: string): unknown {
  if (field.type === 'list') {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  if (field.type === 'number') {
    const n = Number(raw);
    return raw.trim() && Number.isFinite(n) ? n : undefined;
  }
  return raw.trim() ? raw : undefined;
}

/**
 * Side-panel form that edits one embed's config. Fields are derived per-tool from `embed-fields`, so
 * adding a tool is a data change, not a form. Applies the edited config back on close. See ADR 0030.
 */
export function EmbedInspector({
  target,
  onClose,
  locale,
}: {
  target: EmbedInspectorTarget | null;
  onClose: () => void;
  locale: Locale;
}) {
  const [draft, setDraft] = useState<EmbedConfig | null>(target?.config ?? null);
  const lastPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    setDraft(target?.config ?? null);
  }, [target]);

  // For a YouTube embed, resolve the title/thumbnail from the pasted URL so the author sees a live
  // preview and the saved embed carries cached metadata. Debounced; best-effort (failure leaves the
  // draft untouched — the read side still renders from the video id).
  const videoUrl =
    draft?.tool === 'youtube' && typeof draft.videoUrl === 'string' ? draft.videoUrl.trim() : '';
  useEffect(() => {
    const id = parseYouTubeId(videoUrl);
    if (!id || videoUrl === lastPreviewUrl.current) return;
    lastPreviewUrl.current = videoUrl;
    const handle = window.setTimeout(() => {
      adminApi
        .videoPreview(videoUrl)
        .then((preview) => {
          setDraft((prev) => {
            if (prev?.tool !== 'youtube') return prev;
            const current = typeof prev.videoUrl === 'string' ? prev.videoUrl.trim() : '';
            if (current !== videoUrl) return prev;
            return {
              ...prev,
              videoId: preview.videoId,
              thumbnailUrl: preview.thumbnailUrl,
              ...(preview.author ? { videoAuthor: preview.author } : {}),
              ...(prev.title || !preview.title ? {} : { title: preview.title }),
            };
          });
        })
        .catch(() => {
          // preview is best-effort
        });
    }, 500);
    return () => window.clearTimeout(handle);
  }, [videoUrl]);

  if (!target || !draft) {
    return null;
  }

  const tool = draft.tool as EmbedTool;
  const fields = fieldsForTool(tool);
  const previewThumb =
    tool === 'youtube' && typeof draft.thumbnailUrl === 'string' ? draft.thumbnailUrl : null;
  const previewTitle =
    tool === 'youtube' && typeof draft.title === 'string' && draft.title ? draft.title : null;

  const setField = (field: EmbedFieldDef, raw: string) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }
      const next = { ...prev };
      const parsed = fromInputValue(field, raw);
      if (parsed === undefined) {
        delete (next as Record<string, unknown>)[field.key];
      } else {
        (next as Record<string, unknown>)[field.key] = parsed;
      }
      return next;
    });
  };

  const commit = () => {
    target.apply(draft);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          commit();
        }
      }}
    >
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t(locale, TOOL_LABEL_KEY[tool])}</SheetTitle>
          <SheetDescription>{t(locale, 'blockEditor.inspectorHint')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 py-2">
          {fields.map((field) => {
            const id = `embed-${field.key}`;
            const value = toInputValue((draft as Record<string, unknown>)[field.key]);
            return (
              <Field key={field.key} label={t(locale, field.labelKey)} htmlFor={id}>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={id}
                    className="h-40 font-mono"
                    value={value}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <Select id={id} value={value} onChange={(e) => setField(field, e.target.value)}>
                    <option value="">—</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id={id}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                )}
              </Field>
            );
          })}

          {previewThumb ? (
            <div className="space-y-2">
              <img
                src={previewThumb}
                alt=""
                className="aspect-video w-full rounded-md border border-border object-cover"
              />
              {previewTitle ? <p className="text-sm font-medium">{previewTitle}</p> : null}
            </div>
          ) : null}
        </div>

        <SheetFooter>
          <Button type="button" onClick={commit}>
            {t(locale, 'blockEditor.done')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
