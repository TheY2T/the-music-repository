import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { Icon, type IconName } from '../ui/icon';

export interface StatTileProps {
  /** Registered icon name; rendered in an accent chip beside the value. */
  iconName?: IconName;
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}

/**
 * Dashboard stat tile with an optional leading icon — the icon-bearing sibling of `StatCard`
 * (which stays icon-free). Composes `Card` + `Icon`. Presentational, i18n-by-prop.
 */
export function StatTile({ iconName, label, value, hint, className }: StatTileProps) {
  return (
    <Card className={cn('flex items-start gap-3 p-4', className)}>
      {iconName ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Icon name={iconName} className="size-5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </Card>
  );
}
