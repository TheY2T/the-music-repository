import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from '../../auth/auth-schema';
import type { CollectionFacets, ContentDetails, ProseMirrorDoc } from './content-details';

/**
 * Catalogue schema. The repository core: content items + taxonomy + media assets.
 * Postgres columns are snake_case; mapped to camelCase domain entities in the infrastructure mapper.
 */
export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyMdx: text('body_mdx'),
  type: text('type').notNull(), // lesson | song | score | exercise | technique | backing_track | tool_page
  visibility: text('visibility').notNull().default('public'), // public | authed | premium
  tier: text('tier'), // when visibility=premium: which plan unlocks it — null/'premium' | 'pro'
  status: text('status').notNull().default('draft'), // draft | review | published
  difficulty: integer('difficulty'), // graded 1..10 (nullable)
  source: text('source'),
  attribution: text('attribution'),
  license: text('license'),
  /** Structured facts (key/era/form/composer/…) + curated related slugs — see content-details.ts. */
  details: jsonb('details').$type<ContentDetails>(),
  /** Canonical block-editor document (TipTap/ProseMirror JSON); bodyMdx + details.embeds are derived
   * from it on save. Editor-only — the public render path never reads this. Null for file-authored items. */
  bodyDoc: jsonb('body_doc').$type<ProseMirrorDoc>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Immutable content snapshots (ADR 0030). One row is written on each publish, capturing the full
 * editable state (canonical `body_doc` + derived `body_mdx`/`details` + title/summary) so an editor can
 * list and restore prior versions. Restore lifts a snapshot's fields back onto the content item.
 */
export const contentRevisions = pgTable('content_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyMdx: text('body_mdx'),
  bodyDoc: jsonb('body_doc').$type<ProseMirrorDoc>(),
  details: jsonb('details').$type<ContentDetails>(),
  /** The user who created the snapshot (Better Auth user id); null if unknown. */
  authorId: text('author_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Raw binary column (Postgres `bytea`), carried as a Node `Buffer`. */
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea';
  },
});

/**
 * Stored media bytes, keyed by the same `storage_key` the metadata rows reference. Holds score
 * sources, images, and other uploads; served to the browser through the media route.
 */
export const mediaObjects = pgTable('media_objects', {
  storageKey: text('storage_key').primaryKey(),
  data: bytea('data').notNull(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // alphatex | audio | image (see ADR 0027; alphatex replaced musicxml)
  storageKey: text('storage_key').notNull(), // key into media_objects holding the bytes
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull().default(0),
  license: text('license'),
  attribution: text('attribution'),
  sourceUrl: text('source_url'), // provenance of the engraving (score meta), nullable
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Taxonomy dimensions ---
export const genres = pgTable('genres', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const instruments = pgTable('instruments', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const skillTopics = pgTable('skill_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

// --- Many-to-many joins (composite PKs) ---
export const contentGenres = pgTable(
  'content_genres',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.genreId] })],
);

export const contentInstruments = pgTable(
  'content_instruments',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    instrumentId: uuid('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.instrumentId] })],
);

export const contentSkillTopics = pgTable(
  'content_skill_topics',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    skillTopicId: uuid('skill_topic_id')
      .notNull()
      .references(() => skillTopics.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.skillTopicId] })],
);

export const contentTags = pgTable(
  'content_tags',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.contentId, t.tagId] })],
);

// --- Auth (Slice 2): Better Auth tables live in `src/auth/auth-schema.ts`.
// Re-exported here so drizzle-kit (and the shared Drizzle client) see one schema surface. ---
export { account, session, user, verification } from '../../auth/auth-schema';

// --- Favorites (Slice 2c): a user ↔ content bookmark. One row per (user, content). ---
export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.contentId] })],
);

// --- Saved progressions: a user's named chord progressions from the analyzer.
// One row per (user, name); `chords` is a JSON array of { root, quality }. ---
export const savedProgressions = pgTable(
  'saved_progressions',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyRoot: integer('key_root').notNull(),
    chords: jsonb('chords').notNull().$type<{ root: number; quality: string }[]>(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.name] })],
);

