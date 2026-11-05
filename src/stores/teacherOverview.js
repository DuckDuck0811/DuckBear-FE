import { defineStore } from 'pinia'
import { api } from '../services/api.js'
import { getTeacherOverviewSummary } from './teacherOverviewSummary.js'

function readLastReminderAt() {
  try {
    const saved = JSON.parse(localStorage.getItem('teacherOverview.lastReminderAt') ?? '{}')
    return Object.fromEntries(
      Object.entries(saved).filter(([, timestamp]) => Number.isFinite(timestamp)),
    )
  } catch {
    return {}
  }
}

export const useTeacherOverviewStore = defineStore('teacherOverview', {
  state: () => ({
    loading: false,
    error: null,
    data: null, // { totalActions, grading, upcoming, overdue, joinRequests, recentActivity }

    // Realtime activity (prepended by socket events)
    socketActivity: [],
    socketConnected: false,
    socketReconnecting: false,

    // Nhắc bài debounce: assignmentId → timestamp cuối cùng nhắc
    lastReminderAt: readLastReminderAt(),
  }),

  getters: {
    overviewSummary: (state) => getTeacherOverviewSummary(state.data),
    totalActions() {
      return this.overviewSummary.totalActions
    },
    grading: (state) => state.data?.grading ?? [],
    upcoming: (state) => state.data?.upcoming ?? [],
    overdue: (state) => state.data?.overdue ?? [],
    joinRequests: (state) => state.data?.joinRequests ?? [],

    // Hợp nhất realtime + initial, tối đa 20 dòng
    recentActivity(state) {
      const socketItems = (state.socketActivity ?? []).map((e) => ({
        ...e,
        isNew: true,
      }))
      const initialItems = state.data?.recentActivity ?? []
      const combined = [...socketItems, ...initialItems]
      // Deduplicate by type+id
      const seen = new Set()
      return combined
        .filter((e) => {
          const key = `${e.type}-${e.meta?.assignmentId ?? e.meta?.requestId ?? e.at}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, 20)
    },
  },

  actions: {
    async fetchOverview() {
      this.loading = true
      this.error = null
      try {
        this.data = await api('/teacher/overview')
      } catch (err) {
        this.error = err?.message ?? 'Lỗi tải dữ liệu'
      } finally {
        this.loading = false
      }
    },

    // Thêm sự kiện realtime từ socket vào đầu danh sách
    prependActivity(event) {
      this.socketActivity = [event, ...this.socketActivity].slice(0, 20)
      if (event.type === 'join-request' && this.data && event.meta?.requestId) {
        const requestId = event.meta.requestId
        const requests = this.data.joinRequests ?? []
        if (!requests.some((request) => request.id === requestId)) {
          this.data.joinRequests = [
            {
              id: requestId,
              student: event.student,
              class: { id: event.meta.classId, name: event.meta.className },
              requestedAt: event.at,
            },
            ...requests,
          ]
        }
      }
    },

    // Duyệt / từ chối join request → xóa khỏi danh sách
    removeJoinRequest(requestId) {
      if (this.data?.joinRequests) {
        this.data.joinRequests = this.data.joinRequests.filter(
          (jr) => jr.id !== requestId,
        )
      }
    },

    // Kiểm tra xem có thể nhắc bài không (cooldown 5 phút)
    canRemind(assignmentId, cooldownMs = 45 * 60 * 1000) {
      const last = this.lastReminderAt[assignmentId]
      return !last || Date.now() - last >= cooldownMs
    },

    markReminded(assignmentId) {
      this.lastReminderAt[assignmentId] = Date.now()
      try {
        localStorage.setItem('teacherOverview.lastReminderAt', JSON.stringify(this.lastReminderAt))
      } catch {
        // Keep the in-memory cooldown if browser storage is unavailable.
      }
    },

    setSocketStatus(connected, reconnecting = false) {
      this.socketConnected = connected
      this.socketReconnecting = reconnecting
    },
  },
})

