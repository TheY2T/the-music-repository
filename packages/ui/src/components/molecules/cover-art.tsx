import type * as React from 'react';
import { cn } from '../../lib/utils';

export type CoverArtMotif = 'record' | 'staff' | 'keys' | 'strings' | 'auto';

export interface CoverArtProps {
  title: string;
  subtitle?: string;
  /** Deterministic seed — same seed always yields identical art (SSR-safe). Varies layout only, never colors. */
  seed: string;
  motif?: CoverArtMotif;
  /** Show the title band + label overlay. Off for MediaCard (which prints its own title). Default true. */
  showLabel?: boolean;
  className?: string;
}

/** FNV-1a string hash → 32-bit unsigned integer. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — a tiny deterministic PRNG. Returns a function yielding floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTIFS: Exclude<CoverArtMotif, 'auto'>[] = ['record', 'staff', 'keys', 'strings'];

/** ViewBox is 4:3 (400 × 300). Coordinates below assume that space. */
const W = 400;
const H = 300;

function renderMotif(motif: Exclude<CoverArtMotif, 'auto'>, rng: () => number): React.ReactNode {
  const cx = W / 2;
  const cy = H / 2 - 12;
  switch (motif) {
    case 'record': {
      const rings = 3 + Math.floor(rng() * 3); // 3–5 grooves
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={88}
            fill="var(--muted)"
            stroke="var(--border)"
            strokeWidth={2}
          />
          {Array.from({ length: rings }, (_, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={78 - i * (60 / rings)}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.7}
            />
          ))}
          <circle cx={cx} cy={cy} r={26} fill="var(--accent)" />
          <circle cx={cx} cy={cy} r={5} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
        </g>
      );
    }
    case 'staff': {
      const lines = 5;
      const gap = 12;
      const top = cy - (gap * (lines - 1)) / 2;
      const noteX = cx - 40 + Math.floor(rng() * 60);
      const noteLine = Math.floor(rng() * lines);
      const noteY = top + noteLine * gap;
      return (
        <g>
          {Array.from({ length: lines }, (_, i) => (
            <line
              key={i}
              x1={cx - 120}
              y1={top + i * gap}
              x2={cx + 120}
              y2={top + i * gap}
              stroke="var(--foreground)"
              strokeWidth={1.5}
              opacity={0.55}
            />
          ))}
          <ellipse
            cx={noteX}
            cy={noteY}
            rx={9}
            ry={7}
            fill="var(--accent)"
            transform={`rotate(-20 ${noteX} ${noteY})`}
          />
          <line
            x1={noteX + 8}
            y1={noteY - 2}
            x2={noteX + 8}
            y2={noteY - 46}
            stroke="var(--foreground)"
            strokeWidth={2}
          />
        </g>
      );
    }
    case 'keys': {
      const whites = 7;
      const kw = 26;
      const totalW = whites * kw;
      const x0 = cx - totalW / 2;
      const ky = cy - 44;
      const kh = 88;
      // Black-key pattern offset varies with seed for subtle variation.
      const blackAt = new Set([0, 1, 3, 4, 5].map((n) => (n + Math.floor(rng() * 2)) % whites));
      return (
        <g>
          {Array.from({ length: whites }, (_, i) => (
            <rect
              key={`w${i}`}
              x={x0 + i * kw}
              y={ky}
              width={kw - 1.5}
              height={kh}
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          ))}
          {Array.from({ length: whites - 1 }, (_, i) =>
            blackAt.has(i) ? (
              <rect
                key={`b${i}`}
                x={x0 + (i + 1) * kw - kw * 0.32}
                y={ky}
                width={kw * 0.64}
                height={kh * 0.6}
                fill="var(--foreground)"
              />
            ) : null,
          )}
        </g>
      );
    }
    case 'strings': {
      const count = 5 + Math.floor(rng() * 2); // 5–6 strings
      const span = 150;
      const x0 = cx - span / 2;
      const step = span / (count - 1);
      const holeCx = cx + (rng() < 0.5 ? -1 : 1) * 6;
      return (
        <g>
          {Array.from({ length: count }, (_, i) => (
            <line
              key={i}
              x1={x0 + i * step}
              y1={cy - 92}
              x2={x0 + i * step}
              y2={cy + 92}
              stroke="var(--foreground)"
              strokeWidth={1 + (i % 2) * 0.6}
              opacity={0.5}
            />
          ))}
          <circle
            cx={holeCx}
            cy={cy}
            r={34}
            fill="var(--muted)"
            stroke="var(--border)"
            strokeWidth={2}
          />
          <circle
            cx={holeCx}
            cy={cy}
            r={24}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            opacity={0.8}
          />
        </g>
      );
    }
  }
}

/**
 * Procedural vintage sheet-music cover / record sleeve, rendered as inline SVG. Deterministic from
 * `seed` (SSR-safe, no `Math.random`): the seed varies motif + ornament layout only. All fills/strokes
 * use global CSS token variables so the art re-themes across every palette. Presentational, i18n-by-prop.
 */
export function CoverArt({
  title,
  subtitle,
  seed,
  motif = 'auto',
  showLabel = true,
  className,
}: CoverArtProps) {
  const rng = mulberry32(hashSeed(seed));
  // Draw the motif choice first so downstream ornament picks stay stable per seed.
  const chosen: Exclude<CoverArtMotif, 'auto'> =
    motif === 'auto' ? (MOTIFS[Math.floor(rng() * MOTIFS.length)] ?? 'record') : motif;
  const stripe = rng() < 0.5;
  const corner = Math.floor(rng() * 4); // which corner gets the ornament flourish
  const rot = -6 + Math.floor(rng() * 13); // ornament rotation −6..+6

  return (
    <div className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={subtitle ? `${title} — ${subtitle}` : title}
        className="block h-auto w-full rounded-lg"
      >
        {/* Sleeve background + aged frame */}
        <rect x={0} y={0} width={W} height={H} rx={10} fill="var(--card)" />
        {stripe ? (
          <rect x={0} y={H * 0.5} width={W} height={H * 0.5} fill="var(--muted)" opacity={0.5} />
        ) : null}
        <rect
          x={7}
          y={7}
          width={W - 14}
          height={H - 14}
          rx={6}
          fill="none"
          stroke="var(--border)"
          strokeWidth="var(--frame-width, 2)"
        />
        <rect
          x={14}
          y={14}
          width={W - 28}
          height={H - 28}
          rx={4}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Corner flourish (deterministic position + rotation) */}
        <g
          transform={`translate(${corner % 2 === 0 ? 30 : W - 30} ${corner < 2 ? 30 : H - 30}) rotate(${rot})`}
          opacity={0.55}
        >
          <circle cx={0} cy={0} r={4} fill="var(--accent)" />
          <path d="M -10 0 Q 0 -12 10 0" fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        </g>

        {renderMotif(chosen, rng)}

        {/* Title band (only when labelled) */}
        {showLabel ? (
          <rect
            x={20}
            y={H - 64}
            width={W - 40}
            height={44}
            rx={6}
            fill="var(--muted)"
            opacity={0.85}
          />
        ) : null}
      </svg>

      {/* HTML title overlay so long titles wrap and stay legible; token-colored. */}
      {showLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-4">
          <p className="truncate font-display text-sm font-semibold text-foreground">{title}</p>
          {subtitle ? (
            <p className="truncate font-body text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
