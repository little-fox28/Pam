import { Asset } from 'expo-asset';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Vibration } from 'react-native';

import { haptic } from './haptics';

type ExpoAudioPlayerLike = {
  volume: number;
  play: () => void;
  seekTo: (seconds: number) => Promise<void>;
  remove: () => void;
};

type LegacyAvSoundLike = {
  replayAsync: () => Promise<unknown>;
  unloadAsync: () => Promise<unknown>;
};

let shortPlayer: ExpoAudioPlayerLike | null = null;
let longPlayer: ExpoAudioPlayerLike | null = null;
let legacyShortSound: LegacyAvSoundLike | null = null;
let legacyLongSound: LegacyAvSoundLike | null = null;
let initPromise: Promise<void> | null = null;

function hasExpoAudio(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return Boolean(requireOptionalNativeModule('ExpoAudio'));
  } catch {
    return false;
  }
}

function hasLegacyExponentAv(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return Boolean(requireOptionalNativeModule('ExponentAV'));
  } catch {
    return false;
  }
}

async function resolveLocalAudioUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  return asset.localUri ?? asset.uri;
}

/**
 * Configures the OS audio session and preloads the short (3-2-1 countdown)
 * and long (phase end / transition) beep sounds into memory.
 *
 * Uses `expo-audio` (`ExpoAudio`, bundled in Expo SDK 58 / Expo Go) as primary
 * engine, with fallback to `expo-av` (`ExponentAV`) or tactile haptics.
 */
export function initAudioCues(): Promise<void> {
  if ((shortPlayer && longPlayer) || (legacyShortSound && legacyLongSound)) {
    return Promise.resolve();
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const [shortUri, longUri] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        resolveLocalAudioUri(require('@/assets/sounds/beep-short.wav')),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        resolveLocalAudioUri(require('@/assets/sounds/beep-long.wav')),
      ]);

      if (hasExpoAudio()) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ExpoAudio = require('expo-audio') as typeof import('expo-audio');

        await ExpoAudio.setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          shouldRouteThroughEarpiece: false,
        });

        if (!shortPlayer) {
          const player = ExpoAudio.createAudioPlayer({ uri: shortUri });
          player.volume = 1.0;
          shortPlayer = player;
        }

        if (!longPlayer) {
          const player = ExpoAudio.createAudioPlayer({ uri: longUri });
          player.volume = 1.0;
          longPlayer = player;
        }
        return;
      }

      if (hasLegacyExponentAv()) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Audio } = require('expo-av') as typeof import('expo-av');

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });

        if (!legacyShortSound) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: shortUri },
            { shouldPlay: false, volume: 1.0 }
          );
          legacyShortSound = sound;
        }

        if (!legacyLongSound) {
          const { sound } = await Audio.Sound.createAsync(
            { uri: longUri },
            { shouldPlay: false, volume: 1.0 }
          );
          legacyLongSound = sound;
        }
        return;
      }

      if (__DEV__) {
        console.warn(
          '[PAM Audio] Native audio module (ExpoAudio) is not compiled into this client. Rebuild dev client or open in Expo Go SDK 58.'
        );
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[PAM Audio] Failed to initialize audio cues:', err);
      }
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Plays a short 880Hz beep (used at 3s, 2s, 1s remaining before a phase ends).
 */
export function playShortBeep(): void {
  (async () => {
    if (!shortPlayer && !legacyShortSound) {
      await initAudioCues();
    }

    if (shortPlayer) {
      await shortPlayer.seekTo(0);
      shortPlayer.play();
      return;
    }

    if (legacyShortSound) {
      await legacyShortSound.replayAsync();
      return;
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate(60);
    } else {
      haptic.light();
    }
  })().catch(() => {});
}

/**
 * Plays a long 1320Hz beep (used when a WORK or REST phase reaches 0s).
 */
export function playLongBeep(): void {
  (async () => {
    if (!longPlayer && !legacyLongSound) {
      await initAudioCues();
    }

    if (longPlayer) {
      await longPlayer.seekTo(0);
      longPlayer.play();
      return;
    }

    if (legacyLongSound) {
      await legacyLongSound.replayAsync();
      return;
    }

    if (Platform.OS !== 'web') {
      Vibration.vibrate(300);
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
    if (shortPlayer) {
      shortPlayer.remove();
      shortPlayer = null;
    }
    if (longPlayer) {
      longPlayer.remove();
      longPlayer = null;
    }
    if (legacyShortSound) {
      await legacyShortSound.unloadAsync();
      legacyShortSound = null;
    }
    if (legacyLongSound) {
      await legacyLongSound.unloadAsync();
      legacyLongSound = null;
    }
  } catch {
    // Ignore cleanup errors.
  }
}
