import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken'),
    user: null,
  }),
  actions: {
    setSession({ accessToken, user }) {
      this.accessToken = accessToken
      this.user = user
      localStorage.setItem('accessToken', accessToken)
    },
    clearSession() {
      this.accessToken = null
      this.user = null
      localStorage.removeItem('accessToken')
    },
  },
})
