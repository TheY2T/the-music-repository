import type { EmbedConfig } from '@TheY2T/tmr-content-serde';
import type { Locale } from '@TheY2T/tmr-i18n';
import { createContext, useContext } from 'react';

/** What the inspector edits: the current embed config + a callback that writes the edited config back. */
export interface EmbedInspectorTarget {
  config: EmbedConfig;
  apply: (config: EmbedConfig) => void;
}

/**
 * Shared UI wiring passed from the `BlockEditor` island root down into TipTap React node views (which
 * render as portals inside the same React tree, so context propagates). Keeps node views presentational.
 */
export interface EditorUi {
  locale: Locale;
  /** Whether embedded score/tool islands render in interactive mode (mirrors the runtime flag). */
  interactive: boolean;
  /** Open the config inspector for an embed node. */
  openInspector: (target: EmbedInspectorTarget) => void;
}

export const EditorUiContext = createContext<EditorUi | null>(null);

export function useEditorUi(): EditorUi {
  const ctx = useContext(EditorUiContext);
  if (!ctx) {
    throw new Error('useEditorUi must be used within a BlockEditor');
  }
  return ctx;
}
