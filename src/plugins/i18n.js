import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,
  locale: 'vi',
  fallbackLocale: 'en',
  messages: {
    vi: {
      appName: 'DuckBear',
      welcome: 'Chào mừng đến với DuckBear',
      description: 'Nền tảng học tập và quản lý chương trình học.',
      language: 'Ngôn ngữ',
    },
    en: {
      appName: 'DuckBear',
      welcome: 'Welcome to DuckBear',
      description: 'A learning and curriculum management platform.',
      language: 'Language',
    },
  },
})

export default i18n
