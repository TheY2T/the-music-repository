import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from '../../auth/auth-schema';

/**
 * Catalogue schema (Phase 1). The repository core: content items + taxonomy + media assets.
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  contentId: uuid('content_id')
    .notNull()
    .references(() => contentItems.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // score_pdf | audio | image | midi | musicxml
  storageKey: text('storage_key').notNull(), // object key in the S3/MinIO bucket
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  bytes: integer('bytes').notNull().default(0),
  license: text('license'),
  attribution: text('attribution'),
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

// --- Saved progressions (Phase 5 backlog): a user's named chord progressions from the analyzer.
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

// --- Collections (Phase 2): ordered groupings — courses / learning paths / syllabi / song lists. ---
export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  kind: text('kind').notNull().default('course'), // course | path | syllabus | songlist
  visibility: text('visibility').notNull().default('public'),
  status: text('status').notNull().default('draft'), // draft | published
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const collectionItems = pgTable(
  'collection_items',
  {
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(), // 0-based order within the collection
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.contentId] })],
);

// --- Progress (Phase 2): per-user completion + practice sessions (streaks / practice time). ---
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

// --- Trainers (Phase 4): SM-2 spaced-repetition state per user + deck + card. ---
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

// --- Entitlements (Phase 6): premium access grants per user (e.g. `premium`). A grant is a local
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

// --- Billing (Phase 6): checkout sessions + webhook idempotency. A checkout session maps a provider
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

// Entitlement audit log (Phase 6, 6B): every grant/revoke — for support + analytics. Append-only.
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

// Gift / redeem codes (Phase 6, 6B): a one-time (or multi-use) code that grants an entitlement, no
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

// --- Classrooms (Phase 6, teacher mode): a teacher owns a classroom with a join code; learners join.
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

// --- Classroom assignments (Phase 6, 6C): content a teacher assigns to a class. One row per
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

// --- Classroom invitations (Phase 6, 6C): an emailed invite (token) to join a class. ---
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

// --- Info View (Phase 2): context-sensitive help topics keyed by slug (e.g. a term or skill_topic). ---
export const helpTopics = pgTable('help_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  term: text('term').notNull(),
  body: text('body').notNull(), // short markdown definition
  linkSlug: text('link_slug'), // optional catalogue content slug for "learn more"
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
