import { createI18n } from 'vue-i18n'
import vi from './locales/vi.json'
import en from './locales/en.json'

const savedLocale = localStorage.getItem('locale')
const locale = ['vi', 'en'].includes(savedLocale) ? savedLocale : 'vi'

const isDev = import.meta.env.DEV

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'vi',  // Fallback về tiếng Việt thay vì hiện key thô
  messages: { vi, en },
  // Trong dev: cảnh báo key thiếu ra console để phát hiện sớm
  // Trong production: fallback về vi và không log
  missingWarn: isDev,
  fallbackWarn: isDev,
  missing: isDev
    ? (locale, key) => {
        console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`)
      }
    : undefined,
})

export default i18n
