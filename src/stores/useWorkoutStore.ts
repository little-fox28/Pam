import { create } from 'zustand';

import { settingsStorage } from '@/lib/storage';

export const WORKOUT_TYPES = ['PULL', 'PUSH', 'LEGS', 'CARDIO'] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export interface ExerciseLog {
  id: string;
  name: string;
  sets: number;
  reps: number;
  repsPerSet?: number[];
}

export interface WorkoutSession {
  date: string; // 'YYYY-MM-DD'
  type: WorkoutType;
  durationSeconds?: number;
  exercises: ExerciseLog[];
}

/**
 * Widget-ready flat Key-Value JSON map (`YYYY-MM-DD` -> `WorkoutType`).
 * Kept synchronized alongside `sessions` so iOS WidgetKit / Android Glance widgets
 * can deserialize the flat map directly.
 */
export type WorkoutLogMap = Record<string, WorkoutType>;
export type WorkoutSessionMap = Record<string, WorkoutSession>;

const LEGACY_LOGS_KEY = 'workout.logs.v1';
const SESSIONS_KEY = 'workout.sessions.v2';

/**
 * Formats a Date object as a local `YYYY-MM-DD` key.
 * Uses local year/month/day getters instead of `toISOString()` to prevent
 * UTC timezone offset shifts.
 */
export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function isValidDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function isValidWorkoutType(val: unknown): val is WorkoutType {
  return typeof val === 'string' && (WORKOUT_TYPES as readonly string[]).includes(val);
}

function normalizeExercises(raw: unknown): ExerciseLog[] {
  if (!Array.isArray(raw)) return [];
  const result: ExerciseLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.id === 'string' &&
      typeof rec.name === 'string' &&
      typeof rec.sets === 'number' &&
      typeof rec.reps === 'number'
    ) {
      result.push({
        id: rec.id,
        name: rec.name,
        sets: rec.sets,
        reps: rec.reps,
        repsPerSet: Array.isArray(rec.repsPerSet)
          ? rec.repsPerSet.filter((n): n is number => typeof n === 'number')
          : undefined,
      });
    }
  }
  return result;
}

/**
 * Safely reads `sessions` from MMKV and migrates any legacy flat `Record<string, WorkoutType>`
 * entries from `'workout.logs.v1'` into structured `WorkoutSession` objects without data loss.
 */
function readAndMigrateSessions(): {
  sessions: WorkoutSessionMap;
  logs: WorkoutLogMap;
} {
  const sessions: WorkoutSessionMap = {};
  let migratedFromLegacy = false;

  try {
    const rawLegacy = settingsStorage.getString(LEGACY_LOGS_KEY);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy) as Record<string, unknown>;
      if (parsedLegacy && typeof parsedLegacy === 'object' && !Array.isArray(parsedLegacy)) {
        for (const [dateKey, value] of Object.entries(parsedLegacy)) {
          if (!isValidDateKey(dateKey)) continue;
          if (isValidWorkoutType(value)) {
            sessions[dateKey] = {
              date: dateKey,
              type: value,
              exercises: [],
            };
            migratedFromLegacy = true;
          } else if (value && typeof value === 'object') {
            const obj = value as Record<string, unknown>;
            if (isValidWorkoutType(obj.type)) {
              sessions[dateKey] = {
                date: dateKey,
                type: obj.type,
                durationSeconds:
                  typeof obj.durationSeconds === 'number' ? obj.durationSeconds : undefined,
                exercises: normalizeExercises(obj.exercises),
              };
              migratedFromLegacy = true;
            }
          }
        }
      }
    }
  } catch {
    // Ignore malformed legacy data
  }

  try {
    const rawSessions = settingsStorage.getString(SESSIONS_KEY);
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [dateKey, value] of Object.entries(parsed)) {
          if (!isValidDateKey(dateKey)) continue;
          if (isValidWorkoutType(value)) {
            sessions[dateKey] = {
              date: dateKey,
              type: value,
              exercises: [],
            };
          } else if (value && typeof value === 'object') {
            const obj = value as Record<string, unknown>;
            if (isValidWorkoutType(obj.type)) {
              sessions[dateKey] = {
                date: dateKey,
                type: obj.type,
                durationSeconds:
                  typeof obj.durationSeconds === 'number' ? obj.durationSeconds : undefined,
                exercises: normalizeExercises(obj.exercises),
              };
            }
          }
        }
      }
    } else if (migratedFromLegacy) {
      try {
        settingsStorage.set(SESSIONS_KEY, JSON.stringify(sessions));
      } catch {
        // Ignore storage errors
      }
    }
  } catch {
    // Ignore malformed session data
  }

  const logs: WorkoutLogMap = {};
  for (const [dateKey, session] of Object.entries(sessions)) {
    logs[dateKey] = session.type;
  }

  return { sessions, logs };
}

function writePersistedState(sessions: WorkoutSessionMap, logs: WorkoutLogMap): void {
  try {
    settingsStorage.set(SESSIONS_KEY, JSON.stringify(sessions));
    settingsStorage.set(LEGACY_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage write errors
  }
}

type WorkoutStoreState = {
  /** Structured workout sessions keyed by `YYYY-MM-DD`. */
  sessions: WorkoutSessionMap;
  /** Flat widget-ready map of `YYYY-MM-DD` -> `WorkoutType`. */
  logs: WorkoutLogMap;
  /**
   * Logs today's workout type.
   * Enforces the One-Time Daily Lock: only logs for `getTodayDateKey()` and
   * becomes a no-op if today's date already has a recorded workout.
   */
  logTodayWorkout: (
    type: WorkoutType,
    exercises?: ExerciseLog[],
    durationSeconds?: number
  ) => void;
  /**
   * Updates the exercise breakdown and optional duration for an existing session date.
   */
  updateSessionExercises: (
    dateKey: string,
    exercises: ExerciseLog[],
    durationSeconds?: number
  ) => void;
};

const initialState = readAndMigrateSessions();

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  sessions: initialState.sessions,
  logs: initialState.logs,

  logTodayWorkout: (type, exercises = [], durationSeconds) => {
    const todayKey = getTodayDateKey();
    const { sessions: currentSessions, logs: currentLogs } = get();

    if (currentSessions[todayKey]) {
      return;
    }

    const newSession: WorkoutSession = {
      date: todayKey,
      type,
      durationSeconds,
      exercises,
    };

    const nextSessions: WorkoutSessionMap = {
      ...currentSessions,
      [todayKey]: newSession,
    };
    const nextLogs: WorkoutLogMap = {
      ...currentLogs,
      [todayKey]: type,
    };

    writePersistedState(nextSessions, nextLogs);
    set({ sessions: nextSessions, logs: nextLogs });
  },

  updateSessionExercises: (dateKey, exercises, durationSeconds) => {
    const { sessions: currentSessions, logs: currentLogs } = get();
    const existing = currentSessions[dateKey];
    if (!existing) return;

    const updated: WorkoutSession = {
      ...existing,
      exercises,
      durationSeconds: durationSeconds ?? existing.durationSeconds,
    };

    const nextSessions: WorkoutSessionMap = {
      ...currentSessions,
      [dateKey]: updated,
    };

    writePersistedState(nextSessions, currentLogs);
    set({ sessions: nextSessions });
  },
}));
