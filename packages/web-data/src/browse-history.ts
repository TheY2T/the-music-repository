/**
 * Reusable client-side "browse memory" for list/index pages (catalogue, collections, tools, admin).
 *
 * Those lists are anonymous client islands, so a full back-navigation from an item remounts them with
 * fresh state — losing the filters, page, scroll position, and which item was open. {@link createBrowseHistory}
 * persists that context per namespace so the list can resume, and {@link useBrowseHistory} wires the
 * common behaviour (restore-on-mount, scroll-to + highlight the opened item, recents list) into a
 * component with minimal boilerplate.
 *
 *   - **Browse state + last-selected slug** live in `sessionStorage` (per-tab, cleared when the tab
 *     closes) — the lifetime of a "navigate back and forth" session.
 *   - **Recently viewed** lives in `localStorage` (persists across sessions), backing a recents strip.
 *
 * All storage access is guarded: storage can throw (private mode, disabled, SSR) and browse memory is
 * a non-critical enhancement — a failure must never break the page.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface RecentItem {
  slug: string;
  title: string;
  /** Optional descriptor (content type, kind…) shown by some recents strips. */
  type?: string;
  difficulty?: number | null;
}

const RECENTS_MAX = 12;

/** A namespaced store of browse memory. `namespace` becomes the `tmr.<namespace>.*` storage keys. */
export function createBrowseHistory<S>(namespace: string) {
  const stateKey = `tmr.${namespace}.browseState`;
  const lastKey = `tmr.${namespace}.lastSelected`;
  const recentsKey = `tmr.${namespace}.recents`;

  return {
    saveState(state: S): void {
      try {
        sessionStorage.setItem(stateKey, JSON.stringify(state));
      } catch {
        /* storage unavailable — resume is best-effort */
      }
    },
    loadState(): S | null {
      try {
        const raw = sessionStorage.getItem(stateKey);
        return raw ? (JSON.parse(raw) as S) : null;
      } catch {
        return null;
      }
    },
    /** Remember which item was opened, so the list can scroll to + highlight it on return. */
    setLastSelected(slug: string): void {
      try {
        sessionStorage.setItem(lastKey, slug);
      } catch {
        /* ignore */
      }
    },
    /** Read and clear the last-selected slug — it should drive the scroll/highlight exactly once. */
    takeLastSelected(): string | null {
      try {
        const slug = sessionStorage.getItem(lastKey);
        sessionStorage.removeItem(lastKey);
        return slug;
      } catch {
        return null;
      }
    },
    /** Push an opened item to the front (deduped by slug, newest first, capped). */
    pushRecent(item: RecentItem): void {
      try {
        const list = this.getRecents().filter((r) => r.slug !== item.slug);
        list.unshift(item);
        localStorage.setItem(recentsKey, JSON.stringify(list.slice(0, RECENTS_MAX)));
      } catch {
        /* ignore */
      }
    },
    getRecents(): RecentItem[] {
      try {
        const raw = localStorage.getItem(recentsKey);
        const list = raw ? (JSON.parse(raw) as RecentItem[]) : [];
        return Array.isArray(list) ? list.filter((r) => r && typeof r.slug === 'string') : [];
      } catch {
        return [];
      }
    },
    clearRecents(): void {
      try {
        localStorage.removeItem(recentsKey);
      } catch {
        /* ignore */
      }
    },
  };
}

export interface UseBrowseHistoryOptions<S> {
  /** Storage namespace, e.g. `catalogue` → `tmr.catalogue.*` keys, and the DOM id prefix. */
  namespace: string;
  /** Slugs currently rendered — gates the scroll until the restored page/filter shows the item. */
  itemSlugs: string[];
  /** False while the list is still loading (async fetch) — defer the scroll until items arrive. */
  ready?: boolean;
  /** Snapshot the filter/search state to persist when an item is opened (omit if there is none). */
  getState?: () => S;
  /** Apply a restored state on mount (omit if there is none). */
  applyState?: (state: S) => void;
  /** Highlight duration in ms. */
  highlightMs?: number;
}

export interface BrowseHistory {
  /** The recents list (newest first) — render a strip from it. */
  recents: RecentItem[];
  /** The slug to highlight right now (the just-returned-to item), or null. */
  highlightSlug: string | null;
  /** DOM id for an item's element — set `id={domId(slug)}` so the scroll can find it. */
  domId: (slug: string) => string;
  /** Call when the user opens an item (navigation click) to persist context + track the recent. */
  recordSelect: (item: RecentItem) => void;
  /** Empty the recents list. */
  clearRecents: () => void;
}

/** Wire browse memory into a list component: restore on mount, scroll-to + highlight, recents. */
export function useBrowseHistory<S = unknown>({
  namespace,
  itemSlugs,
  ready = true,
  getState,
  applyState,
  highlightMs = 2600,
}: UseBrowseHistoryOptions<S>): BrowseHistory {
  const store = useMemo(() => createBrowseHistory<S>(namespace), [namespace]);
  const [pendingScrollSlug, setPendingScrollSlug] = useState<string | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentItem[]>([]);

  // Keep the latest callbacks in refs so the mount effect + recordSelect always see fresh values.
  const getStateRef = useRef(getState);
  getStateRef.current = getState;
  const applyStateRef = useRef(applyState);
  applyStateRef.current = applyState;

  const domId = useCallback((slug: string) => `${namespace}-item-${slug}`, [namespace]);

  // Restore the last browse session and queue a scroll to the opened item. Runs once, post-hydration
  // (storage is client-only), so first paint still matches the server.
  useEffect(() => {
    const saved = store.loadState();
    if (saved && applyStateRef.current) applyStateRef.current(saved);
    const slug = store.takeLastSelected();
    if (slug) setPendingScrollSlug(slug);
    setRecents(store.getRecents());
  }, [store]);

  // Once the restored page has rendered the item, scroll it into view and highlight it. If it isn't
  // present (filtered out since), give up quietly rather than scroll to nothing.
  useEffect(() => {
    if (!pendingScrollSlug || !ready || itemSlugs.length === 0) return;
    if (!itemSlugs.includes(pendingScrollSlug)) {
      setPendingScrollSlug(null);
      return;
    }
    const el = document.getElementById(domId(pendingScrollSlug));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightSlug(pendingScrollSlug);
    setPendingScrollSlug(null);
  }, [pendingScrollSlug, ready, itemSlugs, domId]);

  // The highlight is a brief cue — fade it out after a moment.
  useEffect(() => {
    if (!highlightSlug) return;
    const timer = setTimeout(() => setHighlightSlug(null), highlightMs);
    return () => clearTimeout(timer);
  }, [highlightSlug, highlightMs]);

  const recordSelect = useCallback(
    (item: RecentItem) => {
      if (getStateRef.current) store.saveState(getStateRef.current());
      store.setLastSelected(item.slug);
      store.pushRecent(item);
    },
    [store],
  );

  const clearRecents = useCallback(() => {
    store.clearRecents();
    setRecents([]);
  }, [store]);

  return { recents, highlightSlug, domId, recordSelect, clearRecents };
}
