export const en = {
  tabs: {
    home: 'Home',
    settings: 'Settings',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Preferences, language and units.',
    theme: 'Theme',
    language: 'Language',
    units: 'Weight unit',
  },
  theme: { system: 'System', light: 'Light', dark: 'Dark' },
  language: { en: 'English', vi: 'Tiếng Việt' },
  units: { kg: 'kg', lbs: 'lbs' },
  error: {
    title: 'Something went wrong',
    message: 'The app hit an unexpected error.',
    retry: 'Try again',
    reset: 'Reset app settings',
  },
  boot: { dbError: 'Database migration failed' },
};

export type Translations = typeof en;
