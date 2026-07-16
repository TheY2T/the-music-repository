import type { EmbedConfig } from '@TheY2T/tmr-content-serde';
import { t } from '@TheY2T/tmr-i18n';
import { Button, Icon } from '@TheY2T/tmr-ui';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { type Embed, EmbedCard } from '@/components/content/ContentEmbeds';
import { useEditorUi } from './editor-ui';

/**
 * TipTap node view for a `tmrEmbed` block: renders the **real** `EmbedCard` (the same component the
 * public page uses) behind a pointer-events shield so the tool doesn't capture editor clicks, with a
 * floating toolbar to configure (opens the inspector) or remove the embed. See ADR 0030.
 */
export function EmbedNodeView(props: NodeViewProps) {
  const { locale, interactive, openInspector } = useEditorUi();
  const config = (props.node.attrs.config ?? { tool: 'circle-of-fifths' }) as EmbedConfig;

  return (
    <NodeViewWrapper
      className="relative my-4 rounded-lg ring-1 ring-border/60"
      contentEditable={false}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={t(locale, 'blockEditor.editEmbed')}
          onClick={() =>
            openInspector({ config, apply: (next) => props.updateAttributes({ config: next }) })
          }
        >
          <Icon name="sliders" className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={t(locale, 'blockEditor.removeEmbed')}
          onClick={() => props.deleteNode()}
        >
          <Icon name="trash" className="size-4" />
        </Button>
      </div>
      {/* The tool is a live preview only — shield it so clicks/drags stay with the editor. */}
      <div className="pointer-events-none select-none">
        <EmbedCard embed={config as Embed} locale={locale} interactive={interactive} />
      </div>
    </NodeViewWrapper>
  );
}
