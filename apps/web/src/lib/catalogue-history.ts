/**
 * Client-side catalogue browse memory. The catalogue list is an anonymous client island, so a full
 * back-navigation from an item's detail page remounts it with fresh state — losing the filters, page,
 * scroll position, and which card was open. These helpers persist that context so the browser can
 * resume where the user left off:
 *
 *   - **Browse state + last-selected slug** live in `sessionStorage` (per-tab, cleared when the tab
 *     closes) — exactly the lifetime of a "navigate back and forth" session. On return the list
 *     restores the filters/page and scrolls the previously-opened card into view + highlights it.
 *   - **Recently viewed** lives in `localStorage` (persists across sessions) and backs the compact
 *     "Recently viewed" strip. Minimal metadata is stored so the strip renders without a re-fetch.
 *
 * All access is wrapped in try/catch: storage can throw (private mode, disabled, SSR) and browse
 * memory is a non-critical enhancement — a failure must never break the catalogue.
 */

const STATE_KEY = 'tmr.catalogue.browseState';
const LAST_KEY = 'tmr.catalogue.lastSelected';
const RECENTS_KEY = 'tmr.catalogue.recents';
const RECENTS_MAX = 12;

export interface CatalogueBrowseState {
  q: string;
  genre: string[];
  era: string[];
  instrument: string[];
  topic: string[];
  type?: string;
  page: number;
}

export interface RecentCatalogueItem {
  slug: string;
  title: string;
  type: string;
  difficulty?: number | null;
}

export function saveBrowseState(state: CatalogueBrowseState): void {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — resume is best-effort */
  }
}

export function loadBrowseState(): CatalogueBrowseState | null {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as CatalogueBrowseState) : null;
  } catch {
    return null;
  }
}

/** Remember which card the user opened, so the list can scroll to + highlight it on return. */
export function setLastSelected(slug: string): void {
  try {
    sessionStorage.setItem(LAST_KEY, slug);
  } catch {
    /* ignore */
  }
}

/** Read and clear the last-selected slug — it should drive the scroll/highlight exactly once. */
export function takeLastSelected(): string | null {
  try {
    const slug = sessionStorage.getItem(LAST_KEY);
    sessionStorage.removeItem(LAST_KEY);
    return slug;
  } catch {
    return null;
  }
}

/** Push an opened item to the front of the recents list (deduped by slug, newest first, capped). */
export function pushRecent(item: RecentCatalogueItem): void {
  try {
    const list = getRecents().filter((r) => r.slug !== item.slug);
    list.unshift(item);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, RECENTS_MAX)));
  } catch {
    /* ignore */
  }
}

export function getRecents(): RecentCatalogueItem[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const list = raw ? (JSON.parse(raw) as RecentCatalogueItem[]) : [];
    return Array.isArray(list) ? list.filter((r) => r && typeof r.slug === 'string') : [];
  } catch {
    return [];
  }
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    /* ignore */
  }
}
