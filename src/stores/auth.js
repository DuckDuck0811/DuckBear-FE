import { defineStore } from 'pinia'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('accessToken') || null,
    user: (() => {
      try {
        const stored = localStorage.getItem('user')
        return stored ? JSON.parse(stored) : null
      } catch {
        return null
      }
    })(),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isTeacher: (state) => state.user?.role === 'TEACHER' || state.user?.role === 'ADMIN',
  },

  actions: {
    /**
     * Đăng nhập tài khoản
     * @param {{ email: string, password: string }} credentials
     */
    async login({ email, password }) {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      this.token = data.accessToken
      this.user = data.user

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      return data
    },

    /**
     * Đăng ký tài khoản mới và tự động đăng nhập
     * @param {{ email: string, password: string, fullName: string, role: string }} info
     */
    async register({ email, password, fullName, role }) {
      await api('/auth/register', {
        method: 'POST',
        body: { email, password, fullName, role },
      })

      // Đăng ký thành công thì tự động đăng nhập
      return await this.login({ email, password })
    },

    /**
     * Đăng xuất tài khoản
     */
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    },
  },
})

