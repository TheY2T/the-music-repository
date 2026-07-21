import { LOCALE_LABELS, LOCALES } from '@TheY2T/tmr-i18n';
import { Checkbox, Input, Label, SegmentedToggle, Select, Slider } from '@TheY2T/tmr-ui';
import type { Locale } from '@TheY2T/tmr-web-acl';
import type { ControlSpec } from '@/registry/types';

interface Props {
  controls: ControlSpec[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

/**
 * The playground controls: a live locale toggle (always present) plus one input per declared prop.
 * Owns no state itself — the stage holds the prop values and re-renders the specimen on each change.
 */
export default function ControlsPanel({
  controls,
  values,
  onChange,
  locale,
  onLocaleChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Locale</Label>
        <SegmentedToggle
          className="w-full [&>button]:flex-1"
          value={locale}
          onValueChange={(v) => onLocaleChange(v as Locale)}
          options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
        />
      </div>

      {controls.map((control) => {
        const value = values[control.name];
        const label = control.label ?? control.name;
        return (
          <div key={control.name} className="space-y-1.5">
            <Label htmlFor={`ctl-${control.name}`}>{label}</Label>
            {control.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`ctl-${control.name}`}
                  checked={Boolean(value)}
                  onChange={(e) => onChange(control.name, e.currentTarget.checked)}
                />
                <span className="text-sm text-muted-foreground">{String(Boolean(value))}</span>
              </div>
            )}
            {control.type === 'text' && (
              <Input
                id={`ctl-${control.name}`}
                value={String(value ?? '')}
                placeholder={control.placeholder}
                onChange={(e) => onChange(control.name, e.currentTarget.value)}
              />
            )}
            {control.type === 'number' && (
              <div className="flex items-center gap-3">
                <Slider
                  id={`ctl-${control.name}`}
                  value={Number(value ?? 0)}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onChange={(e) => onChange(control.name, Number(e.currentTarget.value))}
                />
                <span className="w-10 text-right font-mono text-sm text-muted-foreground">
                  {Number(value ?? 0)}
                </span>
              </div>
            )}
            {control.type === 'enum' && (
              <Select
                id={`ctl-${control.name}`}
                value={String(value ?? '')}
                onChange={(e) => onChange(control.name, e.currentTarget.value)}
              >
                {control.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label ?? opt.value}
                  </option>
                ))}
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
