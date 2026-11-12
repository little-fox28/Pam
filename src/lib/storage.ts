import type { SQLiteStorage } from 'expo-sqlite/kv-store';
import type { createMMKV } from 'react-native-mmkv';

export type KeyValueStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  contains: (key: string) => boolean;
  clearAll: () => void;
};

/**
 * Uses MMKV in Development/Production builds (fast Nitro JSI) and automatically
 * falls back to `expo-sqlite/kv-store` when running inside Expo Go, where custom
 * C++/Nitro native modules are not bundled.
 */
function createStorage(id: string): KeyValueStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvModule = require('react-native-mmkv') as { createMMKV: typeof createMMKV };
    const mmkv = mmkvModule.createMMKV({ id });
    return {
      getString: (key) => mmkv.getString(key),
      set: (key, value) => mmkv.set(key, value),
      contains: (key) => mmkv.contains(key),
      clearAll: () => mmkv.clearAll(),
    };
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const kvModule = require('expo-sqlite/kv-store') as {
      SQLiteStorage: typeof SQLiteStorage;
    };
    const sqlite = new kvModule.SQLiteStorage(id);
    return {
      getString: (key) => sqlite.getItemSync(key) ?? undefined,
      set: (key, value) => sqlite.setItemSync(key, String(value)),
      contains: (key) => sqlite.getItemSync(key) !== null,
      clearAll: () => {
        sqlite.clearSync();
      },
    };
  }
}

/** User preferences: theme, language, units, onboarding flags. */
export const settingsStorage = createStorage('settings');

/** Active workout session snapshot (timer anchors) so a killed app can resume. */
export const sessionStorage = createStorage('session');

export function readEnum<T extends string>(
  storage: KeyValueStorage,
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = storage.getString(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}
