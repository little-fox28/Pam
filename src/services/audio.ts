import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Vibration } from 'react-native';

import { haptic } from './haptics';

type SoundInstance = {
  replayAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
};

let shortBeepSound: SoundInstance | null = null;
let longBeepSound: SoundInstance | null = null;
let isInitializing = false;
let nativeAvAvailable: boolean | null = null;

/**
 * Checks whether the native `ExponentAV` module is compiled into the running binary
 * BEFORE importing `expo-av` (since `expo-av` calls `requireNativeModule('ExponentAV')`
 * at module evaluation time, which throws in Expo Go SDK 58 or un-rebuilt dev clients).
 */
function hasNativeAv(): boolean {
  if (Platform.OS === 'web') return false;
  if (nativeAvAvailable !== null) return nativeAvAvailable;
  try {
    nativeAvAvailable = Boolean(requireOptionalNativeModule('ExponentAV'));
  } catch {
    nativeAvAvailable = false;
  }
  return nativeAvAvailable;
}

/**
 * Configures the OS audio session and preloads the short (3-2-1 countdown)
 * and long (REST -> WORK transition) beep sounds into memory.
 * Safely no-ops if `ExponentAV` is not present in the current native binary.
 */
export async function initAudioCues(): Promise<void> {
  if (!hasNativeAv() || isInitializing) return;
  if (shortBeepSound && longBeepSound) return;

  isInitializing = true;
  try {
    // Lazy require so `expo-av` is never evaluated when ExponentAV is absent.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Audio } = require('expo-av') as typeof import('expo-av');

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });

    if (!shortBeepSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep-short.wav'),
        { shouldPlay: false, volume: 1.0 }
      );
      shortBeepSound = sound;
    }

    if (!longBeepSound) {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep-long.wav'),
        { shouldPlay: false, volume: 1.0 }
      );
      longBeepSound = sound;
    }
  } catch {
    nativeAvAvailable = false;
  } finally {
    isInitializing = false;
  }
}

/**
 * Plays a short 880Hz beep (used at 3s, 2s, 1s remaining in REST).
 * Falls back to haptics if native `ExponentAV` is not available in the client.
 */
export function playShortBeep(): void {
  if (!hasNativeAv()) {
    haptic.light();
    return;
  }

  (async () => {
    if (!shortBeepSound) await initAudioCues();
    if (shortBeepSound) {
      await shortBeepSound.replayAsync();
    } else {
      haptic.light();
    }
  })().catch(() => {});
}

/**
 * Plays a long 1320Hz beep (used when REST reaches 0s and transitions to WORK).
 * Falls back to vibration/haptics if native `ExponentAV` is not available in the client.
 */
export function playLongBeep(): void {
  if (!hasNativeAv()) {
    haptic.success();
    if (Platform.OS !== 'web') Vibration.vibrate(300);
    return;
  }

  (async () => {
    if (!longBeepSound) await initAudioCues();
    if (longBeepSound) {
      await longBeepSound.replayAsync();
    } else {
      haptic.success();
    }
  })().catch(() => {});
}

/**
 * Releases native audio resources when the timer screen unmounts.
 */
export async function unloadAudioCues(): Promise<void> {
  try {
    if (shortBeepSound) {
      await shortBeepSound.unloadAsync();
      shortBeepSound = null;
    }
    if (longBeepSound) {
      await longBeepSound.unloadAsync();
      longBeepSound = null;
    }
  } catch {
    // Ignore cleanup errors.
  }
}
