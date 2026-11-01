import { defineStore } from 'pinia'
import { getStudentDashboard } from '../services/studentDashboard.service'
import { isPendingJoinRequest } from '../schemas/studentDashboard.schema'

export const useStudentDashboardStore = defineStore('studentDashboard', {
  state: () => ({
    classes: [],
    requests: [],
    isLoading: false,
    errorMessage: '',
    hasError: false,
  }),

  getters: {
    pendingRequests: (state) => state.requests.filter(isPendingJoinRequest),
  },

  actions: {
    async load() {
      this.isLoading = true
      this.errorMessage = ''
      this.hasError = false
      try {
        const dashboard = await getStudentDashboard()
        this.classes = dashboard.classes
        this.requests = dashboard.requests
      } catch (error) {
        this.errorMessage = error?.message || ''
        this.hasError = true
      } finally {
        this.isLoading = false
      }
    },
  },
})
