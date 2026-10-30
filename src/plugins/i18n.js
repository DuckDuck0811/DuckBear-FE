import { createI18n } from 'vue-i18n'
import vi from '../locales/vi.json'
import en from '../locales/en.json'

const savedLocale = localStorage.getItem('locale')
const locale = ['vi', 'en'].includes(savedLocale) ? savedLocale : 'vi'

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: { vi, en },
})

export default i18n
