import { type Locale, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { FRETBOARD_SKINS, KEYBOARD_SKINS } from '@TheY2T/tmr-music-core/instrument-skins';
import { Icon, Select } from '@TheY2T/tmr-ui';
import type { Handedness } from '@TheY2T/tmr-web-acl/instrument-preferences';

interface InstrumentControlsProps {
  locale: Locale;
  instrument: 'keyboard' | 'fretboard';
  skin: string;
  onSkinChange: (id: string) => void;
  /** Handedness controls render only for the fretboard. */
  handedness?: Handedness;
  onHandednessChange?: (handedness: Handedness) => void;
}

/**
 * The immersive-instrument controls cluster (skin picker + guitar handedness toggle), rendered in the
 * {@link ToolStage} toolbar. Presentational strings arrive via `t(locale, key)`; the picker options come
 * from the music-core skin registries.
 */
export function InstrumentControls({
  locale,
  instrument,
  skin,
  onSkinChange,
  handedness,
  onHandednessChange,
}: InstrumentControlsProps) {
  const skins = instrument === 'keyboard' ? KEYBOARD_SKINS : FRETBOARD_SKINS;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-1.5 text-sm">
        <Icon name="palette" className="size-4 text-muted-foreground" />
        <span className="sr-only">{t(locale, 'tool.skin.label')}</span>
        <Select
          value={skin}
          onChange={(e) => onSkinChange(e.target.value)}
          aria-label={t(locale, 'tool.skin.label')}
          className="h-auto w-auto px-2 py-1"
        >
          {skins.map((s) => (
            <option key={s.id} value={s.id}>
              {t(locale, s.labelKey as MessageKey)}
            </option>
          ))}
        </Select>
      </label>

      {handedness && onHandednessChange && (
        <label className="flex items-center gap-1.5 text-sm">
          <Icon name="hand" className="size-4 text-muted-foreground" />
          <span className="sr-only">{t(locale, 'tool.handedness.label')}</span>
          <Select
            value={handedness}
            onChange={(e) => onHandednessChange(e.target.value as Handedness)}
            aria-label={t(locale, 'tool.handedness.label')}
            className="h-auto w-auto px-2 py-1"
          >
            <option value="right">{t(locale, 'tool.handedness.right')}</option>
            <option value="left">{t(locale, 'tool.handedness.left')}</option>
          </Select>
        </label>
      )}
    </div>
  );
}
