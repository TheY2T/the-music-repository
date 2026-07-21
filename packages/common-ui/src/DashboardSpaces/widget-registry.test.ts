import { en, zhHans } from '@TheY2T/tmr-i18n-locales';
import { describe, expect, it } from 'vitest';
import { isWidgetType, WIDGET_CATEGORIES, WIDGET_REGISTRY, WIDGET_TYPES } from './widget-registry';

describe('widget registry', () => {
  const categories = new Set(WIDGET_CATEGORIES.map((c) => c.category));

  it('exposes every registered type', () => {
    expect(WIDGET_TYPES).toEqual(Object.keys(WIDGET_REGISTRY));
    expect(WIDGET_TYPES.every(isWidgetType)).toBe(true);
    expect(isWidgetType('not-a-widget')).toBe(false);
  });

  it('gives every widget a known category', () => {
    for (const type of WIDGET_TYPES) {
      expect(categories.has(WIDGET_REGISTRY[type].category)).toBe(true);
    }
  });

  it('has seeded title + description strings in both locales', () => {
    for (const type of WIDGET_TYPES) {
      const { titleKey, descKey } = WIDGET_REGISTRY[type];
      for (const key of [titleKey, descKey]) {
        expect(en[key], `${key} missing from en`).toBeTruthy();
        expect(zhHans[key], `${key} missing from zh-Hans`).toBeTruthy();
      }
    }
  });

  it('has category labels seeded in both locales', () => {
    for (const { labelKey } of WIDGET_CATEGORIES) {
      expect(en[labelKey]).toBeTruthy();
      expect(zhHans[labelKey]).toBeTruthy();
    }
  });

  it('never lets a default footprint fall below its minimum', () => {
    for (const type of WIDGET_TYPES) {
      const { defaultSize, minSize } = WIDGET_REGISTRY[type];
      expect(defaultSize.w).toBeGreaterThanOrEqual(minSize.w);
      expect(defaultSize.h).toBeGreaterThanOrEqual(minSize.h);
    }
  });
});
