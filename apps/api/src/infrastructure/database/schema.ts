import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Phase 0 stub of the core repository table. Expanded in Phase 1 with taxonomy joins,
 * media assets, and licensing. Present now so there is a real Drizzle migration.
 */
export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary'),
  type: text('type').notNull(),
  visibility: text('visibility').notNull().default('public'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
