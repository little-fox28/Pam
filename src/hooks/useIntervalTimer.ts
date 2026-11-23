import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export type TimerState = 'idle' | 'working' | 'resting' | 'completed';

export type UseIntervalTimerInput = {
  /** Duration of each work phase in seconds (must be >= 1). */
  workDuration: number;
  /** Duration of each rest phase in seconds (>= 0). */
  restDuration: number;
  /** Total number of [WORK -> REST] repetitions (must be >= 1). */
  totalReps: number;
};

export type UseIntervalTimerOutput = {
  /** Current state machine phase: 'idle' | 'working' | 'resting' | 'completed'. */
  currentState: TimerState;
  /** Whole seconds remaining in the active phase. */
  remainingTime: number;
  /** 1-based index of the current repetition. */
  currentRep: number;
  /** True when an active 'working' or 'resting' phase has been paused. */
  isPaused: boolean;
  /** Starts the timer from 'idle'/'completed', or resumes if currently paused. */
  start: () => void;
  /** Freezes the current phase and snapshots the remaining milliseconds. */
  pause: () => void;
  /** Aborts the session and resets back to 'idle'. */
  stop: () => void;
};

/**
 * Tick frequency in milliseconds while the app is in the foreground.
 * Using 200ms (instead of 1000ms) ensures UI updates within 200ms of an exact
 * wall-clock second boundary without accumulating drift.
 */
const TICK_INTERVAL_MS = 200;

/**
 * Custom hook that manages the `[WORK -> REST] x REPS` interval timer state machine
 * with wall-clock (`Date.now()`) accuracy that survives OS backgrounding.
 *
 * ### Why `Date.now()` instead of `setInterval` decrementing?
 * React Native suspends JS timers (`setInterval` / `setTimeout`) when the OS moves
 * the app to the background (`background` or `inactive` AppState) or locks the screen.
 * A naive `setRemainingTime((t) => t - 1)` counter freezes in the background and
 * loses track of real elapsed time.
 *
 * Instead, whenever a phase starts (or resumes from pause), we compute an absolute
 * wall-clock deadline:
 * ```ts
 * targetEndTime = Date.now() + duration * 1000;
 * ```
 * On every foreground tick AND immediately when `AppState` returns to `'active'`,
 * we recompute the remaining time strictly from the system clock:
 * ```ts
 * remainingMs = targetEndTime - Date.now();
 * ```
 */
