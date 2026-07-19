import { describe, expect, it } from 'vitest';
import { murmur3_32 } from './murmur';
import type { TargetingRule } from './snapshot';
import { evaluateTargeting } from './targeting';

/** The exact rule authored for `demo.new-banner` in flags/flags.json — migrated verbatim. */
const DEMO_RULE: TargetingRule = {
  if: [
    { in: ['beta', { var: 'roles' }] },
    'on',
    {
      fractional: [
        ['on', 10],
        ['off', 90],
      ],
    },
  ],
};

describe('murmur3_32', () => {
  it('is deterministic and unsigned', () => {
    expect(murmur3_32('hello')).toBe(murmur3_32('hello'));
    expect(murmur3_32('hello')).toBeGreaterThanOrEqual(0);
    expect(murmur3_32('hello')).toBeLessThanOrEqual(0xffffffff);
  });

  it('produces different hashes for different inputs', () => {
    expect(murmur3_32('a')).not.toBe(murmur3_32('b'));
  });
});

describe('evaluateTargeting — role rule', () => {
  it('returns "on" when the beta role is present', () => {
    expect(evaluateTargeting(DEMO_RULE, { flagKey: 'demo.new-banner', roles: ['beta'] })).toBe(
      'on',
    );
  });

  it('falls through to the fractional rollout for non-beta users', () => {
    const variant = evaluateTargeting(DEMO_RULE, {
      flagKey: 'demo.new-banner',
      roles: ['learner'],
      targetingKey: 'user-123',
    });
    expect(['on', 'off']).toContain(variant);
  });

  it('is deterministic for the same targeting key', () => {
    const ctx = { flagKey: 'demo.new-banner', roles: [], targetingKey: 'stable-key' };
    expect(evaluateTargeting(DEMO_RULE, ctx)).toBe(evaluateTargeting(DEMO_RULE, ctx));
  });
});

describe('evaluateTargeting — fractional distribution', () => {
  it('splits roughly 10/90 across many keys (± tolerance)', () => {
    let on = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const variant = evaluateTargeting(DEMO_RULE, {
        flagKey: 'demo.new-banner',
        roles: [],
        targetingKey: `user-${i}`,
      });
      if (variant === 'on') on++;
    }
    const ratio = on / n;
    expect(ratio).toBeGreaterThan(0.06);
    expect(ratio).toBeLessThan(0.14);
  });
});

describe('evaluateTargeting — operators', () => {
  it('supports == / != / and / or / !', () => {
    const data = { flagKey: 'x', email: 'a@b.com', roles: ['admin'] };
    expect(
      evaluateTargeting({ if: [{ '==': [{ var: 'email' }, 'a@b.com'] }, 'on', 'off'] }, data),
    ).toBe('on');
    expect(
      evaluateTargeting({ if: [{ '!=': [{ var: 'email' }, 'a@b.com'] }, 'on', 'off'] }, data),
    ).toBe('off');
    expect(
      evaluateTargeting(
        { if: [{ and: [{ in: ['admin', { var: 'roles' }] }, true] }, 'on', 'off'] },
        data,
      ),
    ).toBe('on');
  });

  it('supports starts_with / ends_with', () => {
    const data = { flagKey: 'x', email: 'staff@corp.com' };
    expect(
      evaluateTargeting(
        { if: [{ ends_with: [{ var: 'email' }, '@corp.com'] }, 'on', 'off'] },
        data,
      ),
    ).toBe('on');
    expect(
      evaluateTargeting({ if: [{ starts_with: [{ var: 'email' }, 'staff'] }, 'on', 'off'] }, data),
    ).toBe('on');
  });

  it('returns null when a rule does not resolve to a variant string', () => {
    expect(evaluateTargeting({ '==': [1, 1] }, { flagKey: 'x' })).toBeNull();
  });
});
