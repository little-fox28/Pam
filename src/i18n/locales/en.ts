export const en = {
  tabs: {
    timer: 'Timer',
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
  timer: {
    setup: {
      title: 'Interval Timer',
      subtitle: 'Set your work, rest and rounds.',
      time: 'Time (s)',
      rest: 'Rest (s)',
      reps: 'Reps',
    },
    action: {
      start: 'START',
      pause: 'PAUSE',
      resume: 'RESUME',
      stop: 'RESET',
      complete: 'COMPLETE',
    },
    phase: {
      idle: 'READY',
      working: 'WORK',
      resting: 'REST',
      completed: 'COMPLETED',
      rep: 'Rep %{current} of %{total}',
    },
  },
};

export type Translations = typeof en;
