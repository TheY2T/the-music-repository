import type { EmbedConfig } from '@TheY2T/tmr-content-serde';
import type { Locale } from '@TheY2T/tmr-i18n';
import { Field, Icon, Input, Textarea } from '@TheY2T/tmr-ui';
import type { FieldKind } from '@TheY2T/tmr-web-data/content-translations-api';
import type { ReactNode } from 'react';
import { BlockEditor } from '../admin/block-editor/BlockEditor';

export interface LocalizableFieldProps {
  locale: Locale;
  kind: FieldKind;
  /** True when the base (source) locale is active — edit base state directly, no reference shown. */
  isBase: boolean;
  value: string;
  /** The base (English) value, shown for reference when a target locale is active. */
  baseValue: string;
  onChange: (value: string) => void;
  /** Localized "English (base)" reference label. */
  baseLabel: string;
  /** `field` = labelled row (metadata/body); `head` = borderless document-head input (title/summary). */
  variant?: 'field' | 'head';
  label?: ReactNode;
  htmlFor?: string;
  placeholder?: string;
  inputClassName?: string;
  rows?: number;
  // Rich (block-editor) context:
  blockEditor?: boolean;
  interactive?: boolean;
  profile?: 'full' | 'minimal' | 'collection';
  /** Remount key so the uncontrolled block editor re-reads its value on a locale switch. */
  remountKey?: string;
  /** Base embeds, shown as read-only context in a target-locale body (never persisted per-locale). */
  embeds?: EmbedConfig[];
}

/** The muted "here's the English original" reference block, shown above a target-locale control. */
function Reference({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-2 text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <span className="block max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
        {value || <span className="text-muted-foreground">—</span>}
      </span>
    </div>
  );
}

/**
 * One localizable field, bound to the active locale. In the base locale it edits base state; in a
 * target locale it edits the translation with the English original shown for reference. Renders an
 * input, textarea, or the WYSIWYG block editor by `kind` (ADR 0034).
 */
export function LocalizableField({
  locale,
  kind,
  isBase,
  value,
  baseValue,
  onChange,
  baseLabel,
  variant = 'field',
  label,
  htmlFor,
  placeholder,
  inputClassName,
  rows = 2,
  blockEditor = false,
  interactive = false,
  profile = 'minimal',
  remountKey,
  embeds = [],
}: LocalizableFieldProps) {
  const control =
    kind === 'rich' ? (
      blockEditor ? (
        <BlockEditor
          key={remountKey}
          locale={locale}
          interactive={interactive}
          profile={profile}
          initialDoc={null}
          initialBodyMdx={value}
          initialEmbeds={embeds}
          onChange={(change) => onChange(change.bodyMdx)}
        />
      ) : (
        <Textarea
          className="h-48 font-mono text-sm"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    ) : kind === 'multiline' ? (
      <Textarea
        id={htmlFor}
        rows={rows}
        value={value}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <Input
        id={htmlFor}
        value={value}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(e) => onChange(e.target.value)}
      />
    );

  if (variant === 'head') {
    return (
      <div className="space-y-1">
        {control}
        {!isBase ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="languages" className="size-3" />
            {baseLabel}: {baseValue || '—'}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Field label={label} htmlFor={htmlFor}>
      {!isBase ? <Reference label={baseLabel} value={baseValue} /> : null}
      {control}
    </Field>
  );
}