// --- Instrument preferences: a signed-in user's immersive-instrument choices
//     (guitar handedness, chosen piano/guitar skin, default-fullscreen). One row per user. ---
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  prefs: jsonb('prefs').notNull().$type<{
    handedness: 'left' | 'right';
    keyboardSkin: string;
    fretboardSkin: string;
    fullscreen: boolean;
  }>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Dashboard spaces: a signed-in user's customizable practice-space layouts (ADR 0045).
//     One row per user; `spaces` is the ordered collection of arrangeable widget grids. ---
export const dashboardSpaces = pgTable('dashboard_spaces', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  spaces: jsonb('spaces').notNull().$type<
    {
      id: string;
      name: string;
      icon?: string;
      background?: { style: string; intensity: number };
      widgets: {
        id: string;
        type: string;
        x: number;
        y: number;
        w: number;
        h: number;
        config: Record<string, unknown>;
      }[];
    }[]
  >(),
  activeSpaceId: text('active_space_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Achievements: a signed-in user's gamification standing (XP + unlocked badge keys),
//     derived from learning activity and persisted per user (ADR 0045). One row per user. ---
export const achievements = pgTable('achievements', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  data: jsonb('data').notNull().$type<{ xp: number; badges: string[] }>(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Collections: rich, chaptered groupings — courses / learning
//     paths / syllabi / song lists. Editorial (curated) or user-created. ---
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  bodyMdx: text('body_mdx'), // rich description (rendered on the detail page)
  kind: text('kind').notNull().default('course'), // course | path | syllabus | songlist
  visibility: text('visibility').notNull().default('public'), // public | authed | private
  status: text('status').notNull().default('draft'), // draft | published
  curationType: text('curation_type').notNull().default('editorial'), // editorial | user
  ownerId: text('owner_id').references(() => user.id, { onDelete: 'cascade' }), // null for editorial
  heroImageKey: text('hero_image_key'), // optional cover/hero asset key
  accent: text('accent'), // optional theme/accent hint
  featured: boolean('featured').notNull().default(false),
  difficultyMin: integer('difficulty_min'), // graded 1..10 (nullable)
  difficultyMax: integer('difficulty_max'),
  estMinutes: integer('est_minutes'), // estimated total duration
  curatorName: text('curator_name'),
  curatorBio: text('curator_bio'),
  outcomes: jsonb('outcomes').$type<string[]>(), // "what you'll learn" bullets
  /** Discovery facets (era/genre/technique/mood) used by collections search. */
  facets: jsonb('facets').$type<CollectionFacets>(),
  tags: jsonb('tags').$type<string[]>(), // denormalized tag slugs for search/facets
  popularity: integer('popularity').notNull().default(0), // open/play counter
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// A chapter within a collection: an ordered group of items. Items with a null section render ungrouped.
export const collectionSections = pgTable('collection_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  position: integer('position').notNull(), // 0-based order within the collection
});

// One membership: a catalogue item at a position, optionally in a section, with curator annotations.
// Own `id` PK (not composite) so a single membership is addressable; UNIQUE(collection, content)
// preserves the no-duplicate-item invariant.
export const collectionItems = pgTable(
  'collection_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id').references(() => collectionSections.id, { onDelete: 'set null' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(), // 0-based order (flattened across sections)
    curatorNote: text('curator_note'), // per-item context ("why this piece / what to focus on")
    focusSkills: jsonb('focus_skills').$type<string[]>(),
  },
  (t) => [unique('collection_items_collection_content_uq').on(t.collectionId, t.contentId)],
);

// --- Collection engagement: a user ↔ collection bookmark (mirror of `favorites`). ---
export const collectionBookmarks = pgTable(
  'collection_bookmarks',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.collectionId] })],
);

// A user's 1..5 rating of a collection. One row per (user, collection); aggregate avg/count via SQL.
export const collectionRatings = pgTable(
  'collection_ratings',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1..5
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.collectionId] })],
);

