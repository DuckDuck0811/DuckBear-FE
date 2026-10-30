import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'
import router from './router'
import i18n from './plugins/i18n'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'duckbearLight',
    themes: {
      duckbearLight: {
        dark: false,
        colors: {
          primary: '#2F7CF6',       // SHub Blue chủ đạo
          secondary: '#1F5FD0',     // Xanh đậm
          info: '#3AA0FF',          // Xanh sáng
          success: '#2BC48A',       // Xanh ngọc mint tươi sáng
          warning: '#FFB020',       // Vàng cam ấm áp
          error: '#F04438',         // Đỏ san hô
          background: '#F4F8FF',    // Nền xanh pastel rất nhạt
          surface: '#FFFFFF',       // Trắng tinh
          'on-background': '#1D2939', // Chữ chính tương phản cao
          'on-surface': '#1D2939',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          // Màu nhấn đa sắc cho badge môn / khối lớp / thống kê
          orange: '#FF9F43',
          yellow: '#FFC83D',
          green: '#2BC48A',
          pink: '#FF6B9A',
          purple: '#7C5CFC',
          cyan: '#00C7E6',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: 'pill',
      elevation: 0,
      class: 'text-none font-weight-bold',
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'lg',
      density: 'comfortable',
      color: 'primary',
      bgColor: 'surface',
    },
    VSelect: {
      variant: 'outlined',
      rounded: 'lg',
      density: 'comfortable',
      color: 'primary',
      bgColor: 'surface',
    },
    VTextarea: {
      variant: 'outlined',
      rounded: 'lg',
      density: 'comfortable',
      color: 'primary',
      bgColor: 'surface',
    },
    VChip: {
      rounded: 'pill',
    },
    VDialog: {
      rounded: 'xl',
    },
    VExpansionPanels: {
      rounded: 'xl',
      elevation: 0,
    },
  },
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)
  .use(vuetify)
  .mount('#app')
