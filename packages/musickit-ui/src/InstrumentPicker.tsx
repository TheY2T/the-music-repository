import { SOUNDFONT_INSTRUMENTS } from '@TheY2T/tmr-music-core/soundfont';
import { Select } from '@TheY2T/tmr-ui';

/**
 * Dropdown to choose the sampled instrument a tool (or the score player) sounds with. Presentational:
 * the caller owns the value + persistence (see `useToolInstrument`). Mirrors the picker built into the
 * keyboard tool. An optional `extraOptions` slot lets the score player prepend a "built-in synth" entry.
 */
export interface InstrumentPickerProps {
  value: string;
  onChange: (name: string) => void;
  /** Label above the select. Defaults to the plain "Instrument" used across the tools. */
  label?: string;
  /** Rendered before the sampled instruments (e.g. the score player's built-in-synth option). */
  extraOptions?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export default function InstrumentPicker({
  value,
  onChange,
  label = 'Instrument',
  extraOptions,
  disabled,
  className,
}: InstrumentPickerProps) {
  return (
    <label className={className ?? 'space-y-1 text-sm'}>
      <span className="block font-medium">{label}</span>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-auto w-auto px-2 py-1"
      >
        {extraOptions?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {SOUNDFONT_INSTRUMENTS.map((inst) => (
          <option key={inst.name} value={inst.name}>
            {inst.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