// --- Progress: per-user completion + practice sessions (streaks / practice time). ---
export const contentProgress = pgTable(
  'content_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.contentId] })],
);

export const practiceSessions = pgTable('practice_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  contentId: uuid('content_id').references(() => contentItems.id, { onDelete: 'set null' }),
  minutes: integer('minutes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Trainers: SM-2 spaced-repetition state per user + deck + card. ---
export const reviewCards = pgTable(
  'review_cards',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    deck: text('deck').notNull(),
    card: text('card').notNull(),
    easeFactor: doublePrecision('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull().defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.deck, t.card] })],
);

/** One row per graded card — the review activity log (streaks + daily counts). */
export const reviewLog = pgTable('review_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Drill engine: one row per objectively-graded drill attempt. Powers per-skill mastery
//     stats; SM-2 scheduling itself lives in `review_cards` (attempts delegate to the reviews context). ---
export const drillAttempts = pgTable(
  'drill_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    deck: text('deck').notNull(),
    card: text('card').notNull(),
    modality: text('modality').notNull(),
    accuracy: doublePrecision('accuracy').notNull(),
    correct: boolean('correct').notNull(),
    responseMs: integer('response_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('drill_attempts_user_deck_idx').on(t.userId, t.deck)],
);

// --- Entitlements: premium access grants per user (e.g. `premium`). A grant is a local
//     stand-in for a payment-provider subscription; `expires_at` null = no expiry. ---
export const entitlements = pgTable(
  'entitlements',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    key: text('key').notNull(), // e.g. 'premium'
    source: text('source').notNull().default('subscription'), // subscription | staff | manual
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

// --- Billing: checkout sessions + webhook idempotency. A checkout session maps a provider
// session back to the user (the mock resolves the user from here; real Stripe also uses
// client_reference_id); it holds the Stripe customer/subscription ids for lifecycle events. ---
export const checkoutSessions = pgTable('checkout_sessions', {
  id: text('id').primaryKey(), // provider session id (mock uuid or Stripe cs_...)
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull().default('mock'), // mock | stripe
  status: text('status').notNull().default('pending'), // pending | completed | canceled
  entitlementKey: text('entitlement_key').notNull().default('premium'), // which tier this checkout grants
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// One row per processed webhook event id → idempotent handling (a provider may retry deliveries).
export const processedWebhooks = pgTable('processed_webhooks', {
  eventId: text('event_id').primaryKey(),
  processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Support: Ko-fi contributions recorded from the inbound Ko-fi webhook. One row per Ko-fi
//     `message_id` (idempotency — Ko-fi retries a delivery with the same id until it gets a 200).
//     Audit/analytics only; grants no entitlements. `raw` keeps the full verified payload. ---
export const kofiDonations = pgTable('kofi_donations', {
  messageId: text('message_id').primaryKey(),
  kofiTransactionId: text('kofi_transaction_id'),
  type: text('type').notNull(), // Donation | Subscription | Commission | Shop Order
  fromName: text('from_name'),
  email: text('email'),
  amount: text('amount'), // provider sends a decimal string, e.g. "3.00"
  currency: text('currency'),
  message: text('message'),
  isPublic: boolean('is_public').notNull().default(true),
  isSubscriptionPayment: boolean('is_subscription_payment').notNull().default(false),
  tierName: text('tier_name'),
  kofiTimestamp: timestamp('kofi_timestamp', { withTimezone: true }),
  raw: jsonb('raw').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

// Entitlement audit log: every grant/revoke — for support + analytics. Append-only.
export const entitlementEvents = pgTable('entitlement_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  key: text('key').notNull(), // e.g. 'premium'
  action: text('action').notNull(), // grant | revoke
  source: text('source').notNull(), // subscription | classroom | redeem | staff | manual
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Gift / redeem codes: a one-time (or multi-use) code that grants an entitlement, no
// card. Mirrors the classroom join-code pattern.
export const redeemCodes = pgTable('redeem_codes', {
  code: text('code').primaryKey(),
  key: text('key').notNull().default('premium'),
  source: text('source').notNull().default('redeem'),
  durationDays: integer('duration_days'), // null = no expiry
  usesRemaining: integer('uses_remaining').notNull().default(1),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Classrooms (teacher mode): a teacher owns a classroom with a join code; learners join.
//     `premium_granted` records that the teacher granted premium to the class (seat entitlement). ---
export const classrooms = pgTable('classrooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  joinCode: text('join_code').notNull().unique(),
  premiumGranted: boolean('premium_granted').notNull().default(false),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const classroomMembers = pgTable(
  'classroom_members',
  {
    classroomId: uuid('classroom_id')
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.classroomId, t.userId] })],
);

// --- Classroom assignments: content a teacher assigns to a class. One row per
// (classroom, content); progress is read from `content_progress` for the class members. ---
export const classroomAssignments = pgTable(
  'classroom_assignments',
  {
    classroomId: uuid('classroom_id')
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.classroomId, t.contentId] })],
);

// --- Classroom invitations: an emailed invite (token) to join a class. ---
export const classroomInvitations = pgTable('classroom_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  classroomId: uuid('classroom_id')
    .notNull()
    .references(() => classrooms.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Info View: context-sensitive help topics keyed by slug (e.g. a term or skill_topic). ---
export const helpTopics = pgTable('help_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  term: text('term').notNull(),
  body: text('body').notNull(), // short markdown definition
  linkSlug: text('link_slug'), // optional catalogue content slug for "learn more"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- FAQ: reader-facing frequently-asked questions, grouped by category and manually ordered. ---
export const faqEntries = pgTable('faq_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  question: text('question').notNull(),
  answer: text('answer').notNull(), // markdown
  category: text('category').notNull(),
  sortOrder: integer('sort_order').notNull().default(0), // order within a category (ascending)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Localization (ADR 0034): UI message strings live in the DB and are edited via the admin CMS.
//     Seeded from the in-repo en/zh-Hans JSON on a fresh deploy; thereafter runtime-driven.
//     Draft → publish: only `published_value` (where not deleted) is assembled into the served catalogue. ---
export const uiMessages = pgTable(
  'ui_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: text('locale').notNull(), // 'en' | 'zh-Hans' (LOCALES from @TheY2T/tmr-i18n)
    key: text('key').notNull(), // dotted message key, e.g. 'nav.catalogue'
    draftValue: text('draft_value'), // latest edited value (pending until published)
    publishedValue: text('published_value'), // live value served to the site; null until first publish
    status: text('status').notNull().default('draft'), // draft | published (draft ⇒ unpublished edit pending)
    /** true = pristine seeded baseline row; false = added or edited at runtime by an admin. */
    seeded: boolean('seeded').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete (restorable); null = live
    updatedBy: text('updated_by'), // Better Auth user id of the last editor; null if unknown/seed
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('ui_messages_locale_key_uq').on(t.locale, t.key),
    index('ui_messages_locale_idx').on(t.locale),
  ],
);

/** Append-only history of every message change — for diff + restore (mirrors `content_revisions`). */
export const uiMessageRevisions = pgTable('ui_message_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id')
    .notNull()
    .references(() => uiMessages.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  key: text('key').notNull(),
  value: text('value'), // the value at the time of the action (null for a delete)
  action: text('action').notNull(), // create | update | delete | restore | publish
  editedBy: text('edited_by'), // Better Auth user id; null if unknown
  editedAt: timestamp('edited_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One row per locale: the published-catalogue version tag (epoch-ms of last publish) used as the ETag
 *  and the web-side cache-bust signal. Bumped whenever a locale's published strings change. */
export const i18nVersions = pgTable('i18n_versions', {
  locale: text('locale').primaryKey(),
  version: text('version').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
});

/** The set of locales the CMS can author strings for (ADR 0034). A superset of the code-level routing
 *  locales (`LOCALES` in @TheY2T/tmr-i18n): admins can create new locales here and import/manage their
 *  strings before a deploy wires them into URL routing + the language switcher. Seeded with en/zh-Hans. */
export const locales = pgTable('locales', {
  code: text('code').primaryKey(), // BCP-47-ish id, e.g. 'en', 'zh-Hans', 'fr'
  label: text('label').notNull(), // display name, e.g. 'English', '中文'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Content translations (ADR 0034): per-locale translations of catalogue/collection/help
//     *content* fields (title, summary, body…). Unlike ui_messages there is no seed baseline — content
//     translations are authored in the CMS. Only published, non-deleted rows overlay the base row at read
//     time (missing → base/English). Polymorphic by (entityType, entityId) — no hard FK. ---
export const entityTranslations = pgTable(
  'entity_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: text('entity_type').notNull(), // content | collection | help
    entityId: uuid('entity_id').notNull(),
    locale: text('locale').notNull(),
    field: text('field').notNull(), // title | summary | bodyMdx | …
    draftValue: text('draft_value'),
    publishedValue: text('published_value'),
    status: text('status').notNull().default('draft'), // draft | published
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete (restorable)
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('entity_translations_target_uq').on(t.entityType, t.entityId, t.locale, t.field),
    index('entity_translations_lookup_idx').on(t.entityType, t.entityId, t.locale),
  ],
);

/** Append-only history of every content-translation change — for diff + restore. */
export const entityTranslationRevisions = pgTable('entity_translation_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  translationId: uuid('translation_id')
    .notNull()
    .references(() => entityTranslations.id, { onDelete: 'cascade' }),
  value: text('value'),
  action: text('action').notNull(), // create | update | delete | restore
  editedBy: text('edited_by'),
  editedAt: timestamp('edited_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Feature flags (ADR 0035): flag configuration lives in the DB and is toggled per environment via the
//     admin CMS. Evaluated by an OpenFeature provider (@TheY2T/tmr-flags-eval) that reads a per-environment
//     snapshot. The typed @TheY2T/tmr-flags registry seeds these tables + types the code-referenced keys. ---

/** The deployable environments a flag can be targeted at (dev/uat/prod + any admin-created ones). A running
 *  app resolves its own environment by matching `APP_ENV` to a `key` (falling back to the `is_default` row). */
export const featureFlagEnvironments = pgTable('feature_flag_environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(), // matches APP_ENV, e.g. 'dev' | 'uat' | 'prod'
  label: text('label').notNull(), // display name, e.g. 'Development'
  rank: integer('rank').notNull().default(0), // ordering in the admin UI
  isDefault: boolean('is_default').notNull().default(false), // fallback when APP_ENV matches no key
  archivedAt: timestamp('archived_at', { withTimezone: true }), // hidden from targeting but retained
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete (restorable)
  updatedBy: text('updated_by'), // Better Auth user id of last editor
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One row per flag key (the runtime registry). `source: 'code'` rows mirror the typed @TheY2T/tmr-flags
 *  registry (seeded, code references them); `source: 'runtime'` rows are admin-created in the CMS. */
export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(), // '<domain>.<capability>', e.g. 'tools.metronome'
    description: text('description').notNull().default(''),
    domain: text('domain').notNull().default(''), // prefix before the first dot, for UI grouping
    flagType: text('flag_type').notNull().default('boolean'), // boolean (variant-ready for later)
    defaultValue: jsonb('default_value').notNull(), // code-registry fallback (FlagDefaults[key])
    source: text('source').notNull().default('runtime'), // code | runtime
    seeded: boolean('seeded').notNull().default(false), // true = pristine seeded baseline row
    deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete (restorable)
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('feature_flags_key_uq').on(t.key), index('feature_flags_domain_idx').on(t.domain)],
);

/** The (flag × environment) configuration matrix — the actual per-environment on/off + targeting.
 *  `enabled` is the admin master switch (off ⇒ the feature is off for that environment). */
export const featureFlagSettings = pgTable(
  'feature_flag_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flagId: uuid('flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    environmentId: uuid('environment_id')
      .notNull()
      .references(() => featureFlagEnvironments.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull().default(false), // master switch for this environment
    defaultVariant: text('default_variant').notNull().default('off'), // variant when no targeting matches
    variants: jsonb('variants').notNull(), // { on: true, off: false }
    targeting: jsonb('targeting'), // flagd-style JSONLogic rule; null = none
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('feature_flag_settings_flag_env_uq').on(t.flagId, t.environmentId),
    index('feature_flag_settings_env_idx').on(t.environmentId),
  ],
);

/** Append-only audit of every flag/setting/environment change — for diff + one-click restore. Flags apply
 *  immediately, so this table is the change history rather than a draft/publish gate. */
export const featureFlagRevisions = pgTable('feature_flag_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagId: uuid('flag_id'), // null for environment-level actions
  environmentId: uuid('environment_id'), // null for flag-registry actions
  // create | update | delete | restore | toggle | targeting | env-create | env-update | env-delete
  action: text('action').notNull(),
  before: jsonb('before'), // state before the change (null for a create)
  after: jsonb('after'), // state after the change (null for a delete)
  actorId: text('actor_id'), // Better Auth user id; null if unknown/seed
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** One row per environment: the snapshot version tag (epoch-ms of last change) used as the ETag and the
 *  web-side cache-bust signal. Bumped whenever any flag/setting affecting that environment changes. */
export const featureFlagVersions = pgTable('feature_flag_versions', {
  environmentId: uuid('environment_id')
    .primaryKey()
    .references(() => featureFlagEnvironments.id, { onDelete: 'cascade' }),
  version: text('version').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Feedback (ADR 0041): user-submitted suggestions, bug reports, and praise. Logged-in only, private
//     to admins for triage. `type` discriminates the submission; `status` tracks the triage lifecycle;
//     `is_public` surfaces an item on the /roadmap board; `upvote_count` is denormalised for board sort;
//     `page_url`/`user_agent` are captured only for bug reports. ---
export const feedbackSubmissions = pgTable(
  'feedback_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(), // idea | bug | praise | other
    title: text('title'),
    message: text('message').notNull(),
    // new | triaging | planned | in_progress | shipped | declined | closed
    status: text('status').notNull().default('new'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    locale: text('locale'),
    pageUrl: text('page_url'),
    userAgent: text('user_agent'),
    isPublic: boolean('is_public').notNull().default(false),
    upvoteCount: integer('upvote_count').notNull().default(0),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('feedback_submissions_status_idx').on(t.status),
    index('feedback_submissions_type_idx').on(t.type),
    index('feedback_submissions_public_idx').on(t.isPublic),
  ],
);

// --- Feedback board votes: one upvote per (submission, user). The composite primary key makes voting
//     idempotent; `feedback_submissions.upvote_count` is kept in step by the vote use-case. ---
export const feedbackVotes = pgTable(
  'feedback_votes',
  {
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => feedbackSubmissions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.submissionId, t.userId] })],
);

// --- Net Promoter Score responses (ADR 0041): one row per submitted score (0..10). The promoter/
//     passive/detractor bucket is derived from `score` on read, never stored. `source` records where the
//     prompt was shown for close-the-loop context. ---
export const npsResponses = pgTable(
  'nps_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(),
    comment: text('comment'),
    source: text('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('nps_responses_created_idx').on(t.createdAt)],
);

// --- NPS prompt throttle state (ADR 0041): one row per user recording when they were last shown,
//     dismissed, or responded to the NPS prompt. Drives eligibility (activated learners, ~quarterly)
//     without scanning the responses table. ---
export const npsPromptState = pgTable('nps_prompt_state', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  lastShownAt: timestamp('last_shown_at', { withTimezone: true }),
  lastDismissedAt: timestamp('last_dismissed_at', { withTimezone: true }),
  lastRespondedAt: timestamp('last_responded_at', { withTimezone: true }),
});
