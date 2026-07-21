import { type Locale, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Icon,
  Input,
  Select,
} from '@TheY2T/tmr-ui';
import { useState } from 'react';
import SpaceGrid from './SpaceGrid';
import { SPACE_TEMPLATES } from './templates';
import { useSpaces } from './use-spaces';
import WidgetPalette from './WidgetPalette';

/**
 * The practice-space builder island. Owns the spaces state (via {@link useSpaces}) and toggles between a
 * read-only view and an editor: switch/create/rename/delete spaces, add widgets from the palette, and
 * drag/resize/remove them on the grid. Every change autosaves (debounced). One island root; the page
 * mounts it inside `AppProviders` so widgets share the data + preference context. i18n-by-prop.
 */
export default function SpacesBuilder({ locale }: { locale: Locale }) {
  const spaces = useSpaces(locale);
  const [editMode, setEditMode] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  if (!spaces.ready) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        {t(locale, 'common.loading')}
      </p>
    );
  }

  const { active } = spaces;

  function toggleEdit() {
    setEditMode((v) => {
      const next = !v;
      if (!next) setPaletteOpen(false);
      return next;
    });
  }

  function confirmDelete() {
    if (!active) return;
    const message = t(locale, 'spaces.deleteConfirm').replace('{name}', active.name);
    if (window.confirm(message)) spaces.deleteSpace(active.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {spaces.spaces.length > 1 && (
            <Select
              aria-label={t(locale, 'spaces.switchSpace')}
              value={spaces.activeId}
              onChange={(e) => spaces.setActive(e.currentTarget.value)}
              className="w-48"
            >
              {spaces.spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
            >
              <Icon name="plus" className="size-4" />
              {t(locale, 'spaces.newSpace')}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{t(locale, 'spaces.newSpaceFrom')}</DropdownMenuLabel>
              {SPACE_TEMPLATES.map((tpl) => (
                <DropdownMenuItem key={tpl.key} onSelect={() => spaces.createSpace(tpl)}>
                  <Icon name={tpl.icon} className="size-4" />
                  {t(locale, tpl.nameKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {editMode && spaces.spaces.length > 1 && (
            <Button variant="ghost" size="sm" onClick={confirmDelete}>
              <Icon name="trash" className="size-4" />
              {t(locale, 'spaces.delete')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {spaces.status !== 'idle' && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {t(locale, spaces.status === 'saving' ? 'spaces.saving' : 'spaces.saved')}
            </span>
          )}
          {editMode && (
            <Button variant="outline" size="sm" onClick={() => setPaletteOpen((v) => !v)}>
              <Icon name="plus" className="size-4" />
              {t(locale, 'spaces.addWidget')}
            </Button>
          )}
          <Button variant={editMode ? 'default' : 'outline'} size="sm" onClick={toggleEdit}>
            <Icon name={editMode ? 'check' : 'pencil'} className="size-4" />
            {t(locale, editMode ? 'spaces.done' : 'spaces.edit')}
          </Button>
        </div>
      </div>

      {editMode && active && (
        <Input
          aria-label={t(locale, 'spaces.spaceName')}
          value={active.name}
          onChange={(e) => spaces.renameSpace(active.id, e.currentTarget.value)}
          className="max-w-sm font-display text-lg"
        />
      )}

      {editMode && paletteOpen && (
        <WidgetPalette
          locale={locale}
          onAdd={(type) => {
            spaces.addWidget(type);
            setPaletteOpen(false);
          }}
        />
      )}

      {active && (
        <SpaceGrid
          space={active}
          editMode={editMode}
          locale={locale}
          onLayoutChange={spaces.applyLayout}
          onRemoveWidget={spaces.removeWidget}
          onNoteChange={(id, text) => spaces.updateWidgetConfig(id, { text })}
          onToggleHScroll={(id, next) => spaces.updateWidgetConfig(id, { hScroll: next })}
          onExpandWidth={spaces.expandWidth}
          onExpandHeight={spaces.expandHeight}
        />
      )}
    </div>
  );
}
