import type { LocaleInfo } from '../../domain/locale';

/**
 * LocaleRegistry (ADR 0012) — the set of locales the CMS can author strings for (a superset of the
 * code-level routing locales). Named for the capability, no `Port` suffix.
 */
export abstract class LocaleRegistry {
  abstract list(): Promise<LocaleInfo[]>;
  abstract exists(code: string): Promise<boolean>;
  abstract create(code: string, label: string): Promise<LocaleInfo>;
  /** Register `code` if it isn't already present (used by import to accept brand-new locales). */
  abstract ensure(code: string, label?: string): Promise<void>;
}