export function useIntervalTimer({
  workDuration,
  restDuration,
  totalReps,
}: UseIntervalTimerInput): UseIntervalTimerOutput {
  const safeWork = Math.max(1, Math.floor(workDuration));
  const safeRest = Math.max(0, Math.floor(restDuration));
  const safeReps = Math.max(1, Math.floor(totalReps));

  const [currentState, setCurrentState] = useState<TimerState>('idle');
  const [remainingTime, setRemainingTime] = useState<number>(safeWork);
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Mutable refs mirror the state machine so the tick loop and AppState listener
  // always read the latest values synchronously without stale closure bugs.
  const stateRef = useRef<TimerState>('idle');
  const repRef = useRef<number>(1);
  const isPausedRef = useRef<boolean>(false);

  /**
   * Absolute UNIX timestamp (ms) when the current active phase is scheduled to end.
   * Formula on phase start: `Date.now() + (duration * 1000)`.
   */
  const targetEndTimeRef = useRef<number | null>(null);

  /**
   * Remaining milliseconds captured at the moment `pause()` was called.
   * Used to reconstruct `targetEndTime = Date.now() + pausedRemainingMs` on resume.
   */
  const pausedRemainingMsRef = useRef<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep latest config values accessible inside long-lived callbacks.
  const configRef = useRef({
    workDuration: safeWork,
    restDuration: safeRest,
    totalReps: safeReps,
  });

  useEffect(() => {
    configRef.current = {
      workDuration: safeWork,
      restDuration: safeRest,
      totalReps: safeReps,
    };
  }, [safeWork, safeRest, safeReps]);

  // Sync displayed remainingTime if config changes while idle.
  useEffect(() => {
    if (stateRef.current === 'idle') {
      setRemainingTime(safeWork);
    }
  }, [safeWork]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Core wall-clock synchronization routine.
   *
   * Executed on every foreground tick and immediately when `AppState` transitions
   * back to `'active'`. It calculates `targetEndTime - Date.now()` and advances
   * through one or more phases in `[WORK -> REST] x REPS` if the deadline has passed
   * (including when multiple phases elapsed while the app was backgrounded).
   */
  const reconcileWithClock = useCallback(() => {
    if (
      isPausedRef.current ||
      (stateRef.current !== 'working' && stateRef.current !== 'resting') ||
      targetEndTimeRef.current === null
    ) {
      return;
    }

    const now = Date.now();
    const { workDuration: workSec, restDuration: restSec, totalReps: reps } = configRef.current;

    // Loop in case the user kept the app in the background across one or more
    // phase boundaries (e.g. WORK finished AND REST finished while backgrounded).
    while (
      targetEndTimeRef.current !== null &&
      now >= targetEndTimeRef.current &&
      (stateRef.current === 'working' || stateRef.current === 'resting')
    ) {
      const previousPhaseEndTime: number = targetEndTimeRef.current;

      if (stateRef.current === 'working') {
        if (restSec > 0) {
          // Transition: WORK -> REST (same rep)
          stateRef.current = 'resting';
          // Anchor next phase to the exact wall-clock end of the previous phase
          // so background transitions do not accumulate drift; if starting fresh,
          // this is equivalent to Date.now() + (restSec * 1000).
          targetEndTimeRef.current = previousPhaseEndTime + restSec * 1000;
        } else if (repRef.current < reps) {
          // If restDuration is 0, jump directly to the next rep's WORK phase.
          repRef.current += 1;
          stateRef.current = 'working';
          targetEndTimeRef.current = previousPhaseEndTime + workSec * 1000;
        } else {
          // Final rep completed (when restDuration === 0).
          stateRef.current = 'completed';
          targetEndTimeRef.current = null;
        }
      } else if (stateRef.current === 'resting') {
        if (repRef.current < reps) {
          // Transition: REST -> next rep's WORK
          repRef.current += 1;
          stateRef.current = 'working';
          targetEndTimeRef.current = previousPhaseEndTime + workSec * 1000;
        } else {
          // Final [WORK -> REST] repetition has finished: transition to 'completed'.
          stateRef.current = 'completed';
          targetEndTimeRef.current = null;
        }
      }
    }

    // Commit reconciled state machine values to React state.
    setCurrentState(stateRef.current);
    setCurrentRep(repRef.current);

    if (stateRef.current === 'completed' || targetEndTimeRef.current === null) {
      setRemainingTime(0);
      clearTimerInterval();
      return;
    }

    // Strict Date-based calculation: remainingTime = ceil((targetEndTime - Date.now()) / 1000)
    const remainingMs = Math.max(0, targetEndTimeRef.current - now);
    setRemainingTime(Math.ceil(remainingMs / 1000));
  }, [clearTimerInterval]);

  const startIntervalLoop = useCallback(() => {
    clearTimerInterval();
    intervalRef.current = setInterval(reconcileWithClock, TICK_INTERVAL_MS);
  }, [clearTimerInterval, reconcileWithClock]);

  /**
   * Starts a new `[WORK -> REST] x REPS` cycle from `'idle'` or `'completed'`,
   * or resumes the current phase if the timer is paused.
   */
  const start = useCallback(() => {
    const { workDuration: workSec } = configRef.current;

    // Case 1: Resume from a paused active phase.
    if (
      isPausedRef.current &&
      (stateRef.current === 'working' || stateRef.current === 'resting')
    ) {
      const remainingMs = pausedRemainingMsRef.current ?? remainingTime * 1000;
      // Re-anchor targetEndTime relative to the current wall clock on resume:
      targetEndTimeRef.current = Date.now() + remainingMs;
      pausedRemainingMsRef.current = null;
      isPausedRef.current = false;

      setIsPaused(false);
      setRemainingTime(Math.ceil(remainingMs / 1000));
      startIntervalLoop();
      return;
    }

    // Case 2: Already running — ignore duplicate start() calls.
    if (stateRef.current === 'working' || stateRef.current === 'resting') {
      return;
    }

    // Case 3: Fresh start from 'idle' or 'completed'.
    repRef.current = 1;
    stateRef.current = 'working';
    isPausedRef.current = false;
    pausedRemainingMsRef.current = null;

    // CRITICAL NFR: Calculate and store targetEndTime = Date.now() + (duration * 1000)
    targetEndTimeRef.current = Date.now() + workSec * 1000;

    setCurrentRep(1);
    setCurrentState('working');
    setIsPaused(false);
    setRemainingTime(workSec);

    startIntervalLoop();
  }, [remainingTime, startIntervalLoop]);

  /**
   * Pauses an active `'working'` or `'resting'` phase by recording the exact
   * remaining milliseconds (`targetEndTime - Date.now()`) and halting the tick loop.
   */
  const pause = useCallback(() => {
    if (
      isPausedRef.current ||
      (stateRef.current !== 'working' && stateRef.current !== 'resting') ||
      targetEndTimeRef.current === null
    ) {
      return;
    }

    // First reconcile in case the phase expired right as pause() was invoked.
    reconcileWithClock();
    if (stateRef.current !== 'working' && stateRef.current !== 'resting') {
      return;
    }

    const remainingMs = Math.max(0, (targetEndTimeRef.current ?? Date.now()) - Date.now());
    pausedRemainingMsRef.current = remainingMs;
    targetEndTimeRef.current = null;
    isPausedRef.current = true;

    clearTimerInterval();
    setIsPaused(true);
    setRemainingTime(Math.ceil(remainingMs / 1000));
  }, [clearTimerInterval, reconcileWithClock]);

  /**
   * Stops the timer and resets all state back to `'idle'`.
   */
  const stop = useCallback(() => {
    clearTimerInterval();

    stateRef.current = 'idle';
    repRef.current = 1;
    isPausedRef.current = false;
    targetEndTimeRef.current = null;
    pausedRemainingMsRef.current = null;

    setCurrentState('idle');
    setCurrentRep(1);
    setIsPaused(false);
    setRemainingTime(configRef.current.workDuration);
  }, [clearTimerInterval]);

  /**
   * AppState listener for Background/Foreground transitions.
   *
   * When the user switches away from the app or locks their device, React Native's
   * JS thread may pause `setInterval`. As soon as the app returns to `'active'`,
   * we immediately invoke `reconcileWithClock()`, which recalculates `remainingTime`
   * via `targetEndTime - Date.now()` and advances any phases that completed in the background.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          reconcileWithClock();
        }
      }
    );

    return () => {
      subscription.remove();
      clearTimerInterval();
    };
  }, [clearTimerInterval, reconcileWithClock]);

  return {
    currentState,
    remainingTime,
    currentRep,
    isPaused,
    start,
    pause,
    stop,
  };
}
