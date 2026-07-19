import { murmur3_32 } from './murmur';
import type { TargetingRule } from './snapshot';

/**
 * A minimal targeting evaluator over a JSONLogic subset — `if` / `in` / `var` / `==` / `!=` / `and` /
 * `or` / `!` / `starts_with` / `ends_with` — plus a **`fractional`** percentage-rollout operator
 * (murmur3-bucketed). A targeting rule resolves to a **variant name** (e.g. `'on'` / `'off'`), or `null`
 * when nothing matches. Dependency-free, so the api↔web shared package stays lean.
 */

/** The evaluation data a rule reads via `{ "var": "…" }`, assembled from the OpenFeature context. */
export interface TargetingData {
  targetingKey?: string;
  email?: string;
  roles?: string[];
  /** The evaluating flag's key, readable as `$flagd.flagKey` or flat as `flagKey`. */
  flagKey: string;
  [key: string]: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a dot-path (`a.b.c`) out of the data object; supports `$flagd.flagKey`. */
function readVar(path: string, data: TargetingData): unknown {
  if (path === '') return data;
  if (path === '$flagd.flagKey') return data.flagKey;
  let current: unknown = data;
  for (const segment of path.split('.')) {
    if (!isPlainObject(current) && !Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function truthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

/** Resolve a JSONLogic sub-expression to a concrete value (variant strings, booleans, primitives…). */
function apply(rule: unknown, data: TargetingData): unknown {
  if (!isPlainObject(rule)) return rule; // primitive or array literal
  const keys = Object.keys(rule);
  const op = keys[0];
  if (keys.length !== 1 || op === undefined) return rule;
  const raw = rule[op];
  const args = Array.isArray(raw) ? raw : [raw];

  switch (op) {
    case 'var': {
      const path = String(apply(args[0], data) ?? '');
      const value = readVar(path, data);
      return value === undefined ? (args[1] ?? null) : value;
    }
    case 'if': {
      // (cond, then, cond, then, …, else)
      for (let i = 0; i + 1 < args.length; i += 2) {
        if (truthy(apply(args[i], data))) return apply(args[i + 1], data);
      }
      return args.length % 2 === 1 ? apply(args[args.length - 1], data) : null;
    }
    case '==':
      // biome-ignore lint/suspicious/noDoubleEquals: JSONLogic `==` is intentionally loose.
      return apply(args[0], data) == apply(args[1], data);
    case '!=':
      // biome-ignore lint/suspicious/noDoubleEquals: JSONLogic `!=` is intentionally loose.
      return apply(args[0], data) != apply(args[1], data);
    case '===':
      return apply(args[0], data) === apply(args[1], data);
    case '!==':
      return apply(args[0], data) !== apply(args[1], data);
    case '!':
      return !truthy(apply(args[0], data));
    case 'and':
      return args.every((arg) => truthy(apply(arg, data)));
    case 'or':
      return args.some((arg) => truthy(apply(arg, data)));
    case 'in': {
      const needle = apply(args[0], data);
      const haystack = apply(args[1], data);
      if (Array.isArray(haystack)) return haystack.includes(needle);
      if (typeof haystack === 'string') return haystack.includes(String(needle));
      return false;
    }
    case 'starts_with': {
      const subject = String(apply(args[0], data) ?? '');
      return subject.startsWith(String(apply(args[1], data) ?? ''));
    }
    case 'ends_with': {
      const subject = String(apply(args[0], data) ?? '');
      return subject.endsWith(String(apply(args[1], data) ?? ''));
    }
    case 'fractional':
      return fractional(args, data);
    default:
      return null;
  }
}

/**
 * `fractional` rollout. Optional leading bucketing expression, then `[variant, weight]` pairs. With no
 * explicit bucket key, buckets by `flagKey + targetingKey`. Returns the chosen variant name.
 */
function fractional(args: unknown[], data: TargetingData): string | null {
  let distributions = args;
  let bucketBy: string;

  if (!Array.isArray(args[0])) {
    // first arg is the bucketing expression (string path or logic)
    bucketBy = String(apply(args[0], data) ?? '');
    distributions = args.slice(1);
  } else {
    bucketBy = `${data.flagKey}${data.targetingKey ?? ''}`;
  }

  const pairs = distributions.filter(
    (d): d is [string, number] => Array.isArray(d) && typeof d[0] === 'string',
  );
  const total = pairs.reduce((sum, [, weight]) => sum + (Number(weight) || 0), 0);
  if (total <= 0) return null;

  const hashRatio = murmur3_32(bucketBy) / 0xffffffff;
  const bucket = Math.floor(hashRatio * total);

  let cursor = 0;
  for (const [variant, weight] of pairs) {
    cursor += Number(weight) || 0;
    if (bucket < cursor) return variant;
  }
  return pairs[pairs.length - 1]?.[0] ?? null;
}

/**
 * Evaluate a targeting rule to a variant name (or `null` if it doesn't resolve to a string variant).
 * `flagKey` seeds the default `fractional` bucketing; `data` carries the request's targeting context.
 */
export function evaluateTargeting(rule: TargetingRule, data: TargetingData): string | null {
  const result = apply(rule, data);
  return typeof result === 'string' ? result : null;
}
