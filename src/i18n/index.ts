import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { useCallback } from 'react';
import { create } from 'zustand';

import { readEnum, settingsStorage } from '@/lib/storage';

import { en } from './locales/en';
import { vi } from './locales/vi';

export const LOCALES = ['en', 'vi'] as const;
export type Locale = (typeof LOCALES)[number];

const KEY = 'i18n.locale';

function detectDeviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return LOCALES.find((l) => l === code) ?? 'en';
}

// Saved preference wins, then device language, then English.
const initialLocale: Locale = settingsStorage.contains(KEY)
  ? readEnum(settingsStorage, KEY, LOCALES, 'en')
  : detectDeviceLocale();

export const i18n = new I18n({ en, vi }, { defaultLocale: 'en', enableFallback: true });
i18n.locale = initialLocale;

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    settingsStorage.set(KEY, locale);
    i18n.locale = locale;
    set({ locale });
  },
}));

/** Subscribes to locale changes so components re-render with the new language. */
export function useTranslation() {
  const locale = useLocaleStore((s) => s.locale);
  const t = useCallback(
    (scope: string, options?: Record<string, unknown>) => i18n.t(scope, { ...options, locale }),
    [locale]
  );
  return { t, locale };
}

