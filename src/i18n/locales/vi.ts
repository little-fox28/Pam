import type { Translations } from './en';

export const vi: Translations = {
  tabs: {
    home: 'Trang chủ',
    settings: 'Cài đặt',
  },
  settings: {
    title: 'Cài đặt',
    subtitle: 'Tùy chỉnh giao diện, ngôn ngữ và đơn vị.',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    units: 'Đơn vị cân nặng',
  },
  theme: { system: 'Hệ thống', light: 'Sáng', dark: 'Tối' },
  language: { en: 'English', vi: 'Tiếng Việt' },
  units: { kg: 'kg', lbs: 'lbs' },
  error: {
    title: 'Đã xảy ra lỗi',
    message: 'Ứng dụng gặp lỗi không mong muốn.',
    retry: 'Thử lại',
    reset: 'Đặt lại cài đặt ứng dụng',
  },
  boot: { dbError: 'Di chuyển cơ sở dữ liệu thất bại' },
};
