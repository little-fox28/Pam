import type { Translations } from './en';

export const vi: Translations = {
  tabs: {
    timer: 'Đồng hồ',
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
  timer: {
    setup: {
      title: 'Hẹn giờ ngắt quãng',
      subtitle: 'Thiết lập thời gian tập, nghỉ và số hiệp.',
      time: 'Thời gian (s)',
      rest: 'Nghỉ (s)',
      reps: 'Số hiệp',
    },
    action: {
      start: 'BẮT ĐẦU',
      pause: 'TẠM DỪNG',
      resume: 'TIẾP TỤC',
      stop: 'ĐẶT LẠI',
      complete: 'HOÀN THÀNH',
    },
    phase: {
      idle: 'SẴN SÀNG',
      working: 'TẬP',
      resting: 'NGHỈ',
      completed: 'HOÀN TẤT',
      rep: 'Hiệp %{current} / %{total}',
    },
  },
};
