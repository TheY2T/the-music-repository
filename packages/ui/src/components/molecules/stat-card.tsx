import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

/** Label + big value tile (dashboard stats: streak, practice minutes, completed count, …). */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}
