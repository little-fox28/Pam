import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// `enableChangeListener` is required for Drizzle's `useLiveQuery`.
export const sqlite = openDatabaseSync('fitness.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

