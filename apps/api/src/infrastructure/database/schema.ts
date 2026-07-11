import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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
