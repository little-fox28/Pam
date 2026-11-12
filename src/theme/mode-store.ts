import { Appearance } from 'react-native';
import { create } from 'zustand';

import { readEnum, settingsStorage } from '@/lib/storage';

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const KEY = 'theme.mode';

function applyToNative(mode: ThemeMode) {
  // 'unspecified' hands control back to the OS setting.
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

// Read synchronously and apply at module load, before the first render,
// so the app never flashes the wrong theme on boot.
const initialMode = readEnum(settingsStorage, KEY, THEME_MODES, 'system');
applyToNative(initialMode);

type ThemeModeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeModeStore = create<ThemeModeState>((set) => ({
  mode: initialMode,
  setMode: (mode) => {
    settingsStorage.set(KEY, mode);
    applyToNative(mode);
    set({ mode });
  },
}));
