import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Placeholder table so the first migration exists and the boot pipeline can be
 * verified end to end. Replace/extend with the domain schema (UUIDv7 ids, updated_at,
 * deleted_at, server_seq...) when feature work starts.
 */
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

