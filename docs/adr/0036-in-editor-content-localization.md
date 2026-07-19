# ADR 0036 — In-editor content localization (locale-rebinding forms)

- **Status:** accepted
- **Date:** 2026-07
- **Builds on:** ADR 0034 (content translations / `entity_translations`, Phase 2). The storage model,
  read-time overlay via `?locale=`, and draft→publish→revisions lifecycle are **unchanged**. This ADR
  replaces the *authoring UI* half.

## Context

Under ADR 0034 Phase 2, an admin translated an entity through a **separate** `ContentLocalizationEditor`
panel embedded as a collapsible "Localization" accordion at the bottom of `ContentForm` /
`CollectionForm` / `HelpTopicForm`. That panel had its own per-locale tab strip and its own "Save &
publish" button, disjoint from the form above it. Consequences:

- Two mental models per entity — author English up top, then scroll to a different surface with different
  controls to translate.
- **Metadata was not translatable** — only title/summary/body. The content `details` facts (era, form,
  key…) weren't even editable in the base form, and collection sections/outcomes/item notes had no UI.
- **No create-time translation** — the panel only appeared in edit mode.

We want translating to feel like editing: switch a language control and keep working in the same form.

## Decision

1. **A locale switcher in the editor header rebinds the whole form.** `LocaleBar` (a `SegmentedToggle`
   over the base locale + started target locales, with a per-locale status dot and an "Add language"
   affordance) sits above the document head. Selecting a locale re-points the *same* properties fields and
   the *same* rich-text body at that locale.
2. **Base vs target binding.** The base locale (`en`) edits the entity's own state (as before). A target
   locale edits that locale's translation buffer, with the English original shown as a muted reference
   under each field, and **structural fields** (slug, type, visibility, taxonomy, collection kind/curator,
   help linkSlug…) locked with a "shared across languages" hint.
3. **Scope extends to metadata.** Content `details` facts (`key`/`era`/`form`/`timeSignature`/`composer`/
   `composerDates`/`composedYear`) are now editable base inputs and translatable. Collections translate
   `curatorBio`, **section** titles/descriptions, **outcomes** (per line), and **per-item curator notes**.
   New overlay keys — `outcome.<i>` and `item.<slug>.curatorNote` — extend `applyCollectionOverlay`.
4. **Per-locale draft→publish, independent of the base entity.** The action bar is locale-aware: in a
   target locale it offers "Save translation" (upsert drafts) and "Publish translation" (publish that
   locale only). `POST /admin/translations/publish` gains an optional `locale` scope.
5. **Create-time translation is buffered then flushed.** A second locale can be authored while first
   creating an item; the buffer is persisted right after the base entity is created (its `id` comes from
   the create response). Section/item translations remain edit-only (their ids exist only post-save).
6. **Shared, form-agnostic pieces.** `packages/common-ui/src/localization/`: `useLocaleContent` (buffer +
   persistence hook), `LocaleBar` (switcher), `LocalizableField` (per-field binder with reference + lock +
   block-editor remount). The field registry and dotted/keyed base-value resolution live in
   `@TheY2T/tmr-web-data/content-translations-api` (`LOCALIZABLE_FIELDS`, `dynamicLocalizableFields`,
   `getTranslationTarget`). The standalone `ContentLocalizationEditor` panel is removed.

## Consequences

- **One authoring surface.** Translating is switching a control, not visiting a different panel; the
  properties strip and body editor are the same in every locale.
- **The base body editor stays mounted (hidden) under a target locale** so its full ProseMirror doc +
  embeds survive locale switches; the target-locale body is a separate editor keyed by locale. Embeds are
  **not** per-locale — only the translated `bodyMdx` string is stored; base embeds show as read-only
  context.
- **Facets stay base-locale.** Translating `details.era` is display-only; catalogue faceting reads the
  base index and translation-publish still does not reindex Meilisearch (unchanged).
- **Collection structure is base-only.** A target locale translates the *text* of existing sections /
  outcomes / items; composition (which items, section order) is edited only in the base locale.
- Adding a URL-routable language still needs a code deploy (the `Locale` union + switcher); the DB locale
  registry remains a superset an admin can translate into.
